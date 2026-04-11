import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Stub function — real network integration wired in later milestones
async function lookupApHotelRate(_hotelName: string, _checkIn: string, _checkOut: string): Promise<{ rate: number; discount: number } | null> {
  // Simulate a rate check — returns mock data
  const baseRate = 250 + Math.random() * 150;
  const discount = Math.floor(10 + Math.random() * 20);
  const rate = Math.round(baseRate * (1 - discount / 100));
  return { rate, discount };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all active watching alerts
    const { data: alerts, error } = await supabase
      .from("ap_hotel_alerts")
      .select("*")
      .eq("status", "watching");

    if (error) throw error;
    if (!alerts?.length) {
      return new Response(JSON.stringify({ checked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;
    for (const alert of alerts) {
      const result = await lookupApHotelRate(alert.hotel_name, alert.check_in, alert.check_out);
      if (!result) continue;

      const priceHistory = alert.price_history || [];
      priceHistory.push({ rate: result.rate, discount: result.discount, checked_at: new Date().toISOString() });

      const meetsTarget =
        (alert.target_discount_percent && result.discount >= alert.target_discount_percent) ||
        (alert.target_max_rate && result.rate <= alert.target_max_rate);

      await supabase
        .from("ap_hotel_alerts")
        .update({
          current_best_rate: result.rate,
          current_best_discount: result.discount,
          check_count: (alert.check_count || 0) + 1,
          last_checked_at: new Date().toISOString(),
          price_history: priceHistory,
          status: meetsTarget ? "found" : "watching",
          updated_at: new Date().toISOString(),
        })
        .eq("id", alert.id);

      if (meetsTarget) {
        // Call send-notification via existing interface
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
              user_id: alert.user_id,
              notification_type: "ap-hotel-drop",
              title: `🏨 AP Hotel Deal Found: ${alert.hotel_name}`,
              body: `AP Rate: $${result.rate}/night (${result.discount}% off) for ${alert.check_in} → ${alert.check_out}`,
              channels: {
                email: alert.notify_email,
                sms: alert.notify_sms,
              },
            }),
          });
        } catch {
          // Notification failure shouldn't stop the check
        }
      }
      updated++;
    }

    return new Response(JSON.stringify({ checked: alerts.length, updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
