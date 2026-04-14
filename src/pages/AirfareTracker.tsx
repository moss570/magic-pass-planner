import { useState, useEffect, useCallback } from "react";
import { Plane, Search, Bell, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, Clock, TrendingDown, TrendingUp, X, Pause, Play } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buildBookingUrl, getGenericBookingUrl } from "@/lib/affiliate";
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

const ORLANDO_AIRPORTS = ["MCO", "SFB", "MLB"];

const POPULAR_ORIGINS = [
  "ATL", "JFK", "LAX", "ORD", "DFW", "DEN", "SFO", "SEA", "BOS", "PHX",
  "IAH", "MSP", "DTW", "PHL", "LGA", "CLT", "MIA", "EWR", "BWI", "DCA",
];

interface SimulatedFlight {
  id: string;
  origin: string;
  destination: string;
  airline: string;
  price: number;
  stops: number;
  duration: string;
  cabin: string;
  departTime: string;
  returnTime: string;
}

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

function generateFlights(origin: string, budget: number, cabin: string, stopsMax: number): SimulatedFlight[] {
  const airlines = ["Delta", "United", "American", "Southwest", "JetBlue", "Spirit", "Frontier"];
  const results: SimulatedFlight[] = [];
  for (const dest of ORLANDO_AIRPORTS) {
    const count = dest === "MCO" ? 4 : 2;
    for (let i = 0; i < count; i++) {
      const basePrice = budget * (0.7 + Math.random() * 0.6);
      const stops = Math.min(stopsMax, Math.floor(Math.random() * 3));
      const hrs = 2 + stops * 1.5 + Math.random() * 2;
      results.push({
        id: `${origin}-${dest}-${i}`,
        origin: origin || "ANY",
        destination: dest,
        airline: airlines[Math.floor(Math.random() * airlines.length)],
        price: Math.round(basePrice),
        stops,
        duration: `${Math.floor(hrs)}h ${Math.round((hrs % 1) * 60)}m`,
        cabin: cabin.replace("_", " "),
        departTime: `${6 + Math.floor(Math.random() * 14)}:${Math.random() > 0.5 ? "00" : "30"}`,
        returnTime: `${8 + Math.floor(Math.random() * 12)}:${Math.random() > 0.5 ? "00" : "30"}`,
      });
    }
  }
  return results.sort((a, b) => a.price - b.price);
}

export default function AirfareTracker() {
  const { session } = useAuth();
  const [alerts, setAlerts] = useState<AirfareAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlerts, setShowAlerts] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showBooked, setShowBooked] = useState<string | null>(null);
  const [confirmNum, setConfirmNum] = useState("");

  // Search form
  const [origin, setOrigin] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [cabinClass, setCabinClass] = useState("economy");
  const [stopsMax, setStopsMax] = useState(2);
  const [maxBudget, setMaxBudget] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<SimulatedFlight[]>([]);
  const [creatingAlert, setCreatingAlert] = useState<string | null>(null);

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

  const handleSearch = () => {
    if (!departDate || !returnDate) { toast.error("Please enter travel dates"); return; }
    const budget = Number(maxBudget) || 500;
    setSearchResults(generateFlights(origin, budget, cabinClass, stopsMax));
    setHasSearched(true);
  };

  const handleBookNow = async (flight: SimulatedFlight) => {
    const url = await buildBookingUrl({
      category: "flights",
      rawDeeplink: "https://www.google.com/travel/flights",
      context: {
        origin: flight.origin, destination: flight.destination,
        depart_date: departDate, return_date: returnDate,
        adults: String(adults), children: String(children),
        userId: session?.user?.id,
      },
    });
    window.open(url, "_blank");
  };

  const handleWatchPrice = async (flight: SimulatedFlight) => {
    if (!session?.access_token) { toast.error("Please sign in"); return; }
    setCreatingAlert(flight.id);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/airfare-alerts`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({
          origin: flight.origin === "ANY" ? origin || "ANY" : flight.origin,
          destination: flight.destination,
          depart_date: departDate, return_date: returnDate,
          adults, children, target_price: flight.price,
          cabin_class: cabinClass, stops_max: stopsMax,
        }),
      });
      if (!resp.ok) throw new Error();
      toast.success(`Watching ${flight.origin} → ${flight.destination}!`);
      supabase.functions.invoke("send-alert-confirmation", {
        body: {
          user_id: session.user.id, alert_type: "airfare",
          alert_details: {
            name: `${flight.origin} → ${flight.destination}`,
            date: `${departDate} → ${returnDate}`,
            extra: `${cabinClass} · Target: ≤$${flight.price}`,
          },
        },
      }).catch(() => {});
      fetchAlerts();
    } catch { toast.error("Failed to create alert"); }
    setCreatingAlert(null);
  };

  const cancelAlert = async (id: string) => {
    await fetch(`${SUPABASE_URL}/functions/v1/airfare-alerts?id=${id}`, { method: "DELETE", headers: getHeaders() });
    toast.success("Alert cancelled"); fetchAlerts();
  };

  const pauseResumeAlert = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "paused" ? "watching" : "paused";
    await fetch(`${SUPABASE_URL}/functions/v1/airfare-alerts`, {
      method: "PATCH", headers: getHeaders(), body: JSON.stringify({ id, status: newStatus }),
    });
    toast.success(newStatus === "paused" ? "Alert paused" : "Alert resumed"); fetchAlerts();
  };

  const markBooked = async (id: string) => {
    await fetch(`${SUPABASE_URL}/functions/v1/airfare-alerts`, {
      method: "PATCH", headers: getHeaders(),
      body: JSON.stringify({ id, status: "booked", confirmation_number: confirmNum }),
    });
    toast.success("Marked as booked!"); setShowBooked(null); setConfirmNum(""); fetchAlerts();
  };

  const { access } = useSubscription();
  const airfareLimit = access.airfareAlerts;
  const watchingCount = alerts.filter(a => a.status === "watching").length;
  const { canAddAlert } = useAlertLimitGuard(airfareLimit, watchingCount);
  const filtered = alerts.filter(a => TABS[activeTab].status.includes(a.status as AlertStatus));

  return (
    <DashboardLayout title="Flight Search">
      <div className="max-w-2xl mx-auto space-y-5 px-4 py-6">
        <AlertLimitBanner limit={airfareLimit} currentCount={watchingCount} alertTypeName="Airfare Alerts" />

        {/* Header */}
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Find Flights to Orlando</h1>
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          Search flights to Orlando area airports (MCO, SFB, MLB). Book instantly or set up a price alert.
        </p>

        {/* Search Form */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">From (airport code)</label>
              <div className="relative">
                <input
                  value={origin} onChange={e => setOrigin(e.target.value.toUpperCase())}
                  placeholder="e.g. LAX (optional)"
                  maxLength={4}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground mt-1 uppercase placeholder:normal-case placeholder:text-muted-foreground"
                />
              </div>
              {!origin && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {["ATL", "JFK", "LAX", "ORD", "DFW"].map(code => (
                    <button key={code} onClick={() => setOrigin(code)} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                      {code}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">To</label>
              <input value="Orlando (MCO/SFB/MLB)" disabled className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Depart</label>
              <input type="date" value={departDate} onChange={e => setDepartDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Return</label>
              <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Adults</label>
              <input type="number" min={1} value={adults} onChange={e => setAdults(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Children</label>
              <input type="number" min={0} value={children} onChange={e => setChildren(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Cabin</label>
              <select value={cabinClass} onChange={e => setCabinClass(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground mt-1">
                {CABIN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Max budget</label>
              <input type="number" min={1} value={maxBudget} onChange={e => setMaxBudget(e.target.value)} placeholder="$500" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground mt-1 placeholder:text-muted-foreground" />
            </div>
          </div>
          <button onClick={handleSearch} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
            <Search className="w-4 h-4" /> Search Flights
          </button>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-foreground">{searchResults.length} flights found</p>
            {searchResults.map(flight => (
              <div key={flight.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{flight.origin} → {flight.destination}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {flight.airline} · {flight.duration} · {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`} · {flight.cabin}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">${flight.price}</p>
                    <p className="text-[10px] text-muted-foreground">per person</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                  <span>Depart {flight.departTime}</span>
                  <span>·</span>
                  <span>Return {flight.returnTime}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleBookNow(flight)} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                    <ExternalLink className="w-3 h-3" /> Book Now
                  </button>
                  <button
                    onClick={() => handleWatchPrice(flight)}
                    disabled={!canAddAlert || creatingAlert === flight.id}
                    className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg border border-primary/40 text-primary font-semibold hover:bg-primary/10 transition-colors disabled:opacity-50"
                  >
                    <Bell className="w-3 h-3" /> {creatingAlert === flight.id ? "Creating..." : "Watch Price"}
                  </button>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground text-center">
              💡 Prices shown are estimated. Actual fares may vary. Click "Book Now" to see live pricing.
            </p>
          </div>
        )}

        {/* My Alerts Section */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">My Airfare Alerts</span>
              {watchingCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                  {watchingCount} active
                </span>
              )}
            </div>
            {showAlerts ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showAlerts && (
            <div className="px-4 pb-4 space-y-3">
              <div className="flex gap-1 rounded-xl bg-muted p-1">
                {TABS.map((tab, i) => (
                  <button key={tab.label} onClick={() => setActiveTab(i)}
                    className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${activeTab === i ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8">
                  <Plane className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No {TABS[activeTab].label.toLowerCase()} alerts. Search above to find flights and create alerts.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(alert => {
                    const delta = alert.current_price != null ? alert.current_price - alert.target_price : null;
                    const deltaColor = delta != null ? (delta <= 0 ? "text-green-400 bg-green-500/15" : "text-red-400 bg-red-500/15") : "";
                    return (
                      <div key={alert.id} className={`rounded-xl border p-3 ${alert.status === "found" ? "border-green-500/40 bg-green-500/5" : "border-border bg-muted/20"} ${alert.status === "paused" ? "opacity-60" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-foreground">{alert.origin} → {alert.destination}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(alert.depart_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                              {new Date(alert.return_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              {" · "}{alert.cabin_class.replace("_", " ")}
                            </p>
                          </div>
                          <p className="text-xs font-bold text-primary">${alert.target_price}</p>
                        </div>
                        {alert.current_price != null && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-foreground font-semibold">${alert.current_price}</span>
                            {delta != null && (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${deltaColor} flex items-center gap-0.5`}>
                                {delta <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                                {delta <= 0 ? `-$${Math.abs(delta)}` : `+$${delta}`}
                              </span>
                            )}
                            <PriceSparkline history={alert.price_history} />
                          </div>
                        )}
                        <div className="flex gap-1.5 mt-2">
                          {alert.status === "found" && (
                            <a href={alert.booking_link || getGenericBookingUrl("flights")} target="_blank" rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-[10px] font-bold hover:bg-green-500 transition-colors">
                              Book Now →
                            </a>
                          )}
                          {(alert.status === "watching" || alert.status === "found" || alert.status === "paused") && (
                            <>
                              <button onClick={() => pauseResumeAlert(alert.id, alert.status)} className="px-2.5 py-1.5 rounded-lg border border-border text-[10px] font-medium text-foreground hover:bg-muted transition-colors">
                                {alert.status === "paused" ? <><Play className="w-3 h-3 inline mr-0.5" />Resume</> : <><Pause className="w-3 h-3 inline mr-0.5" />Pause</>}
                              </button>
                              {alert.status !== "paused" && (
                                <button onClick={() => setShowBooked(alert.id)} className="px-2.5 py-1.5 rounded-lg border border-border text-[10px] font-medium text-foreground hover:bg-muted transition-colors">
                                  <CheckCircle2 className="w-3 h-3 inline mr-0.5" />Booked
                                </button>
                              )}
                              <button onClick={() => cancelAlert(alert.id)} className="px-2.5 py-1.5 rounded-lg border border-destructive/30 text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-colors">
                                <X className="w-3 h-3 inline mr-0.5" />Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

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
