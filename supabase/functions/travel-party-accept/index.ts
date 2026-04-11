import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) =>
  console.log(`[TRAVEL-PARTY-ACCEPT] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate user
    const authHeader = req.headers.get("x-client-authorization") ?? req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const userId = userData.user.id;
    const userEmail = userData.user.email;

    const body = await req.json();
    const { inviteToken } = body;
    if (!inviteToken) throw new Error("inviteToken required");

    log("Accepting invite", { inviteToken, userId });

    // Fetch invite
    const { data: invite, error: fetchErr } = await supabaseAdmin
      .from("travel_party_invites")
      .select("*")
      .eq("invite_token", inviteToken)
      .single();

    if (fetchErr || !invite) {
      return new Response(JSON.stringify({ error: "Invite not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      await supabaseAdmin.from("travel_party_invites").update({ status: "expired" }).eq("id", invite.id);
      return new Response(JSON.stringify({ error: "Invite has expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check status
    if (invite.status === "accepted") {
      return new Response(JSON.stringify({ error: "Invite already accepted" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invite.status === "revoked") {
      return new Response(JSON.stringify({ error: "Invite has been revoked" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark invite accepted
    await supabaseAdmin.from("travel_party_invites").update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by_user_id: userId,
      updated_at: new Date().toISOString(),
    }).eq("id", invite.id);

    // Create discount code record for the user
    await supabaseAdmin.from("discount_codes").insert({
      code: invite.discount_code,
      user_id: userId,
      invite_id: invite.id,
      percent_off: invite.discount_percent,
      expires_at: invite.expires_at,
    });

    // Add user to trip members via the saved trip's itinerary metadata
    // We'll add a trip_members jsonb field or use the social function
    try {
      await supabaseAdmin.rpc("add_trip_member_if_not_exists", {
        _trip_id: invite.trip_id,
        _user_id: userId,
        _email: userEmail || invite.invitee_email,
        _first_name: invite.first_name,
        _last_name: invite.last_name,
      });
    } catch {
      // RPC might not exist yet — fall back to direct approach if needed
      log("RPC add_trip_member_if_not_exists not available, skipping auto-add");
    }

    log("Invite accepted", { inviteId: invite.id, userId });

    return new Response(JSON.stringify({
      success: true,
      tripId: invite.trip_id,
      discountCode: invite.discount_code,
      discountPercent: invite.discount_percent,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
