import { useState, useEffect } from "react";
import { Radio, MapPin, Clock, Users, Plus, X, Calendar, ChevronRight, Star } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

// Magic Pass Events (managed by Brandon/Clark)
const MAGIC_PASS_EVENTS = [
  {
    id: "lorcana-epcot-may",
    title: "Lorcana Card Trading Meetup",
    type: "trading",
    emoji: "🃏",
    park: "EPCOT",
    location: "CommuniCore Plaza",
    date: "May 20, 2026",
    time: "12:00 PM – 2:00 PM",
    description: "Bring your Lorcana decks and trades! Meet fellow Disney adults for an afternoon of trading and playing in the park. All experience levels welcome.",
    rsvpCount: 47,
    daysUntil: 43,
    badge: "Trading Event",
    badgeColor: "bg-purple-500/20 text-purple-400",
  },
  {
    id: "coaster-marathon-mk",
    title: "Space Mountain Ride Marathon",
    type: "challenge",
    emoji: "🎢",
    park: "Magic Kingdom",
    location: "Tomorrowland — Space Mountain",
    date: "June 7, 2026",
    time: "9:00 AM – 12:00 PM",
    description: "How many times can we ride Space Mountain in 3 hours? Join the challenge — we'll track group rides and crown the marathon champion. Lightning Lane strategies welcome.",
    rsvpCount: 31,
    daysUntil: 61,
    badge: "Ride Marathon",
    badgeColor: "bg-red-500/20 text-red-400",
  },
  {
    id: "dessert-trail-monorail",
    title: "Monorail Dessert Trail",
    type: "foodie",
    emoji: "🍰",
    park: "Magic Kingdom Resorts",
    location: "Monorail loop — Contemporary, Polynesian, Grand Floridian",
    date: "June 14, 2026",
    time: "6:00 PM – 9:00 PM",
    description: "Ride the resort monorail and hit dessert stops at the Contemporary, Polynesian, and Grand Floridian. We'll share our picks and vote on the best dessert of the night.",
    rsvpCount: 62,
    daysUntil: 68,
    badge: "Foodie Trail",
    badgeColor: "bg-yellow-500/20 text-yellow-400",
  },
  {
    id: "photo-sunset-epcot",
    title: "EPCOT Golden Hour Photo Walk",
    type: "photography",
    emoji: "📸",
    park: "EPCOT",
    location: "World Showcase — meet at France Pavilion",
    date: "June 21, 2026",
    time: "7:30 PM – 9:00 PM",
    description: "Join fellow Magic Pass photographers for the best golden hour shots in World Showcase. We'll hit France, Japan, Italy, and the lagoon for sunset reflections.",
    rsvpCount: 28,
    daysUntil: 75,
    badge: "Photo Walk",
    badgeColor: "bg-orange-500/20 text-orange-400",
  },
];

export default function MagicBeacon() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"beacons" | "events" | "my-beacon">("beacons");
  const [beacons, setBeacons] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<Set<string>>(new Set());

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

  // Demo beacons
  useEffect(() => {
    setBeacons([
      { id: "1", park: "Magic Kingdom", spot: "Space Mountain Entrance", vibe: "Love coasters, happy to ride together 🎢", passTier: "Incredi-Pass", groupSize: "solo", expiresIn: "42 min", isExpired: false },
      { id: "2", park: "Magic Kingdom", spot: "Fantasyland Carousel", vibe: "Family of Disney adults, first timers welcome 🏰", passTier: "Sorcerer Pass", groupSize: "small", expiresIn: "1h 18min", isExpired: false },
      { id: "3", park: "EPCOT", spot: "France Pavilion Bridge", vibe: "EPCOT food lover, let's chat 🍷", passTier: "Incredi-Pass", groupSize: "pair", expiresIn: "28 min", isExpired: false },
    ]);
  }, []);

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

  const rsvpEvent = (eventId: string) => {
    if (!session) { toast({ title: "Log in to RSVP", variant: "destructive" }); return; }
    setRsvps(prev => {
      const n = new Set(prev);
      if (n.has(eventId)) { n.delete(eventId); toast({ title: "RSVP removed" }); }
      else { n.add(eventId); toast({ title: "✅ You're going!" }); }
      return n;
    });
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
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 live-pulse" />
              <p className="text-xs font-semibold text-green-400">{beacons.length} active beacons nearby</p>
            </div>
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
                <p className="text-xs text-muted-foreground italic mb-2">"{b.vibe}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">{b.passTier}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">{groupSizeLabel[b.groupSize as keyof typeof groupSizeLabel] || b.groupSize}</span>
                  </div>
                  <button className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                    I'm heading over <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {beacons.length === 0 && (
              <div className="text-center py-8">
                <Radio className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No active beacons near you</p>
                <p className="text-xs text-muted-foreground mt-1">Start your own beacon to let other APs find you!</p>
              </div>
            )}
          </div>
        )}

        {/* MAGIC PASS EVENTS */}
        {activeTab === "events" && (
          <div className="space-y-4">
            <div className="rounded-xl p-3 border border-primary/20 bg-primary/5">
              <p className="text-xs font-bold text-primary mb-1">🎪 Magic Pass Community Events</p>
              <p className="text-xs text-muted-foreground">Official events organized by Magic Pass — free for all subscribers. RSVP to let others know you're coming!</p>
            </div>

            {MAGIC_PASS_EVENTS.map(event => {
              const going = rsvps.has(event.id);
              return (
                <div key={event.id} className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "#111827" }}>
                  <div className="px-4 py-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${event.badgeColor}`}>{event.badge}</span>
                        <p className="text-base font-black text-foreground mt-1">{event.emoji} {event.title}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-primary font-bold">{event.daysUntil} days</p>
                      </div>
                    </div>
                    <p className="text-xs text-primary mb-0.5">📍 {event.park} · {event.location}</p>
                    <p className="text-xs text-muted-foreground mb-0.5">📅 {event.date}</p>
                    <p className="text-xs text-muted-foreground mb-3">🕐 {event.time}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{event.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {event.rsvpCount + (going ? 1 : 0)} {going ? "members" : "members"} going
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
                  <p className="text-sm font-semibold text-foreground">{selectedSpot}</p>
                  <p className="text-xs text-primary">{selectedPark}</p>
                  {fineLocation && <p className="text-xs text-muted-foreground mt-1">📍 "{fineLocation}"</p>}
                  {selectedVibe && <p className="text-xs text-muted-foreground italic mt-1">"{selectedVibe}"</p>}
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
                  <p className="text-xs text-muted-foreground mb-4">Let other APs in the park know where you are. No personal info is shared — just your location and vibe.</p>

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

                  <button onClick={startBeacon} disabled={!selectedSpot}
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
