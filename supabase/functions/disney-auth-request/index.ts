import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

// This function queues a Disney auth request for the Pi Playwright poller to fulfill
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
    const action = url.searchParams.get("action") || "request";

    if (action === "request" && req.method === "POST") {
      // Queue a Disney auth request for the Pi poller
      // The poller checks this table every 30 seconds
      await supabase.from("disney_sessions").upsert({
        user_id: userId,
        access_token: "PENDING_PI_AUTH",
        is_active: false,
        last_refreshed: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      return new Response(JSON.stringify({
        success: true,
        message: "Auth request queued. The Magic Pass server will authenticate Disney on your behalf within 60 seconds.",
        status: "pending",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    if (action === "status") {
      const { data: session } = await supabase.from("disney_sessions")
        .select("access_token, is_active, last_refreshed")
        .eq("user_id", userId).single();

      const isPending = session?.access_token === "PENDING_PI_AUTH";
      const isConnected = session?.is_active && !isPending;

      return new Response(JSON.stringify({
        status: !session ? "not_connected" : isPending ? "pending" : isConnected ? "connected" : "not_connected",
        connected: isConnected,
        lastRefreshed: session?.last_refreshed,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    throw new Error("Unknown action");

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
