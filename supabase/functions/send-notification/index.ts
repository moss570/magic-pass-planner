import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { notification_id } = await req.json();

    const { data: notification } = await supabase
      .from("dining_notifications")
      .select("*, alert_id, user_id, restaurant_name, alert_date, party_size, availability_url")
      .eq("id", notification_id)
      .single();

    if (!notification) throw new Error("Notification not found");

    // Get the alert
    const { data: alert } = await supabase
      .from("dining_alerts")
      .select("*, restaurant:restaurants(name, disney_url)")
      .eq("id", notification.alert_id)
      .single();

    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(notification.user_id);
    const userEmail = userData?.user?.email;
    
    // Get user phone from users_profile
    const { data: profile } = await supabase
      .from("users_profile")
      .select("phone")
      .eq("id", notification.user_id)
      .single();

    const BREVO_KEY = Deno.env.get("BREVO_API_KEY");
    const restaurantName = notification.restaurant_name || alert?.restaurant?.name || "Restaurant";
    const bookingUrl = notification.availability_url || alert?.restaurant?.disney_url || "https://disneyworld.disney.go.com/dining";

    const results = [];

    // Send email
    if (userEmail && BREVO_KEY) {
      const emailResp = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: { name: "Magic Pass Plus", email: "alerts@magicpassplus.com" },
          to: [{ email: userEmail }],
          subject: `🍽️ ${restaurantName} — Reservation Available! Book Now`,
          htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:500px;margin:20px auto;background:#111827;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1565C0,#1976D2);padding:28px;text-align:center;">
    <p style="color:#FFD700;font-size:22px;font-weight:bold;margin:0;">🏰 Magic Pass Plus</p>
  </div>
  <div style="background:#22c55e;padding:14px;text-align:center;">
    <p style="color:white;font-size:17px;font-weight:bold;margin:0;">🍽️ RESERVATION AVAILABLE!</p>
  </div>
  <div style="padding:28px;">
    <p style="color:#F9FAFB;font-size:16px;margin:0 0 16px 0;">Hi there! 👋</p>
    <p style="color:#9CA3AF;font-size:14px;line-height:1.6;">We found an opening at <strong style="color:#F9FAFB;">${restaurantName}</strong>!</p>
    <div style="background:#0D1230;border:1px solid rgba(255,215,0,0.2);border-radius:12px;padding:16px;margin:20px 0;">
      <p style="color:#9CA3AF;font-size:13px;margin:4px 0;"><strong style="color:#F9FAFB;">Date:</strong> ${notification.alert_date}</p>
      <p style="color:#9CA3AF;font-size:13px;margin:4px 0;"><strong style="color:#F9FAFB;">Party:</strong> ${notification.party_size} guests</p>
    </div>
    <a href="${bookingUrl}" style="display:block;background:#FFD700;color:#080E1E;text-decoration:none;padding:16px;border-radius:10px;font-size:16px;font-weight:bold;text-align:center;margin-bottom:12px;">
      🍽️ Book This Reservation →
    </a>
    <p style="color:#6B7280;font-size:11px;text-align:center;">Act fast — availability closes in seconds</p>
  </div>
  <div style="padding:16px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
    <p style="color:#4B5563;font-size:11px;margin:0;">© 2026 Magic Pass Plus LLC · magicpassplus.com<br>Not affiliated with Disney</p>
  </div>
</div>`,
        }),
      });
      results.push({ channel: "email", success: emailResp.ok, status: emailResp.status });
    }

    // Send SMS if user has phone
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFrom = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID") || Deno.env.get("TWILIO_PHONE_NUMBER");

    if (profile?.phone && twilioSid && twilioToken && twilioFrom) {
      const smsParams = new URLSearchParams({
        Body: `🏰 Magic Pass Plus: ${restaurantName} is available! Date: ${notification.alert_date}, Party of ${notification.party_size}. Book now: ${bookingUrl}`,
        To: profile.phone,
        ...(twilioFrom.startsWith("MG") ? { MessagingServiceSid: twilioFrom } : { From: twilioFrom }),
      });

      const smsResp = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Authorization": "Basic " + btoa(`${twilioSid}:${twilioToken}`),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: smsParams.toString(),
        }
      );
      results.push({ channel: "sms", success: smsResp.ok, status: smsResp.status });
    }

    // Mark notification as sent
    const allSuccess = results.every(r => r.success);
    await supabase.from("dining_notifications").update({
      sent_at: allSuccess ? new Date().toISOString() : null,
      delivery_details: JSON.stringify(results),
    }).eq("id", notification_id);

    return new Response(JSON.stringify({ success: allSuccess, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
