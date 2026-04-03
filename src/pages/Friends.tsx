import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { MessageSquare, Plus, Send, Search, X, Copy, Mail, MapPin, Calendar, Castle, RefreshCw } from "lucide-react";
import CompassButton from "@/components/CompassButton";

const beaconParks = ["MK", "EPCOT", "HS", "AK", "Typhoon Lagoon", "Blizzard Beach"];
const beaconDurations = ["30 min", "1 hour", "2 hours", "Until park close"];
const beaconGroupTypes = ["Solo", "With a partner", "Small group", "Large group"];

const activeBeacons = [
  { pass: "Incredi-Pass", spot: "Tomorrowland — near Space Mountain", fineSpot: "Third bench on the left, wearing a Haunted Mansion shirt 👻", expires: "42 min", group: "Solo AP", vibe: "Love coasters, happy to ride Tron together 🎢", color: "bg-amber-600" },
  { pass: "Sorcerer Pass", spot: "Fantasyland — near Carousel", fineSpot: "", expires: "1h 18min", group: "Small group (3)", vibe: "Family of Disney adults, first timers welcome 🏰", color: "bg-violet-600" },
  { pass: "Incredi-Pass", spot: "Tomorrowland — near Tomorrowland Terrace", fineSpot: "By the blue trash can near the railing ☕", expires: "28 min", group: "With a partner", vibe: "EPCOT regulars doing MK today, say hi! ☕", color: "bg-sky-600" },
];

const friends = [
  { initials: "MR", name: "Mike R.", pass: "Incredi-Pass", online: true, location: "At Hollywood Studios today", home: "Hollywood Studios", color: "bg-teal-500" },
  { initials: "JL", name: "Jess L.", pass: "Sorcerer Pass", online: true, location: "At Magic Kingdom today", home: "Magic Kingdom", color: "bg-purple-500" },
  { initials: "DT", name: "Dave T.", pass: "Incredi-Pass", online: false, location: "Last seen 2 days ago", home: "EPCOT", color: "bg-blue-500" },
  { initials: "KM", name: "Karen M.", pass: "Incredi-Pass", online: false, location: "Last seen 5 days ago", home: "Animal Kingdom", color: "bg-rose-500" },
];

const threads = [
  { initials: "MR", name: "Mike R.", preview: "Are you going to HS on Thursday? I have...", time: "2 min ago", unread: true, color: "bg-teal-500" },
  { initials: "JL", name: "Jess L.", preview: "I got the Be Our Guest alert! Did you...", time: "1h ago", unread: false, color: "bg-purple-500" },
  { initials: "DT", name: "Dave T.", preview: "EPCOT Food & Wine starts next week 🎉", time: "2 days ago", unread: false, color: "bg-blue-500" },
];

const parks = ["MK", "EPCOT", "HS", "AK"];

const upcomingEvents = [
  {
    badge: "🃏 Trading Event", badgeColor: "bg-purple-500/20 text-purple-400",
    title: "Lorcana Card Trading Meetup",
    park: "EPCOT · CommuniCore Plaza",
    date: "May 20, 2026 · 12:00 PM – 2:00 PM",
    description: "Bring your Lorcana decks and trades! Meet fellow Disney adults for an afternoon of trading and playing in the park. All experience levels welcome.",
    rsvp: 47, countdown: "Starts in 17 days",
  },
  {
    badge: "🎢 Ride Marathon", badgeColor: "bg-red-500/20 text-red-400",
    title: "Space Mountain Ride Marathon",
    park: "Magic Kingdom · Tomorrowland",
    date: "June 7, 2026 · 9:00 AM – 12:00 PM",
    description: "How many times can we ride Space Mountain in 3 hours? Join the challenge — we'll track group rides and crown the marathon champion. Lightning Lane strategies welcome.",
    rsvp: 31, countdown: "Starts in 35 days",
  },
  {
    badge: "🍰 Foodie Trail", badgeColor: "bg-primary/20 text-primary",
    title: "Monorail Dessert Trail",
    park: "Magic Kingdom Resort Loop · Monorail",
    date: "June 14, 2026 · 6:00 PM – 9:00 PM",
    description: "Ride the resort monorail and hit dessert stops at the Contemporary, Polynesian, and Grand Floridian. We'll share our picks and vote on the best dessert of the night.",
    rsvp: 62, countdown: "Starts in 42 days",
  },
];

const pastEvents = [
  { title: "Pin Trading Meet-Up", park: "EPCOT", date: "Mar 15, 2026", attended: 38 },
  { title: "Haunted Mansion After-Dark Walk", park: "Magic Kingdom", date: "Feb 28, 2026", attended: 25 },
  { title: "EPCOT International Festival of the Arts Social", park: "EPCOT", date: "Jan 22, 2026", attended: 54 },
];

const Friends = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedPark, setSelectedPark] = useState("MK");
  const [inviteFriends, setInviteFriends] = useState<string[]>([]);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(true);
  const [beaconPark, setBeaconPark] = useState("MK");
  const [beaconDuration, setBeaconDuration] = useState("1 hour");
  const [beaconVibe, setBeaconVibe] = useState("");
  const [beaconGroup, setBeaconGroup] = useState("Solo");
  const [fineLocation, setFineLocation] = useState("");
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [pastEventsOpen, setPastEventsOpen] = useState(false);
  const [eventIdea, setEventIdea] = useState("");

  const toggleInviteFriend = (name: string) => {
    setInviteFriends(prev => prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]);
  };

  const gpsLocations: Record<string, string> = {
    MK: "Tomorrowland — near Space Mountain",
    EPCOT: "World Showcase — near Japan Pavilion",
    HS: "Toy Story Land — near Slinky Dog Dash",
    AK: "Pandora — near Flight of Passage",
    "Typhoon Lagoon": "Main Entrance — near Surf Pool",
    "Blizzard Beach": "Summit Area — near Summit Plummet",
  };

  return (
    <DashboardLayout title="👥 Magic Pass Friends" subtitle="Connect with other Annual Passholders — coordinate park days, share dining alerts, plan together">

      {/* SECTION 1: My Friends */}
      <Card className="border-primary/20 bg-card/80 mb-6">
        <CardHeader className="p-4 md:p-6 flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base md:text-lg">Your Magic Pass Friends (4)</CardTitle>
            <CardDescription className="text-xs mt-1">Annual Passholders and Disney regulars in your network</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 text-xs shrink-0" onClick={() => setSearchOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Friend
          </Button>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {friends.map(f => (
              <div key={f.initials} className="rounded-xl border border-primary/10 bg-[#0D1230]/60 p-4 flex flex-col items-center text-center gap-2">
                <div className={`w-12 h-12 rounded-full ${f.color} flex items-center justify-center text-white font-bold text-sm`}>{f.initials}</div>
                <span className="text-sm font-bold text-foreground">{f.name}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">{f.pass}</span>
                <div className="flex items-center gap-1.5 text-xs">
                  {f.online ? (
                    <><span className="w-2 h-2 rounded-full bg-green-400 live-pulse" /><span className="text-green-400">{f.location}</span></>
                  ) : (
                    <><span className="w-2 h-2 rounded-full bg-muted-foreground" /><span className="text-muted-foreground">{f.location}</span></>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">Home park: {f.home}</span>
                <div className="flex gap-2 mt-1 w-full">
                  <Button variant="outline" size="sm" className="flex-1 border-primary/30 text-primary hover:bg-primary/10 text-[11px] h-8">💬 Message</Button>
                  <Button size="sm" className="flex-1 text-[11px] h-8">🎢 Plan a Day</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Who's at the Parks Today */}
      <Card className="border-primary/40 bg-card/80 mb-6">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">🏰 Who's at the Parks Today?</CardTitle>
          <CardDescription className="text-xs mt-1">Friends checked in at Walt Disney World right now</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Mike */}
            <div className="rounded-xl border border-primary/10 bg-[#0D1230]/60 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-xs">MR</div>
                <div>
                  <p className="text-sm font-bold text-foreground">Mike R. is at Hollywood Studios</p>
                  <p className="text-xs text-muted-foreground">Checked in 42 min ago · Sorcerer Pass</p>
                </div>
              </div>
              <p className="text-xs text-foreground/80">🎢 Riding Slinky Dog Dash next</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 text-xs">💬 Say Hi</Button>
                <Button size="sm" className="text-xs">📅 Join His Day</Button>
              </div>
            </div>
            {/* Jess */}
            <div className="rounded-xl border border-primary/10 bg-[#0D1230]/60 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs">JL</div>
                <div>
                  <p className="text-sm font-bold text-foreground">Jess L. is at Magic Kingdom</p>
                  <p className="text-xs text-muted-foreground">Checked in 1h 15min ago · Incredi-Pass</p>
                </div>
              </div>
              <p className="text-xs text-foreground/80">🍽️ Has a Be Our Guest alert active</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 text-xs">💬 Say Hi</Button>
                <Button size="sm" className="text-xs">📅 Join Her Day</Button>
              </div>
            </div>
          </div>
          <Button className="w-full mb-2">📍 Check Me In Today</Button>
          <p className="text-xs text-muted-foreground text-center">Let your friends know you're at the parks — they'll see your status and can join you</p>
        </CardContent>
      </Card>

      {/* AP MEETUP BEACON SECTION */}
      <Card className="relative mb-6 bg-card/80 overflow-hidden" style={{ border: '2px solid transparent', backgroundClip: 'padding-box', boxShadow: '0 0 20px 2px rgba(147, 51, 234, 0.15)' }}>
        {/* Purple gradient border overlay */}
        <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.4), rgba(192,132,252,0.2), rgba(147,51,234,0.4))', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude', WebkitMaskComposite: 'xor', padding: '2px', borderRadius: 'inherit' }} />
        {/* AP Exclusive badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary text-primary-foreground">AP Exclusive</span>
        </div>

        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">🏰 AP Meetup Beacon</CardTitle>
          <CardDescription className="text-xs mt-1">Meet fellow Annual Passholders in the park — no personal info shared until you both choose to connect</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 space-y-6">
          {/* TOP: Start Beacon + Active Beacons */}
          <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-5">
            {/* Start a Meetup */}
            <div className="rounded-xl bg-[#0D1230]/80 border border-primary/10 p-4 space-y-4">
              <p className="text-sm font-bold text-foreground">START A MEETUP</p>

              {/* Field 1: Park */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Which park are you in?</label>
                <div className="flex flex-wrap gap-2">
                  {beaconParks.map(p => (
                    <button key={p} onClick={() => setBeaconPark(p)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${beaconPark === p ? "bg-primary text-primary-foreground" : "border border-primary/20 text-muted-foreground hover:text-foreground"}`}>{p}</button>
                  ))}
                </div>
              </div>

              {/* Field 2: GPS Auto-Detect + Fine Location */}
              <div className="space-y-3">
                {/* Part A: GPS Auto-Detect */}
                {gpsEnabled ? (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Your location</label>
                    <div className="rounded-lg border border-primary/15 bg-[#0D1230]/60 px-3 py-2.5 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-xs text-muted-foreground shrink-0">Detected location:</span>
                      <span className="text-xs font-semibold text-primary flex-1 min-w-0 truncate">{gpsLocations[beaconPark]}</span>
                      <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0">
                        <RefreshCw className="w-3 h-3" /> Refresh
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">📍 Location detected via GPS · Updates automatically</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-3 py-2.5 flex items-center gap-2 flex-wrap">
                    <MapPin className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span className="text-xs text-yellow-400 flex-1">📍 Enable location access to auto-detect your spot</span>
                    <Button size="sm" variant="outline" className="text-xs h-7 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10" onClick={() => setGpsEnabled(true)}>
                      Enable GPS →
                    </Button>
                  </div>
                )}

                {/* Part B: Fine Location */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Exact spot (optional)</label>
                  <Input
                    value={fineLocation}
                    onChange={e => { if (e.target.value.length <= 80) setFineLocation(e.target.value); }}
                    placeholder="e.g. Third bench from the right · Near the lamp post · By the blue trash can"
                    className="bg-background/40 border-primary/10 text-sm h-9"
                  />
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[10px] text-muted-foreground">Help people find you with a specific detail GPS can't capture</p>
                    <p className="text-[10px] text-muted-foreground">{fineLocation.length}/80</p>
                  </div>
                </div>
              </div>

              {/* Field 3: Duration */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">How long will you be there?</label>
                <div className="flex flex-wrap gap-2">
                  {beaconDurations.map(d => (
                    <button key={d} onClick={() => setBeaconDuration(d)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${beaconDuration === d ? "bg-primary text-primary-foreground" : "border border-primary/20 text-muted-foreground hover:text-foreground"}`}>{d}</button>
                  ))}
                </div>
              </div>

              {/* Field 4: Vibe note */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Vibe note (optional)</label>
                <Input value={beaconVibe} onChange={e => { if (e.target.value.length <= 60) setBeaconVibe(e.target.value); }} placeholder="e.g. Solo AP, love coasters, happy to ride together 🎢" className="bg-background/40 border-primary/10 text-sm h-9" />
                <p className="text-[10px] text-muted-foreground text-right mt-0.5">{beaconVibe.length}/60</p>
              </div>

              {/* Field 5: Group type */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">I am:</label>
                <div className="flex flex-wrap gap-2">
                  {beaconGroupTypes.map(g => (
                    <button key={g} onClick={() => setBeaconGroup(g)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${beaconGroup === g ? "bg-primary text-primary-foreground" : "border border-primary/20 text-muted-foreground hover:text-foreground"}`}>{g}</button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground">🔒 Your name, photo, and contact info are never shared. Only your park, meeting spot, pass tier, and vibe note are visible to other AP users.</p>

              <Button className="w-full text-xs">📡 Start My Beacon</Button>
              <p className="text-[10px] text-muted-foreground text-center">Your beacon will automatically expire when your time limit ends. Cancel anytime.</p>
            </div>

            {/* Active Beacons */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-foreground">📡 Active Meetup Beacons — Magic Kingdom</p>
                <p className="text-xs text-muted-foreground mt-0.5">3 Annual Passholders hosting meetups right now</p>
              </div>
              {activeBeacons.map((b, i) => (
                <div key={i} className="rounded-xl border border-primary/10 bg-[#0D1230]/60 p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${b.color} flex items-center justify-center`}>
                      <Castle className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">{b.pass}</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-foreground">{b.spot}</p>
                  {b.fineSpot && (
                    <p className="text-xs italic text-primary/80">{b.fineSpot}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-primary font-semibold">Expires in {b.expires}</span>
                    <span className="text-muted-foreground">· {b.group}</span>
                  </div>
                  <p className="text-xs italic text-foreground/70">{b.vibe}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" className="text-xs h-7">👋 I'm Heading Over</Button>
                    <CompassButton destination={b.spot} context={`User-started beacon · Expires in ${b.expires}`} fineLocation={b.fineSpot || undefined} />
                    <button className="text-xs text-muted-foreground hover:text-foreground">❌ Not Interested</button>
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground text-center">Beacons refresh every 60 seconds · Only AP Command Center members can see and create beacons</p>
            </div>
          </div>

          {/* Post-Meetup Connect Prompt */}
          <div className="rounded-xl border-2 border-primary p-4 space-y-2 animate-pulse-subtle" style={{ boxShadow: '0 0 12px 2px hsla(var(--primary) / 0.25)' }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤝</span>
              <div>
                <p className="text-sm font-bold text-foreground">Did you meet up with the Incredi-Pass holder near Space Mountain?</p>
                <p className="text-xs text-muted-foreground">They marked the meetup as successful. Would you like to add them as a Magic Pass friend?</p>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-11">
              <Button size="sm" className="text-xs h-8">✅ Yes — Add as Friend</Button>
              <button className="text-xs text-muted-foreground hover:text-foreground">No thanks</button>
            </div>
            <p className="text-[10px] text-muted-foreground ml-11">Adding as a friend lets you message, coordinate park days, and share dining alerts. You can remove friends anytime.</p>
          </div>
        </CardContent>
      </Card>

      {/* MAGIC MEET-UP EVENTS SECTION */}
      {/*
        NOTIFICATION LOGIC (future backend):
        When a new event is created by admin, all Magic Pass users receive a push/email notification
        14 days before and again 24 hours before the event. AP Command Center users get early access
        RSVP 48 hours before general notification.
      */}
      <Card className="border-primary/20 bg-card/80 mb-6">
        <CardHeader className="p-4 md:p-6 relative">
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary text-primary-foreground">Hosted by Magic Pass</span>
          </div>
          <CardTitle className="text-base md:text-lg">🎪 Magic Meet-Up Events</CardTitle>
          <CardDescription className="text-xs mt-1">Official events planned by Magic Pass — open to all members. Join the community.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 space-y-6">
          {/* Upcoming Events */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingEvents.map((evt, i) => (
              <div key={i} className="rounded-xl border border-primary/10 bg-[#0D1230]/60 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${evt.badgeColor}`}>{evt.badge}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">{evt.countdown}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground leading-tight">{evt.title}</h3>
                <p className="text-xs font-semibold text-primary">{evt.park}</p>
                <p className="text-xs text-foreground">{evt.date}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{evt.description}</p>
                <p className="text-xs text-green-400">{evt.rsvp} members going</p>
                <div className="flex gap-2 mt-auto">
                  <Button size="sm" className="flex-1 text-xs h-8">✅ I'm Going!</Button>
                  <Button variant="outline" size="sm" className="flex-1 border-primary/30 text-primary hover:bg-primary/10 text-xs h-8">🔔 Remind Me</Button>
                </div>
                <div className="flex justify-center">
                  <CompassButton destination={evt.title} context={`Magic Pass Community Event · ${evt.date.split("·")[0].trim()}`} />
                </div>
                <p className="text-[10px] text-muted-foreground text-center">Free with any Magic Pass subscription</p>
              </div>
            ))}
          </div>

          {/* Past Events (collapsible) */}
          <Collapsible open={pastEventsOpen} onOpenChange={setPastEventsOpen}>
            <CollapsibleTrigger className="text-sm text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1">
              <span>{pastEventsOpen ? "▼" : "▶"}</span> View Past Events ({pastEvents.length})
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 mt-3">
                {pastEvents.map((evt, i) => (
                  <div key={i} className="rounded-lg border border-primary/10 bg-[#0D1230]/40 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-semibold text-foreground">{evt.title}</span>
                      <span className="text-xs text-muted-foreground">· {evt.park}</span>
                      <span className="text-xs text-muted-foreground">· {evt.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{evt.attended} members attended</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">✅ Completed</span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Host Your Own Event */}
          <div className="rounded-xl border-2 border-purple-500/30 bg-[#0D1230]/60 p-4 space-y-3">
            <p className="text-sm font-bold text-foreground">🙋 Suggest a Community Event</p>
            <p className="text-xs text-muted-foreground">Have an idea for a meetup? We review all suggestions — the best ones become official Magic Pass events.</p>
            <div className="space-y-3">
              <Textarea
                value={eventIdea}
                onChange={e => setEventIdea(e.target.value)}
                placeholder="e.g. EPCOT Food & Wine progressive dinner starting at Morocco pavilion..."
                className="bg-background/40 border-primary/10 text-sm min-h-[70px]"
              />
              <Input placeholder="Your name (optional)" className="bg-background/40 border-primary/10 text-sm h-9" />
              <Button className="text-xs">Submit Idea →</Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Clark reviews all submissions. Popular ideas get scheduled within 30 days.</p>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: Messages + Coordinate */}
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6 mb-6">
        {/* Messages */}
        <Card className="border-primary/20 bg-card/80">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">💬 Messages</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 space-y-2">
            {threads.map(t => (
              <div key={t.initials} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-[#1a2235] transition-colors ${t.unread ? "border-l-[3px] border-primary" : ""}`}>
                <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-xs shrink-0`}>{t.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{t.name}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{t.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{t.preview}</p>
                </div>
                {t.unread && <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />}
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-center pt-2">Tap a conversation to open it</p>
            <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10 text-xs" onClick={() => setComposeOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> New Message
            </Button>

            {/* Compose demo */}
            {composeOpen && (
              <div className="mt-3 rounded-xl border border-primary/20 bg-[#0D1230]/80 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">To: <span className="text-foreground font-semibold">Mike R.</span></span>
                  <button onClick={() => setComposeOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                </div>
                <Input placeholder="Hey, want to coordinate for Thursday?" className="bg-background/40 border-primary/10 text-sm h-9" />
                <div className="flex flex-wrap gap-2">
                  {["I'm going Thursday 👋", "Want to do dining together?", "What park are you hitting?"].map(s => (
                    <span key={s} className="text-[10px] px-2.5 py-1 rounded-full border border-primary/20 text-primary cursor-pointer hover:bg-primary/10">{s}</span>
                  ))}
                </div>
                <Button size="sm" className="text-xs"><Send className="w-3 h-3 mr-1" /> Send →</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coordinate a Park Day */}
        <Card className="border-primary/20 bg-card/80">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">📅 Plan a Park Day with Friends</CardTitle>
            <CardDescription className="text-xs mt-1">Propose a day — friends can confirm, suggest changes, or join your itinerary</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 space-y-4">
            {/* Park selector */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Park</label>
              <div className="flex gap-2">
                {parks.map(p => (
                  <button key={p} onClick={() => setSelectedPark(p)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${selectedPark === p ? "bg-primary text-primary-foreground" : "border border-primary/20 text-muted-foreground hover:text-foreground"}`}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Date</label>
              <Input type="date" className="bg-background/40 border-primary/10 text-sm h-9" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Invite friends</label>
              <div className="space-y-2">
                {friends.map(f => (
                  <label key={f.initials} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={inviteFriends.includes(f.name)} onCheckedChange={() => toggleInviteFriend(f.name)} />
                    <span className="text-foreground">{f.name}</span>
                    <span className="text-[10px] text-muted-foreground">({f.pass})</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Message (optional)</label>
              <Input placeholder="e.g. Let's do EPCOT for Food & Wine, I'll set dining alerts for Space 220" className="bg-background/40 border-primary/10 text-sm h-9" />
            </div>
            <Button className="w-full text-xs">📤 Send Park Day Proposal</Button>

            {/* Active proposal */}
            <div className="rounded-xl border border-primary/10 bg-[#0D1230]/60 p-4 space-y-2 mt-2">
              <p className="text-sm font-bold text-foreground">🏰 Magic Kingdom — Thursday May 8</p>
              <p className="text-xs text-muted-foreground">Proposed by: You</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-green-400">Mike R. ✅ In</span>
                <span className="text-yellow-400">Jess L. ⏳ Pending</span>
                <span className="text-red-400">Dave T. ❌ Can't make it</span>
              </div>
              <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 text-xs">View Full Plan →</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 4: Friend Invite with Discount */}
      <Card className="border-purple-500/40 bg-card/80 mb-6">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">🎁 Invite Friends — They Get a Special Discount</CardTitle>
          <CardDescription className="text-xs mt-1">When you invite a friend who isn't on Magic Pass yet, they get their first month for $1 — and you earn a free month when they subscribe</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Method 1: Email */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground">Invite by Email</p>
              <div className="flex gap-2">
                <Input placeholder="friend@email.com" className="bg-background/40 border-primary/10 text-sm h-9 flex-1" />
                <Button size="sm" className="text-xs h-9 shrink-0">Send Invite</Button>
              </div>
              <div>
                <button onClick={() => setEmailPreviewOpen(!emailPreviewOpen)} className="text-[10px] text-muted-foreground hover:text-foreground mb-1">
                  {emailPreviewOpen ? "▼" : "▶"} Preview of what they receive
                </button>
                {emailPreviewOpen && (
                  <div className="rounded-lg border border-primary/10 bg-[#0D1230]/60 p-3 text-xs space-y-1">
                    <p className="text-muted-foreground"><span className="text-foreground font-semibold">Subject:</span> Brandon invited you to Magic Pass 🏰</p>
                    <p className="text-muted-foreground">Brandon is using Magic Pass to plan Disney trips and wants you to join. Get full access for just $1 your first month — dining alerts, wait time notifications, gift card deals, and more.</p>
                    <span className="inline-block mt-1 px-3 py-1 rounded bg-primary/20 text-primary text-[10px] font-semibold">Join Magic Pass for $1 →</span>
                    <p className="text-[10px] text-muted-foreground italic mt-1">Offer expires 7 days after invite is sent</p>
                  </div>
                )}
              </div>
            </div>

            {/* Method 2: Share Link */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground">Share Invite Link</p>
              <div className="flex gap-2">
                <Input value="magicpass.app/invite/brandon-moss-friends" readOnly className="bg-background/40 border-primary/10 text-xs h-9 flex-1" />
                <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 text-xs h-9 shrink-0">
                  <Copy className="w-3 h-3 mr-1" /> Copy Link
                </Button>
              </div>
              <div className="flex gap-2">
                {["💬 iMessage", "📘 Facebook", "📸 Instagram", "🐦 Twitter/X"].map(s => (
                  <span key={s} className="text-[10px] px-2.5 py-1.5 rounded-full border border-primary/20 text-muted-foreground cursor-pointer hover:text-foreground hover:border-primary/40">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Invites Sent", value: "3" },
              { label: "Friends Joined", value: "1" },
              { label: "Free Months Earned", value: "1" },
              { label: "Your Friends' Total Savings", value: "$47.20" },
            ].map(s => (
              <div key={s.label} className="rounded-lg border border-primary/10 bg-[#0D1230]/60 p-3 text-center">
                <p className="text-lg font-bold text-primary">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search modal */}
      {searchOpen && (
        <>
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] w-[90%] max-w-md rounded-xl border border-primary/20 bg-[#111827] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Add Friend</span>
              <button onClick={() => setSearchOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name or Magic Pass username" className="pl-9 bg-background/40 border-primary/10 text-sm h-10" />
            </div>
            <p className="text-xs text-muted-foreground text-center">Start typing to find friends</p>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Friends;
