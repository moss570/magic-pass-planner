import { useState, useEffect } from "react";
import { Radio, MapPin, Clock, Users, Plus, X, Calendar, Star, Navigation } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CompassModal from "@/components/CompassModal";

const PARKS = ["Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom", "Typhoon Lagoon", "Blizzard Beach"];

const MK_SPOTS = ["Main Gate / Town Square", "Cinderella Castle Steps", "Space Mountain Entrance", "Tomorrowland Terrace", "Fantasyland Carousel", "Big Thunder Mountain Entrance", "Haunted Mansion Queue", "Pirates Entrance", "Adventureland Bridge", "Tiana's Bayou Entrance", "Crystal Palace Front"];
const EPCOT_SPOTS = ["Spaceship Earth", "World Showcase Plaza", "France Pavilion Bridge", "Japan Pavilion", "Canada Pavilion", "Test Track Queue", "Guardians Queue", "Sunshine Seasons"];
const HS_SPOTS = ["Hollywood Blvd Entrance", "Chinese Theater", "Galaxy's Edge Entrance", "Slinky Dog Dash Queue", "Tower of Terror Entrance", "Echo Lake"];
const AK_SPOTS = ["Main Entrance / Oasis", "Tree of Life", "Pandora Bridge", "Africa - Harambe", "Asia - Expedition Everest Queue", "Discovery Island"];

const QUEUE_MAP: Record<string, string[]> = {
  "Magic Kingdom": MK_SPOTS,
  "EPCOT": EPCOT_SPOTS,
  "Hollywood Studios": HS_SPOTS,
  "Animal Kingdom": AK_SPOTS,
  "Typhoon Lagoon": ["Main Entrance", "Crush 'n' Gusher Queue", "Wave Pool Shore"],
  "Blizzard Beach": ["Main Entrance", "Summit Plummet Queue", "Melt-Away Bay Shore"],
};

// GPS coordinates for meeting spots
const SPOT_COORDS: Record<string, { lat: number; lng: number }> = {
  "Main Gate / Town Square": { lat: 28.4167, lng: -81.5812 },
  "Cinderella Castle Steps": { lat: 28.4195, lng: -81.5812 },
  "Space Mountain Entrance": { lat: 28.4210, lng: -81.5778 },
  "Tomorrowland Terrace": { lat: 28.4203, lng: -81.5790 },
  "Fantasyland Carousel": { lat: 28.4205, lng: -81.5815 },
  "Big Thunder Mountain Entrance": { lat: 28.4199, lng: -81.5845 },
  "Haunted Mansion Queue": { lat: 28.4209, lng: -81.5830 },
  "Pirates Entrance": { lat: 28.4186, lng: -81.5838 },
  "Adventureland Bridge": { lat: 28.4183, lng: -81.5828 },
  "Tiana's Bayou Entrance": { lat: 28.4192, lng: -81.5850 },
  "Crystal Palace Front": { lat: 28.4187, lng: -81.5810 },
  "Spaceship Earth": { lat: 28.3747, lng: -81.5494 },
  "World Showcase Plaza": { lat: 28.3710, lng: -81.5494 },
  "France Pavilion Bridge": { lat: 28.3688, lng: -81.5530 },
  "Japan Pavilion": { lat: 28.3695, lng: -81.5535 },
  "Canada Pavilion": { lat: 28.3700, lng: -81.5460 },
  "Test Track Queue": { lat: 28.3735, lng: -81.5475 },
  "Guardians Queue": { lat: 28.3740, lng: -81.5510 },
  "Sunshine Seasons": { lat: 28.3738, lng: -81.5502 },
  "Hollywood Blvd Entrance": { lat: 28.3576, lng: -81.5593 },
  "Chinese Theater": { lat: 28.3549, lng: -81.5588 },
  "Galaxy's Edge Entrance": { lat: 28.3535, lng: -81.5620 },
  "Slinky Dog Dash Queue": { lat: 28.3555, lng: -81.5618 },
  "Tower of Terror Entrance": { lat: 28.3595, lng: -81.5605 },
  "Echo Lake": { lat: 28.3565, lng: -81.5580 },
  "Main Entrance / Oasis": { lat: 28.3553, lng: -81.5901 },
  "Tree of Life": { lat: 28.3571, lng: -81.5904 },
  "Pandora Bridge": { lat: 28.3558, lng: -81.5930 },
  "Africa - Harambe": { lat: 28.3590, lng: -81.5920 },
  "Asia - Expedition Everest Queue": { lat: 28.3580, lng: -81.5880 },
  "Discovery Island": { lat: 28.3575, lng: -81.5900 },
};

const VIBE_OPTIONS = [
  "Love coasters, happy to ride together 🎢",
  "Solo AP, say hi! 👋",
  "Family with kids, friendly vibes 👨‍👩‍👧",
  "EPCOT food lover, let's chat 🍷",
  "Annual Passholder, park days are my thing 🎟️",
  "Disney adult, here for the magic ✨",
  "First time in a while, excited! 🏰",
  "Photography enthusiast 📸",
];

// Events are now loaded from the database (beacon_events table)

export default function MagicBeacon() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"beacons" | "events" | "my-beacon">("beacons");
  const [beacons, setBeacons] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<Set<string>>(new Set());
  const [dbEvents, setDbEvents] = useState<any[]>([]);
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});

  // My beacon state
  const [myBeaconActive, setMyBeaconActive] = useState(false);
  const [beaconTitle, setBeaconTitle] = useState("");
  const [selectedPark, setSelectedPark] = useState("Magic Kingdom");
  const [selectedSpot, setSelectedSpot] = useState("");
  const [fineLocation, setFineLocation] = useState("");
  const [selectedVibe, setSelectedVibe] = useState("");
  const [beaconActivity, setBeaconActivity] = useState("");
  const [customActivity, setCustomActivity] = useState("");
  const [groupSize, setGroupSize] = useState<"solo" | "pair" | "small" | "large">("solo");
  const [duration, setDuration] = useState<"30" | "60" | "120" | "close">("60");
  const [beaconExpiry, setBeaconExpiry] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [compassTarget, setCompassTarget] = useState<{ spot: string; park: string } | null>(null);

  const BEACON_ACTIVITIES = [
    "Speed Walking Group",
    "Lorcana Cards Trading",
    "Pin Trading",
    "Just Resting",
    "Meeting New Friends",
    "Custom",
  ];

  // GPS location
  const [gpsLocation, setGpsLocation] = useState<{lat: number; lng: number} | null>(null);
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(pos => setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!beaconExpiry) return;
    const interval = setInterval(() => {
      const remaining = beaconExpiry.getTime() - Date.now();
      if (remaining <= 0) { setMyBeaconActive(false); setBeaconExpiry(null); setTimeLeft(""); clearInterval(interval); return; }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [beaconExpiry]);

  // Load events from DB
  const loadEvents = async () => {
    const { data: events } = await (supabase.from("beacon_events" as any).select("*") as any).eq("is_active", true).order("created_at");
    setDbEvents(events || []);
    // Load RSVP counts
    const counts: Record<string, number> = {};
    for (const evt of (events || [])) {
      const { count } = await (supabase.from("beacon_rsvps" as any).select("*", { count: "exact", head: true }) as any).eq("event_id", evt.id);
      counts[evt.id] = count || 0;
    }
    setRsvpCounts(counts);
    // Load user's own RSVPs
    if (session?.user?.id) {
      const { data: myRsvps } = await (supabase.from("beacon_rsvps" as any).select("event_id") as any).eq("user_id", session.user.id);
      setRsvps(new Set((myRsvps || []).map((r: any) => r.event_id)));
    }
  };
  useEffect(() => { loadEvents(); }, [session]);

  // Live beacons — start empty (will be populated from DB when backend is wired)

  // Haversine helper for walk time
  const calcDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const headingOver = (beacon: any) => {
    toast({ title: "📡 On my way!", description: `The beacon host has been notified you're heading to ${beacon.spot}` });
    setCompassTarget({ spot: beacon.spot, park: beacon.park });
  };

  const startBeacon = () => {
    if (!beaconTitle.trim()) { toast({ title: "Enter a beacon title", variant: "destructive" }); return; }
    if (!selectedSpot) { toast({ title: "Select a meeting spot", variant: "destructive" }); return; }
    if (!beaconActivity) { toast({ title: "Select a beacon activity", variant: "destructive" }); return; }
    const durationMs = duration === "close" ? 8 * 3600000 : parseInt(duration) * 60000;
    setBeaconExpiry(new Date(Date.now() + durationMs));
    setMyBeaconActive(true);
    const activityLabel = beaconActivity === "Custom" ? customActivity : beaconActivity;
    toast({ title: "📡 Beacon is live!", description: `"${beaconTitle}" — ${activityLabel} · Shared with all APs in ${selectedPark}` });
  };

  const stopBeacon = () => {
    setMyBeaconActive(false);
    setBeaconExpiry(null);
    setTimeLeft("");
    toast({ title: "Beacon stopped" });
  };

  const rsvpEvent = async (eventId: string) => {
    if (!session) { toast({ title: "Log in to RSVP", variant: "destructive" }); return; }
    const userId = session.user.id;
    const isGoing = rsvps.has(eventId);
    if (isGoing) {
      await (supabase.from("beacon_rsvps" as any).delete() as any).eq("event_id", eventId).eq("user_id", userId);
      setRsvps(prev => { const n = new Set(prev); n.delete(eventId); return n; });
      setRsvpCounts(prev => ({ ...prev, [eventId]: Math.max(0, (prev[eventId] || 1) - 1) }));
      toast({ title: "RSVP removed" });
    } else {
      await (supabase.from("beacon_rsvps" as any).insert({ event_id: eventId, user_id: userId }) as any);
      setRsvps(prev => new Set(prev).add(eventId));
      setRsvpCounts(prev => ({ ...prev, [eventId]: (prev[eventId] || 0) + 1 }));
      toast({ title: "✅ You're going!" });
    }
  };

  const groupSizeLabel = { solo: "Solo AP", pair: "With a partner", small: "Small group (3-4)", large: "Large group (5+)" };

  return (
    <DashboardLayout title="🏰 Magic Beacon" subtitle="Meet fellow Annual Passholders & join Magic Pass community events">
      <div className="space-y-5">

        {/* AP-Only badge */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/20 bg-primary/5">
          <Star className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold text-foreground">Annual Passholder Feature — AP Command Center required</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "#111827" }}>
          {[
            { id: "beacons", label: "📡 Live Beacons" },
            { id: "events", label: "🎪 Events" },
            { id: "my-beacon", label: "🏰 My Beacon" },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all ${activeTab === t.id ? "bg-primary text-[#080E1E]" : "text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* LIVE BEACONS */}
        {activeTab === "beacons" && (
          <div className="space-y-3">
            {beacons.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 live-pulse" />
                <p className="text-xs font-semibold text-green-400">{beacons.length} active beacon{beacons.length !== 1 ? "s" : ""} nearby</p>
              </div>
            )}
            {beacons.map(b => (
              <div key={b.id} className="rounded-xl p-4 border border-white/8" style={{ background: "#111827" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs font-bold text-primary">{b.park}</p>
                    <p className="text-sm font-bold text-foreground">{b.spot}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Expires in</p>
                    <p className="text-xs font-bold text-yellow-400">{b.expiresIn}</p>
                  </div>
                </div>
                {b.activity && <p className="text-xs text-primary mb-1">🎯 {b.activity}</p>}
                <p className="text-xs text-muted-foreground italic mb-2">"{b.vibe}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">{b.passTier}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">{groupSizeLabel[b.groupSize as keyof typeof groupSizeLabel] || b.groupSize}</span>
                  </div>
                  <button onClick={() => headingOver(b)}
                    className="text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors">
                    <Navigation className="w-3 h-3" /> I'm heading over
                  </button>
                </div>
              </div>
            ))}
            {beacons.length === 0 && (
              <div className="text-center py-12">
                <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-base font-bold text-foreground mb-2">No Beacons currently live now</p>
                <p className="text-sm text-muted-foreground mb-5">Start a Beacon and meet a new friend.</p>
                <button onClick={() => setActiveTab("my-beacon")}
                  className="px-6 py-3 rounded-xl font-bold text-sm text-[#080E1E]" style={{ background: "#F5C842" }}>
                  🏰 Start My Beacon
                </button>
              </div>
            )}
          </div>
        )}

        {/* Compass Modal for navigation */}
        {compassTarget && SPOT_COORDS[compassTarget.spot] && (
          <CompassModal
            open={!!compassTarget}
            onClose={() => setCompassTarget(null)}
            destination={compassTarget.spot}
            land={compassTarget.park}
            walkTime={gpsLocation && SPOT_COORDS[compassTarget.spot]
              ? `${Math.max(1, Math.round(calcDistance(gpsLocation.lat, gpsLocation.lng, SPOT_COORDS[compassTarget.spot].lat, SPOT_COORDS[compassTarget.spot].lng) / 80))} min`
              : "5 min"}
            distance={gpsLocation && SPOT_COORDS[compassTarget.spot]
              ? (() => { const m = calcDistance(gpsLocation.lat, gpsLocation.lng, SPOT_COORDS[compassTarget.spot].lat, SPOT_COORDS[compassTarget.spot].lng); const ft = m * 3.28084; return ft > 5280 ? `${(ft / 5280).toFixed(1)} miles` : `${Math.round(ft)} ft`; })()
              : "nearby"}
            directions={["Follow park signage toward " + compassTarget.spot]}
          />
        )}

        {/* MAGIC PASS EVENTS */}
        {activeTab === "events" && (
          <div className="space-y-4">
            <div className="rounded-xl p-3 border border-primary/20 bg-primary/5">
              <p className="text-xs font-bold text-primary mb-1">🎪 Magic Pass Community Events</p>
              <p className="text-xs text-muted-foreground">Official events organized by Magic Pass — free for all subscribers. RSVP to let others know you're coming!</p>
            </div>

            {dbEvents.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-foreground font-semibold">No upcoming events yet</p>
                <p className="text-xs text-muted-foreground mt-1">Check back soon for community meetups!</p>
              </div>
            )}

            {dbEvents.map(event => {
              const going = rsvps.has(event.id);
              const count = rsvpCounts[event.id] || 0;
              return (
                <div key={event.id} className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "#111827" }}>
                  <div className="px-4 py-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${event.badge_color}`}>{event.badge}</span>
                        <p className="text-base font-black text-foreground mt-1">{event.emoji} {event.title}</p>
                      </div>
                    </div>
                    <p className="text-xs text-primary mb-0.5">📍 {event.park} · {event.location}</p>
                    <p className="text-xs text-muted-foreground mb-0.5">📅 {event.event_date}</p>
                    <p className="text-xs text-muted-foreground mb-3">🕐 {event.event_time}</p>
                    {event.description && <p className="text-xs text-muted-foreground leading-relaxed mb-3">{event.description}</p>}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {count} member{count !== 1 ? "s" : ""} going
                        {going && " (including you! ✅)"}
                      </p>
                      <button onClick={() => rsvpEvent(event.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${going ? "bg-green-500/20 text-green-400 border border-green-500/30" : "text-[#080E1E]"}`}
                        style={!going ? { background: "#F5C842" } : {}}>
                        {going ? "✅ I'm Going!" : "RSVP →"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Suggest an event */}
            <div className="rounded-xl p-5 border border-white/10" style={{ background: "#111827" }}>
              <p className="text-sm font-bold text-foreground mb-1">🙋 Suggest a Community Event</p>
              <p className="text-xs text-muted-foreground mb-3">Have an idea for a meetup? Submit it and we'll consider scheduling it!</p>
              <textarea rows={3} placeholder="Describe your event idea (e.g. EPCOT Food & Wine progressive dinner starting at Morocco pavilion...)"
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40 resize-none mb-3"
                style={{ background: "#0D1230" }} />
              <button onClick={() => toast({ title: "Thanks! We'll review your idea." })}
                className="w-full py-2.5 rounded-xl font-bold text-sm text-[#080E1E]" style={{ background: "#F5C842" }}>
                Submit Idea →
              </button>
            </div>
          </div>
        )}

        {/* MY BEACON */}
        {activeTab === "my-beacon" && (
          <div className="space-y-4">
            {myBeaconActive ? (
              /* Active beacon display */
              <div className="space-y-4">
                <div className="rounded-xl p-5 border border-green-500/30 bg-green-500/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full bg-green-400 live-pulse" />
                    <p className="text-sm font-bold text-green-400">📡 Your beacon is LIVE</p>
                    {timeLeft && <span className="text-xs text-muted-foreground ml-auto">Expires in {timeLeft}</span>}
                  </div>
                  <p className="text-base font-black text-foreground">{beaconTitle}</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{selectedSpot}</p>
                  <p className="text-xs text-primary">{selectedPark}</p>
                  {fineLocation && <p className="text-xs text-muted-foreground mt-1">📍 "{fineLocation}"</p>}
                  <p className="text-xs text-muted-foreground mt-1">🎯 {beaconActivity === "Custom" ? customActivity : beaconActivity}</p>
                  {selectedVibe && <p className="text-xs text-muted-foreground italic mt-1">"{selectedVibe}"</p>}
                  <div className="mt-3 p-2 rounded-lg border border-primary/20 bg-primary/5">
                    <p className="text-xs text-primary font-semibold">📢 Beacon shared with all APs in {selectedPark} · Visible on Social Feed</p>
                  </div>
                </div>
                <button onClick={stopBeacon}
                  className="w-full py-3 rounded-xl font-bold text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors">
                  Stop My Beacon
                </button>
              </div>
            ) : (
              /* Beacon creation form */
              <div className="space-y-4">
                <div className="rounded-xl p-4 border border-white/8" style={{ background: "#111827" }}>
                  <p className="text-xs font-bold text-foreground mb-3">🏰 Start Your Magic Beacon</p>
                  <p className="text-xs text-muted-foreground mb-4">Let other APs in the park know where you are. Your beacon will be shared with all passholders in the same park and posted to the Social Feed.</p>

                  {/* Beacon Title */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Beacon Title *</label>
                    <input value={beaconTitle} onChange={e => setBeaconTitle(e.target.value)} maxLength={60}
                      placeholder="e.g. Pin Trading at Frontierland!"
                      className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                      style={{ background: "#0D1230", minHeight: 44 }} />
                  </div>

                  {/* Park */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Which park?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {PARKS.map(p => (
                        <button key={p} onClick={() => { setSelectedPark(p); setSelectedSpot(""); }}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${selectedPark === p ? "bg-primary text-[#080E1E] border-primary" : "border-white/10 text-muted-foreground"}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spot */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Meeting spot *</label>
                    <select value={selectedSpot} onChange={e => setSelectedSpot(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                      style={{ background: "#0D1230", minHeight: 44 }}>
                      <option value="">Select a landmark...</option>
                      {(QUEUE_MAP[selectedPark] || []).map(spot => <option key={spot} value={spot}>{spot}</option>)}
                    </select>
                  </div>

                  {/* Fine location */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Fine location detail (optional)</label>
                    <input value={fineLocation} onChange={e => setFineLocation(e.target.value)} maxLength={80}
                      placeholder="e.g. Third bench on the left, wearing a Haunted Mansion shirt"
                      className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                      style={{ background: "#0D1230", minHeight: 44 }} />
                    <p className="text-xs text-muted-foreground mt-1">Helps people find you beyond GPS accuracy</p>
                  </div>

                  {/* Group size */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">I am:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(groupSizeLabel) as [string, string][]).map(([val, label]) => (
                        <button key={val} onClick={() => setGroupSize(val as any)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all text-left ${groupSize === val ? "bg-primary/15 border-primary/50 text-primary" : "border-white/10 text-muted-foreground"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Beacon Activity */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Beacon Activity *</label>
                    <select value={beaconActivity} onChange={e => { setBeaconActivity(e.target.value); if (e.target.value !== "Custom") setCustomActivity(""); }}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                      style={{ background: "#0D1230", minHeight: 44 }}>
                      <option value="">Select an activity...</option>
                      {BEACON_ACTIVITIES.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    {beaconActivity === "Custom" && (
                      <input value={customActivity} onChange={e => setCustomActivity(e.target.value)} maxLength={60}
                        placeholder="Describe your activity..."
                        className="w-full mt-2 px-3 py-2.5 rounded-xl border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                        style={{ background: "#0D1230", minHeight: 44 }} />
                    )}
                  </div>

                  {/* Vibe */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Vibe note (optional)</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {VIBE_OPTIONS.map(v => (
                        <button key={v} onClick={() => setSelectedVibe(selectedVibe === v ? "" : v)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedVibe === v ? "bg-secondary/20 border-secondary/50 text-secondary" : "border-white/10 text-muted-foreground"}`}>
                          {v.split(",")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">How long will you be there?</label>
                    <div className="flex gap-2">
                      {[{v:"30", l:"30 min"}, {v:"60", l:"1 hour"}, {v:"120", l:"2 hours"}, {v:"close", l:"Until park close"}].map(d => (
                        <button key={d.v} onClick={() => setDuration(d.v as any)}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${duration === d.v ? "bg-primary text-[#080E1E] border-primary" : "border-white/10 text-muted-foreground"}`}>
                          {d.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg p-3 mb-4 border border-white/8 bg-white/3">
                    <p className="text-xs text-muted-foreground">🔒 <strong className="text-foreground">Privacy:</strong> Other Magic Pass members only see your park, meeting spot, pass tier, vibe, and group size. Your name, email, and personal info are never shared. You can stop your beacon at any time.</p>
                  </div>

                  <button onClick={startBeacon} disabled={!selectedSpot || !beaconTitle.trim() || !beaconActivity || (beaconActivity === "Custom" && !customActivity.trim())}
                    className="w-full py-4 rounded-2xl font-black text-base text-[#080E1E] disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: "#F5C842" }}>
                    <Radio className="w-5 h-5" /> Start My Beacon
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
