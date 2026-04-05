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
        })
        .select(`*, restaurant:restaurants(name, location, disney_url)`)
        .single();

      if (error) throw error;
      logStep("Alert created", { alertId: data.id, userId: user.id });

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
