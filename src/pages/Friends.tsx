import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Plus, Send, Search, X, Copy, Mail, MapPin, Calendar } from "lucide-react";

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

const Friends = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedPark, setSelectedPark] = useState("MK");
  const [inviteFriends, setInviteFriends] = useState<string[]>([]);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(true);

  const toggleInviteFriend = (name: string) => {
    setInviteFriends(prev => prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]);
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
