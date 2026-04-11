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

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (req.method === "POST") {
      const body = await req.json();
      const { origin, destination, depart_date, return_date, adults, children, target_price, cabin_class, stops_max, notify_email, notify_sms, trip_id } = body;
      if (!origin || !depart_date || !return_date || !target_price) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await supabase.from("airfare_alerts").insert({
        user_id: user.id, origin, destination: destination || "MCO",
        depart_date, return_date, adults: adults || 2, children: children || 0,
        target_price, cabin_class: cabin_class || "economy", stops_max: stops_max ?? 2,
        notify_email: notify_email ?? true, notify_sms: notify_sms ?? false,
        trip_id: trip_id || null,
      }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ alert: data }), {
        status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      const url = new URL(req.url);
      const tripId = url.searchParams.get("trip_id");
      let query = supabase.from("airfare_alerts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (tripId) query = query.eq("trip_id", tripId);
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ alerts: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "PATCH") {
      const body = await req.json();
      const { id, ...updates } = body;
      if (!id) return new Response(JSON.stringify({ error: "Missing alert id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from("airfare_alerts").update(updates).eq("id", id).eq("user_id", user.id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ alert: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) return new Response(JSON.stringify({ error: "Missing alert id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await supabase.from("airfare_alerts").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
