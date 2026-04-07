import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[DINING-ALERTS] ${step}${detailsStr}`);
};

// Disney opens reservations at 6:00 AM ET, 60 days before the dining date.
// We calculate the exact window_opens_at timestamp for a given alert_date.
function computeWindowOpensAt(alertDate: string): { isPriority: boolean; windowOpensAt: string | null } {
  // alertDate is "YYYY-MM-DD"
  const dining = new Date(alertDate + "T00:00:00");
  const now = new Date();

  // The window opens 60 days before the dining date at 6:00 AM ET
  const windowDay = new Date(dining);
  windowDay.setDate(windowDay.getDate() - 60);

  // Build 6:00 AM ET on that day.
  // ET = UTC-5 (EST) or UTC-4 (EDT). Use America/New_York via offset calculation.
  // We'll store as UTC: 6:00 AM ET = 10:00 or 11:00 UTC depending on DST.
  // For correctness, compute the ET offset for that specific date.
  const etOffset = getETOffsetHours(windowDay);
  const windowOpensAt = new Date(
    windowDay.getFullYear(),
    windowDay.getMonth(),
    windowDay.getDate(),
    6 - etOffset, // Convert 6 AM ET to UTC hours
    0, 0, 0
  );

  // An alert qualifies for priority launch if the window hasn't opened yet,
  // or opened within the last 15 minutes (so we catch alerts created right at window time)
  const fifteenMinAfter = new Date(windowOpensAt.getTime() + 15 * 60 * 1000);
  const isPriority = now < fifteenMinAfter;

  return {
    isPriority,
    windowOpensAt: windowOpensAt.toISOString(),
  };
}

// Approximate ET offset: EDT (UTC-4) Mar-Nov, EST (UTC-5) Nov-Mar
function getETOffsetHours(date: Date): number {
  const year = date.getFullYear();
  // Second Sunday in March
  const marStart = new Date(year, 2, 1);
  const marSunday = 14 - marStart.getDay() || 7;
  const edtStart = new Date(year, 2, marSunday >= 8 ? marSunday : marSunday + 7, 2, 0, 0);
  // First Sunday in November
  const novStart = new Date(year, 10, 1);
  const novSunday = 7 - novStart.getDay() || 7;
  const estStart = new Date(year, 10, novSunday, 2, 0, 0);

  return (date >= edtStart && date < estStart) ? -4 : -5;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    // Auth check
    const authHeader = req.headers.get("x-client-authorization") ?? req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;

    // ─── GET RESTAURANTS ───────────────────────────────────────
    if (action === "restaurants") {
      const location = url.searchParams.get("location");
      const location_type = url.searchParams.get("location_type");
      const search = url.searchParams.get("search");

      let query = supabaseAdmin
        .from("restaurants")
        .select("id, name, location, location_type, area, cuisine, price_range, meal_periods, requires_reservation, disney_url")
        .eq("is_active", true)
        .eq("requires_reservation", true)
        .order("location")
        .order("name");

      if (location) query = query.eq("location", location);
      if (location_type) query = query.eq("location_type", location_type);
      if (search) query = query.ilike("name", `%${search}%`);

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify({ restaurants: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ─── CREATE ALERT ───────────────────────────────────────────
    if (action === "create" && req.method === "POST") {
      const body = await req.json();
      const { restaurant_id, alert_date, party_size, meal_periods, preferred_time, alert_email, alert_sms } = body;

      if (!restaurant_id || !alert_date || !party_size) {
        throw new Error("restaurant_id, alert_date, and party_size are required");
      }

      // Check for duplicate
      const { data: existing } = await supabaseAdmin
        .from("dining_alerts")
        .select("id")
        .eq("user_id", user.id)
        .eq("restaurant_id", restaurant_id)
        .eq("alert_date", alert_date)
        .eq("status", "watching")
        .maybeSingle();

      if (existing) throw new Error("You already have a watching alert for this restaurant on this date");

      // Determine if this alert qualifies for Priority Launch
      const { isPriority, windowOpensAt } = computeWindowOpensAt(alert_date);
      logStep("Priority launch check", { alert_date, isPriority, windowOpensAt });

      const { data, error } = await supabaseAdmin
        .from("dining_alerts")
        .insert({
          user_id: user.id,
          restaurant_id,
          alert_date,
          party_size,
          meal_periods: meal_periods || ["Any"],
          preferred_time: preferred_time || "Any",
          alert_email: alert_email !== false,
          alert_sms: alert_sms === true,
          status: "watching",
          priority_launch: isPriority,
          window_opens_at: isPriority ? windowOpensAt : null,
        })
        .select(`*, restaurant:restaurants(name, location, disney_url)`)
        .single();

      if (error) throw error;
      logStep("Alert created", {
        alertId: data.id,
        userId: user.id,
        priorityLaunch: isPriority,
        windowOpensAt: isPriority ? windowOpensAt : "N/A",
      });

      // Trigger an instant first check in the background
      const restaurantUrl = data.restaurant?.disney_url;
      if (restaurantUrl) {
        logStep("Triggering instant first check", { alertId: data.id, url: restaurantUrl });
        // Fire-and-forget: don't await so the user gets their response immediately
        fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/dining-availability-check`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            test_url: restaurantUrl,
            date: alert_date,
            party_size,
            meal_periods: meal_periods || ["Any"],
            instant_alert_id: data.id,
          }),
        }).then(r => r.json()).then(result => {
          logStep("Instant check result", { alertId: data.id, result });
        }).catch(err => {
          logStep("Instant check fire-and-forget error (non-blocking)", { error: String(err) });
        });
      }

      return new Response(JSON.stringify({ alert: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      });
    }

    // ─── LIST USER ALERTS ────────────────────────────────────────
    if (action === "list") {
      const { data, error } = await supabaseAdmin
        .from("dining_alerts")
        .select(`
          *,
          restaurant:restaurants(id, name, location, location_type, area, cuisine, price_range, disney_url)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ alerts: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ─── CANCEL ALERT ────────────────────────────────────────────
    if (action === "cancel" && req.method === "POST") {
      const body = await req.json();
      const { alert_id } = body;
      if (!alert_id) throw new Error("alert_id required");

      const { error } = await supabaseAdmin
        .from("dining_alerts")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", alert_id)
        .eq("user_id", user.id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
