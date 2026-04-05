import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("x-client-authorization") ?? req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) throw new Error("Invalid session");
    const userId = userData.user.id;

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "status";

    // ── SAVE TOKEN ──────────────────────────────────────────
    if (action === "save" && req.method === "POST") {
      const { access_token, swid } = await req.json();
      if (!access_token) throw new Error("access_token required");

      // Verify token works with Disney API
      const verifyResp = await fetch(
        "https://disneyworld.disney.go.com/dine-res/api/availability/2/2026-05-01,2026-05-01?facilityId=90001369&entityType=restaurant",
        {
          headers: {
            "Authorization": `BEARER ${access_token}`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
            "Referer": "https://disneyworld.disney.go.com/dine-res/reservation",
            "Origin": "https://disneyworld.disney.go.com",
          },
        }
      );

      const hasScope = verifyResp.status !== 401;
      console.log(`Token verification: status=${verifyResp.status}, hasScope=${hasScope}`);

      // Save to database (even if limited scope - it's still useful)
      await supabase.from("disney_sessions").upsert({
        user_id: userId,
        access_token,
        swid: swid || null,
        is_active: true,
        last_refreshed: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ 
        success: true, 
        hasFullScope: verifyResp.status === 200,
        tokenStatus: verifyResp.status === 200 ? "full_access" : verifyResp.status === 403 ? "limited_scope" : "invalid"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ── GET STATUS ──────────────────────────────────────────
    if (action === "status") {
      const { data: session } = await supabase
        .from("disney_sessions")
        .select("is_active, last_refreshed, token_expiry")
        .eq("user_id", userId)
        .single();

      return new Response(JSON.stringify({ 
        connected: !!session?.is_active,
        lastRefreshed: session?.last_refreshed || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ── DISCONNECT ──────────────────────────────────────────
    if (action === "disconnect" && req.method === "POST") {
      await supabase.from("disney_sessions").update({ is_active: false }).eq("user_id", userId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    throw new Error("Unknown action");

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
