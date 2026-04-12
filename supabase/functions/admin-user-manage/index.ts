import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-authorization",
};

const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    // Auth check - get caller identity
    const authHeader = req.headers.get("x-client-authorization") || req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);
    if (authErr || !user || !ADMIN_EMAILS.includes(user.email || "")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list-users";

    if (action === "list-users") {
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const limit = parseInt(url.searchParams.get("limit") || "100");
      const search = url.searchParams.get("search") || "";

      // Get profiles
      let query = admin.from("users_profile").select("id, email, first_name, last_name, avatar_url, created_at, onboarding_complete").range(offset, offset + limit - 1).order("created_at", { ascending: false });
      if (search) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }
      const { data: profiles, error: profErr } = await query;
      if (profErr) throw profErr;

      if (!profiles || profiles.length === 0) {
        return new Response(JSON.stringify({ users: [], hasMore: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const userIds = profiles.map(p => p.id);

      // Get subscriptions for these users
      const { data: subs } = await admin.from("subscriptions").select("user_id, plan_name, status, billing_interval, created_at, updated_at").in("user_id", userIds);

      // Get alert counts per user
      const alertTables = ["dining_alerts", "event_alerts", "hotel_alerts", "airfare_alerts"];
      const alertCounts: Record<string, number> = {};
      for (const table of alertTables) {
        const { data: alerts } = await admin.from(table).select("user_id").eq("status", "watching").in("user_id", userIds);
        (alerts || []).forEach((a: any) => {
          alertCounts[a.user_id] = (alertCounts[a.user_id] || 0) + 1;
        });
      }

      const subMap: Record<string, any> = {};
      (subs || []).forEach(s => { subMap[s.user_id] = s; });

      const users = profiles.map(p => ({
        id: p.id,
        email: p.email,
        first_name: p.first_name,
        last_name: p.last_name,
        avatar_url: p.avatar_url,
        created_at: p.created_at,
        plan_name: subMap[p.id]?.plan_name || null,
        status: subMap[p.id]?.status || "none",
        billing_interval: subMap[p.id]?.billing_interval || null,
        sub_updated_at: subMap[p.id]?.updated_at || null,
        active_alerts: alertCounts[p.id] || 0,
      }));

      return new Response(JSON.stringify({ users, hasMore: profiles.length === limit }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "delete-user-data") {
      const body = await req.json();
      const userId = body.user_id;
      if (!userId) return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const tables = [
        "dining_alerts", "event_alerts", "hotel_alerts", "airfare_alerts",
        "ap_hotel_alerts", "ap_merch_alerts", "saved_trips",
        "social_posts", "messages", "game_sessions",
        "reservations_inbox", "gift_card_alerts", "subscriptions",
        "beacon_rsvps", "friend_requests", "friendships",
        "dining_notifications", "event_notifications",
        "disney_sessions", "discount_codes",
      ];

      const results: Record<string, string> = {};
      for (const table of tables) {
        const col = ["messages"].includes(table) ? "receiver_id" :
                    ["friendships"].includes(table) ? "user_id_1" :
                    "user_id";
        const { error } = await admin.from(table).delete().eq(col, userId);
        results[table] = error ? error.message : "ok";
      }

      // For friendships also delete where user_id_2
      await admin.from("friendships").delete().eq("user_id_2", userId);
      // For messages also delete sent
      await admin.from("messages").delete().eq("sender_id", userId);

      // Delete profile last
      const { error: profErr } = await admin.from("users_profile").delete().eq("id", userId);
      results["users_profile"] = profErr ? profErr.message : "ok";

      // Audit log
      await admin.from("admin_audit_log").insert({
        actor_id: user.id, actor_email: user.email, action: "delete_user_data",
        target_id: userId, target_table: "users_profile", details: results,
      });

      return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update-tier") {
      const body = await req.json();
      const { user_id, plan_name, status: newStatus } = body;
      if (!user_id || !plan_name) return new Response(JSON.stringify({ error: "user_id and plan_name required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // Check existing subscription
      const { data: existing } = await admin.from("subscriptions").select("id").eq("user_id", user_id).maybeSingle();

      if (existing) {
        const { error } = await admin.from("subscriptions").update({
          plan_name, status: newStatus || "active", updated_at: new Date().toISOString(),
        }).eq("user_id", user_id);
        if (error) throw error;
      } else {
        const { error } = await admin.from("subscriptions").insert({
          user_id, plan_name, status: newStatus || "active", billing_interval: "monthly",
        });
        if (error) throw error;
      }

      await admin.from("admin_audit_log").insert({
        actor_id: user.id, actor_email: user.email, action: "update_tier",
        target_id: user_id, target_table: "subscriptions", details: { plan_name, status: newStatus },
      });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "user-errors") {
      const userId = url.searchParams.get("user_id");
      if (!userId) return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const [dNotifs, eNotifs] = await Promise.all([
        admin.from("dining_notifications").select("*").eq("user_id", userId).eq("delivery_status", "failed").order("created_at", { ascending: false }).limit(20),
        admin.from("event_notifications").select("*").eq("user_id", userId).eq("delivery_status", "failed").order("created_at", { ascending: false }).limit(20),
      ]);

      return new Response(JSON.stringify({
        dining_errors: dNotifs.data || [],
        event_errors: eNotifs.data || [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
