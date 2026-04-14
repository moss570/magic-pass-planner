import { useState, useEffect, useCallback } from "react";
import { Hotel, Search, MapPin, Bell, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, Clock, TrendingDown, TrendingUp, X, Pause, Play } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buildBookingUrl, getGenericBookingUrl } from "@/lib/affiliate";
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
  const w = 120, h = 32;
  const points = prices.map((p, i) => `${(i / (prices.length - 1)) * w},${h - ((p - min) / range) * (h - 4) - 2}`).join(" ");
  return <svg width={w} height={h} className="inline-block"><polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" /></svg>;
}

export default function HotelAlerts() {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [alerts, setAlerts] = useState<HotelAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlerts, setShowAlerts] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showBooked, setShowBooked] = useState<string | null>(null);
  const [confirmNum, setConfirmNum] = useState("");

  // Search form state
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [maxPrice, setMaxPrice] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [creatingAlert, setCreatingAlert] = useState<string | null>(null);

  // Hydrate from URL params
  useEffect(() => {
    const hotel = searchParams.get("hotel");
    const ci = searchParams.get("checkIn");
    const co = searchParams.get("checkOut");
    if (ci) setCheckIn(ci);
    if (co) setCheckOut(co);
    if (searchParams.get("adults")) setAdults(Number(searchParams.get("adults")) || 2);
    if (searchParams.get("children")) setChildren(Number(searchParams.get("children")) || 0);
    if (searchParams.get("targetPrice")) setMaxPrice(searchParams.get("targetPrice") || "");
    if (hotel || ci) {
      setHasSearched(true);
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Search results
  const searchResults = hasSearched
    ? CURATED_HOTELS
        .filter(h => !maxPrice || h.defaultTargetPrice <= Number(maxPrice))
        .sort((a, b) => a.defaultTargetPrice - b.defaultTargetPrice)
    : [];

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut + "T12:00:00").getTime() - new Date(checkIn + "T12:00:00").getTime()) / 86400000))
    : 1;

  const handleSearch = () => {
    if (!checkIn || !checkOut) { toast.error("Please enter check-in and check-out dates"); return; }
    setHasSearched(true);
  };

  const handleBookNow = async (hotel: typeof CURATED_HOTELS[0]) => {
    const url = await buildBookingUrl({
      category: "hotels",
      rawDeeplink: hotel.bookingSearchUrl,
      context: { checkIn, checkOut, adults: String(adults), children: String(children), userId: session?.user?.id },
    });
    window.open(url, "_blank");
  };

  const handleWatchPrice = async (hotel: typeof CURATED_HOTELS[0]) => {
    if (!session?.access_token) { toast.error("Please sign in"); return; }
    setCreatingAlert(hotel.name);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/hotel-alerts`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({
          hotel_name: hotel.name, check_in: checkIn, check_out: checkOut,
          adults, children, target_price: hotel.defaultTargetPrice,
        }),
      });
      if (!resp.ok) throw new Error();
      toast.success(`Watching ${hotel.name}!`);
      supabase.functions.invoke("send-alert-confirmation", {
        body: {
          user_id: session.user.id, alert_type: "hotel",
          alert_details: { name: hotel.name, date: `${checkIn} → ${checkOut}`, extra: `Target: ≤$${hotel.defaultTargetPrice}/night` },
        },
      }).catch(() => {});
      fetchAlerts();
    } catch { toast.error("Failed to create alert"); }
    setCreatingAlert(null);
  };

  const cancelAlert = async (id: string) => {
    await fetch(`${SUPABASE_URL}/functions/v1/hotel-alerts?id=${id}`, { method: "DELETE", headers: getHeaders() });
    toast.success("Alert cancelled"); fetchAlerts();
  };

  const pauseResumeAlert = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "paused" ? "watching" : "paused";
    await fetch(`${SUPABASE_URL}/functions/v1/hotel-alerts`, {
      method: "PATCH", headers: getHeaders(), body: JSON.stringify({ id, status: newStatus }),
    });
    toast.success(newStatus === "paused" ? "Alert paused" : "Alert resumed"); fetchAlerts();
  };

  const markBooked = async (id: string) => {
    await fetch(`${SUPABASE_URL}/functions/v1/hotel-alerts`, {
      method: "PATCH", headers: getHeaders(),
      body: JSON.stringify({ id, status: "booked", confirmation_number: confirmNum }),
    });
    toast.success("Marked as booked!"); setShowBooked(null); setConfirmNum(""); fetchAlerts();
  };

  const { access } = useSubscription();
  const hotelLimit = access.hotelAlerts;
  const watchingCount = alerts.filter(a => a.status === "watching").length;
  const { canAddAlert } = useAlertLimitGuard(hotelLimit, watchingCount);
  const filtered = alerts.filter(a => TABS[activeTab].status.includes(a.status as AlertStatus));

  return (
    <DashboardLayout title="Hotel Search">
      <div className="max-w-2xl mx-auto space-y-5 px-4 py-6">
        <AlertLimitBanner limit={hotelLimit} currentCount={watchingCount} alertTypeName="Hotel Alerts" />

        {/* Header */}
        <div className="flex items-center gap-2">
          <Hotel className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Find Orlando Hotels</h1>
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          Search for off-property hotels near Disney World. Book instantly or set up a price alert to watch for drops.
        </p>

        {/* Search Form */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Check-in</label>
              <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Check-out</label>
              <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Adults</label>
              <input type="number" min={1} value={adults} onChange={e => setAdults(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Children</label>
              <input type="number" min={0} value={children} onChange={e => setChildren(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Max $/night</label>
              <input type="number" min={1} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Any" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground mt-1 placeholder:text-muted-foreground" />
            </div>
          </div>
          <button onClick={handleSearch} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
            <Search className="w-4 h-4" /> Search Hotels
          </button>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">
                {searchResults.length} hotel{searchResults.length !== 1 ? "s" : ""} found
              </p>
              <p className="text-xs text-muted-foreground">
                {nights} night{nights > 1 ? "s" : ""} · {adults} adult{adults > 1 ? "s" : ""}{children > 0 ? ` + ${children} kid${children > 1 ? "s" : ""}` : ""}
              </p>
            </div>
            {searchResults.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-border bg-card">
                <Hotel className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No hotels match your budget. Try increasing your max price.</p>
              </div>
            ) : (
              searchResults.map((hotel, i) => (
                <div key={hotel.name} className={`rounded-xl border p-4 transition-colors ${i === 0 ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{hotel.name}</p>
                        {i === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">Best Value</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-primary font-semibold">{hotel.priceRange}/night</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" /> {hotel.distanceMiles} mi from Disney
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Est. total</p>
                      <p className="text-sm font-bold text-foreground">${hotel.defaultTargetPrice * nights}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">✨ {hotel.bestFor}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {hotel.amenities.map(a => (
                      <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{a}</span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleBookNow(hotel)} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                      <ExternalLink className="w-3 h-3" /> Book Now
                    </button>
                    <button
                      onClick={() => handleWatchPrice(hotel)}
                      disabled={!canAddAlert || creatingAlert === hotel.name}
                      className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg border border-primary/40 text-primary font-semibold hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      <Bell className="w-3 h-3" /> {creatingAlert === hotel.name ? "Creating..." : "Watch Price"}
                    </button>
                  </div>
                </div>
              ))
            )}
            <p className="text-[10px] text-muted-foreground text-center">
              💡 Prices shown are estimated low-end rates. Actual prices may vary by date and availability.
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
              <span className="text-sm font-bold text-foreground">My Hotel Alerts</span>
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
                  <Hotel className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No {TABS[activeTab].label.toLowerCase()} alerts. Search above to find hotels and create alerts.</p>
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
                            <p className="text-xs font-bold text-foreground">{alert.hotel_name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(alert.check_in + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                              {new Date(alert.check_out + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              {" · "}{alert.adults}A {alert.children > 0 ? `${alert.children}C` : ""}
                            </p>
                          </div>
                          <p className="text-xs font-bold text-primary">${alert.target_price}/night</p>
                        </div>
                        {alert.current_price != null && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-foreground font-semibold">${alert.current_price}/night</span>
                            {delta != null && (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${deltaColor} flex items-center gap-0.5`}>
                                {delta <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                                {delta <= 0 ? `-$${Math.abs(delta)}` : `+$${delta}`}
                              </span>
                            )}
                            <PriceSparkline history={alert.price_history} />
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" /> {alert.check_count} checks
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          {alert.status === "found" && (
                            <a href={alert.booking_link || getGenericBookingUrl("hotels")} target="_blank" rel="noopener noreferrer"
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
