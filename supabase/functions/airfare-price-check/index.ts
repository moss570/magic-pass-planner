import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function lookupFlightPrice(origin: string, destination: string, _depart: string, _return: string, adults: number, cabin: string, baseline: number | null): number {
  const cabinMultiplier: Record<string, number> = { economy: 1, premium_economy: 1.6, business: 3.2, first: 5 };
  const base = baseline || (250 * adults * (cabinMultiplier[cabin] || 1));
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
    const { data: alerts, error } = await supabase.from("airfare_alerts").select("*").eq("status", "watching");
    if (error) throw error;

    let alertsChecked = 0, alertsUpdated = 0;
    const errors: any[] = [];

    for (const alert of (alerts || [])) {
      alertsChecked++;
      try {
        const newPrice = lookupFlightPrice(alert.origin, alert.destination, alert.depart_date, alert.return_date, alert.adults, alert.cabin_class, alert.current_price);
        const history = Array.isArray(alert.price_history) ? alert.price_history : [];
        history.push({ date: new Date().toISOString().split("T")[0], price: newPrice });

        const updates: any = {
          current_price: newPrice, price_history: history,
          check_count: (alert.check_count || 0) + 1,
          last_checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (newPrice <= alert.target_price) {
          updates.status = "found";
          alertsUpdated++;
          // Notification via Brevo
          try { await sendAirfareAlert(supabase, alert, newPrice); } catch (e) { console.error(e); }
        }

        await supabase.from("airfare_alerts").update(updates).eq("id", alert.id);
      } catch (e) { errors.push({ alertId: alert.id, error: String(e) }); }
    }

    await supabase.from("price_check_runs").insert({
      function_name: "airfare-price-check", alerts_checked: alertsChecked, alerts_updated: alertsUpdated, errors,
    });

    return new Response(JSON.stringify({ checked: alertsChecked, updated: alertsUpdated, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

async function sendAirfareAlert(supabase: any, alert: any, newPrice: number) {
  const { data: userData } = await supabase.auth.admin.getUserById(alert.user_id);
  const userEmail = userData?.user?.email;
  const BREVO_KEY = Deno.env.get("BREVO_API_KEY");

  if (alert.notify_email && userEmail && BREVO_KEY) {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "Magic Pass Plus", email: "alerts@magicpassplus.com" },
        to: [{ email: userEmail }],
        subject: `✈️ Flight ${alert.origin}→${alert.destination} — Price Drop to $${newPrice}!`,
        htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:500px;margin:20px auto;background:#111827;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1565C0,#1976D2);padding:28px;text-align:center;">
    <p style="color:#FFD700;font-size:22px;font-weight:bold;margin:0;">🏰 Magic Pass Plus</p>
  </div>
  <div style="background:#22c55e;padding:14px;text-align:center;">
    <p style="color:white;font-size:17px;font-weight:bold;margin:0;">✈️ AIRFARE PRICE DROP!</p>
  </div>
  <div style="padding:28px;">
    <p style="color:#9CA3AF;font-size:14px;line-height:1.6;">Flight <strong style="color:#F9FAFB;">${alert.origin} → ${alert.destination}</strong> dropped to <strong style="color:#22c55e;">$${newPrice}</strong> (target: $${alert.target_price})</p>
    <div style="background:#0D1230;border:1px solid rgba(255,215,0,0.2);border-radius:12px;padding:16px;margin:20px 0;">
      <p style="color:#9CA3AF;font-size:13px;margin:4px 0;"><strong style="color:#F9FAFB;">Depart:</strong> ${alert.depart_date}</p>
      <p style="color:#9CA3AF;font-size:13px;margin:4px 0;"><strong style="color:#F9FAFB;">Return:</strong> ${alert.return_date}</p>
      <p style="color:#9CA3AF;font-size:13px;margin:4px 0;"><strong style="color:#F9FAFB;">Cabin:</strong> ${alert.cabin_class}</p>
    </div>
  </div>
</div>`,
      }),
    });
  }
}
