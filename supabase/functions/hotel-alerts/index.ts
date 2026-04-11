import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

  // Verify JWT
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
      const { hotel_name, hotel_id, trip_id, check_in, check_out, adults, children, target_price, notify_email, notify_sms } = body;
      if (!hotel_name || !check_in || !check_out || !target_price) {
        return new Response(JSON.stringify({ error: "Missing required fields: hotel_name, check_in, check_out, target_price" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await supabase.from("hotel_alerts").insert({
        user_id: user.id, hotel_name, hotel_id: hotel_id || null, trip_id: trip_id || null,
        check_in, check_out, adults: adults || 2, children: children || 0,
        target_price, notify_email: notify_email ?? true, notify_sms: notify_sms ?? false,
      }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ alert: data }), {
        status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      const url = new URL(req.url);
      const tripId = url.searchParams.get("trip_id");
      let query = supabase.from("hotel_alerts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
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
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing alert id" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from("hotel_alerts").update(updates).eq("id", id).eq("user_id", user.id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ alert: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing alert id" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await supabase.from("hotel_alerts").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
