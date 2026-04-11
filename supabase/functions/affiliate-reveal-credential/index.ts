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

    const { networkId, field, password } = await req.json();

    // Verify admin password by attempting sign-in
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    });
    if (signInErr) {
      return new Response(JSON.stringify({ error: "Invalid password" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const validFields = ["api_key_enc", "api_secret_enc", "oauth_client_secret_enc", "webhook_secret_enc", "sandbox_api_key_enc", "sandbox_api_secret_enc"];
    if (!validFields.includes(field)) {
      return new Response(JSON.stringify({ error: "Invalid field" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: network, error: fetchErr } = await supabase.from("affiliate_networks").select(field).eq("id", networkId).single();
    if (fetchErr || !network) {
      return new Response(JSON.stringify({ error: "Network not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Audit log
    await supabase.from("admin_audit_log").insert({
      actor_id: user.id, actor_email: user.email, action: "reveal_credential",
      target_table: "affiliate_networks", target_id: networkId,
      details: { field },
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown",
    });

    return new Response(JSON.stringify({ value: network[field] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
