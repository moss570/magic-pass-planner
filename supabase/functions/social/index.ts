import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

const BREVO_KEY = Deno.env.get("BREVO_API_KEY") || "";

async function sendFriendInviteEmail(toEmail: string, fromName: string, inviteUrl: string): Promise<boolean> {
  if (!BREVO_KEY) return false;
  const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Magic Pass Plus", email: "alerts@magicpassplus.com" },
      to: [{ email: toEmail }],
      subject: `${fromName} wants to be your Magic Pass Plus friend 🏰`,
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:20px auto;background:#111827;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#080E1E,#0D1230);padding:28px;text-align:center;border-bottom:2px solid #F5C842;">
    <p style="color:#F5C842;font-size:20px;font-weight:bold;margin:0;">🏰 Magic Pass Plus</p>
  </div>
  <div style="padding:28px;">
    <p style="color:#F9FAFB;font-size:16px;margin:0 0 16px 0;">Hi there! 👋</p>
    <p style="color:#9CA3AF;font-size:14px;line-height:1.6;">
      <strong style="color:#F9FAFB;">${fromName}</strong> wants to be your Magic Pass Plus friend! 
      Join them to plan Disney trips together, share expenses, and coordinate park days.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${inviteUrl}" style="background:#F5C842;color:#080E1E;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">
        Accept Friend Request →
      </a>
    </div>
    <p style="color:#6B7280;font-size:12px;text-align:center;">Magic Pass Plus · magicpassplus.com</p>
  </div>
</div>`,
    }),
  });
  return resp.ok;
}

async function sendTripInviteEmail(toEmail: string, fromName: string, inviteUrl: string, tripName: string): Promise<boolean> {
  if (!BREVO_KEY) return false;
  const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Magic Pass Plus", email: "alerts@magicpassplus.com" },
      to: [{ email: toEmail }],
      subject: `${fromName} invited you to their Disney trip 🏰✨`,
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:20px auto;background:#111827;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#080E1E,#0D1230);padding:28px;text-align:center;border-bottom:2px solid #F5C842;">
    <p style="color:#F5C842;font-size:20px;font-weight:bold;margin:0;">🏰 Magic Pass Plus</p>
  </div>
  <div style="padding:28px;">
    <p style="color:#F9FAFB;font-size:16px;margin:0 0 4px 0;">You're invited! 🎉</p>
    <p style="color:#9CA3AF;font-size:14px;line-height:1.6;">
      <strong style="color:#F9FAFB;">${fromName}</strong> is planning <strong style="color:#F5C842;">${tripName}</strong> and wants you to join the trip on Magic Pass Plus.
    </p>
    <p style="color:#9CA3AF;font-size:13px;">You'll be able to see the itinerary, track shared expenses, and get dining alerts — all in one app.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${inviteUrl}" style="background:#F5C842;color:#080E1E;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">
        Join the Trip →
      </a>
    </div>
    <p style="color:#6B7280;font-size:12px;text-align:center;">Magic Pass Plus · magicpassplus.com</p>
  </div>
</div>`,
    }),
  });
  return resp.ok;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("x-client-authorization") ?? req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) throw new Error("Invalid session");
    const userId = userData.user.id;

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list-friends";

    // ── SEND FRIEND REQUEST ───────────────────────────────────
    if (action === "add-friend" && req.method === "POST") {
      const { email } = await req.json();
      if (!email) throw new Error("Email required");

      // Get requester's profile
      const { data: myProfile } = await supabase.from("users_profile").select("first_name, last_name, qr_token").eq("id", userId).single();
      const myName = `${myProfile?.first_name || ""} ${myProfile?.last_name || ""}`.trim() || "A Magic Pass member";

      // Check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const targetUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (targetUser) {
        // User exists — create friend request
        const { data: existing } = await supabase.from("friend_requests")
          .select("id").eq("from_user_id", userId).eq("to_user_id", targetUser.id).single();
        
        if (!existing) {
          await supabase.from("friend_requests").insert({
            from_user_id: userId, to_user_id: targetUser.id,
            to_email: email, from_name: myName, status: "pending",
          });
        }
        // Send notification email
        await sendFriendInviteEmail(email, myName, "https://magicpassplus.com/friends");
        return new Response(JSON.stringify({ success: true, userExists: true, message: "Friend request sent!" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } else {
        // User doesn't exist — send invite
        await supabase.from("friend_requests").insert({
          from_user_id: userId, to_email: email, from_name: myName, status: "pending",
        });
        await sendFriendInviteEmail(email, myName, "https://magicpassplus.com/signup?friend_invite=1&invited_by=" + encodeURIComponent(myName));
        return new Response(JSON.stringify({ success: true, userExists: false, message: `Invite sent to ${email}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ── LIST FRIENDS ─────────────────────────────────────────
    if (action === "list-friends") {
      const { data: friendships } = await supabase.from("friendships")
        .select("user_id_1, user_id_2, created_at")
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

      const friendIds = (friendships || []).map(f => f.user_id_1 === userId ? f.user_id_2 : f.user_id_1);
      
      const friends = await Promise.all(friendIds.map(async (fid) => {
        const { data: profile } = await supabase.from("users_profile").select("first_name, last_name, qr_token").eq("id", fid).single();
        const { data: user } = await supabase.auth.admin.getUserById(fid);
        return { id: fid, first_name: profile?.first_name, last_name: profile?.last_name, email: user.user?.email };
      }));

      // Pending requests
      const { data: pending } = await supabase.from("friend_requests")
        .select("*").eq("to_user_id", userId).eq("status", "pending");

      return new Response(JSON.stringify({ friends, pendingRequests: pending || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ACCEPT FRIEND REQUEST ─────────────────────────────────
    if (action === "accept-friend" && req.method === "POST") {
      const { requestId } = await req.json();
      const { data: request } = await supabase.from("friend_requests").select("*").eq("id", requestId).single();
      if (!request) throw new Error("Request not found");
      
      // Create bidirectional friendship
      await supabase.from("friendships").upsert([
        { user_id_1: request.from_user_id, user_id_2: userId },
        { user_id_1: userId, user_id_2: request.from_user_id },
      ]);
      await supabase.from("friend_requests").update({ status: "accepted", responded_at: new Date().toISOString() }).eq("id", requestId);
      
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── GET MY QR TOKEN ───────────────────────────────────────
    if (action === "my-qr") {
      const { data: profile } = await supabase.from("users_profile").select("first_name, last_name, qr_token").eq("id", userId).single();
      return new Response(JSON.stringify({ qrToken: profile?.qr_token, name: `${profile?.first_name} ${profile?.last_name}`.trim() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ADD BY QR TOKEN ───────────────────────────────────────
    if (action === "add-by-qr" && req.method === "POST") {
      const { qrToken } = await req.json();
      const { data: targetProfile } = await supabase.from("users_profile").select("id, first_name, last_name").eq("qr_token", qrToken).single();
      if (!targetProfile) throw new Error("QR code not recognized");
      if (targetProfile.id === userId) throw new Error("Can't add yourself");
      
      await supabase.from("friendships").upsert([
        { user_id_1: userId, user_id_2: targetProfile.id },
        { user_id_1: targetProfile.id, user_id_2: userId },
      ]);
      
      return new Response(JSON.stringify({ success: true, friend: { first_name: targetProfile.first_name, last_name: targetProfile.last_name } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ADD TRIP MEMBER ───────────────────────────────────────
    if (action === "add-trip-member" && req.method === "POST") {
      const { tripId, firstName, lastName, email, isAdult, isSplittingExpenses } = await req.json();
      
      // Verify trip belongs to this user
      const { data: trip } = await supabase.from("saved_trips").select("id, name").eq("id", tripId).eq("user_id", userId).single();
      if (!trip) throw new Error("Trip not found");

      const { data: member } = await supabase.from("trip_members").insert({
        trip_id: tripId, first_name: firstName, last_name: lastName,
        email: email || null, is_adult: isAdult !== false, is_splitting_expenses: isSplittingExpenses !== false,
        status: email ? "invited" : "added",
      }).select().single();

      // Send trip invite email if adult with email
      if (isAdult && email) {
        const { data: myProfile } = await supabase.from("users_profile").select("first_name, last_name").eq("id", userId).single();
        const myName = `${myProfile?.first_name || ""} ${myProfile?.last_name || ""}`.trim() || "A Magic Pass member";
        await sendTripInviteEmail(email, myName, `https://magicpassplus.com/trip-invite?trip=${tripId}`, trip.name);
        
        // Check if they're a Magic Pass user already and auto-friend them
        const { data: allUsers } = await supabase.auth.admin.listUsers();
        const targetUser = allUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (targetUser && targetUser.id !== userId) {
          await supabase.from("friendships").upsert([
            { user_id_1: userId, user_id_2: targetUser.id },
            { user_id_1: targetUser.id, user_id_2: userId },
          ]).catch(() => {});
          await supabase.from("trip_members").update({ user_id: targetUser.id, status: "joined" }).eq("id", member.id);
        }
      }

      return new Response(JSON.stringify({ success: true, member }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── GET TRIP MEMBERS ──────────────────────────────────────
    if (action === "trip-members") {
      const tripId = url.searchParams.get("tripId");
      const { data: members } = await supabase.from("trip_members").select("*").eq("trip_id", tripId || "").order("created_at");
      return new Response(JSON.stringify({ members: members || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ADD EXPENSE ───────────────────────────────────────────
    if (action === "add-expense" && req.method === "POST") {
      const { tripId, description, amount, expenseType, paidByMemberId, category, splitWith, date } = await req.json();
      
      const { data: expense } = await supabase.from("trip_expenses").insert({
        trip_id: tripId, user_id: userId, description, amount,
        expense_type: expenseType || "personal",
        paid_by_member_id: paidByMemberId || null,
        category: category || "misc",
        split_with: splitWith || [],
        date: date || new Date().toISOString().split("T")[0],
      }).select().single();

      return new Response(JSON.stringify({ success: true, expense }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── GET EXPENSES + SETTLE UP ──────────────────────────────
    if (action === "expenses") {
      const tripId = url.searchParams.get("tripId");
      const { data: expenses } = await supabase.from("trip_expenses").select("*").eq("trip_id", tripId || "").order("date");
      const { data: members } = await supabase.from("trip_members").select("*").eq("trip_id", tripId || "").eq("is_splitting_expenses", true);

      // Calculate settle-up
      const memberBalances: Record<string, number> = {};
      (members || []).forEach(m => memberBalances[m.id] = 0);
      
      (expenses || []).filter(e => e.expense_type === "shared").forEach(expense => {
        const splitCount = expense.split_with.length || (members || []).length;
        const perPerson = expense.amount / splitCount;
        const paidById = expense.paid_by_member_id;
        
        if (paidById && memberBalances[paidById] !== undefined) {
          memberBalances[paidById] += expense.amount;
        }
        
        const splitMembers = expense.split_with.length > 0 ? expense.split_with : (members || []).map(m => m.id);
        splitMembers.forEach((mid: string) => {
          if (memberBalances[mid] !== undefined) {
            memberBalances[mid] -= perPerson;
          }
        });
      });

      const settleUp = Object.entries(memberBalances)
        .map(([memberId, balance]) => {
          const member = (members || []).find(m => m.id === memberId);
          return { memberId, name: `${member?.first_name} ${member?.last_name}`.trim(), balance: Math.round(balance * 100) / 100 };
        })
        .filter(s => Math.abs(s.balance) > 0.01);

      return new Response(JSON.stringify({ expenses: expenses || [], settleUp, totalShared: (expenses || []).filter(e => e.expense_type === "shared").reduce((sum, e) => sum + e.amount, 0) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error("Unknown action");

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
