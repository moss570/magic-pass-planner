import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plane, Plus, CheckCircle2, Clock, TrendingDown, TrendingUp, X, Pause, Play } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getGenericBookingUrl } from "@/lib/affiliate";
import { useSubscription } from "@/hooks/useSubscription";
import { AlertLimitBanner, useAlertLimitGuard } from "@/components/AlertLimitBanner";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";

type AlertStatus = "watching" | "found" | "booked" | "expired" | "cancelled" | "paused";
const TABS: { label: string; status: AlertStatus[] }[] = [
  { label: "Watching", status: ["watching"] },
  { label: "Paused", status: ["paused"] },
  { label: "Found", status: ["found"] },
  { label: "Booked", status: ["booked"] },
  { label: "History", status: ["expired", "cancelled"] },
];

const CABIN_OPTIONS = [
  { label: "Economy", value: "economy" },
  { label: "Premium Economy", value: "premium_economy" },
  { label: "Business", value: "business" },
  { label: "First", value: "first" },
];

interface AirfareAlert {
  id: string;
  origin: string;
  destination: string;
  depart_date: string;
  return_date: string;
  adults: number;
  children: number;
  target_price: number;
  current_price: number | null;
  price_history: { date: string; price: number }[];
  status: AlertStatus;
  check_count: number;
  last_checked_at: string | null;
  cabin_class: string;
  stops_max: number;
  notify_email: boolean;
  notify_sms: boolean;
  booking_link: string | null;
  airline: string | null;
  confirmation_number: string | null;
  created_at: string;
}

function PriceSparkline({ history }: { history: { date: string; price: number }[] }) {
  if (!history || history.length < 2) return null;
  const prices = history.map(h => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 120, h = 32;
  const points = prices.map((p, i) => `${(i / (prices.length - 1)) * w},${h - ((p - min) / range) * (h - 4) - 2}`).join(" ");
  return <svg width={w} height={h} className="inline-block"><polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" /></svg>;
}

export default function AirfareTracker() {
  const { session } = useAuth();
  const [alerts, setAlerts] = useState<AirfareAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showBooked, setShowBooked] = useState<string | null>(null);
  const [confirmNum, setConfirmNum] = useState("");

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("MCO");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [cabinClass, setCabinClass] = useState("economy");
  const [stopsMax, setStopsMax] = useState(2);
  const [targetPrice, setTargetPrice] = useState("");

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
    apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbmVsaHJtZ3NwdXp0ZWhldHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzcyNzgsImV4cCI6MjA5MDgxMzI3OH0.vjT4Iun32HsCfoO7nVnfzLBnJy-Lye6N9ZryBbWuAjo",
  }), [session]);

  const fetchAlerts = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/airfare-alerts`, { headers: getHeaders() });
      const data = await resp.json();
      setAlerts(data.alerts || []);
    } catch { toast.error("Failed to load airfare alerts"); }
    setLoading(false);
  }, [session, getHeaders]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const createAlert = async () => {
    if (!origin || !departDate || !returnDate || !targetPrice) { toast.error("Fill all required fields"); return; }
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/airfare-alerts`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ origin, destination, depart_date: departDate, return_date: returnDate, adults, children, target_price: Number(targetPrice), cabin_class: cabinClass, stops_max: stopsMax }),
      });
      if (!resp.ok) throw new Error();
      toast.success("Airfare alert created!");

      // Fire-and-forget confirmation email
      supabase.functions.invoke("send-alert-confirmation", {
        body: {
          user_id: session!.user.id,
          alert_type: "airfare",
          alert_details: {
            name: `${origin} → ${destination}`,
            date: `${departDate} → ${returnDate}`,
            extra: `${adults} adults${children > 0 ? `, ${children} children` : ""} · ${cabinClass} · Target: ≤$${targetPrice}`,
          },
        },
      }).catch(() => {});

      setShowCreate(false);
      setOrigin(""); setDepartDate(""); setReturnDate(""); setTargetPrice("");
      fetchAlerts();
    } catch { toast.error("Failed to create alert"); }
  };

  const cancelAlert = async (id: string) => {
    await fetch(`${SUPABASE_URL}/functions/v1/airfare-alerts?id=${id}`, { method: "DELETE", headers: getHeaders() });
    toast.success("Alert cancelled");
    fetchAlerts();
  };

  const pauseResumeAlert = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "paused" ? "watching" : "paused";
    await fetch(`${SUPABASE_URL}/functions/v1/airfare-alerts`, {
      method: "PATCH", headers: getHeaders(),
      body: JSON.stringify({ id, status: newStatus }),
    });
    toast.success(newStatus === "paused" ? "Alert paused" : "Alert resumed");
    fetchAlerts();
  };

  const markBooked = async (id: string) => {
    await fetch(`${SUPABASE_URL}/functions/v1/airfare-alerts`, {
      method: "PATCH", headers: getHeaders(),
      body: JSON.stringify({ id, status: "booked", confirmation_number: confirmNum }),
    });
    toast.success("Marked as booked!");
    setShowBooked(null); setConfirmNum("");
    fetchAlerts();
  };

  const { access } = useSubscription();
  const airfareLimit = access.airfareAlerts;
  const watchingCount = alerts.filter(a => a.status === "watching").length;
  const { canAddAlert } = useAlertLimitGuard(airfareLimit, watchingCount);

  const filtered = alerts.filter(a => TABS[activeTab].status.includes(a.status as AlertStatus));

  return (
    <DashboardLayout title="Airfare Tracker">
      <div className="max-w-2xl mx-auto space-y-4 px-4 py-6">
        <AlertLimitBanner limit={airfareLimit} currentCount={watchingCount} alertTypeName="Airfare Alerts" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Airfare Tracker</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
              {watchingCount} watching
            </span>
          </div>
          <button onClick={() => setShowCreate(true)} disabled={!canAddAlert} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus className="w-3.5 h-3.5" /> New Alert
          </button>
        </div>

        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {TABS.map((tab, i) => (
            <button key={tab.label} onClick={() => setActiveTab(i)}
              className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${activeTab === i ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Plane className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No {TABS[activeTab].label.toLowerCase()} alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(alert => {
              const delta = alert.current_price != null ? alert.current_price - alert.target_price : null;
              const deltaColor = delta != null ? (delta <= 0 ? "text-green-400 bg-green-500/15" : "text-red-400 bg-red-500/15") : "";
              return (
                <div key={alert.id} className={`rounded-xl border p-4 ${alert.status === "found" ? "border-green-500/40 bg-green-500/5" : "border-border bg-card"} ${alert.status === "paused" ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-foreground">{alert.origin} → {alert.destination}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(alert.depart_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                        {new Date(alert.return_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {" · "}{alert.adults}A {alert.children > 0 ? `${alert.children}C` : ""}
                        {" · "}{alert.cabin_class.replace("_", " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="text-sm font-bold text-primary">${alert.target_price}</p>
                    </div>
                  </div>

                  {alert.current_price != null && (
                    <div className="flex items-center gap-3 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Current</p>
                        <p className="text-sm font-bold text-foreground">${alert.current_price}</p>
                      </div>
                      {delta != null && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${deltaColor} flex items-center gap-0.5`}>
                          {delta <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          {delta <= 0 ? `-$${Math.abs(delta)}` : `+$${delta}`}
                        </span>
                      )}
                      <PriceSparkline history={alert.price_history} />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> {alert.check_count} checks · last {alert.last_checked_at ? new Date(alert.last_checked_at).toLocaleDateString() : "never"}
                  </div>

                  <div className="flex gap-2 mt-3">
                    {alert.status === "found" && (
                      <a href={alert.booking_link || getGenericBookingUrl("flights")}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-center py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-500 transition-colors">
                        Book Now →
                      </a>
                    )}
                    {(alert.status === "watching" || alert.status === "found" || alert.status === "paused") && (
                      <>
                        <button onClick={() => pauseResumeAlert(alert.id, alert.status)} className="px-3 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors">
                          {alert.status === "paused" ? <><Play className="w-3 h-3 inline mr-1" />Resume</> : <><Pause className="w-3 h-3 inline mr-1" />Pause</>}
                        </button>
                        {alert.status !== "paused" && (
                          <button onClick={() => setShowBooked(alert.id)} className="px-3 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors">
                            <CheckCircle2 className="w-3 h-3 inline mr-1" />Mark Booked
                          </button>
                        )}
                        <button onClick={() => cancelAlert(alert.id)} className="px-3 py-2 rounded-lg border border-destructive/30 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                          <X className="w-3 h-3 inline mr-1" />Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">New Airfare Alert</h2>
                <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground">Origin (airport code)</label><input value={origin} onChange={e => setOrigin(e.target.value.toUpperCase())} placeholder="LAX" maxLength={4} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground uppercase" /></div>
                <div><label className="text-xs text-muted-foreground">Destination</label><input value={destination} onChange={e => setDestination(e.target.value.toUpperCase())} placeholder="MCO" maxLength={4} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground uppercase" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground">Depart</label><input type="date" value={departDate} onChange={e => setDepartDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground" /></div>
                <div><label className="text-xs text-muted-foreground">Return</label><input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-muted-foreground">Adults</label><input type="number" min={1} value={adults} onChange={e => setAdults(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground" /></div>
                <div><label className="text-xs text-muted-foreground">Children</label><input type="number" min={0} value={children} onChange={e => setChildren(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground" /></div>
                <div><label className="text-xs text-muted-foreground">Target $</label><input type="number" min={1} value={targetPrice} onChange={e => setTargetPrice(e.target.value)} placeholder="400" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Cabin</label>
                  <select value={cabinClass} onChange={e => setCabinClass(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground">
                    {CABIN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground">Max stops</label><input type="number" min={0} max={3} value={stopsMax} onChange={e => setStopsMax(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground" /></div>
              </div>
              <button onClick={createAlert} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
                Create Alert
              </button>
            </div>
          </div>
        )}

        {/* Mark Booked Modal */}
        {showBooked && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm space-y-4">
              <h2 className="text-sm font-bold text-foreground">Mark as Booked</h2>
              <input value={confirmNum} onChange={e => setConfirmNum(e.target.value)} placeholder="Confirmation number (optional)" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground" />
              <div className="flex gap-2">
                <button onClick={() => markBooked(showBooked)} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">Confirm</button>
                <button onClick={() => setShowBooked(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
