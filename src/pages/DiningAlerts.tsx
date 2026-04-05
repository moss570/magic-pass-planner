import { useState, useEffect, useCallback } from "react";
import { Search, Bell, Mail, MessageSquare, X, ExternalLink, RefreshCw, Plus } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import CompassButton from "@/components/CompassButton";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";

const locationFilters = ["All", "Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom", "Resorts", "Disney Springs"];
const mealTimes = ["Breakfast", "Lunch", "Dinner", "Any"];

interface Restaurant {
  id: string;
  name: string;
  location: string;
  location_type: string;
  area?: string;
  cuisine?: string;
  price_range?: string;
  meal_periods: string[];
  disney_url?: string;
}

interface DiningAlert {
  id: string;
  restaurant_id: string;
  alert_date: string;
  party_size: number;
  meal_periods: string[];
  preferred_time?: string;
  alert_email: boolean;
  alert_sms: boolean;
  status: string;
  check_count: number;
  last_checked_at?: string;
  availability_found_at?: string;
  availability_url?: string;
  created_at: string;
  restaurant: Restaurant;
}

export default function DiningAlerts() {
  const { session } = useAuth();
  const { toast } = useToast();

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [dateOpen, setDateOpen] = useState(false);
  const [partySize, setPartySize] = useState(2);
  const [selectedMeals, setSelectedMeals] = useState<string[]>(["Dinner"]);
  const [alertEmail, setAlertEmail] = useState(true);
  const [alertSms, setAlertSms] = useState(false);
  const [showRestaurantDropdown, setShowRestaurantDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [alerts, setAlerts] = useState<DiningAlert[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const getAuthHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
    "x-client-authorization": `Bearer ${session?.access_token}`,
    "apikey": SUPABASE_ANON_KEY,
  }), [session]);

  // Load restaurants
  useEffect(() => {
    if (!session) return;
    setLoadingRestaurants(true);
    fetch(`${SUPABASE_URL}/functions/v1/dining-alerts?action=restaurants`, {
      headers: getAuthHeaders(),
    })
      .then(r => r.json())
      .then(data => {
        setRestaurants(data.restaurants || []);
        setFilteredRestaurants(data.restaurants || []);
      })
      .catch(err => console.error("Failed to load restaurants:", err))
      .finally(() => setLoadingRestaurants(false));
  }, [session, getAuthHeaders]);

  // Filter restaurants
  useEffect(() => {
    let filtered = restaurants;
    if (locationFilter !== "All") {
      filtered = filtered.filter(r =>
        r.location === locationFilter ||
        (locationFilter === "Resorts" && r.location_type === "Resort")
      );
    }
    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredRestaurants(filtered);
  }, [restaurants, locationFilter, searchQuery]);

  // Load user's alerts
  const loadAlerts = useCallback(() => {
    if (!session) return;
    setLoadingAlerts(true);
    fetch(`${SUPABASE_URL}/functions/v1/dining-alerts?action=list`, {
      headers: getAuthHeaders(),
    })
      .then(r => r.json())
      .then(data => setAlerts(data.alerts || []))
      .catch(err => console.error("Failed to load alerts:", err))
      .finally(() => setLoadingAlerts(false));
  }, [session, getAuthHeaders]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const toggleMeal = (meal: string) => {
    if (meal === "Any") {
      setSelectedMeals(["Any"]);
      return;
    }
    setSelectedMeals(prev => {
      const withoutAny = prev.filter(m => m !== "Any");
      if (withoutAny.includes(meal)) {
        const next = withoutAny.filter(m => m !== meal);
        return next.length === 0 ? ["Any"] : next;
      }
      return [...withoutAny, meal];
    });
  };

  const handleCreateAlert = async () => {
    if (!selectedRestaurant) { toast({ title: "Please select a restaurant", variant: "destructive" }); return; }
    if (!date) { toast({ title: "Please select a date", variant: "destructive" }); return; }
    if (!session) { toast({ title: "Please log in", variant: "destructive" }); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/dining-alerts?action=create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          restaurant_id: selectedRestaurant.id,
          alert_date: format(date, "yyyy-MM-dd"),
          party_size: partySize,
          meal_periods: selectedMeals,
          alert_email: alertEmail,
          alert_sms: alertSms,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create alert");

      toast({ title: "🔔 Alert created!", description: `Watching ${selectedRestaurant.name} for ${format(date, "MMM d, yyyy")}` });
      setSelectedRestaurant(null);
      setDate(undefined);
      setSearchQuery("");
      loadAlerts();
    } catch (err) {
      toast({ title: "Failed to create alert", description: err instanceof Error ? err.message : "Please try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAlert = async (alertId: string, restaurantName: string) => {
    if (!session) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/dining-alerts?action=cancel`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ alert_id: alertId }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      toast({ title: "Alert cancelled", description: `Stopped watching ${restaurantName}` });
      loadAlerts();
    } catch {
      toast({ title: "Failed to cancel alert", variant: "destructive" });
    }
  };

  const getStatusBadge = (alert: DiningAlert) => {
    switch (alert.status) {
      case "watching":
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-pulse" />
            Watching...
          </span>
        );
      case "found":
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/15 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            AVAILABLE — Book Now!
          </span>
        );
      case "booked":
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400">✅ Booked</span>;
      case "expired":
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted/30 text-muted-foreground">⏰ Expired</span>;
      case "cancelled":
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400">❌ Cancelled</span>;
      default:
        return <span className="text-xs text-muted-foreground">{alert.status}</span>;
    }
  };

  const activeAlerts = alerts.filter(a => a.status === "watching" || a.status === "found");
  const pastAlerts = alerts.filter(a => a.status === "booked" || a.status === "expired" || a.status === "cancelled");

  return (
    <DashboardLayout
      title="🍽️ Dining Reservation Alerts"
      subtitle="We watch 24/7 and alert you the instant your table opens up"
    >
      <div className="space-y-6">

        {/* ── SET A NEW ALERT ─────────────────────────────────── */}
        <div className="rounded-xl border p-5 md:p-6" style={{ background: "var(--card)", borderColor: "rgba(245,200,66,0.3)", borderTopWidth: 3, borderTopColor: "#F5C842" }}>
          <h2 className="text-base font-bold text-foreground mb-4">🔔 Set a New Alert</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Restaurant Search */}
            <div className="relative md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Restaurant</label>

              {/* Location filter pills */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {locationFilters.map(f => (
                  <button
                    key={f}
                    onClick={() => setLocationFilter(f)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${locationFilter === f ? "bg-primary text-[var(--background)]" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {selectedRestaurant ? (
                <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-primary/40 bg-primary/5">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedRestaurant.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedRestaurant.location}{selectedRestaurant.area ? ` · ${selectedRestaurant.area}` : ""}</p>
                  </div>
                  <button onClick={() => { setSelectedRestaurant(null); setSearchQuery(""); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={loadingRestaurants ? "Loading restaurants..." : `Search ${restaurants.length}+ Disney restaurants...`}
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowRestaurantDropdown(true); }}
                    onFocus={() => setShowRestaurantDropdown(true)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#1a2235] border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                    style={{ minHeight: 44 }}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {restaurants.length > 0 ? `${restaurants.length} restaurants · Updated automatically` : "Loading..."}
                  </p>

                  {showRestaurantDropdown && filteredRestaurants.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-white/10 overflow-hidden shadow-xl" style={{ background: "var(--card)", maxHeight: 280 }}>
                      <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
                        {filteredRestaurants.slice(0, 30).map(r => (
                          <button
                            key={r.id}
                            onClick={() => { setSelectedRestaurant(r); setShowRestaurantDropdown(false); setSearchQuery(""); }}
                            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors border-b border-white/5 last:border-0"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                              <p className="text-xs text-muted-foreground">{r.location}{r.area ? ` · ${r.area}` : ""} {r.cuisine ? `· ${r.cuisine}` : ""}</p>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">{r.price_range}</span>
                          </button>
                        ))}
                        {filteredRestaurants.length > 30 && (
                          <p className="text-center text-xs text-muted-foreground py-2">Refine your search to see more results</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Date Picker */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Date</label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <button className={cn("w-full px-4 py-2.5 rounded-lg bg-[#1a2235] border border-white/10 text-sm text-left transition-colors hover:border-primary/40 focus:outline-none", !date && "text-muted-foreground")} style={{ minHeight: 44 }}>
                    {date ? format(date, "MMM d, yyyy") : "Select date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Calendar mode="single" selected={date} onSelect={d => { setDate(d); setDateOpen(false); }} disabled={d => d < new Date()} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Party Size */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Party Size</label>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#1a2235] border border-white/10" style={{ minHeight: 44 }}>
                <button onClick={() => setPartySize(p => Math.max(1, p - 1))} className="w-7 h-7 rounded-full bg-muted/30 text-foreground font-bold hover:bg-muted/50 transition-colors text-lg leading-none">−</button>
                <span className="flex-1 text-center text-sm font-semibold text-foreground">{partySize} {partySize === 1 ? "Guest" : "Guests"}</span>
                <button onClick={() => setPartySize(p => Math.min(12, p + 1))} className="w-7 h-7 rounded-full bg-muted/30 text-foreground font-bold hover:bg-muted/50 transition-colors text-lg leading-none">+</button>
              </div>
            </div>

            {/* Meal Times */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Meal Time</label>
              <div className="flex flex-wrap gap-1.5">
                {mealTimes.map(meal => (
                  <button
                    key={meal}
                    onClick={() => toggleMeal(meal)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${selectedMeals.includes(meal) ? "bg-primary text-[var(--background)]" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                  >
                    {meal}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Channels */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Alert me via</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAlertEmail(e => !e)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${alertEmail ? "bg-primary text-[var(--background)]" : "bg-muted/30 text-muted-foreground"}`}
                >
                  <Mail className="w-3 h-3" /> Email
                </button>
                <button
                  onClick={() => setAlertSms(s => !s)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${alertSms ? "bg-primary text-[var(--background)]" : "bg-muted/30 text-muted-foreground"}`}
                >
                  <MessageSquare className="w-3 h-3" /> SMS
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateAlert}
            disabled={submitting || !selectedRestaurant || !date}
            className="mt-5 w-full py-3 rounded-lg font-bold text-sm text-[var(--background)] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#F5C842" }}
          >
            {submitting ? "Creating Alert..." : "🔔 Start Watching This Restaurant"}
          </button>
          <p className="text-center text-xs text-muted-foreground mt-2">We check every few minutes and alert you the instant a spot opens</p>
        </div>

        {/* ── ACTIVE ALERTS ───────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">
              Your Active Alerts {activeAlerts.length > 0 && <span className="text-primary">({activeAlerts.length})</span>}
            </h2>
            <button onClick={loadAlerts} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loadingAlerts ? (
            <div className="rounded-xl p-8 text-center" style={{ background: "var(--card)" }}>
              <p className="text-muted-foreground text-sm">Loading your alerts...</p>
            </div>
          ) : activeAlerts.length === 0 ? (
            <div className="rounded-xl p-8 text-center border border-dashed border-white/10" style={{ background: "var(--card)" }}>
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No active alerts</p>
              <p className="text-xs text-muted-foreground">Set an alert above and we'll watch 24/7 for availability</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map(alert => (
                <div key={alert.id} className="rounded-xl p-4 md:p-5 border" style={{ background: "var(--card)", borderColor: alert.status === "found" ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.08)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground">{alert.restaurant?.name}</h3>
                        {getStatusBadge(alert)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alert.alert_date + "T12:00:00"), "MMM d, yyyy")} · Party of {alert.party_size} · {alert.meal_periods.join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {alert.restaurant?.location}{alert.restaurant?.area ? ` · ${alert.restaurant.area}` : ""}
                      </p>
                      {alert.check_count > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Checked {alert.check_count.toLocaleString()} times
                          {alert.last_checked_at ? ` · Last checked ${new Date(alert.last_checked_at).toLocaleTimeString()}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CompassButton
                        destination={alert.restaurant?.name || "Restaurant"}
                        context={`${alert.restaurant?.location || "Disney World"}`}
                        size="inline"
                      />
                      <button
                        onClick={() => handleCancelAlert(alert.id, alert.restaurant?.name)}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {alert.status === "found" && alert.availability_url && (
                    <div className="mt-3 pt-3 border-t border-green-500/20">
                      <a
                        href={alert.availability_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-bold text-sm text-[var(--background)] transition-opacity hover:opacity-90"
                        style={{ background: "#F5C842" }}
                      >
                        🍽️ Book This Reservation →
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <p className="text-center text-xs text-muted-foreground mt-1">Opens Disney dining page · Availability may close in seconds</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ALERT HISTORY ───────────────────────────────────── */}
        {pastAlerts.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-foreground mb-3">Recent Alert History</h2>
            <div className="rounded-xl overflow-hidden border border-white/8" style={{ background: "var(--card)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-primary">Restaurant</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-primary hidden sm:table-cell">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-primary hidden md:table-cell">Party</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-primary">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastAlerts.map((alert, i) => (
                      <tr key={alert.id} className={i < pastAlerts.length - 1 ? "border-b border-white/5" : ""}>
                        <td className="px-4 py-3 text-foreground font-medium">{alert.restaurant?.name}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{format(new Date(alert.alert_date + "T12:00:00"), "MMM d, yyyy")}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{alert.party_size}</td>
                        <td className="px-4 py-3">{getStatusBadge(alert)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
