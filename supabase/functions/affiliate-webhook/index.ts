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

    // Extract network slug from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const slug = pathParts[pathParts.length - 1] || "unknown";

    const body = await req.text();
    let payload: any = {};
    try { payload = JSON.parse(body); } catch { payload = { raw: body }; }

    // Look up network to verify webhook secret
    const { data: network } = await supabase.from("affiliate_networks").select("id, webhook_secret_enc").eq("slug", slug).single();

    let signatureValid = false;
    if (network?.webhook_secret_enc) {
      const signature = req.headers.get("x-webhook-signature") || req.headers.get("x-signature") || "";
      // Simple HMAC verification stub — in production, use the network-specific HMAC algorithm
      signatureValid = signature.length > 0; // Placeholder
    }

    // Log the event
    await supabase.from("affiliate_webhook_events").insert({
      network_slug: slug,
      event_type: payload.event_type || payload.type || "unknown",
      payload,
      signature_valid: signatureValid,
      processed: false,
    });

    // Handle confirmed booking events
    const eventType = (payload.event_type || payload.type || "").toLowerCase();
    if (eventType.includes("booking_confirmed") || eventType.includes("conversion")) {
      const subId = payload.sub_id || payload.subId || payload.label || "";
      // sub_id format: mpp-{tripId}-{userId}
      const parts = subId.split("-");
      if (parts.length >= 3) {
        const category = payload.category || slug;
        // Try to mark matching alert as booked
        if (category.includes("hotel")) {
          await supabase.from("hotel_alerts").update({ status: "booked" }).match({ user_id: parts[2], status: "watching" });
        } else if (category.includes("flight") || category.includes("airfare")) {
          await supabase.from("airfare_alerts").update({ status: "booked" }).match({ user_id: parts[2], status: "watching" });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("affiliate-webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
