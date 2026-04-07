import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const railwayUrl = Deno.env.get("RAILWAY_POLLER_URL");
  const railwayApiKey = Deno.env.get("RAILWAY_POLLER_API_KEY");

  if (!railwayUrl || !railwayApiKey) {
    return new Response(JSON.stringify({ error: "Missing Railway config" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }

  try {
    let body: any = {};
    try { body = await req.json(); } catch { /* ok */ }

    // Mode 1: Single diagnose
    if (body.eventUrl) {
      console.log("[diagnose-events] Single:", body.eventUrl);
      const res = await fetch(`${railwayUrl}/diagnose-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": railwayApiKey },
        body: JSON.stringify({ eventUrl: body.eventUrl }),
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // Mode 2: Batch diagnose all active events from DB
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: events, error } = await supabase
      .from("events")
      .select("id, event_name, event_url, scrapable")
      .eq("is_active", true)
      .order("event_name");

    if (error) throw error;

    const urls = (events || []).map((e: any) => e.event_url);
    console.log(`[diagnose-events] Batch: ${urls.length} URLs`);

    const res = await fetch(`${railwayUrl}/batch-diagnose-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": railwayApiKey },
      body: JSON.stringify({ urls }),
    });
    const batchData = await res.json();

    // Auto-update scrapable column based on results
    if (body.autoUpdate && batchData.results) {
      let updated = 0;
      for (const result of batchData.results) {
        if (result.url && typeof result.scrapable === "boolean") {
          const matchingEvent = (events || []).find((e: any) => e.event_url === result.url);
          if (matchingEvent && matchingEvent.scrapable !== result.scrapable) {
            await supabase.from("events").update({ scrapable: result.scrapable }).eq("id", matchingEvent.id);
            updated++;
            console.log(`[diagnose-events] Updated ${matchingEvent.event_name}: scrapable=${result.scrapable} (profile ${result.profile})`);
          }
        }
      }
      batchData.updatedCount = updated;
    }

    return new Response(JSON.stringify(batchData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[diagnose-events] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
