import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    // Public trip view by share token (no auth needed)
    if (action === "view-shared") {
      const token = url.searchParams.get("token");
      if (!token) throw new Error("Share token required");
      const { data, error } = await supabase.from("saved_trips").select("*").eq("share_token", token).eq("is_public", true).single();
      if (error || !data) throw new Error("Trip not found or no longer shared");
      return new Response(JSON.stringify({ trip: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // Auth required for all other actions
    const authHeader = req.headers.get("x-client-authorization") ?? req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) throw new Error("Invalid session");
    const userId = userData.user.id;

    // ── SAVE TRIP ──────────────────────────────────────────
    if (action === "save" && req.method === "POST") {
      const body = await req.json();
      // Enforce 10-trip limit
      if (!body.id) {
        const { count } = await supabase.from("saved_trips").select("id", { count: "exact" }).eq("user_id", userId);
        if ((count || 0) >= 10) {
          return new Response(JSON.stringify({ error: "Trip limit reached (10 max). Delete an existing trip to save a new one." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
          });
        }
      }
      const shareToken = body.is_public ? crypto.randomUUID().replace(/-/g, "").substring(0, 12) : null;
      
      const { data: trip, error } = await supabase.from("saved_trips").upsert({
        id: body.id || crypto.randomUUID(),
        user_id: userId,
        name: body.name || `${body.parks?.[0] || "Disney"} Trip ${new Date().toLocaleDateString()}`,
        parks: body.parks || [],
        start_date: body.start_date,
        end_date: body.end_date,
        adults: body.adults || 2,
        children: body.children || 0,
        ages: body.ages || null,
        ride_preference: body.ride_preference || "mix",
        budget: body.budget || 6500,
        ll_option: body.ll_option || "multi",
        special_notes: body.special_notes || null,
        itinerary: body.itinerary || null,
        estimated_total: body.estimated_total || null,
        share_token: shareToken,
        is_public: body.is_public || false,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" }).select().single();

      if (error) throw error;
      return new Response(JSON.stringify({ trip, shareUrl: shareToken ? `https://magicpassplus.com/trip/${shareToken}` : null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201,
      });
    }

    // ── LIST TRIPS ────────────────────────────────────────
    if (action === "list") {
      const { data, error } = await supabase.from("saved_trips").select("id, name, parks, start_date, end_date, adults, children, estimated_total, created_at, share_token, is_public")
        .eq("user_id", userId).order("updated_at", { ascending: false }).limit(20);
      if (error) throw error;
      return new Response(JSON.stringify({ trips: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // ── LOAD TRIP ─────────────────────────────────────────
    if (action === "load") {
      const tripId = url.searchParams.get("id");
      if (!tripId) throw new Error("Trip ID required");
      const { data, error } = await supabase.from("saved_trips").select("*").eq("id", tripId).eq("user_id", userId).single();
      if (error) throw error;
      return new Response(JSON.stringify({ trip: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // ── DELETE TRIP ───────────────────────────────────────
    if (action === "delete" && req.method === "POST") {
      const { id } = await req.json();
      await supabase.from("saved_trips").delete().eq("id", id).eq("user_id", userId);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // ── GENERATE SHARE LINK ───────────────────────────────
    if (action === "share" && req.method === "POST") {
      const { id } = await req.json();
      const shareToken = crypto.randomUUID().replace(/-/g, "").substring(0, 12);
      await supabase.from("saved_trips").update({ share_token: shareToken, is_public: true }).eq("id", id).eq("user_id", userId);
      return new Response(JSON.stringify({ shareUrl: `https://magicpassplus.com/trip/${shareToken}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    throw new Error("Unknown action");

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
