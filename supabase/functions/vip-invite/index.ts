import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://magicpassplus.com",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net"];

async function sendVIPInviteEmail(params: {
  toEmail: string;
  firstName: string;
  reason: string;
  inviteToken: string;
  customHtml?: string;
  enrollToken?: string;
  enrollType?: string;
}): Promise<boolean> {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    console.log("No Brevo key — email not sent");
    return false;
  }

  const signupUrl = `https://magicpassplus.com/signup?vip=${params.inviteToken}&email=${encodeURIComponent(params.toEmail)}`;
  const betaLink = params.enrollToken ? `https://magicpassplus.com/signup?enroll=${params.enrollToken}&type=beta_tester` : signupUrl;
  const vipLink = params.enrollToken ? `https://magicpassplus.com/signup?enroll=${params.enrollToken}&type=vip` : signupUrl;
  const freeMonthLink = params.enrollToken ? `https://magicpassplus.com/signup?enroll=${params.enrollToken}&type=free_month` : signupUrl;

  let html: string;

  if (params.customHtml) {
    html = params.customHtml
      .replace(/\{\{first_name\}\}/g, params.firstName || "there")
      .replace(/\{\{signup_url\}\}/g, signupUrl)
      .replace(/\{\{app_url\}\}/g, "https://magicpassplus.com/dashboard")
      .replace(/\{\{beta_link\}\}/g, betaLink)
      .replace(/\{\{vip_link\}\}/g, vipLink)
      .replace(/\{\{free_month_link\}\}/g, freeMonthLink);
  } else {
    // Type-specific default email content
    let tagline: string;
    let bodyText: string;
    let ctaLabel: string;
    let ctaLink: string;

    if (params.enrollType === "beta_tester") {
      tagline = "🧪 You've been invited to beta test!";
      bodyText = `You've been personally invited by Brandon to join Magic Pass Plus as a <strong style="color:#F5C842;">Beta Tester — 1 Year Free Access</strong>. Get early access to new features and help shape the future of the platform. No credit card required.`;
      ctaLabel = "🧪 Join the Beta →";
      ctaLink = betaLink;
    } else if (params.enrollType === "free_month") {
      tagline = "🎉 You've got a free month!";
      bodyText = `You've been personally invited by Brandon to try Magic Pass Plus with <strong style="color:#F5C842;">One Free Month — Full Access</strong>. Enjoy 30 days of every feature, completely free. No credit card required.`;
      ctaLabel = "🎉 Claim Your Free Month →";
      ctaLink = freeMonthLink;
    } else {
      tagline = "🎁 You've been invited!";
      bodyText = `You've been personally invited by Brandon to join Magic Pass Plus as a <strong style="color:#F5C842;">VIP Member — Free Forever</strong>. No credit card required, ever.`;
      ctaLabel = "🏰 Claim Your Free VIP Account →";
      ctaLink = vipLink;
    }

    html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#080E1E;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:500px;margin:20px auto;background:#111827;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#080E1E,#0D1230);padding:32px;text-align:center;border-bottom:2px solid #F5C842;">
      <p style="color:#F5C842;font-size:24px;font-weight:bold;margin:0;">🏰 Magic Pass Plus</p>
      <p style="color:#9CA3AF;font-size:13px;margin:6px 0 0 0;">Your complete Disney vacation command center</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#F5C842;font-size:18px;font-weight:bold;margin:0 0 16px 0;">${tagline}</p>
      <p style="color:#F9FAFB;font-size:15px;margin:0 0 12px 0;">Hi ${params.firstName || "there"},</p>
      <p style="color:#9CA3AF;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
        ${bodyText}
      </p>
      <a href="${ctaLink}" style="display:block;background:#F5C842;color:#080E1E;text-decoration:none;padding:16px;border-radius:10px;font-size:16px;font-weight:bold;text-align:center;margin-bottom:16px;">
        ${ctaLabel}
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
  }

  // Determine subject based on type
  let subject = "🏰 You're invited — Free VIP access to Magic Pass Plus";
  if (params.enrollType === "beta_tester") {
    subject = "🧪 You're invited to beta test Magic Pass Plus";
  } else if (params.enrollType === "free_month") {
    subject = "🎉 You've got one free month of Magic Pass Plus!";
  }

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
        subject,
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
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    // ── TRACK CLICK (unauthenticated, fire-and-forget) ───
    if (action === "track-click" && req.method === "POST") {
      const { enroll_token } = await req.json();
      if (enroll_token) {
        await supabase
          .from("vip_accounts")
          .update({ link_clicked_at: new Date().toISOString() })
          .eq("enroll_token", enroll_token)
          .is("link_clicked_at", null);
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ── ACCEPT TOKEN (unauthenticated) ────────────────────
    if (action === "accept-token" && req.method === "POST") {
      const { enroll_token } = await req.json();
      if (!enroll_token) throw new Error("enroll_token required");

      // Look up the VIP record by enroll token
      const { data: vip, error: vipErr } = await supabase
        .from("vip_accounts")
        .select("*")
        .eq("enroll_token", enroll_token)
        .single();

      if (vipErr || !vip) {
        return new Response(JSON.stringify({ error: "Invalid or expired enrollment token" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404,
        });
      }

      // Determine period end and stripe customer ID based on enroll type
      const enrollType = vip.enroll_type || "vip";
      let periodEnd: string;
      let stripeCustomerId: string;

      if (enrollType === "free_month") {
        periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        stripeCustomerId = "free_month_trial";
      } else if (enrollType === "beta_tester") {
        periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        stripeCustomerId = "beta_tester";
      } else {
        periodEnd = new Date("2099-12-31").toISOString();
        stripeCustomerId = "vip_free_forever";
      }

      // Find the user by email
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === vip.email?.toLowerCase().trim());

      if (existingUser) {
        // Grant subscription
        await supabase.from("subscriptions").upsert({
          user_id: existingUser.id,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: `${enrollType}_${existingUser.id}`,
          plan_name: "magic_pass_plus",
          plan_interval: "monthly",
          status: "active",
          trial_end: null,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        // Update VIP record
        await supabase.from("vip_accounts").update({
          user_id: existingUser.id,
          status: "active",
          invite_accepted_at: new Date().toISOString(),
          enroll_token: null, // Single-use — clear it
        }).eq("id", vip.id);
      }

      return new Response(JSON.stringify({ success: true, type: enrollType }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ── All other actions require admin auth ──────────────
    const authHeader = req.headers.get("x-client-authorization") ?? req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user || !ADMIN_EMAILS.includes(userData.user.email || "")) {
      throw new Error("Admin access required");
    }

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
      const { email, first_name, last_name, reason, notes, type: inviteType, custom_html, template_name } = await req.json();
      if (!email) throw new Error("Email required");

      const accountType = inviteType === "beta_tester" ? "beta_tester" : inviteType === "free_month" ? "free_month" : "vip";

      // Check if already active — skip re-sending email
      const { data: existingVip } = await supabase
        .from("vip_accounts")
        .select("status")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (existingVip?.status === "active") {
        return new Response(JSON.stringify({ success: true, skipped: true, reason: "Already active" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
        });
      }

      // Generate tokens
      const inviteToken = crypto.randomUUID().replace(/-/g, "");
      const enrollToken = crypto.randomUUID();

      // Create VIP record
      const { data: vip, error } = await supabase
        .from("vip_accounts")
        .upsert({
          email: email.toLowerCase().trim(),
          first_name: first_name || "",
          last_name: last_name || "",
          reason: reason || (accountType === "beta_tester" ? "Beta tester invite" : accountType === "free_month" ? "Free month invite" : "VIP invite"),
          notes: notes ? `${notes}${template_name ? ` [template: ${template_name}]` : ""}` : (template_name ? `[template: ${template_name}]` : ""),
          invited_by: userData.user.id,
          invite_sent_at: new Date().toISOString(),
          status: "invited",
          type: accountType,
          enroll_token: enrollToken,
          enroll_type: accountType,
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
        customHtml: custom_html,
        enrollToken,
        enrollType: accountType,
      });

      // Calculate expiration based on type
      let periodEnd: string;
      let stripeCustomerId: string;

      if (accountType === "free_month") {
        periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        stripeCustomerId = "free_month_trial";
      } else if (accountType === "beta_tester") {
        periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        stripeCustomerId = "beta_tester";
      } else {
        periodEnd = new Date("2099-12-31").toISOString();
        stripeCustomerId = "vip_free_forever";
      }

      // If user already exists, grant them subscription immediately
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email.toLowerCase().trim());

      if (existingUser) {
        await supabase.from("subscriptions").upsert({
          user_id: existingUser.id,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: `${accountType}_${existingUser.id}`,
          plan_name: "magic_pass_plus",
          plan_interval: "monthly",
          status: "active",
          trial_end: null,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        await supabase.from("vip_accounts").update({
          user_id: existingUser.id,
          status: "active",
          invite_accepted_at: new Date().toISOString(),
          enroll_token: null,
        }).eq("email", email.toLowerCase().trim());
      }

      return new Response(JSON.stringify({ success: true, vip, emailSent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201,
      });
    }

    // ── REVOKE VIP ────────────────────────────────────────
    if (action === "revoke" && req.method === "POST") {
      const { vip_id } = await req.json();

      const { data: vip } = await supabase
        .from("vip_accounts")
        .select("*")
        .eq("id", vip_id)
        .single();

      if (vip?.user_id) {
        await supabase.from("subscriptions")
          .delete()
          .eq("user_id", vip.user_id)
          .eq("stripe_subscription_id", `vip_${vip.user_id}`);
      }

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
        await supabase.from("subscriptions")
          .delete()
          .eq("user_id", vip.user_id)
          .eq("stripe_subscription_id", `vip_${vip.user_id}`);
        await supabase.auth.admin.deleteUser(vip.user_id);
      }

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
