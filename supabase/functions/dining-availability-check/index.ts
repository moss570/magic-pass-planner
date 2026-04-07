import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[DINING-CHECK] ${step}${detailsStr}`);
};

// Convert a /dining/ info page URL to a /dine-res/ reservation URL
// Disney's SPA does not honor query params for date/party pre-fill,
// so we just link to the reservation page directly.
function buildBookingUrl(infoUrl: string): string {
  try {
    const url = new URL(infoUrl);
    // e.g. /dining/contemporary-resort/chef-mickeys/ → chef-mickeys
    const segments = url.pathname.replace(/\/+$/, "").split("/");
    const slug = segments[segments.length - 1];
    if (slug) {
      return `https://disneyworld.disney.go.com/dine-res/restaurant/${slug}/`;
    }
  } catch { /* fall through */ }
  return infoUrl;
}

// Check availability via Railway Puppeteer poller
async function checkAvailability(
  restaurantUrl: string,
  date: string,
  partySize: number,
  mealPeriods: string[]
): Promise<{ available: boolean; times: string[]; bookingUrls: string[] }> {
  const railwayUrl = Deno.env.get("RAILWAY_POLLER_URL");
  const railwayApiKey = Deno.env.get("RAILWAY_POLLER_API_KEY");

  if (!railwayUrl || !railwayApiKey) {
    logStep("ERROR: Missing RAILWAY_POLLER_URL or RAILWAY_POLLER_API_KEY secrets");
    return { available: false, times: [], bookingUrls: [] };
  }

  try {
    // Send the original /dining/ info page URL — no transform needed.
    // The info page is public (no login wall) and has a "Check Available Days" button.
    logStep("Sending to poller", { url: restaurantUrl, date, partySize, mealPeriods });

    const res = await fetch(`${railwayUrl}/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": railwayApiKey,
      },
      body: JSON.stringify({ restaurantUrl, date, partySize, mealPeriods }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logStep("Railway poller error", { status: res.status, body: errText.slice(0, 200) });
      return { available: false, times: [], bookingUrls: [] };
    }

    const data = await res.json();
    logStep("Railway poller response", { available: data.available, timesCount: data.times?.length || 0 });
    return {
      available: data.available || false,
      times: data.times || [],
      bookingUrls: data.bookingUrls || [],
    };
  } catch (err) {
    logStep("Railway poller fetch error", { error: err instanceof Error ? err.message : String(err) });
    return { available: false, times: [], bookingUrls: [] };
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
    // Direct test mode: check a single restaurant without needing a DB alert
    let body: any = {};
    try { body = await req.json(); } catch { /* empty body is fine */ }

    if (body.test_url) {
      const isInstant = !!body.instant_alert_id;
      logStep(isInstant ? "INSTANT FIRST CHECK" : "DIRECT TEST MODE", { url: body.test_url, date: body.date, partySize: body.party_size, mealPeriods: body.meal_periods, alertId: body.instant_alert_id });
      const { available, times, bookingUrls } = await checkAvailability(
        body.test_url,
        body.date || "2026-05-06",
        body.party_size || 2,
        body.meal_periods || ["Dinner"]
      );

      // If this is an instant check triggered on alert creation, update the alert
      if (isInstant && available) {
        const alertId = body.instant_alert_id;
        logStep("INSTANT CHECK - AVAILABILITY FOUND!", { alertId, times });

        // Update the alert
        await supabase.from("dining_alerts").update({
          status: "found",
          availability_found_at: new Date().toISOString(),
          availability_url: buildBookingUrl(bookingUrls[0] || body.test_url),
          last_checked_at: new Date().toISOString(),
          check_count: 1,
          updated_at: new Date().toISOString(),
        }).eq("id", alertId);

        // Get alert details for notification
        const { data: alert } = await supabase.from("dining_alerts")
          .select("*, restaurant:restaurants(name, disney_url)")
          .eq("id", alertId).single();

        if (alert) {
          const { data: userD } = await supabase.auth.admin.getUserById(alert.user_id);
          if (userD?.user) {
            const { data: notifData } = await supabase.from("dining_notifications").insert({
              alert_id: alertId,
              user_id: alert.user_id,
              restaurant_name: alert.restaurant?.name || "Restaurant",
              alert_date: alert.alert_date,
              party_size: alert.party_size,
              availability_url: buildBookingUrl(bookingUrls[0] || body.test_url),
              notification_type: alert.alert_sms ? "sms" : "email",
              sent_at: null,
            }).select().single();

            if (notifData) {
              try {
                await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
                  body: JSON.stringify({ notification_id: notifData.id }),
                });
                logStep("Instant check notification sent", { alertId });
              } catch (e) { logStep("Instant notification error (will retry)", { error: String(e) }); }
            }
          }
        }
      } else if (isInstant) {
        // No availability found on instant check — just update last_checked_at
        await supabase.from("dining_alerts").update({
          last_checked_at: new Date().toISOString(),
          check_count: 1,
          updated_at: new Date().toISOString(),
        }).eq("id", body.instant_alert_id);
      }

      return new Response(JSON.stringify({ test: !isInstant, instant: isInstant, available, times, bookingUrls }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    logStep("Starting dining availability check run");
    const startTime = Date.now();

    // Get active alerts not checked in last 60 seconds
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const today = new Date().toISOString().split("T")[0];

    const { data: alerts, error: alertsError } = await supabase
      .from("dining_alerts")
      .select(`*, restaurant:restaurants(id, name, location, disney_url)`)
      .eq("status", "watching")
      .gte("alert_date", today)
      .or(`last_checked_at.is.null,last_checked_at.lt.${sixtySecondsAgo}`)
      .limit(25);

    if (alertsError) throw alertsError;

    logStep("Alerts to check", { count: alerts?.length || 0 });

    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ message: "No alerts to check", checked: 0, durationMs: Date.now() - startTime }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    let checked = 0;
    let found = 0;

    for (const alert of alerts) {
      try {
        const restaurant = alert.restaurant;
        if (!restaurant) continue;

        const restaurantUrl = restaurant.disney_url || "";
        if (!restaurantUrl) {
          logStep("Skipping - no disney_url", { name: restaurant.name });
          continue;
        }

        logStep("Checking restaurant", { name: restaurant.name, url: restaurantUrl, date: alert.alert_date });

        const { available, times, bookingUrls } = await checkAvailability(
          restaurantUrl,
          alert.alert_date,
          alert.party_size,
          alert.meal_periods || ["Dinner"]
        );

        const updateData: any = {
          last_checked_at: new Date().toISOString(),
          check_count: (alert.check_count || 0) + 1,
          updated_at: new Date().toISOString(),
        };

        if (available) {
          found++;
          updateData.status = "found";
          updateData.availability_found_at = new Date().toISOString();
          // Use booking URL from poller if available, otherwise link to the info page
          updateData.availability_url = buildBookingUrl(bookingUrls[0] || restaurantUrl);

          logStep("AVAILABILITY FOUND!", {
            restaurant: restaurant.name,
            times,
            date: alert.alert_date,
            partySize: alert.party_size,
          });

          // Get user email and send notification
          const { data: userData } = await supabase.auth.admin.getUserById(alert.user_id);
          if (userData?.user) {
            const { data: notifData, error: notifError } = await supabase
              .from("dining_notifications")
              .insert({
                alert_id: alert.id,
                user_id: alert.user_id,
                restaurant_name: restaurant.name,
                alert_date: alert.alert_date,
                party_size: alert.party_size,
                availability_url: buildBookingUrl(bookingUrls[0] || restaurantUrl, alert.alert_date, alert.party_size),
                notification_type: alert.alert_sms ? "sms" : "email",
                sent_at: null,
              })
              .select()
              .single();

            if (notifData && !notifError) {
              try {
                const sendResponse = await fetch(
                  `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ notification_id: notifData.id }),
                  }
                );
                const sendResult = await sendResponse.json();
                logStep("Notification SENT", {
                  email: userData.user.email,
                  restaurant: restaurant.name,
                  results: sendResult,
                });
              } catch (sendErr) {
                logStep("Notification send failed (will retry)", {
                  error: sendErr instanceof Error ? sendErr.message : String(sendErr),
                });
              }
            } else {
              logStep("Failed to log notification", { error: notifError?.message });
            }
          }
        }

        await supabase.from("dining_alerts").update(updateData).eq("id", alert.id);
        checked++;

        // Small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (alertErr) {
        logStep("Error on alert", {
          alertId: alert.id,
          error: alertErr instanceof Error ? alertErr.message : String(alertErr),
        });
      }
    }

    // Expire past-date alerts
    await supabase
      .from("dining_alerts")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("status", "watching")
      .lt("alert_date", today);

    const duration = Date.now() - startTime;
    logStep("Check run complete", { checked, found, durationMs: duration });

    return new Response(JSON.stringify({ success: true, checked, found, durationMs: duration }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("FATAL ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
