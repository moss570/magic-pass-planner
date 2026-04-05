import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net"];

async function sendVIPInviteEmail(params: {
  toEmail: string;
  firstName: string;
  reason: string;
  inviteToken: string;
}): Promise<boolean> {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    console.log("No Brevo key — email not sent");
    return false;
  }

  const signupUrl = `https://magicpassplus.com/signup?vip=${params.inviteToken}&email=${encodeURIComponent(params.toEmail)}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#080E1E;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:500px;margin:20px auto;background:#111827;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#080E1E,#0D1230);padding:32px;text-align:center;border-bottom:2px solid #F5C842;">
      <p style="color:#F5C842;font-size:24px;font-weight:bold;margin:0;">🏰 Magic Pass Plus</p>
      <p style="color:#9CA3AF;font-size:13px;margin:6px 0 0 0;">Your complete Disney vacation command center</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#F5C842;font-size:18px;font-weight:bold;margin:0 0 16px 0;">🎁 You've been invited!</p>
      <p style="color:#F9FAFB;font-size:15px;margin:0 0 12px 0;">Hi ${params.firstName || "there"},</p>
      <p style="color:#9CA3AF;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
        You've been personally invited by Brandon to join Magic Pass Plus as a <strong style="color:#F5C842;">VIP Member — Free Forever</strong>. No credit card required, ever.
      </p>
      <div style="background:#0D1230;border:1px solid rgba(245,200,66,0.3);border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="color:#F5C842;font-size:13px;font-weight:bold;margin:0 0 8px 0;">YOUR VIP INCLUDES:</p>
        <ul style="color:#F9FAFB;font-size:13px;margin:0;padding-left:20px;line-height:2;">
          <li>AI Trip Planner & full itinerary builder</li>
          <li>Live wait times & in-park optimizer</li>
          <li>Disney Gift Card deal tracker</li>
          <li>Dining reservation alerts</li>
          <li>Annual Passholder Command Center</li>
          <li>Fireworks ride timing calculator</li>
          <li>Group coordinator & AP Meetup Beacon</li>
          <li><strong style="color:#F5C842;">Free forever — no billing, ever</strong></li>
        </ul>
      </div>
      <a href="${signupUrl}" style="display:block;background:#F5C842;color:#080E1E;text-decoration:none;padding:16px;border-radius:10px;font-size:16px;font-weight:bold;text-align:center;margin-bottom:16px;">
        🏰 Claim Your Free VIP Account →
      </a>
      <p style="color:#6B7280;font-size:12px;text-align:center;margin:0;">
        This invitation is personal to you. Please don't share the link.
      </p>
    </div>
    <div style="padding:16px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
      <p style="color:#4B5563;font-size:11px;margin:0;">© 2026 Magic Pass Plus LLC · magicpassplus.com<br>Not affiliated with The Walt Disney Company</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Magic Pass Plus", email: "alerts@magicpassplus.com" },
        to: [{ email: params.toEmail, name: params.firstName }],
        subject: "🏰 You're invited — Free VIP access to Magic Pass Plus",
        htmlContent: html,
      }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Verify admin
    const authHeader = req.headers.get("x-client-authorization") ?? req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user || !ADMIN_EMAILS.includes(userData.user.email || "")) {
      throw new Error("Admin access required");
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    // ── LIST VIP ACCOUNTS ─────────────────────────────────
    if (action === "list") {
      const { data, error } = await supabase
        .from("vip_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ vips: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ── INVITE VIP ────────────────────────────────────────
    if (action === "invite" && req.method === "POST") {
      const { email, first_name, last_name, reason, notes } = await req.json();
      if (!email) throw new Error("Email required");

      // Generate invite token
      const inviteToken = crypto.randomUUID().replace(/-/g, "");

      // Create VIP record
      const { data: vip, error } = await supabase
        .from("vip_accounts")
        .upsert({
          email: email.toLowerCase().trim(),
          first_name: first_name || "",
          last_name: last_name || "",
          reason: reason || "VIP invite",
          notes: notes || "",
          invited_by: userData.user.id,
          invite_sent_at: new Date().toISOString(),
          status: "invited",
          updated_at: new Date().toISOString(),
        }, { onConflict: "email" })
        .select()
        .single();

      if (error) throw error;

      // Send invite email
      const emailSent = await sendVIPInviteEmail({
        toEmail: email,
        firstName: first_name || "Disney Fan",
        reason: reason || "",
        inviteToken,
      });

      // Create/update their Supabase auth account with free subscription
      // Try to find existing user
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email.toLowerCase().trim());

      if (existingUser) {
        // Grant them VIP subscription in subscriptions table
        await supabase.from("subscriptions").upsert({
          user_id: existingUser.id,
          stripe_customer_id: "vip_free_forever",
          stripe_subscription_id: `vip_${existingUser.id}`,
          plan_name: "Magic Pass",
          plan_interval: "monthly",
          status: "active",
          trial_end: null,
          current_period_end: new Date("2099-12-31").toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        // Update VIP record with user_id
        await supabase.from("vip_accounts").update({
          user_id: existingUser.id,
          status: "active",
          invite_accepted_at: new Date().toISOString(),
        }).eq("email", email.toLowerCase().trim());
      }

      return new Response(JSON.stringify({ success: true, vip, emailSent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201,
      });
    }

    // ── REVOKE VIP ────────────────────────────────────────
    if (action === "revoke" && req.method === "POST") {
      const { vip_id, email } = await req.json();

      // Get the VIP record
      const { data: vip } = await supabase
        .from("vip_accounts")
        .select("*")
        .eq("id", vip_id)
        .single();

      if (vip?.user_id) {
        // Remove their subscription
        await supabase.from("subscriptions")
          .delete()
          .eq("user_id", vip.user_id)
          .eq("stripe_subscription_id", `vip_${vip.user_id}`);
      }

      // Mark as revoked
      await supabase.from("vip_accounts")
        .update({ status: "revoked", updated_at: new Date().toISOString() })
        .eq("id", vip_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ── DELETE VIP ────────────────────────────────────────
    if (action === "delete" && req.method === "POST") {
      const { vip_id } = await req.json();

      const { data: vip } = await supabase
        .from("vip_accounts")
        .select("*")
        .eq("id", vip_id)
        .single();

      if (vip?.user_id) {
        // Remove subscription
        await supabase.from("subscriptions")
          .delete()
          .eq("user_id", vip.user_id)
          .eq("stripe_subscription_id", `vip_${vip.user_id}`);
        // Delete user account entirely
        await supabase.auth.admin.deleteUser(vip.user_id);
      }

      // Remove VIP record
      await supabase.from("vip_accounts").delete().eq("id", vip_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    throw new Error("Unknown action");

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
