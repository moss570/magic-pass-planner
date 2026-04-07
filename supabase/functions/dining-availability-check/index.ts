import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://magicpassplus.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[DINING-CHECK] ${step}${detailsStr}`);
};

// Convert a /dining/ info page URL to a /dine-res/ reservation URL slug
function extractSlug(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.replace(/\/+$/, "").split("/");
    return segments[segments.length - 1] || "";
  } catch { return ""; }
}

function buildBookingUrl(infoUrl: string): string {
  const slug = extractSlug(infoUrl);
  if (slug) return `https://disneyworld.disney.go.com/dine-res/restaurant/${slug}/`;
  return infoUrl;
}

// Check availability via Railway Puppeteer poller
// When cacheBust is true, appends a unique query param to force a fresh page load
async function checkAvailability(
  restaurantUrl: string,
  date: string,
  partySize: number,
  mealPeriods: string[],
  cacheBust = false
): Promise<{ available: boolean; times: string[]; bookingUrls: string[] }> {
  const railwayUrl = Deno.env.get("RAILWAY_POLLER_URL");
  const railwayApiKey = Deno.env.get("RAILWAY_POLLER_API_KEY");

  if (!railwayUrl || !railwayApiKey) {
    logStep("ERROR: Missing RAILWAY_POLLER_URL or RAILWAY_POLLER_API_KEY secrets");
    return { available: false, times: [], bookingUrls: [] };
  }

  try {
    // Cache-bust: add a unique timestamp param to the restaurant URL so Puppeteer
    // fetches a completely fresh page (bypasses any CDN/edge caching)
    let urlToCheck = restaurantUrl;
    if (cacheBust) {
      const separator = restaurantUrl.includes("?") ? "&" : "?";
      urlToCheck = `${restaurantUrl}${separator}_cb=${Date.now()}`;
    }

    logStep("Sending to poller", { url: urlToCheck, date, partySize, mealPeriods, cacheBust });

    const res = await fetch(`${railwayUrl}/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": railwayApiKey,
      },
      body: JSON.stringify({
        restaurantUrl: urlToCheck,
        date,
        partySize,
        mealPeriods,
        // Tell the poller to skip its own internal cache if any
        noCache: cacheBust,
      }),
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

// Determine if the current time is within a priority launch window
// Window: 5:59:45 AM ET to 6:15:00 AM ET on the day the reservation opens
function isInPriorityWindow(windowOpensAt: string): boolean {
  const opens = new Date(windowOpensAt);
  const now = new Date();

  // Priority window starts 15 seconds before the opening (5:59:45 AM ET)
  const windowStart = new Date(opens.getTime() - 15 * 1000);
  // Priority window ends 15 minutes after opening (6:15:00 AM ET)
  const windowEnd = new Date(opens.getTime() + 15 * 60 * 1000);

  return now >= windowStart && now <= windowEnd;
}

// Process a found-availability result: update alert, send notification
async function handleAvailabilityFound(
  supabase: any,
  alert: any,
  restaurant: any,
  bookingUrls: string[],
  restaurantUrl: string,
  times: string[]
) {
  const bookingUrl = buildBookingUrl(bookingUrls[0] || restaurantUrl);

  await supabase.from("dining_alerts").update({
    status: "found",
    availability_found_at: new Date().toISOString(),
    availability_url: bookingUrl,
    last_checked_at: new Date().toISOString(),
    check_count: (alert.check_count || 0) + 1,
    updated_at: new Date().toISOString(),
  }).eq("id", alert.id);

  logStep("AVAILABILITY FOUND!", {
    restaurant: restaurant.name,
    times,
    date: alert.alert_date,
    partySize: alert.party_size,
    priority: alert.priority_launch || false,
  });

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
        availability_url: bookingUrl,
        notification_type: alert.alert_sms ? "sms" : "email",
        sent_at: null,
      })
      .select()
      .single();

    if (notifData && !notifError) {
      try {
        await fetch(
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
        logStep("Notification SENT", { email: userData.user.email, restaurant: restaurant.name });
      } catch (sendErr) {
        logStep("Notification send failed (will retry)", {
          error: sendErr instanceof Error ? sendErr.message : String(sendErr),
        });
      }
    }
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
    let body: any = {};
    try { body = await req.json(); } catch { /* empty body is fine */ }

    // ── DIAGNOSE MODE ──
    if (body.diagnose) {
      const railwayUrl = Deno.env.get("RAILWAY_POLLER_URL");
      const railwayApiKey = Deno.env.get("RAILWAY_POLLER_API_KEY");
      if (!railwayUrl || !railwayApiKey) {
        return new Response(JSON.stringify({ error: "Missing Railway secrets" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
        });
      }
      logStep("DIAGNOSE MODE", { url: body.test_url });
      const res = await fetch(`${railwayUrl}/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": railwayApiKey },
        body: JSON.stringify({ restaurantUrl: body.test_url }),
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: res.ok ? 200 : 502,
      });
    }

    // ── BATCH DIAGNOSE MODE ──
    if (body.batch_diagnose) {
      const railwayUrl = Deno.env.get("RAILWAY_POLLER_URL");
      const railwayApiKey = Deno.env.get("RAILWAY_POLLER_API_KEY");
      if (!railwayUrl || !railwayApiKey) {
        return new Response(JSON.stringify({ error: "Missing Railway secrets" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
        });
      }

      let urls: string[] = body.urls || [];
      if (urls.length === 0) {
        const { data: restaurants } = await supabase
          .from("restaurants")
          .select("name, disney_url")
          .eq("is_active", true)
          .not("disney_url", "is", null)
          .limit(200);
        urls = (restaurants || []).map((r: any) => r.disney_url).filter(Boolean);
        logStep("Batch diagnose - fetched URLs from DB", { count: urls.length });
      }

      const limit = Math.min(body.limit || 10, 50);
      const batch = urls.slice(0, limit);
      logStep("BATCH DIAGNOSE", { total: urls.length, checking: batch.length });

      const res = await fetch(`${railwayUrl}/batch-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": railwayApiKey },
        body: JSON.stringify({ urls: batch }),
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: res.ok ? 200 : 502,
      });
    }

    // ── DIRECT TEST / INSTANT CHECK MODE ──
    if (body.test_url) {
      const isInstant = !!body.instant_alert_id;
      logStep(isInstant ? "INSTANT FIRST CHECK" : "DIRECT TEST MODE", {
        url: body.test_url, date: body.date, partySize: body.party_size,
        mealPeriods: body.meal_periods, alertId: body.instant_alert_id,
      });
      const { available, times, bookingUrls } = await checkAvailability(
        body.test_url,
        body.date || "2026-05-06",
        body.party_size || 2,
        body.meal_periods || ["Dinner"]
      );

      if (isInstant && available) {
        const alertId = body.instant_alert_id;
        logStep("INSTANT CHECK - AVAILABILITY FOUND!", { alertId, times });

        await supabase.from("dining_alerts").update({
          status: "found",
          availability_found_at: new Date().toISOString(),
          availability_url: buildBookingUrl(bookingUrls[0] || body.test_url),
          last_checked_at: new Date().toISOString(),
          check_count: 1,
          updated_at: new Date().toISOString(),
        }).eq("id", alertId);

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

    // ──────────────────────────────────────────────────────────────
    // PRIORITY LAUNCH MODE
    // Invoked by the 1-minute priority cron job.
    // Finds priority_launch alerts whose window is active NOW,
    // then performs two checks 30 seconds apart (cache-busted).
    // ──────────────────────────────────────────────────────────────
    if (body.priority_mode) {
      logStep("⚡ PRIORITY LAUNCH MODE - Starting");
      const startTime = Date.now();

      // Find all priority alerts that are still watching and whose window is active
      const { data: priorityAlerts, error: pErr } = await supabase
        .from("dining_alerts")
        .select(`*, restaurant:restaurants(id, name, location, disney_url)`)
        .eq("status", "watching")
        .eq("priority_launch", true)
        .not("window_opens_at", "is", null)
        .limit(25);

      if (pErr) throw pErr;

      // Filter to only those currently in their priority window
      const activeAlerts = (priorityAlerts || []).filter(
        (a: any) => a.window_opens_at && isInPriorityWindow(a.window_opens_at)
      );

      logStep("Priority alerts in active window", { total: priorityAlerts?.length || 0, active: activeAlerts.length });

      if (activeAlerts.length === 0) {
        // Also disable priority_launch for alerts whose window has fully passed
        const now = new Date();
        for (const a of (priorityAlerts || [])) {
          if (a.window_opens_at) {
            const windowEnd = new Date(new Date(a.window_opens_at).getTime() + 15 * 60 * 1000);
            if (now > windowEnd) {
              await supabase.from("dining_alerts").update({
                priority_launch: false,
                updated_at: now.toISOString(),
              }).eq("id", a.id);
              logStep("Disabled expired priority flag", { alertId: a.id });
            }
          }
        }

        return new Response(JSON.stringify({
          priority: true, checked: 0, found: 0,
          message: "No alerts in active priority window",
          durationMs: Date.now() - startTime,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
        });
      }

      let checked = 0;
      let found = 0;

      for (const alert of activeAlerts) {
        const restaurant = alert.restaurant;
        if (!restaurant?.disney_url) continue;

        const restaurantUrl = restaurant.disney_url;

        // ── First check (cache-busted) ──
        logStep("⚡ Priority check #1", { name: restaurant.name, date: alert.alert_date });
        const result1 = await checkAvailability(
          restaurantUrl, alert.alert_date, alert.party_size,
          alert.meal_periods || ["Dinner"], true // cacheBust = true
        );

        if (result1.available) {
          found++;
          await handleAvailabilityFound(supabase, alert, restaurant, result1.bookingUrls, restaurantUrl, result1.times);
          checked++;
          continue; // Don't need second check
        }

        // Update last_checked_at after first check
        await supabase.from("dining_alerts").update({
          last_checked_at: new Date().toISOString(),
          check_count: (alert.check_count || 0) + 1,
          updated_at: new Date().toISOString(),
        }).eq("id", alert.id);

        // ── Wait 30 seconds ──
        logStep("⚡ Waiting 30s before second check", { name: restaurant.name });
        await new Promise(resolve => setTimeout(resolve, 30_000));

        // ── Second check (cache-busted) ──
        logStep("⚡ Priority check #2", { name: restaurant.name, date: alert.alert_date });
        const result2 = await checkAvailability(
          restaurantUrl, alert.alert_date, alert.party_size,
          alert.meal_periods || ["Dinner"], true // cacheBust = true
        );

        if (result2.available) {
          found++;
          await handleAvailabilityFound(supabase, alert, restaurant, result2.bookingUrls, restaurantUrl, result2.times);
        } else {
          await supabase.from("dining_alerts").update({
            last_checked_at: new Date().toISOString(),
            check_count: (alert.check_count || 0) + 2,
            updated_at: new Date().toISOString(),
          }).eq("id", alert.id);
        }

        checked++;

        // Small delay between different alerts
        if (activeAlerts.indexOf(alert) < activeAlerts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      const duration = Date.now() - startTime;
      logStep("⚡ Priority run complete", { checked, found, durationMs: duration });

      return new Response(JSON.stringify({ priority: true, checked, found, durationMs: duration }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ──────────────────────────────────────────────────────────────
    // STANDARD SCHEDULED CHECK (existing 5-minute cron)
    // ──────────────────────────────────────────────────────────────
    logStep("Starting dining availability check run");
    const startTime = Date.now();

    // Get active alerts not checked in last 60 seconds
    // Exclude priority_launch alerts that are in their active window (handled by priority cron)
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

    // Filter out priority alerts that are currently in their active window
    // (those are handled by the priority cron to avoid double-checking)
    const standardAlerts = (alerts || []).filter((a: any) => {
      if (a.priority_launch && a.window_opens_at && isInPriorityWindow(a.window_opens_at)) {
        logStep("Skipping priority alert (handled by priority cron)", { alertId: a.id });
        return false;
      }
      return true;
    });

    logStep("Alerts to check", { total: alerts?.length || 0, standard: standardAlerts.length });

    if (standardAlerts.length === 0) {
      return new Response(JSON.stringify({ message: "No alerts to check", checked: 0, durationMs: Date.now() - startTime }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    let checked = 0;
    let found = 0;

    for (const alert of standardAlerts) {
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
          await handleAvailabilityFound(supabase, alert, restaurant, bookingUrls, restaurantUrl, times);
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
