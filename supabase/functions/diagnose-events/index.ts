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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Mode 1: Single diagnose
    if (body.eventUrl) {
      console.log("[diagnose-events] Single:", body.eventUrl);
      const res = await fetch(`${railwayUrl}/diagnose-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": railwayApiKey },
        body: JSON.stringify({ eventUrl: body.eventUrl }),
      });
      const data = await res.json();

      // Auto-update if requested
      if (body.autoUpdate && typeof data.scrapable === "boolean") {
        const { data: events } = await supabase
          .from("events").select("id, scrapable").eq("event_url", body.eventUrl).limit(1);
        if (events?.[0] && events[0].scrapable !== data.scrapable) {
          await supabase.from("events").update({ scrapable: data.scrapable }).eq("id", events[0].id);
          data.dbUpdated = true;
        }
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // Mode 2: Batch - process one at a time to avoid timeout
    // Use offset/limit for pagination
    const offset = body.offset || 0;
    const limit = body.limit || 5;

    const { data: events, error } = await supabase
      .from("events")
      .select("id, event_name, event_url, scrapable")
      .eq("is_active", true)
      .order("event_name")
      .range(offset, offset + limit - 1);

    if (error) throw error;
    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ done: true, offset, message: "No more events" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    console.log(`[diagnose-events] Batch offset=${offset} limit=${limit}, processing ${events.length} events`);

    const results: any[] = [];
    let updated = 0;

    for (const event of events) {
      try {
        console.log(`[diagnose-events] Diagnosing: ${event.event_name}`);
        const res = await fetch(`${railwayUrl}/diagnose-event`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": railwayApiKey },
          body: JSON.stringify({ eventUrl: event.event_url }),
        });
        const data = await res.json();

        const result: any = {
          event_name: event.event_name,
          url: event.event_url,
          profile: data.profile || "error",
          profileReason: data.profileReason || data.error || "unknown",
          scrapable: data.scrapable,
          blocked: data.blocked || false,
          templateType: data.templateType || "unknown",
        };

        // Auto-update scrapable
        if (body.autoUpdate && typeof data.scrapable === "boolean" && event.scrapable !== data.scrapable) {
          await supabase.from("events").update({ scrapable: data.scrapable }).eq("id", event.id);
          result.dbUpdated = true;
          updated++;
        }

        results.push(result);
      } catch (err) {
        results.push({
          event_name: event.event_name,
          url: event.event_url,
          profile: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return new Response(JSON.stringify({
      offset,
      limit,
      processed: results.length,
      updated,
      nextOffset: offset + events.length,
      hasMore: events.length === limit,
      results,
    }), {
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
