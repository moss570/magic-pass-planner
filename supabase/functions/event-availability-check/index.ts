import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[EVENT-CHECK] ${step}${detailsStr}`);
};

// Check event availability via Railway /check-event endpoint
async function checkEventAvailability(
  eventUrl: string,
  date: string,
  partySize: number,
  preferredTime: string,
  cacheBust = false
): Promise<{ available: boolean; times: string[] }> {
  const railwayUrl = Deno.env.get("RAILWAY_POLLER_URL");
  const railwayApiKey = Deno.env.get("RAILWAY_POLLER_API_KEY");

  if (!railwayUrl || !railwayApiKey) {
    logStep("ERROR: Missing RAILWAY_POLLER_URL or RAILWAY_POLLER_API_KEY");
    return { available: false, times: [] };
  }

  try {
    let urlToCheck = eventUrl;
    if (cacheBust) {
      const sep = eventUrl.includes("?") ? "&" : "?";
      urlToCheck = `${eventUrl}${sep}_cb=${Date.now()}`;
    }

    logStep("Sending to Railway /check-event", { url: urlToCheck, date, partySize, preferredTime, cacheBust });

    const res = await fetch(`${railwayUrl}/check-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": railwayApiKey,
      },
      body: JSON.stringify({
        eventUrl: urlToCheck,
        date,
        partySize,
        preferredTime,
        steps: ["check_available_days", "time_of_day_buttons", "view_more_times", "scrape_pills"],
        noCache: cacheBust,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logStep("Railway /check-event error", { status: res.status, body: errText.slice(0, 200) });
      return { available: false, times: [] };
    }

    const data = await res.json();
    logStep("Railway /check-event response", { available: data.available, timesCount: data.times?.length || 0 });
    return { available: data.available || false, times: data.times || [] };
  } catch (err) {
    logStep("Railway fetch error", { error: err instanceof Error ? err.message : String(err) });
    return { available: false, times: [] };
  }
}

// Determine if the current time is within a priority launch window
// Window: 11:59:45 PM ET to 12:15:00 AM ET
function isInPriorityWindow(windowOpensAt: string): boolean {
  const opens = new Date(windowOpensAt);
  const now = new Date();
  const windowStart = new Date(opens.getTime() - 15 * 1000);
  const windowEnd = new Date(opens.getTime() + 15 * 60 * 1000);
  return now >= windowStart && now <= windowEnd;
}

async function handleEventFound(
  supabase: any,
  alert: any,
  times: string[]
) {
  await supabase.from("event_alerts").update({
    status: "found",
    availability_found_at: new Date().toISOString(),
    found_times: times,
    last_checked_at: new Date().toISOString(),
    check_count: (alert.check_count || 0) + 1,
    updated_at: new Date().toISOString(),
  }).eq("id", alert.id);

  logStep("EVENT AVAILABILITY FOUND!", {
    event: alert.event_name,
    times,
    date: alert.alert_date,
    partySize: alert.party_size,
  });

  // Create notification and send
  const { data: notifData, error: notifError } = await supabase
    .from("event_notifications")
    .insert({
      alert_id: alert.id,
      user_id: alert.user_id,
      event_name: alert.event_name,
      alert_date: alert.alert_date,
      party_size: alert.party_size,
      availability_url: alert.event_url,
      notification_type: alert.alert_sms ? "sms" : "email",
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
          body: JSON.stringify({
            notification_id: notifData.id,
            notification_source: "event",
          }),
        }
      );
      logStep("Event notification SENT", { event: alert.event_name });
    } catch (sendErr) {
      logStep("Event notification send failed (will retry)", {
        error: sendErr instanceof Error ? sendErr.message : String(sendErr),
      });
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
    try { body = await req.json(); } catch { /* empty body ok */ }

    // ── INSTANT CHECK for a single alert ──
    if (body.instant_alert_id) {
      const { data: alert } = await supabase
        .from("event_alerts")
        .select("*")
        .eq("id", body.instant_alert_id)
        .single();

      if (!alert) throw new Error("Alert not found");

      logStep("INSTANT CHECK", { event: alert.event_name, date: alert.alert_date });
      const { available, times } = await checkEventAvailability(
        alert.event_url, alert.alert_date, alert.party_size, alert.preferred_time || "Any"
      );

      if (available) {
        await handleEventFound(supabase, alert, times);
      } else {
        await supabase.from("event_alerts").update({
          last_checked_at: new Date().toISOString(),
          check_count: (alert.check_count || 0) + 1,
          updated_at: new Date().toISOString(),
        }).eq("id", alert.id);
      }

      return new Response(JSON.stringify({ instant: true, available, times }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ── PRIORITY MODE (1-min cron, midnight launch) ──
    if (body.priority) {
      logStep("🎪 PRIORITY EVENT MODE - Starting");
      const startTime = Date.now();

      const { data: priorityAlerts, error: pErr } = await supabase
        .from("event_alerts")
        .select("*")
        .eq("status", "watching")
        .eq("priority_launch", true)
        .not("window_opens_at", "is", null)
        .limit(25);

      if (pErr) throw pErr;

      const activeAlerts = (priorityAlerts || []).filter(
        (a: any) => a.window_opens_at && isInPriorityWindow(a.window_opens_at)
      );

      logStep("Priority event alerts in window", { total: priorityAlerts?.length || 0, active: activeAlerts.length });

      if (activeAlerts.length === 0) {
        // Disable expired priority flags
        const now = new Date();
        for (const a of (priorityAlerts || [])) {
          if (a.window_opens_at) {
            const windowEnd = new Date(new Date(a.window_opens_at).getTime() + 15 * 60 * 1000);
            if (now > windowEnd) {
              await supabase.from("event_alerts").update({
                priority_launch: false, updated_at: now.toISOString(),
              }).eq("id", a.id);
            }
          }
        }
        return new Response(JSON.stringify({ priority: true, checked: 0, found: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
        });
      }

      let checked = 0, found = 0;
      for (const alert of activeAlerts) {
        // First check (cache-busted)
        const r1 = await checkEventAvailability(
          alert.event_url, alert.alert_date, alert.party_size, alert.preferred_time || "Any", true
        );
        if (r1.available) {
          found++;
          await handleEventFound(supabase, alert, r1.times);
          checked++;
          continue;
        }

        await supabase.from("event_alerts").update({
          last_checked_at: new Date().toISOString(),
          check_count: (alert.check_count || 0) + 1,
          updated_at: new Date().toISOString(),
        }).eq("id", alert.id);

        // Wait 30s then second check
        await new Promise(resolve => setTimeout(resolve, 30_000));
        const r2 = await checkEventAvailability(
          alert.event_url, alert.alert_date, alert.party_size, alert.preferred_time || "Any", true
        );
        if (r2.available) {
          found++;
          await handleEventFound(supabase, alert, r2.times);
        } else {
          await supabase.from("event_alerts").update({
            last_checked_at: new Date().toISOString(),
            check_count: (alert.check_count || 0) + 2,
            updated_at: new Date().toISOString(),
          }).eq("id", alert.id);
        }
        checked++;
      }

      return new Response(JSON.stringify({ priority: true, checked, found, durationMs: Date.now() - startTime }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ── STANDARD MODE (5-min cron) ──
    logStep("Starting event availability check run");
    const startTime = Date.now();
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const today = new Date().toISOString().split("T")[0];

    // Join with events table to check scrapable flag
    const { data: alerts, error: alertsErr } = await supabase
      .from("event_alerts")
      .select("*")
      .eq("status", "watching")
      .gte("alert_date", today)
      .or(`last_checked_at.is.null,last_checked_at.lt.${sixtySecondsAgo}`)
      .order("last_checked_at", { ascending: true, nullsFirst: true })
      .limit(10);

    if (alertsErr) throw alertsErr;

    // Filter out non-scrapable events by checking events table
    const eventUrls = [...new Set((alerts || []).map((a: any) => a.event_url))];
    let nonScrapableUrls = new Set<string>();
    if (eventUrls.length > 0) {
      const { data: eventRows } = await supabase
        .from("events")
        .select("event_url, scrapable")
        .in("event_url", eventUrls)
        .eq("scrapable", false);
      nonScrapableUrls = new Set((eventRows || []).map((e: any) => e.event_url));
    }

    // Exclude priority alerts in active window (handled by priority cron)
    const standardAlerts = (alerts || []).filter((a: any) => {
      if (a.priority_launch && a.window_opens_at && isInPriorityWindow(a.window_opens_at)) return false;
      if (nonScrapableUrls.has(a.event_url)) return false;
      return true;
    });

    logStep("Standard alerts to check", { count: standardAlerts.length });

    let checked = 0, found = 0;
    for (const alert of standardAlerts) {
      const { available, times } = await checkEventAvailability(
        alert.event_url, alert.alert_date, alert.party_size, alert.preferred_time || "Any"
      );

      if (available) {
        found++;
        await handleEventFound(supabase, alert, times);
      } else {
        await supabase.from("event_alerts").update({
          last_checked_at: new Date().toISOString(),
          check_count: (alert.check_count || 0) + 1,
          updated_at: new Date().toISOString(),
        }).eq("id", alert.id);
      }
      checked++;

      // Small delay between checks
      if (standardAlerts.indexOf(alert) < standardAlerts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const duration = Date.now() - startTime;
    logStep("Standard run complete", { checked, found, durationMs: duration });

    return new Response(JSON.stringify({ checked, found, durationMs: duration }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
