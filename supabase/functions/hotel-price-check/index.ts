import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Stub price lookup — returns fake price ±15% from current or baseline */
function lookupHotelPrice(hotelName: string, _checkIn: string, _checkOut: string, _adults: number, _children: number, baseline: number | null): number {
  const base = baseline || 180;
  const variance = base * 0.15;
  return Math.round(base + (Math.random() * variance * 2 - variance));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { data: alerts, error } = await supabase
      .from("hotel_alerts")
      .select("*")
      .eq("status", "watching");

    if (error) throw error;

    let alertsChecked = 0;
    let alertsUpdated = 0;
    const errors: any[] = [];

    for (const alert of (alerts || [])) {
      alertsChecked++;
      try {
        const newPrice = lookupHotelPrice(alert.hotel_name, alert.check_in, alert.check_out, alert.adults, alert.children, alert.current_price);
        const history = Array.isArray(alert.price_history) ? alert.price_history : [];
        history.push({ date: new Date().toISOString().split("T")[0], price: newPrice });

        const updates: any = {
          current_price: newPrice,
          price_history: history,
          check_count: (alert.check_count || 0) + 1,
          last_checked_at: new Date().toISOString(),
          last_checked_status: newPrice <= alert.target_price ? "price_met" : "above_target",
          updated_at: new Date().toISOString(),
        };

        if (newPrice <= alert.target_price) {
          updates.status = "found";
          // Send notification via dedicated function to avoid modifying send-notification
          try {
            await sendHotelAlert(supabase, alert, newPrice);
          } catch (notifErr) {
            console.error("[hotel-price-check] notification error", notifErr);
          }
        }

        await supabase.from("hotel_alerts").update(updates).eq("id", alert.id);
        if (newPrice <= alert.target_price) alertsUpdated++;
      } catch (alertErr) {
        errors.push({ alertId: alert.id, error: String(alertErr) });
      }
    }

    // Log run
    await supabase.from("price_check_runs").insert({
      function_name: "hotel-price-check",
      alerts_checked: alertsChecked,
      alerts_updated: alertsUpdated,
      errors: errors.length ? errors : [],
    });

    return new Response(JSON.stringify({ checked: alertsChecked, updated: alertsUpdated, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/** Send hotel price drop notification using Brevo/Twilio directly (avoids modifying send-notification) */
async function sendHotelAlert(supabase: any, alert: any, newPrice: number) {
  const { data: userData } = await supabase.auth.admin.getUserById(alert.user_id);
  const userEmail = userData?.user?.email;
  const { data: profile } = await supabase.from("users_profile").select("phone").eq("id", alert.user_id).single();

  const BREVO_KEY = Deno.env.get("BREVO_API_KEY");

  if (alert.notify_email && userEmail && BREVO_KEY) {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "Magic Pass Plus", email: "alerts@magicpassplus.com" },
        to: [{ email: userEmail }],
        subject: `🏨 ${alert.hotel_name} — Price Drop to $${newPrice}/night!`,
        htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:500px;margin:20px auto;background:#111827;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1565C0,#1976D2);padding:28px;text-align:center;">
    <p style="color:#FFD700;font-size:22px;font-weight:bold;margin:0;">🏰 Magic Pass Plus</p>
  </div>
  <div style="background:#22c55e;padding:14px;text-align:center;">
    <p style="color:white;font-size:17px;font-weight:bold;margin:0;">🏨 HOTEL PRICE DROP!</p>
  </div>
  <div style="padding:28px;">
    <p style="color:#F9FAFB;font-size:16px;margin:0 0 16px 0;">Great news! 🎉</p>
    <p style="color:#9CA3AF;font-size:14px;line-height:1.6;"><strong style="color:#F9FAFB;">${alert.hotel_name}</strong> dropped to <strong style="color:#22c55e;">$${newPrice}/night</strong> (your target: $${alert.target_price})</p>
    <div style="background:#0D1230;border:1px solid rgba(255,215,0,0.2);border-radius:12px;padding:16px;margin:20px 0;">
      <p style="color:#9CA3AF;font-size:13px;margin:4px 0;"><strong style="color:#F9FAFB;">Check-in:</strong> ${alert.check_in}</p>
      <p style="color:#9CA3AF;font-size:13px;margin:4px 0;"><strong style="color:#F9FAFB;">Check-out:</strong> ${alert.check_out}</p>
      <p style="color:#9CA3AF;font-size:13px;margin:4px 0;"><strong style="color:#F9FAFB;">Party:</strong> ${alert.adults} adults, ${alert.children} children</p>
    </div>
    ${alert.booking_link ? `<a href="${alert.booking_link}" style="display:block;background:#FFD700;color:#080E1E;text-decoration:none;padding:16px;border-radius:10px;font-size:16px;font-weight:bold;text-align:center;">🏨 Book Now →</a>` : ''}
  </div>
</div>`,
      }),
    });
  }

  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioFrom = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID") || Deno.env.get("TWILIO_PHONE_NUMBER");

  if (alert.notify_sms && profile?.phone && twilioSid && twilioToken && twilioFrom) {
    const digits = profile.phone.replace(/\D/g, "");
    const toPhone = digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith("1") ? `+${digits}` : `+${digits}`;
    const smsParams = new URLSearchParams({
      Body: `🏨 Magic Pass Plus: ${alert.hotel_name} dropped to $${newPrice}/night (target: $${alert.target_price}). Check-in: ${alert.check_in}. Book now!`,
      To: toPhone,
      ...(twilioFrom.startsWith("MG") ? { MessagingServiceSid: twilioFrom } : { From: twilioFrom }),
    });
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: "POST",
      headers: { "Authorization": "Basic " + btoa(`${twilioSid}:${twilioToken}`), "Content-Type": "application/x-www-form-urlencoded" },
      body: smsParams.toString(),
    });
  }
}
