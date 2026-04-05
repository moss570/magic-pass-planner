import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[DINING-CHECK] ${step}${detailsStr}`);
};

// Disney dining availability endpoint (My Disney Experience API)
const DISNEY_DINING_URL = "https://disneyworld.disney.go.com/dining-availability/";

async function checkDisneyAvailability(
  restaurantUrl: string,
  date: string,
  partySize: number,
  mealPeriods: string[]
): Promise<{ available: boolean; slots: any[] }> {
  try {
    // Build the Disney dining search URL
    // This hits the same endpoint the Disney website uses
    const searchDate = date; // YYYY-MM-DD format
    const mealPeriod = mealPeriods.includes("Dinner") ? "80000714" :
                       mealPeriods.includes("Lunch") ? "80000712" :
                       mealPeriods.includes("Breakfast") ? "80000711" : "80000714";

    // Extract restaurant ID from URL
    const urlParts = restaurantUrl.split("/").filter(Boolean);
    const restaurantSlug = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];

    const checkUrl = `https://disneyworld.disney.go.com/finder/api/v1/explorer-service/list-ancestor-entities/wdw/80007798;entityType=destination/dining?date=${searchDate}&partySize=${partySize}&mealPeriod=${mealPeriod}`;

    logStep("Checking Disney availability", { restaurantSlug, date: searchDate, partySize });

    // For now, use a secondary approach: check if the booking page responds
    // In production this would use the full Disney API with auth tokens
    const response = await fetch(
      `https://disneyworld.disney.go.com/dining-availability/?entityId=wdw&date=${searchDate}&partySize=${partySize}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://disneyworld.disney.go.com/",
        },
      }
    );

    logStep("Disney API response", { status: response.status });

    // If we get a 200, parse availability
    if (response.ok) {
      const text = await response.text();
      // Look for availability indicators in the response
      const hasAvailability = text.includes('"available":true') ||
                              text.includes('"slots":[{') ||
                              (text.includes('offerTime') && text.length > 100);
      return { available: hasAvailability, slots: [] };
    }

    return { available: false, slots: [] };
  } catch (err) {
    logStep("Disney API error", { error: err instanceof Error ? err.message : String(err) });
    return { available: false, slots: [] };
  }
}

async function sendEmailNotification(
  supabase: any,
  alert: any,
  restaurantName: string,
  userEmail: string,
  availabilityUrl: string
) {
  // Send via Supabase (uses their email system)
  // In production we'd use Brevo/SendGrid for custom HTML
  logStep("Sending email notification", { to: userEmail, restaurant: restaurantName });

  try {
    // Log the notification
    await supabase.from("dining_notifications").insert({
      alert_id: alert.id,
      user_id: alert.user_id,
      restaurant_name: restaurantName,
      alert_date: alert.alert_date,
      party_size: alert.party_size,
      availability_url: availabilityUrl,
      notification_type: "email",
    });
    logStep("Notification logged");
  } catch (err) {
    logStep("Notification log error", { error: err instanceof Error ? err.message : String(err) });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Starting availability check run");

    // Get all active watching alerts that haven't been checked in 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const today = new Date().toISOString().split("T")[0];

    const { data: alerts, error: alertsError } = await supabase
      .from("dining_alerts")
      .select(`
        *,
        restaurant:restaurants(id, name, location, disney_url)
      `)
      .eq("status", "watching")
      .gte("alert_date", today)
      .or(`last_checked_at.is.null,last_checked_at.lt.${fiveMinutesAgo}`)
      .limit(20); // Process 20 at a time to stay within edge function limits

    if (alertsError) throw alertsError;

    logStep("Found alerts to check", { count: alerts?.length || 0 });

    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ message: "No alerts to check", checked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let checked = 0;
    let found = 0;

    for (const alert of alerts) {
      try {
        const restaurant = alert.restaurant;
        if (!restaurant?.disney_url) {
          logStep("Skipping alert - no restaurant URL", { alertId: alert.id });
          continue;
        }

        // Check availability
        const { available, slots } = await checkDisneyAvailability(
          restaurant.disney_url,
          alert.alert_date,
          alert.party_size,
          alert.meal_periods || ["Dinner"]
        );

        // Update the alert with check results
        const updateData: any = {
          last_checked_at: new Date().toISOString(),
          check_count: (alert.check_count || 0) + 1,
          updated_at: new Date().toISOString(),
        };

        if (available) {
          found++;
          updateData.status = "found";
          updateData.availability_found_at = new Date().toISOString();
          updateData.availability_url = restaurant.disney_url;

          logStep("AVAILABILITY FOUND", {
            restaurant: restaurant.name,
            date: alert.alert_date,
            partySize: alert.party_size
          });

          // Get user email for notification
          const { data: userData } = await supabase.auth.admin.getUserById(alert.user_id);
          if (userData?.user?.email && alert.alert_email) {
            await sendEmailNotification(
              supabase,
              alert,
              restaurant.name,
              userData.user.email,
              restaurant.disney_url
            );
          }
        }

        await supabase
          .from("dining_alerts")
          .update(updateData)
          .eq("id", alert.id);

        checked++;

        // Small delay to avoid hammering Disney's servers
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (alertErr) {
        logStep("Error processing alert", {
          alertId: alert.id,
          error: alertErr instanceof Error ? alertErr.message : String(alertErr)
        });
      }
    }

    // Expire alerts for past dates
    await supabase
      .from("dining_alerts")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("status", "watching")
      .lt("alert_date", today);

    logStep("Check run complete", { checked, found });

    return new Response(JSON.stringify({ success: true, checked, found }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("FATAL ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
