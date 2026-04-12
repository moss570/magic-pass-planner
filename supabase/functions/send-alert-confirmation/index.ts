import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.1/dist/module/lib/constants.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PLAN_DISPLAY: Record<string, string> = {
  free: "Free Trial",
  ninety_day_planner: "90 Day Magic Pass Planner",
  ninety_day_friend: "90 Day Magic Pass Friend",
  magic_pass_planner: "Magic Pass Planner",
  magic_pass_plus: "Magic Pass Plus",
  founders_pass: "Founders Pass",
};

const ALERT_LIMITS: Record<string, Record<string, number | "unlimited" | "none">> = {
  free: { dining: 1, event: "none", hotel: 1, airfare: "none" },
  ninety_day_planner: { dining: 7, event: 3, hotel: 7, airfare: 1 },
  ninety_day_friend: { dining: 0, event: 0, hotel: 0, airfare: 0 },
  magic_pass_planner: { dining: 20, event: 10, hotel: 20, airfare: 20 },
  magic_pass_plus: { dining: "unlimited", event: "unlimited", hotel: "unlimited", airfare: "unlimited" },
  founders_pass: { dining: "unlimited", event: "unlimited", hotel: "unlimited", airfare: "unlimited" },
};

const UPGRADE_TARGETS: Record<string, { plan: string; label: string }> = {
  free: { plan: "magic_pass_planner", label: "Magic Pass Planner" },
  ninety_day_planner: { plan: "magic_pass_planner", label: "Magic Pass Planner" },
  ninety_day_friend: { plan: "magic_pass_planner", label: "Magic Pass Planner" },
  magic_pass_planner: { plan: "magic_pass_plus", label: "Magic Pass Plus" },
};

const FEATURE_SPOTLIGHTS = [
  { title: "⚡ Lightning Lane Gap Finder", desc: "Automatically spots open Lightning Lane windows throughout the day so you skip the longest lines.", link: "/live-park" },
  { title: "🌅 Golden Hour Planner", desc: "Identifies the lowest-crowd windows at each park so you can hit top rides with minimal waits.", link: "/live-park" },
  { title: "💰 AP Discount Database", desc: "Browse every Annual Passholder discount across dining, merch, and experiences — updated daily.", link: "/ap-command-center" },
  { title: "🗺️ GPS Park Compass", desc: "Real-time walking directions inside the parks with estimated walk times calibrated to your speed.", link: "/live-park" },
  { title: "📸 PhotoPass Alert Spots", desc: "Never miss a PhotoPass photographer — see all locations on an interactive map with crowd tips.", link: "/photo-opps" },
  { title: "🎆 Fireworks Ride Calculator", desc: "Know exactly which rides you can squeeze in before the fireworks start based on current wait times.", link: "/live-park" },
  { title: "🛍️ Merch Drop Alerts", desc: "Get notified instantly when limited-edition merchandise drops — before it sells out.", link: "/ap-command-center" },
  { title: "🏨 AP Hotel Deal Alerts", desc: "We monitor passholder room discounts 24/7 and alert you the moment a deal appears.", link: "/ap-command-center" },
];

const ALERT_TABLE_MAP: Record<string, string> = {
  dining: "dining_alerts",
  event: "event_alerts",
  hotel: "hotel_alerts",
  airfare: "airfare_alerts",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user_id, alert_type, alert_details } = await req.json();
    if (!user_id || !alert_type) {
      return new Response(JSON.stringify({ error: "Missing user_id or alert_type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user email
    const { data: { user } } = await supabase.auth.admin.getUserById(user_id);
    if (!user?.email) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get subscription
    const { data: sub } = await supabase.from("subscriptions").select("plan_name, status").eq("user_id", user_id).maybeSingle();
    const planName = (sub?.status === "active" ? sub?.plan_name : "free") || "free";
    const planDisplay = PLAN_DISPLAY[planName] || planName;

    // Count active alerts for this type
    const tableName = ALERT_TABLE_MAP[alert_type];
    let activeCount = 0;
    if (tableName) {
      const { count } = await supabase.from(tableName).select("id", { count: "exact", head: true }).eq("user_id", user_id).eq("status", "watching");
      activeCount = count || 0;
    }

    // Calculate remaining
    const limits = ALERT_LIMITS[planName] || ALERT_LIMITS.free;
    const limit = limits[alert_type];
    const isUnlimited = limit === "unlimited";
    const remaining = isUnlimited ? "Unlimited" : typeof limit === "number" ? Math.max(0, limit - activeCount) : 0;
    const limitDisplay = isUnlimited ? "Unlimited" : limit;

    // Upgrade info
    const upgradeTarget = UPGRADE_TARGETS[planName];
    const upgradeLimits = upgradeTarget ? ALERT_LIMITS[upgradeTarget.plan] : null;
    const upgradeAlertLimit = upgradeLimits ? upgradeLimits[alert_type] : null;

    // Feature spotlight (rotate by day of year)
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const spotlight = FEATURE_SPOTLIGHTS[dayOfYear % FEATURE_SPOTLIGHTS.length];

    // Alert type labels
    const typeLabels: Record<string, string> = { dining: "🍽️ Dining Alert", event: "🎪 Event Alert", hotel: "🏨 Hotel Alert", airfare: "✈️ Airfare Alert" };
    const typeLabel = typeLabels[alert_type] || "Alert";

    // Build details string
    const detailsHtml = alert_details
      ? `<table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:8px">
          ${alert_details.name ? `<tr><td style="color:#a0a0a0;font-size:12px;padding:4px 8px">Watching</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 8px">${alert_details.name}</td></tr>` : ""}
          ${alert_details.date ? `<tr><td style="color:#a0a0a0;font-size:12px;padding:4px 8px">Date</td><td style="color:#ffffff;font-size:13px;padding:4px 8px">${alert_details.date}</td></tr>` : ""}
          ${alert_details.extra ? `<tr><td style="color:#a0a0a0;font-size:12px;padding:4px 8px">Details</td><td style="color:#ffffff;font-size:13px;padding:4px 8px">${alert_details.extra}</td></tr>` : ""}
        </table>`
      : "";

    const upgradeSection = upgradeTarget
      ? `<div style="background:#1a1a2e;border:1px solid #d4a843;border-radius:12px;padding:16px;margin-top:16px;text-align:center">
          <p style="color:#d4a843;font-size:13px;font-weight:600;margin:0 0 8px">✨ Want more alerts?</p>
          <p style="color:#c0c0c0;font-size:12px;margin:0 0 12px">Upgrade to <strong style="color:#ffffff">${upgradeTarget.label}</strong> for ${upgradeAlertLimit === "unlimited" ? "unlimited" : `up to ${upgradeAlertLimit}`} ${alert_type} alerts</p>
          <a href="https://magic-pass-planner.lovable.app/pricing" style="display:inline-block;background:linear-gradient(135deg,#d4a843,#b8860b);color:#000;font-weight:700;font-size:13px;padding:10px 24px;border-radius:8px;text-decoration:none">Upgrade Now →</a>
        </div>`
      : "";

    const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:24px 16px">
    <!-- Header -->
    <div style="text-align:center;padding:20px 0">
      <p style="font-size:20px;font-weight:800;margin:0;color:#d4a843">🏰 Magic Pass Plus</p>
      <p style="font-size:11px;color:#888;margin:4px 0 0">${planDisplay} Member</p>
    </div>

    <!-- Confirmation Banner -->
    <div style="background:linear-gradient(135deg,#065f46,#047857);border-radius:12px;padding:16px;text-align:center;margin-bottom:16px">
      <p style="color:#ffffff;font-size:16px;font-weight:700;margin:0">✅ ${typeLabel} Created!</p>
    </div>

    <!-- Alert Details -->
    <div style="background:#111827;border-radius:12px;padding:16px;border:1px solid #1f2937">
      ${detailsHtml}
    </div>

    <!-- Alerts Remaining -->
    <div style="background:#111827;border-radius:12px;padding:16px;margin-top:12px;border:1px solid #1f2937">
      <p style="color:#a0a0a0;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Alerts Remaining (${alert_type})</p>
      <p style="color:#ffffff;font-size:24px;font-weight:800;margin:0">${remaining}${!isUnlimited ? ` <span style="color:#666;font-size:14px;font-weight:400">of ${limitDisplay}</span>` : ""}</p>
      ${!isUnlimited && typeof limit === "number" ? `<div style="background:#1f2937;border-radius:4px;height:6px;margin-top:10px;overflow:hidden"><div style="background:linear-gradient(90deg,#d4a843,#b8860b);height:100%;width:${Math.min(100, (activeCount / limit) * 100)}%;border-radius:4px"></div></div>` : ""}
    </div>

    ${upgradeSection}

    <!-- Feature Spotlight -->
    <div style="background:#111827;border:1px solid #d4a843;border-radius:12px;padding:16px;margin-top:16px">
      <p style="color:#d4a843;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">✨ Feature Spotlight</p>
      <p style="color:#ffffff;font-size:14px;font-weight:700;margin:0 0 6px">${spotlight.title}</p>
      <p style="color:#c0c0c0;font-size:12px;line-height:1.5;margin:0 0 12px">${spotlight.desc}</p>
      <a href="https://magic-pass-planner.lovable.app${spotlight.link}" style="color:#d4a843;font-size:12px;font-weight:600;text-decoration:none">Explore →</a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px 0 0;border-top:1px solid #1f2937;margin-top:20px">
      <p style="color:#555;font-size:10px;margin:0">Magic Pass Planner · Your Disney World Command Center</p>
    </div>
  </div>
</body></html>`;

    // Send via Brevo
    const brevoResp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "Magic Pass Planner", email: "alerts@magicpassplanner.com" },
        to: [{ email: user.email }],
        subject: `✅ ${typeLabel} Created — ${alert_details?.name || "Alert Active"}`,
        htmlContent: emailHtml,
      }),
    });

    if (!brevoResp.ok) {
      const errText = await brevoResp.text();
      console.error("Brevo error:", errText);
      return new Response(JSON.stringify({ error: "Email send failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-alert-confirmation error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
