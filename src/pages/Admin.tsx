import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Castle, Shield, TrendingUp, Users, Bell, Database, CreditCard, Mail, MessageSquare, Zap, Globe, AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net"];

interface AdminStats {
  totalSubscribers: number;
  activeSubscribers: number;
  trialUsers: number;
  planBreakdown: { plan_name: string; count: number }[];
  activeDiningAlerts: number;
  foundToday: number;
  notificationsToday: number;
  totalUsers: number;
  onboardingComplete: number;
  usersWithAlerts: number;
}

const THIRD_PARTY_SERVICES = [
  {
    name: "Supabase",
    icon: Database,
    purpose: "Database & Auth",
    status: "active",
    plan: "Free",
    cost: "$0/mo",
    note: "Upgrade to Pro ($25/mo) at ~500 active users",
    color: "#10B981",
  },
  {
    name: "Stripe",
    icon: CreditCard,
    purpose: "Billing & Subscriptions",
    status: "warning",
    plan: "Pay-as-go",
    cost: "2.9% + $0.30/txn",
    note: "⚠️ Still in TEST MODE — switch to Live before public launch",
    color: "#F59E0B",
  },
  {
    name: "Lovable",
    icon: Globe,
    purpose: "Frontend Hosting",
    status: "active",
    plan: "Paid",
    cost: "~$25/mo",
    note: "Domain: magicpassplus.com — Live ✅",
    color: "#10B981",
  },
  {
    name: "Railway",
    icon: Zap,
    purpose: "Dining Alert Poller (Playwright)",
    status: "warning",
    plan: "Free Trial",
    cost: "$0 → $5/mo at launch",
    note: "Upgrade to Hobby when poller confirms stable",
    color: "#F59E0B",
  },
  {
    name: "Brevo",
    icon: Mail,
    purpose: "Email Alerts",
    status: "active",
    plan: "Free",
    cost: "$0/mo",
    note: "300 emails/day free — upgrade at 300+ daily alerts",
    color: "#10B981",
  },
  {
    name: "Twilio",
    icon: MessageSquare,
    purpose: "SMS Alerts",
    status: "warning",
    plan: "Pay-as-go",
    cost: "$0.0079/SMS + $1.15/mo number",
    note: "10DLC registration pending (1-3 business days)",
    color: "#F59E0B",
  },
  {
    name: "ThemeParks.wiki",
    icon: Castle,
    purpose: "Live Wait Times API",
    status: "active",
    plan: "Free",
    cost: "$0/mo",
    note: "No rate limits at current scale — monitor at 1000+ users",
    color: "#10B981",
  },
  {
    name: "Supabase pg_cron",
    icon: Clock,
    purpose: "Dining Alert Scheduler",
    status: "active",
    plan: "Included",
    cost: "$0/mo",
    note: "Runs every 5 min — check cron.job_run_details for health",
    color: "#10B981",
  },
];

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [notes, setNotes] = useState(() => localStorage.getItem("clark_admin_notes") || "");
  const [stripeReport, setStripeReport] = useState<any>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripePeriod, setStripePeriod] = useState("month");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [vips, setVips] = useState<any[]>([]);
  const [vipEmail, setVipEmail] = useState("");
  const [vipFirstName, setVipFirstName] = useState("");
  const [vipLastName, setVipLastName] = useState("");
  const [vipReason, setVipReason] = useState("");
  const [vipNotes, setVipNotes] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  // Access control
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
        return;
      }
      if (!ADMIN_EMAILS.includes(user.email || "")) {
        toast({ title: "Access denied", description: "Admin only", variant: "destructive" });
        navigate("/dashboard");
      }
    }
  }, [user, loading, navigate, toast]);

  const loadStats = async () => {
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) return;
    setLoadingStats(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      // Exclude admin test accounts from revenue stats
      const adminUserIds = ["6bfddcfe-3201-4275-be9c-02819bb70854"]; // moss570@gmail.com test account

      const [subsResult, planResult, alertsResult, foundResult, notifsResult, profilesResult, alertUsersResult] = await Promise.all([
        supabase.from("subscriptions").select("status", { count: "exact" }).not("user_id", "in", `(${adminUserIds.join(",")})`),
        supabase.from("subscriptions").select("plan_name, status").not("user_id", "in", `(${adminUserIds.join(",")})`),
        supabase.from("dining_alerts").select("id", { count: "exact" }).eq("status", "watching"),
        supabase.from("dining_alerts").select("id", { count: "exact" }).eq("status", "found").gte("availability_found_at", today),
        supabase.from("dining_notifications").select("id", { count: "exact" }).gte("sent_at", today),
        supabase.from("users_profile").select("onboarding_complete", { count: "exact" }).eq("onboarding_complete", true),
        supabase.from("dining_alerts").select("user_id").eq("status", "watching"),
      ]);

      const allSubs = subsResult.data || [];
      const active = allSubs.filter(s => s.status === "active").length;
      const trial = allSubs.filter(s => s.status === "trialing").length;

      // Plan breakdown
      const planCounts: Record<string, number> = {};
      (planResult.data || []).forEach(s => {
        if (s.plan_name) {
          planCounts[s.plan_name] = (planCounts[s.plan_name] || 0) + 1;
        }
      });
      const planBreakdown = Object.entries(planCounts).map(([plan_name, count]) => ({ plan_name, count }));

      // Unique users with alerts
      const alertUserIds = new Set((alertUsersResult.data || []).map((a: any) => a.user_id));

      setStats({
        totalSubscribers: allSubs.length,
        activeSubscribers: active,
        trialUsers: trial,
        planBreakdown,
        activeDiningAlerts: alertsResult.count || 0,
        foundToday: foundResult.count || 0,
        notificationsToday: notifsResult.count || 0,
        totalUsers: allSubs.length, // approximation
        onboardingComplete: profilesResult.count || 0,
        usersWithAlerts: alertUserIds.size,
      });

      setLastRefresh(new Date());
    } catch (err) {
      console.error("Admin stats error:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (user && ADMIN_EMAILS.includes(user.email || "")) {
      loadStats();
      loadVips();
    }
  }, [user]);

  const loadVips = async () => {
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) return;
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const resp = await fetch(`https://wknelhrmgspuztehetpa.supabase.co/functions/v1/vip-invite?action=list`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-client-authorization": `Bearer ${token}`,
          "apikey": "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC",
        },
      });
      const data = await resp.json();
      setVips(data.vips || []);
    } catch (err) {
      console.error("Failed to load VIPs:", err);
    }
  };

  const sendVipInvite = async () => {
    if (!vipEmail) return;
    setSendingInvite(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const resp = await fetch(`https://wknelhrmgspuztehetpa.supabase.co/functions/v1/vip-invite?action=invite`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-client-authorization": `Bearer ${token}`,
          "apikey": "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: vipEmail, first_name: vipFirstName, last_name: vipLastName, reason: vipReason, notes: vipNotes }),
      });
      const data = await resp.json();
      if (data.success) {
        toast({ title: `✅ VIP invite sent to ${vipEmail}`, description: data.emailSent ? "Email delivered" : "Saved (email may need Brevo config)" });
        setVipEmail(""); setVipFirstName(""); setVipLastName(""); setVipReason(""); setVipNotes("");
        loadVips();
      } else {
        toast({ title: "Failed", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error sending invite", variant: "destructive" });
    } finally {
      setSendingInvite(false);
    }
  };

  const revokeVip = async (vip: any) => {
    if (!confirm(`Revoke VIP access for ${vip.email}?`)) return;
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    await fetch(`https://wknelhrmgspuztehetpa.supabase.co/functions/v1/vip-invite?action=revoke`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "x-client-authorization": `Bearer ${token}`, "apikey": "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC", "Content-Type": "application/json" },
      body: JSON.stringify({ vip_id: vip.id }),
    });
    toast({ title: `VIP access revoked for ${vip.email}` });
    loadVips();
  };

  const deleteVip = async (vip: any) => {
    if (!confirm(`DELETE account for ${vip.email}? This cannot be undone.`)) return;
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    await fetch(`https://wknelhrmgspuztehetpa.supabase.co/functions/v1/vip-invite?action=delete`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "x-client-authorization": `Bearer ${token}`, "apikey": "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC", "Content-Type": "application/json" },
      body: JSON.stringify({ vip_id: vip.id }),
    });
    toast({ title: `Account deleted for ${vip.email}` });
    loadVips();
  };

  const loadStripeReport = async () => {
    if (!user) return;
    setStripeLoading(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const resp = await fetch(
        `https://wknelhrmgspuztehetpa.supabase.co/functions/v1/stripe-reports?period=${stripePeriod}`,
        { headers: { "Authorization": `Bearer ${token}`, "x-client-authorization": `Bearer ${token}`, "apikey": "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC" } }
      );
      const data = await resp.json();
      setStripeReport(data);
    } catch (err) {
      toast({ title: "Failed to load Stripe report", variant: "destructive" });
    } finally {
      setStripeLoading(false);
    }
  };

  const saveNotes = () => {
    localStorage.setItem("clark_admin_notes", notes);
    toast({ title: "✅ Notes saved" });
  };

  if (loading || !user || !ADMIN_EMAILS.includes(user.email || "")) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Revenue estimate
  const PLAN_PRICES: Record<string, number> = {
    "Pre-Trip Planner": 6.99,
    "Magic Pass": 12.99,
    "AP Command Center": 7.99,
    "AP Command Center PLUS": 10.99,
  };
  const estimatedMRR = (stats?.planBreakdown || []).reduce((sum, p) => {
    return sum + (p.count * (PLAN_PRICES[p.plan_name] || 10));
  }, 0);
  const totalMRR = stats ? estimatedMRR + (stats.trialUsers * 0) : 0; // trials not counted yet

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-8 pb-6 border-b" style={{ borderColor: "rgba(245,200,66,0.15)" }}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-primary/20 text-primary">Clark & Brandon Only</span>
            </div>
            <p className="text-muted-foreground text-sm">Magic Pass Plus — Operations Center</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <a href="/admin/command-center" className="text-xs px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 font-semibold">
              🎛️ Command Center
            </a>
            <a href="/admin/affiliates" className="text-xs px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 font-semibold">
              🔗 Affiliate Networks
            </a>
            <a href="/admin/park-content" className="text-xs px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 font-semibold">
              🏪 Park Content CMS
            </a>
            <a href="/admin/tier-access" className="text-xs px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 font-semibold">
              🔐 Tier Access
            </a>
            <a href="/admin/users" className="text-xs px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 font-semibold">
              👥 Users
            </a>
            <span className="text-xs text-muted-foreground">Last refresh: {lastRefresh.toLocaleTimeString()}</span>
            <button
              onClick={loadStats}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto space-y-6">

        {/* Revenue Overview */}
        <div>
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Revenue Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Est. MRR", value: `$${totalMRR.toFixed(0)}`, sub: "monthly recurring", color: "text-primary" },
              { label: "Active Subscribers", value: stats?.activeSubscribers ?? "—", sub: "paid plans", color: "text-green-400" },
              { label: "Trial Users", value: stats?.trialUsers ?? "—", sub: "7-day trials", color: "text-yellow-400" },
              { label: "Churned This Month", value: "0", sub: "cancelled", color: "text-red-400" },
            ].map(card => (
              <div key={card.label} className="rounded-xl p-4 border border-white/8" style={{ background: "var(--card)" }}>
                <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Breakdown */}
        <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "var(--card)" }}>
          <div className="px-5 py-4 border-b border-white/8">
            <h2 className="text-sm font-bold text-foreground">Subscription Breakdown</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-5 py-3 text-xs font-semibold text-primary">Plan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-primary">Users</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-primary">Monthly Revenue</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-primary">Price/User</th>
              </tr>
            </thead>
            <tbody>
              {stats?.planBreakdown.length === 0 || !stats ? (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-muted-foreground text-sm">No active subscriptions yet</td>
                </tr>
              ) : (
                stats.planBreakdown.map((p, i) => (
                  <tr key={p.plan_name} className={i < stats.planBreakdown.length - 1 ? "border-b border-white/5" : ""}>
                    <td className="px-5 py-3 font-medium text-foreground">{p.plan_name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.count}</td>
                    <td className="px-5 py-3 text-green-400 font-semibold">${((PLAN_PRICES[p.plan_name] || 10) * p.count).toFixed(2)}</td>
                    <td className="px-5 py-3 text-muted-foreground">${PLAN_PRICES[p.plan_name] || "?"}/mo</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 3rd Party Services */}
        <div>
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">3rd Party Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {THIRD_PARTY_SERVICES.map(svc => (
              <div key={svc.name} className="rounded-xl p-4 border border-white/8" style={{ background: "var(--card)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svc.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{svc.name}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${svc.status === "active" ? "bg-green-400" : "bg-yellow-400"}`} />
                </div>
                <p className="text-xs text-muted-foreground mb-1">{svc.purpose}</p>
                <p className="text-xs font-semibold text-foreground mb-0.5">{svc.plan} · {svc.cost}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{svc.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Two columns: Dining Alerts + User Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dining Alerts Operations */}
          <div className="rounded-xl p-5 border border-white/8" style={{ background: "var(--card)" }}>
            <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Dining Alert Operations
            </h2>
            <div className="space-y-3">
              {[
                { label: "Active Watching Alerts", value: stats?.activeDiningAlerts ?? "—", color: "text-yellow-400" },
                { label: "Reservations Found Today", value: stats?.foundToday ?? "—", color: "text-green-400" },
                { label: "Notifications Sent Today", value: stats?.notificationsToday ?? "—", color: "text-primary" },
                { label: "Users With Active Alerts", value: stats?.usersWithAlerts ?? "—", color: "text-foreground" },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Activity */}
          <div className="rounded-xl p-5 border border-white/8" style={{ background: "var(--card)" }}>
            <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> User Activity
            </h2>
            <div className="space-y-3">
              {[
                { label: "Total Registered Users", value: stats?.totalSubscribers ?? "—", color: "text-foreground" },
                { label: "Onboarding Completed", value: stats?.onboardingComplete ?? "—", color: "text-green-400" },
                { label: "Active Subscribers", value: stats?.activeSubscribers ?? "—", color: "text-primary" },
                { label: "Trial Users", value: stats?.trialUsers ?? "—", color: "text-yellow-400" },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-xl p-5 border border-white/8" style={{ background: "var(--card)" }}>
          <h2 className="text-sm font-bold text-foreground mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { label: "Supabase Connection", status: "ok", note: "Connected" },
              { label: "Domain (magicpassplus.com)", status: "ok", note: "Live + SSL Active" },
              { label: "Stripe Webhooks", status: "ok", note: "Registered" },
              { label: "Google OAuth", status: "ok", note: "Configured" },
              { label: "Brevo Email", status: "ok", note: "Domain verified" },
              { label: "Railway Poller", status: "warn", note: "Check Railway dashboard for build status" },
              { label: "Twilio SMS", status: "warn", note: "10DLC pending 1-3 days" },
              { label: "Stripe Mode", status: "warn", note: "TEST MODE — switch to Live before launch" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/3">
                {item.status === "ok"
                  ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                }
                <div>
                  <span className="text-sm text-foreground">{item.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">— {item.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VIP Accounts */}
        <div className="rounded-xl p-5 border border-white/8" style={{ background: "var(--card)" }}>
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            🎁 VIP Free Forever Accounts
          </h2>

          {/* Invite Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <input type="email" placeholder="Email address *" value={vipEmail} onChange={e => setVipEmail(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[var(--muted)] border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ minHeight: 44 }} />
            <input type="text" placeholder="First name" value={vipFirstName} onChange={e => setVipFirstName(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[var(--muted)] border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ minHeight: 44 }} />
            <input type="text" placeholder="Last name" value={vipLastName} onChange={e => setVipLastName(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[var(--muted)] border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ minHeight: 44 }} />
            <input type="text" placeholder="Reason (e.g. Disney blogger, beta tester)" value={vipReason} onChange={e => setVipReason(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[var(--muted)] border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ minHeight: 44 }} />
            <input type="text" placeholder="Internal notes (optional)" value={vipNotes} onChange={e => setVipNotes(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[var(--muted)] border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40 md:col-span-2" style={{ minHeight: 44 }} />
          </div>
          <button onClick={sendVipInvite} disabled={sendingInvite || !vipEmail}
            className="px-6 py-2.5 rounded-lg font-bold text-sm text-[var(--background)] mb-5 disabled:opacity-50"
            style={{ background: "#F0B429" }}>
            {sendingInvite ? "Sending..." : "🎁 Send VIP Invite"}
          </button>

          {/* VIP List */}
          {vips.length === 0 ? (
            <p className="text-sm text-muted-foreground">No VIP accounts yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left px-3 py-2 text-xs text-primary">Email</th>
                    <th className="text-left px-3 py-2 text-xs text-primary">Name</th>
                    <th className="text-left px-3 py-2 text-xs text-primary">Reason</th>
                    <th className="text-left px-3 py-2 text-xs text-primary">Status</th>
                    <th className="text-left px-3 py-2 text-xs text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vips.map((vip, i) => (
                    <tr key={vip.id} className={i < vips.length - 1 ? "border-b border-white/5" : ""}>
                      <td className="px-3 py-2 text-foreground text-xs">{vip.email}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{vip.first_name} {vip.last_name}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{vip.reason || "—"}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${vip.status === "active" ? "bg-green-500/20 text-green-400" : vip.status === "revoked" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                          {vip.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          {vip.status !== "revoked" && (
                            <button onClick={() => revokeVip(vip)} className="text-xs text-yellow-400 hover:text-yellow-300">Revoke</button>
                          )}
                          <button onClick={async () => {
                            const newVal = !vip.is_game_developer;
                            // Optimistically update state first for instant visual feedback
                            setVips(prev => prev.map(v => v.id === vip.id ? { ...v, is_game_developer: newVal } : v));
                            const { error } = await supabase
                              .from("vip_accounts")
                              .update({ is_game_developer: newVal })
                              .eq("id", vip.id);
                            if (!error) {
                              toast({ title: newVal ? "🎮 Game Developer enabled!" : "🎮 Game Developer disabled" });
                            } else {
                              // Revert on error
                              setVips(prev => prev.map(v => v.id === vip.id ? { ...v, is_game_developer: !newVal } : v));
                              toast({ title: "Update failed", description: error.message, variant: "destructive" });
                            }
                          }} className={`text-xs font-semibold px-2 py-1 rounded border transition-colors ${vip.is_game_developer ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20" : "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"}`}>
                            {vip.is_game_developer ? "🎮 Dev ON ✓" : "🎮 Make Dev"}
                          </button>
                          <button onClick={() => deleteVip(vip)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stripe Financial Reports */}
        <div className="rounded-xl p-5 border border-white/8" style={{ background: "#111827" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Stripe Financial Report</h2>
              {stripeReport && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${stripeReport.stripeMode === "LIVE" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {stripeReport.stripeMode || "TEST"} MODE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select value={stripePeriod} onChange={e => setStripePeriod(e.target.value)}
                className="text-xs px-2 py-1 rounded border border-white/10 bg-muted/20 text-foreground">
                <option value="day">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
              <button onClick={loadStripeReport} disabled={stripeLoading}
                className="text-xs px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 flex items-center gap-1">
                <RefreshCw className={`w-3 h-3 ${stripeLoading ? "animate-spin" : ""}`} />
                {stripeLoading ? "Loading..." : "Run Report"}
              </button>
            </div>
          </div>

          {!stripeReport ? (
            <p className="text-xs text-muted-foreground">Click "Run Report" to load Stripe financial data</p>
          ) : (
            <div className="space-y-5">
              {/* Summary grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Gross Revenue", value: `$${stripeReport.summary?.grossRevenue?.toFixed(2) || "0.00"}`, color: "text-primary", sub: `${stripeReport.summary?.chargeCount || 0} charges` },
                  { label: "Processing Fees", value: `-$${stripeReport.summary?.processingFees?.toFixed(2) || "0.00"}`, color: "text-red-400", sub: "2.9% + $0.30/txn" },
                  { label: "Net Revenue", value: `$${stripeReport.summary?.netRevenue?.toFixed(2) || "0.00"}`, color: "text-green-400", sub: "After Stripe fees" },
                  { label: "Paid to Bank", value: `$${stripeReport.summary?.totalPayouts?.toFixed(2) || "0.00"}`, color: "text-blue-400", sub: `$${stripeReport.summary?.pendingPayouts?.toFixed(2) || "0"} pending` },
                  { label: "Available Balance", value: `$${stripeReport.summary?.availableBalance?.toFixed(2) || "0.00"}`, color: "text-foreground", sub: "In Stripe account" },
                  { label: "Total Refunds", value: `-$${stripeReport.summary?.totalRefunds?.toFixed(2) || "0.00"}`, color: "text-orange-400", sub: "Period refunds" },
                  { label: "Active Subs", value: String(stripeReport.summary?.activeSubscriptions || 0), color: "text-foreground", sub: "Paying subscribers" },
                  { label: "Est. MRR", value: `$${stripeReport.summary?.estimatedMRR?.toFixed(2) || "0.00"}`, color: "text-primary", sub: "Monthly recurring" },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-0.5">{s.label}</p>
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Net summary */}
              <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Net after refunds</span>
                  <span className="text-xl font-black text-green-400">${stripeReport.summary?.netAfterRefunds?.toFixed(2) || "0.00"}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Gross ${stripeReport.summary?.grossRevenue?.toFixed(2)} − Fees ${stripeReport.summary?.processingFees?.toFixed(2)} − Refunds ${stripeReport.summary?.totalRefunds?.toFixed(2)}</p>
              </div>

              {/* Plan breakdown */}
              {Object.keys(stripeReport.planBreakdown || {}).length > 0 && (
                <div>
                  <p className="text-xs font-bold text-primary mb-2">Revenue by Plan</p>
                  <div className="space-y-1">
                    {Object.entries(stripeReport.planBreakdown || {}).map(([plan, data]: [string, any]) => (
                      <div key={plan} className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5 text-sm">
                        <span className="text-muted-foreground truncate flex-1">{plan}</span>
                        <span className="text-muted-foreground ml-2">{data.count}x</span>
                        <span className="text-foreground font-semibold ml-3">${data.revenue.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming payouts */}
              {stripeReport.upcomingPayouts?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-primary mb-2">Upcoming Bank Transfers</p>
                  {stripeReport.upcomingPayouts.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5 mb-1 text-sm">
                      <div>
                        <p className="text-foreground">${p.amount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{p.arrivalDate}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "paid" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent transactions */}
              {stripeReport.recentTransactions?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-primary mb-2">Recent Transactions</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/8">
                          <th className="text-left px-3 py-2 text-primary">Date</th>
                          <th className="text-left px-3 py-2 text-primary">Description</th>
                          <th className="text-left px-3 py-2 text-primary">Gross</th>
                          <th className="text-left px-3 py-2 text-primary">Fee</th>
                          <th className="text-left px-3 py-2 text-primary">Net</th>
                          <th className="text-left px-3 py-2 text-primary">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stripeReport.recentTransactions.map((t: any, i: number) => (
                          <tr key={t.id} className={i < stripeReport.recentTransactions.length - 1 ? "border-b border-white/5" : ""}>
                            <td className="px-3 py-2 text-muted-foreground">{t.date}</td>
                            <td className="px-3 py-2 text-foreground max-w-[120px] truncate">{t.description || t.email}</td>
                            <td className="px-3 py-2 text-foreground">${t.amount.toFixed(2)}</td>
                            <td className="px-3 py-2 text-red-400">-${t.fee.toFixed(2)}</td>
                            <td className="px-3 py-2 text-green-400">${t.net.toFixed(2)}</td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-xs ${t.status === "paid" ? "bg-green-500/20 text-green-400" : t.status === "refunded" ? "bg-orange-500/20 text-orange-400" : "bg-red-500/20 text-red-400"}`}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Report generated {new Date(stripeReport.generatedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clark's Daily Notes */}
        <div className="rounded-xl p-5 border" style={{ background: "var(--card)", borderColor: "rgba(245,200,66,0.2)" }}>
          <h2 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
            📋 Clark's Daily Notes
          </h2>
          <p className="text-xs text-muted-foreground mb-3">Observations, recommended actions, and flags for Brandon</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Daily observations, recommended actions, and flags..."
            rows={6}
            className="w-full px-4 py-3 rounded-lg bg-[var(--muted)] border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
          />
          <button
            onClick={saveNotes}
            className="mt-2 px-5 py-2 rounded-lg font-bold text-sm text-[var(--background)]"
            style={{ background: "#F0B429" }}
          >
            Save Notes
          </button>
        </div>

      </div>
    </div>
  );
}
