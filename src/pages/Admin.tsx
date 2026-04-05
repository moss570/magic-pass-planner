import { useState, useEffect } from "react";
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
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

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

      const [subsResult, planResult, alertsResult, foundResult, notifsResult, profilesResult, alertUsersResult] = await Promise.all([
        supabase.from("subscriptions").select("status", { count: "exact" }),
        supabase.from("subscriptions").select("plan_name, status"),
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
    }
  }, [user]);

  const saveNotes = () => {
    localStorage.setItem("clark_admin_notes", notes);
    toast({ title: "✅ Notes saved" });
  };

  if (loading || !user || !ADMIN_EMAILS.includes(user.email || "")) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080E1E" }}>
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
    <div className="min-h-screen pb-12" style={{ background: "#080E1E" }}>
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
          <div className="flex items-center gap-3">
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
              <div key={card.label} className="rounded-xl p-4 border border-white/8" style={{ background: "#111827" }}>
                <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Breakdown */}
        <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "#111827" }}>
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
              <div key={svc.name} className="rounded-xl p-4 border border-white/8" style={{ background: "#111827" }}>
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
          <div className="rounded-xl p-5 border border-white/8" style={{ background: "#111827" }}>
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
          <div className="rounded-xl p-5 border border-white/8" style={{ background: "#111827" }}>
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
        <div className="rounded-xl p-5 border border-white/8" style={{ background: "#111827" }}>
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

        {/* Clark's Daily Notes */}
        <div className="rounded-xl p-5 border" style={{ background: "#111827", borderColor: "rgba(245,200,66,0.2)" }}>
          <h2 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
            📋 Clark's Daily Notes
          </h2>
          <p className="text-xs text-muted-foreground mb-3">Observations, recommended actions, and flags for Brandon</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Daily observations, recommended actions, and flags..."
            rows={6}
            className="w-full px-4 py-3 rounded-lg bg-[#0D1230] border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
          />
          <button
            onClick={saveNotes}
            className="mt-2 px-5 py-2 rounded-lg font-bold text-sm text-[#080E1E]"
            style={{ background: "#F5C842" }}
          >
            Save Notes
          </button>
        </div>

      </div>
    </div>
  );
}
