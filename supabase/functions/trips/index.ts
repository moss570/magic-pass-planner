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

    // ── CREATE VERSION ────────────────────────────────────
    if (action === "create-version" && req.method === "POST") {
      const body = await req.json();
      const tripId = body.trip_id;
      if (!tripId) throw new Error("trip_id required");

      // Check existing count
      const { count } = await supabase.from("trip_versions").select("id", { count: "exact" }).eq("trip_id", tripId).eq("user_id", userId);
      if ((count || 0) >= 3) {
        return new Response(JSON.stringify({ error: "Max 3 versions per trip" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
        });
      }

      // Get next version number
      const { data: existing } = await supabase.from("trip_versions").select("version_number").eq("trip_id", tripId).eq("user_id", userId).order("version_number", { ascending: true });
      const usedNums = new Set((existing || []).map((r: any) => r.version_number));
      let nextNum = 1;
      for (let i = 1; i <= 3; i++) { if (!usedNums.has(i)) { nextNum = i; break; } }

      // Deactivate others if this is active
      const isActive = body.is_active !== false;
      if (isActive) {
        await supabase.from("trip_versions").update({ is_active: false }).eq("trip_id", tripId).eq("user_id", userId);
      }

      const { data: version, error } = await supabase.from("trip_versions").insert({
        user_id: userId,
        trip_id: tripId,
        version_number: nextNum,
        name: body.name || `Version ${nextNum}`,
        inputs: body.inputs || {},
        plans: body.plans || [],
        totals: body.totals || {},
        warnings: body.warnings || [],
        is_active: isActive,
      }).select().single();

      if (error) throw error;
      return new Response(JSON.stringify({ version }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201,
      });
    }

    // ── LIST VERSIONS ─────────────────────────────────────
    if (action === "list-versions") {
      const tripId = url.searchParams.get("trip_id");
      if (!tripId) throw new Error("trip_id required");
      const { data, error } = await supabase.from("trip_versions").select("*")
        .eq("trip_id", tripId).eq("user_id", userId).order("version_number", { ascending: true });
      if (error) throw error;
      return new Response(JSON.stringify({ versions: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ── UPDATE VERSION ────────────────────────────────────
    if (action === "update-version" && req.method === "POST") {
      const body = await req.json();
      if (!body.id) throw new Error("Version id required");
      const patch: Record<string, any> = { updated_at: new Date().toISOString() };
      if (body.name !== undefined) patch.name = body.name;
      if (body.plans !== undefined) patch.plans = body.plans;
      if (body.totals !== undefined) patch.totals = body.totals;
      if (body.inputs !== undefined) patch.inputs = body.inputs;
      if (body.warnings !== undefined) patch.warnings = body.warnings;
      if (body.is_active === true) {
        // Deactivate others first
        const { data: ver } = await supabase.from("trip_versions").select("trip_id").eq("id", body.id).eq("user_id", userId).single();
        if (ver) await supabase.from("trip_versions").update({ is_active: false }).eq("trip_id", ver.trip_id).eq("user_id", userId);
        patch.is_active = true;
      }
      const { data, error } = await supabase.from("trip_versions").update(patch).eq("id", body.id).eq("user_id", userId).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ version: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ── DELETE VERSION ────────────────────────────────────
    if (action === "delete-version" && req.method === "POST") {
      const { id } = await req.json();
      if (!id) throw new Error("Version id required");
      // Don't allow deleting the last version
      const { data: ver } = await supabase.from("trip_versions").select("trip_id, is_active").eq("id", id).eq("user_id", userId).single();
      if (!ver) throw new Error("Version not found");
      const { count } = await supabase.from("trip_versions").select("id", { count: "exact" }).eq("trip_id", ver.trip_id).eq("user_id", userId);
      if ((count || 0) <= 1) {
        return new Response(JSON.stringify({ error: "Cannot delete the last version" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
        });
      }
      await supabase.from("trip_versions").delete().eq("id", id).eq("user_id", userId);
      // If deleted version was active, activate the first remaining
      if (ver.is_active) {
        const { data: remaining } = await supabase.from("trip_versions").select("id").eq("trip_id", ver.trip_id).eq("user_id", userId).order("version_number", { ascending: true }).limit(1);
        if (remaining?.[0]) {
          await supabase.from("trip_versions").update({ is_active: true }).eq("id", remaining[0].id);
        }
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ── ADD EXPENSE ─────────────────────────────────────
    if (action === "add-expense" && req.method === "POST") {
      const body = await req.json();
      if (!body.tripId) throw new Error("tripId required");
      if (!body.category || !body.description || body.amount == null) throw new Error("category, description, and amount required");

      const expense = {
        id: crypto.randomUUID(),
        tripId: body.tripId,
        versionId: body.versionId || null,
        category: body.category,
        description: body.description,
        amount: Number(body.amount),
        paidByUserId: body.paidByUserId || null,
        splitWithUserIds: body.splitWithUserIds || [],
        source: body.source || "manual",
        sourceRef: body.sourceRef || null,
        date: body.date || new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      };

      // Load current trip to append expense to itinerary budget data
      const { data: trip, error: loadErr } = await supabase.from("saved_trips").select("itinerary").eq("id", body.tripId).eq("user_id", userId).single();
      if (loadErr) throw loadErr;

      const itinerary = (trip?.itinerary as any) || {};
      const budgetExpenses = itinerary.budgetExpenses || [];
      budgetExpenses.push(expense);
      itinerary.budgetExpenses = budgetExpenses;

      const { error: updateErr } = await supabase.from("saved_trips").update({
        itinerary,
        updated_at: new Date().toISOString(),
      }).eq("id", body.tripId).eq("user_id", userId);

      if (updateErr) throw updateErr;
      return new Response(JSON.stringify({ expense, success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201,
      });
    }

    throw new Error("Unknown action");

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
