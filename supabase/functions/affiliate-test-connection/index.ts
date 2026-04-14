import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-authorization",
};

const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const authHeader = req.headers.get("authorization") || req.headers.get("x-client-authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user || !ADMIN_EMAILS.includes(user.email || "")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { networkId } = await req.json();
    const { data: network, error } = await supabase.from("affiliate_networks").select("*").eq("id", networkId).single();
    if (error || !network) throw new Error("Network not found");

    // Attempt a safe GET to the base_url or a known health endpoint
    let testUrl = network.base_url || network.deeplink_template?.split("?")[0] || "";
    if (!testUrl) {
      await supabase.from("affiliate_networks").update({
        last_test_status: "failed", last_test_at: new Date().toISOString(),
        last_test_error: "No base_url or deeplink_template configured",
      }).eq("id", networkId);
      return new Response(JSON.stringify({ status: "failed", error: "No URL configured" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(testUrl, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",  // ✅ FIX #1: Follow redirects (e.g., Klook deeplinks)
        headers: network.api_key_enc ? { "Authorization": `Bearer ${network.api_key_enc}` } : {},
      });
      clearTimeout(timeout);

      const status = resp.ok ? "success" : "failed";
      const preview = await resp.text().then(t => t.slice(0, 500));

      await supabase.from("affiliate_networks").update({
        last_test_status: status,
        last_test_at: new Date().toISOString(),
        last_test_error: resp.ok ? null : `HTTP ${resp.status}`,
      }).eq("id", networkId);

      await supabase.from("admin_audit_log").insert({
        actor_id: user.id, actor_email: user.email, action: "test_affiliate_connection",
        target_table: "affiliate_networks", target_id: networkId,
        details: { http_status: resp.status, slug: network.slug, final_url: resp.url },  // ✅ FIX #2: Log final URL after redirects
      });

      return new Response(JSON.stringify({ status, httpStatus: resp.status, preview, finalUrl: resp.url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (fetchErr) {
      const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      
      // ✅ FIX #3: Distinguish timeout errors for clearer debugging
      const isTimeout = errMsg.includes("AbortError") || errMsg.includes("deadline");
      const friendlyError = isTimeout ? "Request timeout (>10s) — check URL and network connectivity" : errMsg;
      
      await supabase.from("affiliate_networks").update({
        last_test_status: "failed", last_test_at: new Date().toISOString(), last_test_error: friendlyError,
      }).eq("id", networkId);

      return new Response(JSON.stringify({ status: "failed", error: friendlyError, isTimeout }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
