import { useState, useEffect, useCallback } from "react";
import { Bell, Mail, MessageSquare, X, ExternalLink, RefreshCw, Sparkles } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";

const POPULAR_EVENTS = [
  { name: "Savi's Workshop", url: "https://disneyworld.disney.go.com/experiences/hollywood-studios/savis-workshop-handbuilt-lightsabers/", category: "Experience" },
  { name: "Droid Depot", url: "https://disneyworld.disney.go.com/experiences/hollywood-studios/droid-depot/", category: "Experience" },
  { name: "Disney Villains After Hours", url: "https://disneyworld.disney.go.com/events/magic-kingdom/disney-villains-after-hours/", category: "After Hours" },
  { name: "Disney H2O Glow", url: "https://disneyworld.disney.go.com/events/typhoon-lagoon/h2o-glow/", category: "After Hours" },
  { name: "Ferrytale Fireworks Dessert Cruise", url: "https://disneyworld.disney.go.com/dining/contemporary-resort/ferrytale-fireworks-dessert-cruise/", category: "Dessert Party" },
  { name: "Star Wars Dessert Party", url: "https://disneyworld.disney.go.com/dining/hollywood-studios/star-wars-galactic-spectacular-dessert-party/", category: "Dessert Party" },
  { name: "EPCOT Fireworks Dessert Party", url: "https://disneyworld.disney.go.com/dining/epcot/harmonious-dessert-party/", category: "Dessert Party" },
  { name: "Bibbidi Bobbidi Boutique", url: "https://disneyworld.disney.go.com/events/magic-kingdom/bibbidi-bobbidi-boutique/", category: "Experience" },
];

const timePreferences = ["Any", "Morning", "Afternoon", "Evening"];

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
  const [eventName, setEventName] = useState("");
  const [eventUrl, setEventUrl] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [dateOpen, setDateOpen] = useState(false);
  const [partySize, setPartySize] = useState(2);
  const [preferredTime, setPreferredTime] = useState("Any");
  const [alertEmail, setAlertEmail] = useState(true);
  const [alertSms, setAlertSms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showQuickPicks, setShowQuickPicks] = useState(true);

  // Data state
  const [alerts, setAlerts] = useState<EventAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const getAuthHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
    "x-client-authorization": `Bearer ${session?.access_token}`,
    "apikey": SUPABASE_ANON_KEY,
  }), [session]);

  // Load user's event alerts
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

  const selectQuickPick = (event: typeof POPULAR_EVENTS[0]) => {
    setEventName(event.name);
    setEventUrl(event.url);
    setShowQuickPicks(false);
  };

  const handleCreateAlert = async () => {
    if (!eventName.trim()) { toast({ title: "Please enter an event name", variant: "destructive" }); return; }
    if (!eventUrl.trim()) { toast({ title: "Please enter the event URL", variant: "destructive" }); return; }
    if (!date) { toast({ title: "Please select a date", variant: "destructive" }); return; }
    if (!session) { toast({ title: "Please log in", variant: "destructive" }); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/event-alerts?action=create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          event_name: eventName.trim(),
          event_url: eventUrl.trim(),
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
        description: `Watching ${eventName} for ${format(date, "MMM d, yyyy")}${data.alert?.priority_launch ? " — Midnight Launch mode active!" : ""}`,
      });
      setEventName("");
      setEventUrl("");
      setDate(undefined);
      setShowQuickPicks(true);
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
      case "expired":
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted/30 text-muted-foreground">⏰ Expired</span>;
      case "cancelled":
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400">❌ Cancelled</span>;
      default:
        return <span className="text-xs text-muted-foreground">{alert.status}</span>;
    }
  };

  const activeAlerts = alerts.filter(a => a.status === "watching" || a.status === "found");
  const pastAlerts = alerts.filter(a => a.status === "expired" || a.status === "cancelled");

  return (
    <DashboardLayout
      title="🎪 Enchanting Extras"
      subtitle="Monitor events like Droid Depot, Dessert Parties & more — we alert you instantly"
    >
      <div className="space-y-6">

        {/* ── SET A NEW EVENT ALERT ──────────────────────────── */}
        <div className="rounded-xl border p-5 md:p-6" style={{ background: "var(--card)", borderColor: "rgba(245,200,66,0.3)", borderTopWidth: 3, borderTopColor: "#F5C842" }}>
          <h2 className="text-base font-bold text-foreground mb-4">🔔 Set a New Event Alert</h2>

          {/* Quick Picks */}
          {showQuickPicks && (
            <div className="mb-4">
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">Quick Picks</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {POPULAR_EVENTS.map(ev => (
                  <button
                    key={ev.name}
                    onClick={() => selectQuickPick(ev)}
                    className="flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg bg-muted/20 border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                    style={{ minHeight: 48 }}
                  >
                    <span className="text-xs font-semibold text-foreground leading-tight">{ev.name}</span>
                    <span className="text-[10px] text-muted-foreground">{ev.category}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Name */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Event Name</label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="e.g. Droid Depot, Savi's Workshop, Dessert Party..."
                  value={eventName}
                  onChange={e => { setEventName(e.target.value); setShowQuickPicks(false); }}
                  onFocus={() => { if (!eventName) setShowQuickPicks(true); }}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#1a2235] border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  style={{ minHeight: 44 }}
                />
              </div>
            </div>

            {/* Event URL */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Disney Event URL</label>
              <input
                type="url"
                placeholder="https://disneyworld.disney.go.com/..."
                value={eventUrl}
                onChange={e => setEventUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[#1a2235] border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                style={{ minHeight: 44 }}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Paste the full Disney event/experience page URL</p>
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
            disabled={submitting || !eventName.trim() || !eventUrl.trim() || !date}
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
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No active event alerts</p>
              <p className="text-xs text-muted-foreground">Pick an event above and we'll watch 24/7 for availability</p>
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
                    <button
                      onClick={() => handleCancelAlert(alert.id, alert.event_name)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
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
