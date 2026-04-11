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
import { useSubscription } from "@/hooks/useSubscription";
import { AlertLimitBanner, useAlertLimitGuard } from "@/components/AlertLimitBanner";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";

const categoryFilters = ["All", "Experience", "Tour", "After Hours", "Dessert Party", "Festival", "Recreation"];
const timePreferences = ["Any", "Morning", "Afternoon", "Evening"];

interface Event {
  id: string;
  event_name: string;
  event_url: string;
  category: string;
  location: string;
  location_type: string;
  area?: string;
  description?: string;
  price_info?: string;
  scrapable?: boolean;
}

interface EventAlert {
  id: string;
  event_name: string;
  event_url: string;
  alert_date: string;
  party_size: number;
  preferred_time?: string;
  alert_email: boolean;
  alert_sms: boolean;
  status: string;
  check_count: number;
  last_checked_at?: string;
  availability_found_at?: string;
  found_times?: string[];
  priority_launch: boolean;
  window_opens_at?: string;
  created_at: string;
}

export default function EventAlerts() {
  const { session } = useAuth();
  const { toast } = useToast();

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [dateOpen, setDateOpen] = useState(false);
  const [partySize, setPartySize] = useState(2);
  const [preferredTime, setPreferredTime] = useState("Any");
  const [alertEmail, setAlertEmail] = useState(true);
  const [alertSms, setAlertSms] = useState(false);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data state
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [alerts, setAlerts] = useState<EventAlert[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const getAuthHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
    "x-client-authorization": `Bearer ${session?.access_token}`,
    "apikey": SUPABASE_ANON_KEY,
  }), [session]);

  // Load events catalog
  useEffect(() => {
    if (!session) return;
    setLoadingEvents(true);
    fetch(`${SUPABASE_URL}/functions/v1/event-alerts?action=events`, {
      headers: getAuthHeaders(),
    })
      .then(r => r.json())
      .then(data => {
        setEvents(data.events || []);
        setFilteredEvents(data.events || []);
      })
      .catch(err => console.error("Failed to load events:", err))
      .finally(() => setLoadingEvents(false));
  }, [session, getAuthHeaders]);

  // Filter events
  useEffect(() => {
    let filtered = events;
    if (categoryFilter !== "All") {
      filtered = filtered.filter(e => e.category === categoryFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredEvents(filtered);
  }, [events, categoryFilter, searchQuery]);

  // Load user's alerts
  const loadAlerts = useCallback(() => {
    if (!session) return;
    setLoadingAlerts(true);
    fetch(`${SUPABASE_URL}/functions/v1/event-alerts?action=list`, {
      headers: getAuthHeaders(),
    })
      .then(r => r.json())
      .then(data => setAlerts(data.alerts || []))
      .catch(err => console.error("Failed to load event alerts:", err))
      .finally(() => setLoadingAlerts(false));
  }, [session, getAuthHeaders]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleCreateAlert = async () => {
    if (!selectedEvent) { toast({ title: "Please select an event", variant: "destructive" }); return; }
    if (!date) { toast({ title: "Please select a date", variant: "destructive" }); return; }
    if (!session) { toast({ title: "Please log in", variant: "destructive" }); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/event-alerts?action=create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          event_name: selectedEvent.event_name,
          event_url: selectedEvent.event_url,
          alert_date: format(date, "yyyy-MM-dd"),
          party_size: partySize,
          preferred_time: preferredTime,
          alert_email: alertEmail,
          alert_sms: alertSms,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create alert");

      toast({
        title: "🎪 Event alert created!",
        description: `Watching ${selectedEvent.event_name} for ${format(date, "MMM d, yyyy")}${data.alert?.priority_launch ? " — Midnight Launch mode active!" : ""}`,
      });
      setSelectedEvent(null);
      setDate(undefined);
      setSearchQuery("");
      loadAlerts();
    } catch (err) {
      toast({ title: "Failed to create alert", description: err instanceof Error ? err.message : "Please try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAlert = async (alertId: string, name: string) => {
    if (!session) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/event-alerts?action=cancel`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ alert_id: alertId }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      toast({ title: "Alert cancelled", description: `Stopped watching ${name}` });
      loadAlerts();
    } catch {
      toast({ title: "Failed to cancel alert", variant: "destructive" });
    }
  };

  const getStatusBadge = (alert: EventAlert) => {
    switch (alert.status) {
      case "watching":
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-pulse" />
            {alert.priority_launch ? "🚀 Priority Watching" : "Watching..."}
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
      title="🎪 Enchanting Extras Alerts"
      subtitle="We watch 24/7 and alert you the instant your event opens up"
    >
      <div className="space-y-6">

        {/* ── SET A NEW ALERT ─────────────────────────────────── */}
        <div className="rounded-xl border p-5 md:p-6" style={{ background: "var(--card)", borderColor: "rgba(245,200,66,0.3)", borderTopWidth: 3, borderTopColor: "#F5C842" }}>
          <h2 className="text-base font-bold text-foreground mb-4">🔔 Set a New Alert</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Search */}
            <div className="relative md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Event / Experience</label>

              {/* Category filter pills */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {categoryFilters.map(f => (
                  <button
                    key={f}
                    onClick={() => setCategoryFilter(f)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${categoryFilter === f ? "bg-primary text-[var(--background)]" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {selectedEvent ? (
                <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-primary/40 bg-primary/5">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedEvent.event_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedEvent.location}{selectedEvent.area ? ` · ${selectedEvent.area}` : ""} · {selectedEvent.category}</p>
                  </div>
                  <button onClick={() => { setSelectedEvent(null); setSearchQuery(""); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={loadingEvents ? "Loading events..." : `Search ${events.length}+ Disney events & experiences...`}
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowEventDropdown(true); }}
                    onFocus={() => setShowEventDropdown(true)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#1a2235] border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                    style={{ minHeight: 44 }}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {events.length > 0 ? `${events.length} events & experiences · Updated automatically` : "Loading..."}
                  </p>

                  {showEventDropdown && filteredEvents.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-white/10 overflow-hidden shadow-xl" style={{ background: "#141C2E", maxHeight: 280 }}>
                      <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
                        {filteredEvents.slice(0, 30).map(e => (
                          <button
                            key={e.id}
                            onClick={() => { if (e.scrapable !== false) { setSelectedEvent(e); setShowEventDropdown(false); setSearchQuery(""); } }}
                            className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-white/5 last:border-0 ${e.scrapable === false ? "opacity-50 cursor-not-allowed" : "hover:bg-white/5"}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground truncate">{e.event_name}</p>
                                {e.scrapable === false && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground font-medium shrink-0">Walk-up only</span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{e.location}{e.area ? ` · ${e.area}` : ""} · {e.category}</p>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">{e.price_info}</span>
                          </button>
                        ))}
                        {filteredEvents.length > 30 && (
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

            {/* Preferred Time */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Preferred Time</label>
              <div className="flex flex-wrap gap-1.5">
                {timePreferences.map(tp => (
                  <button
                    key={tp}
                    onClick={() => setPreferredTime(tp)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${preferredTime === tp ? "bg-primary text-[var(--background)]" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                  >
                    {tp}
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
            disabled={submitting || !selectedEvent || !date}
            className="mt-5 w-full py-3 rounded-lg font-bold text-sm text-[var(--background)] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#F5C842" }}
          >
            {submitting ? "Creating Alert..." : "🎪 Start Watching This Event"}
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
                        <h3 className="text-sm font-bold text-foreground">{alert.event_name}</h3>
                        {getStatusBadge(alert)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alert.alert_date + "T12:00:00"), "MMM d, yyyy")} · Party of {alert.party_size} · {alert.preferred_time || "Any time"}
                      </p>
                      {alert.priority_launch && alert.window_opens_at && (
                        <p className="text-xs text-primary mt-0.5">
                          🚀 Midnight Launch — window opens {format(new Date(alert.window_opens_at), "MMM d 'at' h:mm:ss a")}
                        </p>
                      )}
                      {alert.check_count > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Checked {alert.check_count.toLocaleString()} times
                          {alert.last_checked_at ? ` · Last checked ${new Date(alert.last_checked_at).toLocaleTimeString()}` : ""}
                        </p>
                      )}
                      {alert.found_times && alert.found_times.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {alert.found_times.map((t, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CompassButton
                        destination={alert.event_name}
                        context="Walt Disney World"
                        size="inline"
                      />
                      <button
                        onClick={() => handleCancelAlert(alert.id, alert.event_name)}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {alert.status === "found" && (
                    <div className="mt-3 pt-3 border-t border-green-500/20">
                      <a
                        href={alert.event_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-bold text-sm text-[var(--background)] transition-opacity hover:opacity-90"
                        style={{ background: "#F5C842" }}
                      >
                        🎪 Book This Event →
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <p className="text-center text-xs text-muted-foreground mt-1">Opens Disney event page · Availability may close quickly</p>
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
                      <th className="text-left px-4 py-3 text-xs font-semibold text-primary">Event</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-primary hidden sm:table-cell">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-primary hidden md:table-cell">Party</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-primary">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastAlerts.map((alert, i) => (
                      <tr key={alert.id} className={i < pastAlerts.length - 1 ? "border-b border-white/5" : ""}>
                        <td className="px-4 py-3 text-foreground font-medium">{alert.event_name}</td>
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
