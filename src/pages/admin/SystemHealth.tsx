import { useState, useEffect } from "react";
import { Activity, RefreshCw, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

const SUPABASE_ANON = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";
const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";

export default function SystemHealth() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<{
    diningAlerts: any[]; eventAlerts: any[]; diningNotifs: any[]; eventNotifs: any[];
    recentDiningErrors: number; recentEventErrors: number;
  }>({ diningAlerts: [], eventAlerts: [], diningNotifs: [], eventNotifs: [], recentDiningErrors: 0, recentEventErrors: 0 });
  const [diagResults, setDiagResults] = useState<any[]>([]);
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagProgress, setDiagProgress] = useState("");

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
    "x-client-authorization": `Bearer ${session?.access_token}`,
    "apikey": SUPABASE_ANON,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [dAlerts, eAlerts, dNotifs, eNotifs] = await Promise.all([
        supabase.from("dining_alerts").select("id, status, last_checked_at, check_count, restaurant_id, alert_date").order("created_at", { ascending: false }).limit(50),
        supabase.from("event_alerts").select("id, status, last_checked_at, check_count, event_name, alert_date").order("created_at", { ascending: false }).limit(50),
        supabase.from("dining_notifications").select("id, delivery_status, sent_at, restaurant_name, notification_type, created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("event_notifications").select("id, delivery_status, sent_at, event_name, notification_type, created_at").order("created_at", { ascending: false }).limit(50),
      ]);
      const diningNotifs = dNotifs.data || [];
      const eventNotifs = eNotifs.data || [];
      setHealthData({
        diningAlerts: dAlerts.data || [],
        eventAlerts: eAlerts.data || [],
        diningNotifs,
        eventNotifs,
        recentDiningErrors: diningNotifs.filter(n => n.delivery_status === "failed").length,
        recentEventErrors: eventNotifs.filter(n => n.delivery_status === "failed").length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const runDiagnosticBatch = async () => {
    setDiagRunning(true);
    setDiagResults([]);
    setDiagProgress("Starting diagnostic batch...");
    let offset = 0;
    const allResults: any[] = [];
    try {
      while (true) {
        setDiagProgress(`Processing events ${offset + 1}–${offset + 5}...`);
        const res = await fetch(`${SUPABASE_URL}/functions/v1/diagnose-events`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ offset, limit: 5, autoUpdate: true }),
        });
        const data = await res.json();
        if (data.error) { setDiagProgress(`Error: ${data.error}`); break; }
        if (data.done || !data.results || data.results.length === 0) break;
        allResults.push(...data.results);
        setDiagResults([...allResults]);
        if (!data.hasMore) break;
        offset = data.nextOffset;
      }
      setDiagProgress(`Done — ${allResults.length} events checked`);
    } catch (err) {
      setDiagProgress(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setDiagRunning(false);
  };

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">System Health</h1>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Active Dining Alerts", value: healthData.diningAlerts.filter(a => a.status === "watching").length, total: healthData.diningAlerts.length, color: "text-blue-400" },
            { label: "Active Event Alerts", value: healthData.eventAlerts.filter(a => a.status === "watching").length, total: healthData.eventAlerts.length, color: "text-purple-400" },
            { label: "Dining Notif Failures", value: healthData.recentDiningErrors, total: healthData.diningNotifs.length, color: healthData.recentDiningErrors > 0 ? "text-red-400" : "text-green-400" },
            { label: "Event Notif Failures", value: healthData.recentEventErrors, total: healthData.eventNotifs.length, color: healthData.recentEventErrors > 0 ? "text-red-400" : "text-green-400" },
          ].map((c, i) => (
            <div key={i} className="rounded-xl border border-border/50 p-4 bg-card">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{c.label}</p>
              <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
              <p className="text-[10px] text-muted-foreground">of {c.total} total</p>
            </div>
          ))}
        </div>

        {/* Railway Poller Status */}
        <div className="rounded-xl border border-border/50 p-5 bg-card">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Railway Poller Status</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg p-3 border border-border/30 bg-muted/30">
              <p className="text-muted-foreground mb-1">Last Dining Check</p>
              {(() => {
                const lastChecked = healthData.diningAlerts.filter(a => a.last_checked_at).sort((a, b) => new Date(b.last_checked_at).getTime() - new Date(a.last_checked_at).getTime())[0];
                if (!lastChecked) return <p className="text-foreground">No checks yet</p>;
                const ago = Math.round((Date.now() - new Date(lastChecked.last_checked_at).getTime()) / 60000);
                return <p className={`font-semibold ${ago > 15 ? "text-red-400" : "text-green-400"}`}>{ago} min ago</p>;
              })()}
            </div>
            <div className="rounded-lg p-3 border border-border/30 bg-muted/30">
              <p className="text-muted-foreground mb-1">Last Event Check</p>
              {(() => {
                const lastChecked = healthData.eventAlerts.filter(a => a.last_checked_at).sort((a, b) => new Date(b.last_checked_at).getTime() - new Date(a.last_checked_at).getTime())[0];
                if (!lastChecked) return <p className="text-foreground">No checks yet</p>;
                const ago = Math.round((Date.now() - new Date(lastChecked.last_checked_at).getTime()) / 60000);
                return <p className={`font-semibold ${ago > 15 ? "text-red-400" : "text-green-400"}`}>{ago} min ago</p>;
              })()}
            </div>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="rounded-xl border border-border/50 p-5 bg-card">
          <p className="text-sm font-bold text-foreground mb-3">📬 Recent Notifications</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Dining ({healthData.diningNotifs.length})</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {healthData.diningNotifs.slice(0, 10).map(n => (
                  <div key={n.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-muted/30">
                    <span className="text-foreground truncate flex-1">{n.restaurant_name || "Unknown"}</span>
                    <span className={`font-semibold ml-2 ${n.delivery_status === "sent" ? "text-green-400" : n.delivery_status === "failed" ? "text-red-400" : "text-yellow-400"}`}>
                      {n.delivery_status}
                    </span>
                  </div>
                ))}
                {healthData.diningNotifs.length === 0 && <p className="text-xs text-muted-foreground">No notifications</p>}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Events ({healthData.eventNotifs.length})</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {healthData.eventNotifs.slice(0, 10).map(n => (
                  <div key={n.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-muted/30">
                    <span className="text-foreground truncate flex-1">{n.event_name || "Unknown"}</span>
                    <span className={`font-semibold ml-2 ${n.delivery_status === "sent" ? "text-green-400" : n.delivery_status === "failed" ? "text-red-400" : "text-yellow-400"}`}>
                      {n.delivery_status}
                    </span>
                  </div>
                ))}
                {healthData.eventNotifs.length === 0 && <p className="text-xs text-muted-foreground">No notifications</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Batch Runner */}
        <div className="rounded-xl border border-border/50 p-5 bg-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-foreground">🔬 Event Template Diagnostics</p>
              <p className="text-xs text-muted-foreground">Run a batch diagnostic to check if Disney event page templates have changed</p>
            </div>
            <button onClick={runDiagnosticBatch} disabled={diagRunning}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {diagRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {diagRunning ? "Running..." : "Run Diagnostics"}
            </button>
          </div>
          {diagProgress && (
            <p className={`text-xs mb-3 ${diagProgress.startsWith("Error") ? "text-red-400" : "text-primary"} font-medium`}>
              {diagProgress}
            </p>
          )}
          {diagResults.length > 0 && (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-2 py-1.5">
                <span>Event</span><span>Status</span><span>Scrapable</span><span>Updated</span>
              </div>
              {diagResults.map((r, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_80px_80px] gap-2 text-xs px-2 py-1.5 rounded bg-muted/30">
                  <span className="text-foreground truncate" title={r.url}>{r.event_name}</span>
                  <span className={r.ok ? "text-green-400" : "text-red-400"}>{r.ok ? "✅ OK" : "❌ Fail"}</span>
                  <span className={r.scrapable ? "text-green-400" : "text-yellow-400"}>{r.scrapable ? "Yes" : "No"}</span>
                  <span className={r.dbUpdated ? "text-primary" : "text-muted-foreground"}>{r.dbUpdated ? "✏️ Yes" : "—"}</span>
                </div>
              ))}
              <div className="flex gap-4 text-xs text-muted-foreground pt-2 px-2">
                <span>✅ OK: {diagResults.filter(r => r.ok).length}</span>
                <span>❌ Failed: {diagResults.filter(r => !r.ok).length}</span>
                <span>Scrapable: {diagResults.filter(r => r.scrapable).length}</span>
                <span>DB Updated: {diagResults.filter(r => r.dbUpdated).length}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
