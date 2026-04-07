import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[EVENT-ALERTS] ${step}${detailsStr}`);
};

// Events open at midnight ET (11:59:45 PM the night before), 60 days out.
function computeWindowOpensAt(alertDate: string): { isPriority: boolean; windowOpensAt: string | null } {
  const eventDay = new Date(alertDate + "T00:00:00");
  const now = new Date();

  // Window opens 60 days before at 11:59:45 PM ET the night before that day
  // i.e. 60 days before = windowDay, then 11:59:45 PM ET on (windowDay - 1)
  const windowDay = new Date(eventDay);
  windowDay.setDate(windowDay.getDate() - 60);

  // 11:59:45 PM ET on the day BEFORE windowDay
  const launchNight = new Date(windowDay);
  launchNight.setDate(launchNight.getDate() - 1);

  const etOffset = getETOffsetHours(launchNight);
  // 11:59:45 PM ET = 23:59:45 local ET
  const windowOpensAt = new Date(
    launchNight.getFullYear(),
    launchNight.getMonth(),
    launchNight.getDate(),
    23 - etOffset, // Convert 11 PM ET to UTC
    59, 45, 0
  );

  const fifteenMinAfter = new Date(windowOpensAt.getTime() + 15 * 60 * 1000);
  const isPriority = now < fifteenMinAfter;

  return { isPriority, windowOpensAt: windowOpensAt.toISOString() };
}

function getETOffsetHours(date: Date): number {
  const year = date.getFullYear();
  const marStart = new Date(year, 2, 1);
  const marSunday = 14 - marStart.getDay() || 7;
  const edtStart = new Date(year, 2, marSunday >= 8 ? marSunday : marSunday + 7, 2, 0, 0);
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

    // ─── CREATE EVENT ALERT ─────────────────────────────────────
    if (action === "create" && req.method === "POST") {
      const body = await req.json();
      const { event_name, event_url, alert_date, party_size, preferred_time, alert_email, alert_sms } = body;

      if (!event_name || !event_url || !alert_date) {
        throw new Error("event_name, event_url, and alert_date are required");
      }

      // Check for duplicate
      const { data: existing } = await supabaseAdmin
        .from("event_alerts")
        .select("id")
        .eq("user_id", user.id)
        .eq("event_name", event_name)
        .eq("alert_date", alert_date)
        .eq("status", "watching")
        .maybeSingle();

      if (existing) throw new Error("You already have a watching alert for this event on this date");

      const { isPriority, windowOpensAt } = computeWindowOpensAt(alert_date);
      logStep("Priority launch check", { alert_date, isPriority, windowOpensAt });

      const { data, error } = await supabaseAdmin
        .from("event_alerts")
        .insert({
          user_id: user.id,
          event_name,
          event_url,
          alert_date,
          party_size: party_size || 2,
          preferred_time: preferred_time || "Any",
          alert_email: alert_email !== false,
          alert_sms: alert_sms === true,
          status: "watching",
          priority_launch: isPriority,
          window_opens_at: isPriority ? windowOpensAt : null,
        })
        .select()
        .single();

      if (error) throw error;
      logStep("Event alert created", { alertId: data.id, userId: user.id, priorityLaunch: isPriority });

      // Trigger instant first check (fire-and-forget)
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/event-availability-check`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ instant_alert_id: data.id }),
      }).catch(err => logStep("Instant check fire-and-forget error", { error: String(err) }));

      return new Response(JSON.stringify({ alert: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201,
      });
    }

    // ─── LIST USER EVENT ALERTS ─────────────────────────────────
    if (action === "list") {
      const { data, error } = await supabaseAdmin
        .from("event_alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ alerts: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ─── CANCEL EVENT ALERT ─────────────────────────────────────
    if (action === "cancel" && req.method === "POST") {
      const body = await req.json();
      const { alert_id } = body;
      if (!alert_id) throw new Error("alert_id required");

      const { error } = await supabaseAdmin
        .from("event_alerts")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", alert_id)
        .eq("user_id", user.id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
