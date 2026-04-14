import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-authorization",
};

const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net"];
const CREDENTIAL_FIELDS = ["api_key_enc", "api_secret_enc", "oauth_client_secret_enc", "webhook_secret_enc", "sandbox_api_key_enc", "sandbox_api_secret_enc"];

function maskValue(val: string | null): string | null {
  if (!val) return null;
  if (val.length <= 8) return "****";
  return val.slice(0, 4) + "****" + val.slice(-4);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth check
    const authHeader = req.headers.get("authorization") || req.headers.get("x-client-authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user || !ADMIN_EMAILS.includes(user.email || "")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    if (action === "list") {
      const { data, error } = await supabase.from("affiliate_networks").select("*").order("category").order("priority");
      if (error) throw error;
      // Mask credential fields
      const masked = (data || []).map((row: any) => {
        const r = { ...row };
        CREDENTIAL_FIELDS.forEach(f => { r[f] = maskValue(r[f]); });
        return r;
      });
      return new Response(JSON.stringify({ networks: masked }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "get") {
      const id = url.searchParams.get("id");
      const { data, error } = await supabase.from("affiliate_networks").select("*").eq("id", id).single();
      if (error) throw error;
      const r = { ...data };
      CREDENTIAL_FIELDS.forEach(f => { r[f] = maskValue(r[f]); });
      return new Response(JSON.stringify({ network: r }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "create" || action === "update") {
      const body = await req.json();
      const record: any = { ...body };
      delete record.id;
      record.updated_at = new Date().toISOString();
      record.updated_by = user.id;

      if (action === "create") {
        record.created_by = user.id;
        // Auto-generate webhook URL
        record.webhook_url = `${supabaseUrl}/functions/v1/affiliate-webhook/${record.slug}`;
        const { data, error } = await supabase.from("affiliate_networks").insert(record).select().single();
        if (error) throw error;

        await supabase.from("admin_audit_log").insert({
          actor_id: user.id, actor_email: user.email, action: "create_affiliate_network",
          target_table: "affiliate_networks", target_id: data.id,
          details: { slug: record.slug, category: record.category },
        });

        const r = { ...data };
        CREDENTIAL_FIELDS.forEach(f => { r[f] = maskValue(r[f]); });
        return new Response(JSON.stringify({ network: r }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } else {
        const id = body.id;
        // Don't overwrite credentials with masked values
        CREDENTIAL_FIELDS.forEach(f => {
          if (record[f] && (record[f].includes("****") || record[f] === null)) {
            delete record[f];
          }
        });
        const { data, error } = await supabase.from("affiliate_networks").update(record).eq("id", id).select().single();
        if (error) throw error;

        await supabase.from("admin_audit_log").insert({
          actor_id: user.id, actor_email: user.email, action: "update_affiliate_network",
          target_table: "affiliate_networks", target_id: id,
          details: { slug: data.slug, fields_changed: Object.keys(record) },
        });

        const r = { ...data };
        CREDENTIAL_FIELDS.forEach(f => { r[f] = maskValue(r[f]); });
        return new Response(JSON.stringify({ network: r }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (action === "delete") {
      const { id } = await req.json();
      const { data: existing } = await supabase.from("affiliate_networks").select("slug").eq("id", id).single();
      const { error } = await supabase.from("affiliate_networks").delete().eq("id", id);
      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        actor_id: user.id, actor_email: user.email, action: "delete_affiliate_network",
        target_table: "affiliate_networks", target_id: id,
        details: { slug: existing?.slug },
      });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "toggle") {
      const { id, is_enabled } = await req.json();
      const { error } = await supabase.from("affiliate_networks").update({ is_enabled, updated_at: new Date().toISOString(), updated_by: user.id }).eq("id", id);
      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        actor_id: user.id, actor_email: user.email, action: is_enabled ? "enable_affiliate_network" : "disable_affiliate_network",
        target_table: "affiliate_networks", target_id: id,
      });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
