import { useState } from "react";
import { Database, CreditCard, Mail, MessageSquare, Zap, Globe, Clock, Castle, CheckCircle, AlertTriangle, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

const THIRD_PARTY_SERVICES = [
  { name: "Supabase", icon: Database, purpose: "Database & Auth", status: "active", plan: "Free", cost: "$0/mo", note: "Upgrade to Pro ($25/mo) at ~500 active users", color: "#10B981" },
  { name: "Stripe", icon: CreditCard, purpose: "Billing & Subscriptions", status: "warning", plan: "Pay-as-go", cost: "2.9% + $0.30/txn", note: "⚠️ Still in TEST MODE — switch to Live before public launch", color: "#F59E0B" },
  { name: "Lovable", icon: Globe, purpose: "Frontend Hosting", status: "active", plan: "Paid", cost: "~$25/mo", note: "Domain: magicpassplus.com — Live ✅", color: "#10B981" },
  { name: "Railway", icon: Zap, purpose: "Dining Alert Poller", status: "warning", plan: "Free Trial", cost: "$0 → $5/mo", note: "Upgrade to Hobby when poller confirms stable", color: "#F59E0B" },
  { name: "Brevo", icon: Mail, purpose: "Email Alerts", status: "active", plan: "Free", cost: "$0/mo", note: "300 emails/day free", color: "#10B981" },
  { name: "Twilio", icon: MessageSquare, purpose: "SMS Alerts", status: "warning", plan: "Pay-as-go", cost: "$0.0079/SMS", note: "10DLC registration pending", color: "#F59E0B" },
  { name: "ThemeParks.wiki", icon: Castle, purpose: "Live Wait Times API", status: "active", plan: "Free", cost: "$0/mo", note: "No rate limits at current scale", color: "#10B981" },
  { name: "Supabase pg_cron", icon: Clock, purpose: "Dining Alert Scheduler", status: "active", plan: "Included", cost: "$0/mo", note: "Runs every 5 min", color: "#10B981" },
];

export default function SystemServices() {
  const { toast } = useToast();
  const [notes, setNotes] = useState(() => localStorage.getItem("clark_admin_notes") || "");

  const saveNotes = () => { localStorage.setItem("clark_admin_notes", notes); toast({ title: "✅ Notes saved" }); };

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Wrench className="w-5 h-5 text-primary" /> Services & Notes</h1>

        {/* System Health Quick */}
        <div className="rounded-xl p-5 border border-border/50 bg-card">
          <h2 className="text-sm font-bold text-foreground mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { label: "Supabase Connection", status: "ok", note: "Connected" },
              { label: "Domain (magicpassplus.com)", status: "ok", note: "Live + SSL Active" },
              { label: "Stripe Webhooks", status: "ok", note: "Registered" },
              { label: "Google OAuth", status: "ok", note: "Configured" },
              { label: "Brevo Email", status: "ok", note: "Domain verified" },
              { label: "Railway Poller", status: "warn", note: "Check Railway dashboard" },
              { label: "Twilio SMS", status: "warn", note: "10DLC pending" },
              { label: "Stripe Mode", status: "warn", note: "TEST MODE" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/20">
                {item.status === "ok" ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />}
                <div>
                  <span className="text-sm text-foreground">{item.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">— {item.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3rd Party Services */}
        <div>
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">3rd Party Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {THIRD_PARTY_SERVICES.map(svc => (
              <div key={svc.name} className="rounded-xl p-4 border border-border/50 bg-card">
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

        {/* Notes */}
        <div className="rounded-xl p-5 border border-primary/20 bg-card">
          <h2 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">📋 Admin Notes</h2>
          <p className="text-xs text-muted-foreground mb-3">Observations, recommended actions, and flags</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Daily observations..." rows={6}
            className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border/50 text-sm text-foreground focus:outline-none resize-none" />
          <button onClick={saveNotes} className="mt-2 px-5 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground">Save Notes</button>
        </div>
      </div>
    </AdminLayout>
  );
}
