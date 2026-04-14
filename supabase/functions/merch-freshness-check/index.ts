import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const today = new Date().toISOString().split("T")[0];

    // Find merchandise past valid_to that are still listed
    const { data: expiredMerch, error: mErr } = await supabase
      .from("merchandise")
      .select("id, name, land, park_id, valid_to")
      .lt("valid_to", today)
      .not("valid_to", "is", null);

    if (mErr) throw mErr;

    const expiredIds = (expiredMerch || []).map((m: any) => m.id);
    let updatedCount = 0;

    if (expiredIds.length > 0) {
      // We can't directly set is_limited=false to "expire" — the milestone says flip to is_active=false
      // But merchandise table doesn't have is_active... use valid_to as the signal
      // Actually the milestone says "Flips any merchandise row past valid_to to is_active = false"
      // The merchandise table doesn't have is_active, but snacks/shows/attractions tables may.
      // For now, log the expired items. The CMS UI will show items past valid_to as "expired".
      updatedCount = expiredIds.length;
    }

    // Also check special_events — no valid_to on that table either, but booking availability
    // Just report counts
    const summary = {
      expired_merchandise: expiredMerch?.length || 0,
      checked_at: new Date().toISOString(),
    };

    // Send digest notification if there are expired items
    if ((expiredMerch?.length || 0) > 0) {
      const itemList = (expiredMerch || []).map((m: any) => `• ${m.name} (${m.park_id} / ${m.land}) — expired ${m.valid_to}`).join("\n");

      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            channel: "email",
            to: "moss570@gmail.com",
            subject: `🏪 ${expiredMerch?.length} Merchandise Items Expired — Action Needed`,
            body: `The following merchandise items have passed their valid_to date:\n\n${itemList}\n\nPlease review and update or remove these items in the Park Content CMS.`,
            notification_source: "merch_freshness",
          }),
        });
      } catch (e) {
        console.error("Failed to send digest:", e);
      }
    }

    return new Response(JSON.stringify(summary), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("merch-freshness-check error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
