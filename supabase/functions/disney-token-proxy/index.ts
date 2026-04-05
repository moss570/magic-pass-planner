import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://magicpassplus.com",
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

    const cookieJar: string[] = [];
    
    const warmup = await fetch("https://disneyworld.disney.go.com/dine-res/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const warmupCookies = warmup.headers.get("set-cookie");
    if (warmupCookies) {
      warmupCookies.split(",").forEach(c => {
        const val = c.split(";")[0].trim();
        if (val.includes("=")) cookieJar.push(val);
      });
    }

    const tokenRes = await fetch("https://disneyworld.disney.go.com/profile-api/authentication/get-client-token", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://disneyworld.disney.go.com/dine-res/",
        ...(cookieJar.length > 0 ? { "Cookie": cookieJar.join("; ") } : {}),
      },
    });

    if (!tokenRes.ok) throw new Error(`Disney token: ${tokenRes.status}`);

    const tokenData = await tokenRes.json() as { access_token?: string };
    const accessToken = tokenData.access_token;
    if (!accessToken) throw new Error("No access token");

    const testRes = await fetch(
      "https://disneyworld.disney.go.com/dine-res/api/availability/2/2026-05-01,2026-05-01?facilityId=90001369&entityType=restaurant",
      {
        headers: {
          "Authorization": `BEARER ${accessToken}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
          "Referer": "https://disneyworld.disney.go.com/dine-res/reservation",
        },
      }
    );

    const hasScope = testRes.status === 200;

    await supabase.from("disney_sessions").upsert({
      user_id: userId,
      access_token: accessToken,
      is_active: true,
      last_refreshed: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return new Response(JSON.stringify({
      success: true,
      hasFullScope: hasScope,
      message: hasScope ? "Connected with full dining access!" : "Connected — dining alerts active",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg, success: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
