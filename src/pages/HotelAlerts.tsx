import { useState, useEffect, useCallback } from "react";
import { Hotel, Plus, Eye, CheckCircle2, Clock, TrendingDown, TrendingUp, X, Search, DollarSign, Pause, Play } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getGenericBookingUrl } from "@/lib/affiliate";
import { useSubscription } from "@/hooks/useSubscription";
import { AlertLimitBanner, useAlertLimitGuard } from "@/components/AlertLimitBanner";
import { CURATED_HOTELS } from "@/lib/curatedHotels";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";

type AlertStatus = "watching" | "found" | "booked" | "expired" | "cancelled" | "paused";
const TABS: { label: string; status: AlertStatus[] }[] = [
  { label: "Watching", status: ["watching"] },
  { label: "Paused", status: ["paused"] },
  { label: "Found", status: ["found"] },
  { label: "Booked", status: ["booked"] },
  { label: "History", status: ["expired", "cancelled"] },
];

interface HotelAlert {
  id: string;
  hotel_name: string;
  hotel_id: string | null;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  target_price: number;
  current_price: number | null;
  price_history: { date: string; price: number }[];
  status: AlertStatus;
  check_count: number;
  last_checked_at: string | null;
  notify_email: boolean;
  notify_sms: boolean;
  booking_link: string | null;
  confirmation_number: string | null;
  created_at: string;
  trip_id: string | null;
}

function PriceSparkline({ history }: { history: { date: string; price: number }[] }) {
  if (!history || history.length < 2) return null;
  const prices = history.map(h => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 120;
  const h = 32;
  const points = prices.map((p, i) => `${(i / (prices.length - 1)) * w},${h - ((p - min) / range) * (h - 4) - 2}`).join(" ");

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
    </svg>
  );
}

export default function HotelAlerts() {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [alerts, setAlerts] = useState<HotelAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showBooked, setShowBooked] = useState<string | null>(null);
  const [confirmNum, setConfirmNum] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Create form state
  const [hotelName, setHotelName] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [targetPrice, setTargetPrice] = useState("");

  // Auto-open create form from URL params (e.g. from Trip Planner "Track Price")
  useEffect(() => {
    const hotel = searchParams.get("hotel");
    if (hotel) {
      setHotelName(hotel);
      setCheckIn(searchParams.get("checkIn") || "");
      setCheckOut(searchParams.get("checkOut") || "");
      setAdults(Number(searchParams.get("adults")) || 2);
      setChildren(Number(searchParams.get("children")) || 0);
      setTargetPrice(searchParams.get("targetPrice") || "");
      setShowCreate(true);
      // Clear params so refreshing doesn't re-open
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredSuggestions = hotelName.trim().length > 0
    ? CURATED_HOTELS.filter(h => h.name.toLowerCase().includes(hotelName.toLowerCase()))
    : CURATED_HOTELS;

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
    apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbmVsaHJtZ3NwdXp0ZWhldHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzcyNzgsImV4cCI6MjA5MDgxMzI3OH0.vjT4Iun32HsCfoO7nVnfzLBnJy-Lye6N9ZryBbWuAjo",
  }), [session]);

  const fetchAlerts = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/hotel-alerts`, { headers: getHeaders() });
      const data = await resp.json();
      setAlerts(data.alerts || []);
    } catch { toast.error("Failed to load hotel alerts"); }
    setLoading(false);
  }, [session, getHeaders]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const createAlert = async () => {
    if (!hotelName || !checkIn || !checkOut || !targetPrice) { toast.error("Fill all required fields"); return; }
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/hotel-alerts`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ hotel_name: hotelName, check_in: checkIn, check_out: checkOut, adults, children, target_price: Number(targetPrice) }),
      });
      if (!resp.ok) throw new Error();
      toast.success("Hotel alert created!");

      // Fire-and-forget confirmation email
      supabase.functions.invoke("send-alert-confirmation", {
        body: {
          user_id: session!.user.id,
          alert_type: "hotel",
          alert_details: {
            name: hotelName,
            date: `${checkIn} → ${checkOut}`,
            extra: `${adults} adults${children > 0 ? `, ${children} children` : ""} · Target: ≤$${targetPrice}/night`,
          },
        },
      }).catch(() => {});

      setShowCreate(false);
      setHotelName(""); setCheckIn(""); setCheckOut(""); setTargetPrice("");
      fetchAlerts();
    } catch { toast.error("Failed to create alert"); }
  };

  const cancelAlert = async (id: string) => {
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/hotel-alerts?id=${id}`, { method: "DELETE", headers: getHeaders() });
      if (!resp.ok) throw new Error(await resp.text());
      toast.success("Alert cancelled");
      fetchAlerts();
    } catch (err) {
      console.error("Cancel failed:", err);
      toast.error("Failed to cancel alert");
    }
  };

  const pauseResumeAlert = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "paused" ? "watching" : "paused";
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/hotel-alerts`, {
        method: "PATCH", headers: getHeaders(),
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      toast.success(newStatus === "paused" ? "Alert paused" : "Alert resumed");
      fetchAlerts();
    } catch (err) {
      console.error("Pause/resume failed:", err);
      toast.error("Failed to update alert");
    }
  };

  const markBooked = async (id: string) => {
    await fetch(`${SUPABASE_URL}/functions/v1/hotel-alerts`, {
      method: "PATCH", headers: getHeaders(),
      body: JSON.stringify({ id, status: "booked", confirmation_number: confirmNum }),
    });
    toast.success("Marked as booked!");
    setShowBooked(null); setConfirmNum("");
    fetchAlerts();
  };

  const { access } = useSubscription();
  const hotelLimit = access.hotelAlerts;
  const watchingCount = alerts.filter(a => a.status === "watching").length;
  const { canAddAlert } = useAlertLimitGuard(hotelLimit, watchingCount);

  const filtered = alerts.filter(a => TABS[activeTab].status.includes(a.status as AlertStatus));

  return (
    <DashboardLayout title="Hotel Alerts">
      <div className="max-w-2xl mx-auto space-y-4 px-4 py-6">
        <AlertLimitBanner limit={hotelLimit} currentCount={watchingCount} alertTypeName="Hotel Alerts" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hotel className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Hotel Alerts</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
              {watchingCount} watching
            </span>
          </div>
          <button onClick={() => setShowCreate(true)} disabled={!canAddAlert} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus className="w-3.5 h-3.5" /> New Alert
          </button>
        </div>

        {/* Tabs */}
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
            <Hotel className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
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
                      <p className="text-sm font-bold text-foreground">{alert.hotel_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(alert.check_in + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                        {new Date(alert.check_out + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {" · "}{alert.adults}A {alert.children > 0 ? `${alert.children}C` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="text-sm font-bold text-primary">${alert.target_price}/night</p>
                    </div>
                  </div>

                  {alert.current_price != null && (
                    <div className="flex items-center gap-3 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Current</p>
                        <p className="text-sm font-bold text-foreground">${alert.current_price}/night</p>
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
                    <Clock className="w-3 h-3" />
                    {alert.check_count} checks · last {alert.last_checked_at ? new Date(alert.last_checked_at).toLocaleDateString() : "never"}
                  </div>

                  <div className="flex gap-2 mt-3">
                    {alert.status === "found" && (
                      <a href={alert.booking_link || getGenericBookingUrl("hotels")}
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
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">New Hotel Alert</h2>
                <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="relative">
                <input
                  value={hotelName}
                  onChange={e => { setHotelName(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Hotel name — type to search"
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground"
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map(h => (
                      <button
                        key={h.name}
                        onClick={() => {
                          setHotelName(h.name);
                          if (!targetPrice) setTargetPrice(String(h.defaultTargetPrice));
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                      >
                        <p className="text-xs font-semibold text-foreground">{h.name}</p>
                        <p className="text-[10px] text-muted-foreground">{h.priceRange}/night · {h.distanceMiles}mi · {h.category}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground">Check-in</label><input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground" /></div>
                <div><label className="text-xs text-muted-foreground">Check-out</label><input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-muted-foreground">Adults</label><input type="number" min={1} value={adults} onChange={e => setAdults(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground" /></div>
                <div><label className="text-xs text-muted-foreground">Children</label><input type="number" min={0} value={children} onChange={e => setChildren(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground" /></div>
                <div><label className="text-xs text-muted-foreground">Target $/night</label><input type="number" min={1} value={targetPrice} onChange={e => setTargetPrice(e.target.value)} placeholder="150" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground" /></div>
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
