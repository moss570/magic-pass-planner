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
    const body = await req.json();
    let notification_id = body.notification_id;
    const notificationSource = body.notification_source || "dining"; // "dining" or "event"
    const isEvent = notificationSource === "event";

    // Test mode: create a notification record inline for E2E testing
    if (body.test_mode && body.user_id && body.alert_id) {
      const table = isEvent ? "event_notifications" : "dining_notifications";
      const insertData: any = {
        alert_id: body.alert_id,
        user_id: body.user_id,
        alert_date: body.alert_date || new Date().toISOString().split("T")[0],
        party_size: body.party_size || 2,
        availability_url: body.availability_url || "https://disneyworld.disney.go.com/dining",
        notification_type: "email",
      };
      if (isEvent) {
        insertData.event_name = body.event_name || "Test Event";
      } else {
        insertData.restaurant_name = body.restaurant_name || "Test Restaurant";
      }
      const { data: inserted, error: insertErr } = await supabase
        .from(table)
        .insert(insertData)
        .select()
        .single();
      if (insertErr) throw new Error("Test insert failed: " + insertErr.message);
      notification_id = inserted.id;
      console.log(`[SEND-NOTIFICATION] Test mode (${notificationSource}) - created notification`, notification_id);
    }

    // Fetch notification from the correct table
    let notification: any;
    let alert: any;
    let itemName: string;
    let bookingUrl: string;

    if (isEvent) {
      const { data } = await supabase
        .from("event_notifications")
        .select("*")
        .eq("id", notification_id)
        .single();
      notification = data;
      if (!notification) throw new Error("Event notification not found");

      const { data: alertData } = await supabase
        .from("event_alerts")
        .select("*")
        .eq("id", notification.alert_id)
        .single();
      alert = alertData;
      itemName = notification.event_name || alert?.event_name || "Event";
      bookingUrl = notification.availability_url || alert?.event_url || "https://disneyworld.disney.go.com";
    } else {
      const { data } = await supabase
        .from("dining_notifications")
        .select("*, alert_id, user_id, restaurant_name, alert_date, party_size, availability_url")
        .eq("id", notification_id)
        .single();
      notification = data;
      if (!notification) throw new Error("Notification not found");

      const { data: alertData } = await supabase
        .from("dining_alerts")
        .select("*, restaurant:restaurants(name, disney_url)")
        .eq("id", notification.alert_id)
        .single();
      alert = alertData;
      itemName = notification.restaurant_name || alert?.restaurant?.name || "Restaurant";
      bookingUrl = notification.availability_url || alert?.restaurant?.disney_url || "https://disneyworld.disney.go.com/dining";
    }

    const wantsEmail = alert?.alert_email !== false;
    const wantsSms = alert?.alert_sms === true;

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

    // Event vs Dining branding
    const emailSubject = isEvent
      ? `🎪 ${itemName} — Event Slot Available! Book Now`
      : `🍽️ ${itemName} — Reservation Available! Book Now`;
    const bannerEmoji = isEvent ? "🎪" : "🍽️";
    const bannerText = isEvent ? "EVENT SLOT AVAILABLE!" : "RESERVATION AVAILABLE!";
    const ctaText = isEvent ? "🎪 Book This Event →" : "🍽️ Book This Reservation →";
    const smsPrefix = isEvent ? "🎪 Magic Pass Plus EVENT:" : "🏰 Magic Pass Plus:";

    // Build notification promises for concurrent dispatch
    const promises: Array<Promise<{ channel: string; success: boolean; status: number; sid?: string }>> = [];

    // Email promise
    if (wantsEmail && userEmail && BREVO_KEY) {
      promises.push(
        fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: { name: "Magic Pass Plus", email: "alerts@magicpassplus.com" },
            to: [{ email: userEmail }],
            subject: emailSubject,
            htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:500px;margin:20px auto;background:#111827;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1565C0,#1976D2);padding:28px;text-align:center;">
    <p style="color:#FFD700;font-size:22px;font-weight:bold;margin:0;">🏰 Magic Pass Plus</p>
  </div>
  <div style="background:#22c55e;padding:14px;text-align:center;">
    <p style="color:white;font-size:17px;font-weight:bold;margin:0;">${bannerEmoji} ${bannerText}</p>
  </div>
  <div style="padding:28px;">
    <p style="color:#F9FAFB;font-size:16px;margin:0 0 16px 0;">Hi there! 👋</p>
    <p style="color:#9CA3AF;font-size:14px;line-height:1.6;">We found an opening for <strong style="color:#F9FAFB;">${itemName}</strong>!</p>
    <div style="background:#0D1230;border:1px solid rgba(255,215,0,0.2);border-radius:12px;padding:16px;margin:20px 0;">
      <p style="color:#9CA3AF;font-size:13px;margin:4px 0;"><strong style="color:#F9FAFB;">Date:</strong> ${notification.alert_date}</p>
      <p style="color:#9CA3AF;font-size:13px;margin:4px 0;"><strong style="color:#F9FAFB;">Party:</strong> ${notification.party_size} guests</p>
    </div>
    <a href="${bookingUrl}" style="display:block;background:#FFD700;color:#080E1E;text-decoration:none;padding:16px;border-radius:10px;font-size:16px;font-weight:bold;text-align:center;margin-bottom:12px;">
      ${ctaText}
    </a>
    <p style="color:#6B7280;font-size:11px;text-align:center;">Act fast — availability closes in seconds</p>
  </div>
  <div style="padding:16px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
    <p style="color:#4B5563;font-size:11px;margin:0;">© 2026 Magic Pass Plus LLC · magicpassplus.com<br>Not affiliated with Disney</p>
  </div>
</div>`,
          }),
        }).then(async (emailResp) => ({
          channel: "email" as const,
          success: emailResp.ok,
          status: emailResp.status,
        }))
      );
    }

    // SMS promise
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFrom = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID") || Deno.env.get("TWILIO_PHONE_NUMBER");

    const normalizePhone = (raw: string): string => {
      const digits = raw.replace(/\D/g, "");
      if (digits.length === 10) return `+1${digits}`;
      if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
      if (raw.startsWith("+")) return raw;
      return `+${digits}`;
    };

    if (wantsSms && profile?.phone && twilioSid && twilioToken && twilioFrom) {
      const toPhone = normalizePhone(profile.phone);
      console.log("[SEND-NOTIFICATION] SMS to", toPhone, "(raw:", profile.phone, ")");

      const smsParams = new URLSearchParams({
        Body: `${smsPrefix} ${itemName} is available! Date: ${notification.alert_date}, Party of ${notification.party_size}. Book now: ${bookingUrl}`,
        To: toPhone,
        ...(twilioFrom.startsWith("MG") ? { MessagingServiceSid: twilioFrom } : { From: twilioFrom }),
      });

      promises.push(
        fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": "Basic " + btoa(`${twilioSid}:${twilioToken}`),
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: smsParams.toString(),
          }
        ).then(async (smsResp) => {
          const smsBody = await smsResp.json();
          if (!smsResp.ok) {
            console.log("[SEND-NOTIFICATION] SMS error:", JSON.stringify(smsBody));
          }
          return { channel: "sms" as const, success: smsResp.ok, status: smsResp.status, sid: smsBody.sid };
        })
      );
    }

    // Fire all channels concurrently
    const results = await Promise.all(promises);

    // Mark notification as sent with delivery status tracking
    const allSuccess = results.length > 0 && results.every(r => r.success);
    const anySuccess = results.some(r => r.success);
    const deliveryStatus = allSuccess ? "delivered" : anySuccess ? "partial_failure" : "failed";

    const updateTable = isEvent ? "event_notifications" : "dining_notifications";
    await supabase.from(updateTable).update({
      sent_at: anySuccess ? new Date().toISOString() : null,
      delivery_status: deliveryStatus,
      delivery_details: JSON.stringify(results),
      retry_count: (notification.retry_count || 0) + 1,
    }).eq("id", notification_id);

    console.log(`[SEND-NOTIFICATION] ${deliveryStatus} (${notificationSource})`, { notification_id, results });

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
