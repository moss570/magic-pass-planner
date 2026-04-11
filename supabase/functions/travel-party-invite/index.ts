import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

function generateToken(len: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

function generateDiscountCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (n: number) => {
    const a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return Array.from(a, (b) => chars[b % chars.length]).join("");
  };
  return `WDW-${seg(4)}-${seg(4)}`;
}

const log = (step: string, details?: unknown) =>
  console.log(`[TRAVEL-PARTY-INVITE] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

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
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Public action: view invite by token
    if (action === "view" && req.method === "GET") {
      const token = url.searchParams.get("token");
      if (!token) return new Response(JSON.stringify({ error: "token required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: invite, error } = await supabaseAdmin
        .from("travel_party_invites")
        .select("id, first_name, last_name, invitee_email, invite_token, discount_code, discount_percent, expires_at, status, trip_id, created_at")
        .eq("invite_token", token)
        .single();

      if (error || !invite) {
        return new Response(JSON.stringify({ error: "Invite not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Fetch trip details
      const { data: trip } = await supabaseAdmin
        .from("saved_trips")
        .select("name, start_date, end_date")
        .eq("id", invite.trip_id)
        .single();

      // Fetch inviter name
      const { data: inviterInvite } = await supabaseAdmin
        .from("travel_party_invites")
        .select("inviter_user_id")
        .eq("id", invite.id)
        .single();

      let inviterName = "A friend";
      if (inviterInvite?.inviter_user_id) {
        const { data: profile } = await supabaseAdmin
          .from("users_profile")
          .select("username, email")
          .eq("id", inviterInvite.inviter_user_id)
          .single();
        if (profile) inviterName = profile.username || profile.email || "A friend";
      }

      // Check expiry
      const expired = new Date(invite.expires_at) < new Date();
      const effectiveStatus = expired && invite.status === "pending" ? "expired" : invite.status;

      return new Response(JSON.stringify({
        invite: { ...invite, status: effectiveStatus },
        trip: trip || { name: "Trip", start_date: null, end_date: null },
        inviterName,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Authenticated actions
    const authHeader = req.headers.get("x-client-authorization") ?? req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const userId = userData.user.id;

    if (req.method === "POST") {
      const body = await req.json();
      const { tripId, firstName, lastName, email, phone } = body;
      if (!tripId || !firstName || !lastName || !email) {
        return new Response(JSON.stringify({ error: "tripId, firstName, lastName, email required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      log("Creating invite", { tripId, email });

      // Get trip info for the email
      const { data: trip } = await supabaseAdmin.from("saved_trips").select("name, start_date, end_date").eq("id", tripId).single();

      // Get inviter info
      const { data: inviterProfile } = await supabaseAdmin.from("users_profile").select("username, email").eq("id", userId).single();
      const inviterName = inviterProfile?.username || inviterProfile?.email || "A friend";

      const inviteToken = generateToken(24);
      const discountCode = generateDiscountCode();

      // Expire any previous pending invites for this email+trip
      await supabaseAdmin
        .from("travel_party_invites")
        .update({ status: "revoked", updated_at: new Date().toISOString() })
        .eq("trip_id", tripId)
        .eq("invitee_email", email)
        .eq("status", "pending");

      const { data: invite, error: insertErr } = await supabaseAdmin
        .from("travel_party_invites")
        .insert({
          trip_id: tripId,
          inviter_user_id: userId,
          invitee_email: email,
          invitee_phone: phone || null,
          first_name: firstName,
          last_name: lastName,
          invite_token: inviteToken,
          discount_code: discountCode,
          discount_percent: 20,
          status: "sent",
        })
        .select()
        .single();

      if (insertErr) throw new Error("Failed to create invite: " + insertErr.message);

      // Send email via Brevo
      const brevoKey = Deno.env.get("BREVO_API_KEY");
      const inviteUrl = `https://magicpassplus.com/invite/${inviteToken}`;

      if (brevoKey) {
        try {
          const emailResp = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: { "api-key": brevoKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              sender: { name: "Magic Pass Plus", email: "noreply@magicpassplus.com" },
              to: [{ email, name: `${firstName} ${lastName}` }],
              subject: `You've been invited to a Magic Pass Plus trip — 3-day discount inside`,
              htmlContent: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                  <h2 style="color:#c9a55a;">🏰 You're Invited!</h2>
                  <p><strong>${inviterName}</strong> has invited you to join their trip${trip?.name ? `: <strong>${trip.name}</strong>` : ""}!</p>
                  ${trip?.start_date ? `<p>📅 ${trip.start_date}${trip.end_date ? ` — ${trip.end_date}` : ""}</p>` : ""}
                  <p>As a special welcome, you'll get <strong>${invite.discount_percent}% off</strong> your first subscription when you sign up within 72 hours.</p>
                  <p>Your discount code: <strong style="font-size:18px;color:#c9a55a;">${discountCode}</strong></p>
                  <div style="margin:24px 0;">
                    <a href="${inviteUrl}" style="background:#c9a55a;color:#1a1a2e;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
                      Accept Invite & Create Account
                    </a>
                  </div>
                  <p style="font-size:12px;color:#888;">This invite expires 72 hours from when it was sent.</p>
                </div>
              `,
            }),
          });
          if (emailResp.ok) {
            await supabaseAdmin.from("travel_party_invites").update({ sent_email_at: new Date().toISOString() }).eq("id", invite.id);
            log("Email sent", { email });
          }
        } catch (e) {
          log("Email send failed", { error: String(e) });
        }
      }

      // Send SMS if phone provided
      if (phone) {
        const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
        const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
        const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER");
        if (twilioSid && twilioAuth && twilioFrom) {
          try {
            const smsBody = `🏰 ${inviterName} invited you to join their Magic Pass Plus trip! ${invite.discount_percent}% off for 72hrs. Accept here: ${inviteUrl}`;
            const formData = new URLSearchParams({ To: phone, From: twilioFrom, Body: smsBody });
            const smsResp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
              method: "POST",
              headers: {
                "Authorization": `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: formData.toString(),
            });
            if (smsResp.ok || smsResp.status === 201) {
              await supabaseAdmin.from("travel_party_invites").update({ sent_sms_at: new Date().toISOString() }).eq("id", invite.id);
              log("SMS sent", { phone });
            }
          } catch (e) {
            log("SMS send failed", { error: String(e) });
          }
        }
      }

      return new Response(JSON.stringify({ invite }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // GET — list invites for a trip
    if (req.method === "GET") {
      const tripId = url.searchParams.get("tripId");
      const query = supabaseAdmin.from("travel_party_invites").select("*").eq("inviter_user_id", userId);
      if (tripId) query.eq("trip_id", tripId);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ invites: data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // PATCH — revoke or resend
    if (req.method === "PATCH") {
      const body = await req.json();
      const { inviteId, action: patchAction } = body;
      if (!inviteId) throw new Error("inviteId required");

      if (patchAction === "revoke") {
        await supabaseAdmin.from("travel_party_invites").update({ status: "revoked", updated_at: new Date().toISOString() }).eq("id", inviteId).eq("inviter_user_id", userId);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
