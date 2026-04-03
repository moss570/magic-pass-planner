import { Castle, Home, Map, UtensilsCrossed, Gift, Zap, Ticket, Users, Wallet, Settings, Bell, LogOut, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

const sidebarNav = [
  { icon: Home, label: "Dashboard", active: true, path: "/dashboard" },
  { icon: Map, label: "Trip Planner", path: "/trip-planner" },
  { icon: UtensilsCrossed, label: "Dining Alerts", path: "#" },
  { icon: Gift, label: "Gift Card Tracker", path: "#" },
  { icon: Zap, label: "Live Park Mode", path: "#" },
  { icon: Ticket, label: "AP Command Center", path: "#" },
  { icon: Users, label: "Group Coordinator", path: "#" },
  { icon: Wallet, label: "Budget Manager", path: "#" },
  { icon: Settings, label: "Settings", path: "#" },
];

const itinerary = [
  { time: "8:00 AM", activity: "Arrive at park, rope drop Tron Lightcycle Run", badge: "wait: 12 min ✅", badgeColor: "text-green-400" },
  { time: "9:30 AM", activity: "Breakfast: Be Our Guest", badge: "reservation confirmed 🍽️", badgeColor: "text-primary" },
  { time: "11:00 AM", activity: "Space Mountain", badge: "Lightning Lane booked ⚡", badgeColor: "text-primary" },
  { time: "1:00 PM", activity: "Columbia Harbour House lunch", badge: "quick service", badgeColor: "text-muted-foreground" },
  { time: "2:30 PM", activity: "Festival of Fantasy Parade", badge: null, badgeColor: "" },
  { time: "4:00 PM", activity: "Rest / pool time", badge: null, badgeColor: "" },
  { time: "7:00 PM", activity: "Dinner: Cinderella's Royal Table", badge: null, badgeColor: "" },
  { time: "9:00 PM", activity: "Happily Ever After Fireworks", badge: "best view: Liberty Riverboat 🎆", badgeColor: "text-primary" },
];

const alerts = [
  { emoji: "🍽️", title: "Be Our Guest — Oct 15, party of 4", status: "Watching...", statusColor: "text-yellow-400", dot: "bg-yellow-400 live-pulse" },
  { emoji: "🎁", title: "Sam's Club Disney Gift Cards", status: "Deal live! $200 for $190", statusColor: "text-green-400", dot: "bg-green-400 live-pulse", badge: "LIVE" },
  { emoji: "🏨", title: "Wilderness Lodge — May 18-22", status: "Price drop: $892 → $743", statusColor: "text-green-400", badge: "SAVED $149" },
];

const upcomingDates = [
  { date: "May 20", park: "Magic Kingdom", crowd: 4, color: "text-green-400", dot: "bg-green-400" },
  { date: "May 21", park: "EPCOT", crowd: 6, color: "text-yellow-400", dot: "bg-yellow-400" },
  { date: "May 22", park: "Hollywood Studios", crowd: 7, color: "text-yellow-400", dot: "bg-yellow-400" },
  { date: "May 23", park: "Animal Kingdom", crowd: 3, color: "text-green-400", dot: "bg-green-400" },
];

const Dashboard = () => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-60 flex flex-col z-40" style={{ background: "#0D1230" }}>
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <Link to="/" className="flex items-center gap-2">
            <Castle className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold text-primary">Magic Pass</span>
          </Link>
        </div>

        {/* User */}
        <div className="px-5 pb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold">B</div>
          <div>
            <p className="text-xs text-muted-foreground">Welcome back,</p>
            <p className="text-sm font-semibold text-foreground">Brandon</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {sidebarNav.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? "text-primary border-l-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-5 pb-6 space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-primary/15 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
            <Castle className="w-3 h-3" />
            Magic Pass Plan
          </div>
          <div>
            <Link to="/pricing" className="block text-xs font-medium text-secondary hover:underline mb-1">Upgrade Plan</Link>
            <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <LogOut className="w-3 h-3" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 min-h-screen" style={{ background: "#080E1E" }}>
        {/* Top bar */}
        <div className="px-8 pt-8 pb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Good morning, Brandon 👋</h1>
            <p className="text-muted-foreground text-sm mt-1">Your next Disney trip is <span className="text-primary font-semibold">47 days</span> away</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative">
              <Bell className="w-5 h-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive" />
            </button>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500/15 text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-pulse" />
              7-day free trial active
            </span>
          </div>
        </div>

        <div className="px-8 pb-8 space-y-6">
          {/* ROW 1 — Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Active Alerts", value: "3", valueColor: "text-primary", sub: "Dining, hotel & gift card" },
              { label: "Days to Trip", value: "47", valueColor: "text-primary", sub: "Magic Kingdom · May 20" },
              { label: "Est. Trip Savings", value: "$340", valueColor: "text-green-400", sub: "Gift cards + hotel discount" },
            ].map((card) => (
              <div key={card.label} className="rounded-xl bg-card gold-border p-5">
                <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                <p className={`text-3xl font-extrabold ${card.valueColor}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              </div>
            ))}
            <div className="rounded-xl bg-card gold-border p-5">
              <p className="text-xs text-muted-foreground mb-1">Budget Status</p>
              <p className="text-3xl font-extrabold text-foreground">$4,200</p>
              <p className="text-xs text-muted-foreground mt-1">of $6,500 budget used</p>
              <Progress value={65} className="h-1.5 mt-3 bg-muted" />
            </div>
          </div>

          {/* ROW 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Itinerary — 3/5 */}
            <div className="lg:col-span-3 rounded-xl bg-card gold-border p-6">
              <h2 className="text-base font-bold text-foreground mb-1">Your Trip Itinerary</h2>
              <p className="text-xs text-muted-foreground mb-5">Magic Kingdom · May 20</p>
              <div className="space-y-0">
                {itinerary.map((item, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      {i < itinerary.length - 1 && <div className="w-px flex-1 bg-primary/20" />}
                    </div>
                    <div className="pb-5">
                      <p className="text-xs font-semibold text-primary">{item.time}</p>
                      <p className="text-sm text-foreground">{item.activity}</p>
                      {item.badge && <p className={`text-xs mt-0.5 ${item.badgeColor}`}>{item.badge}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — 2/5 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Alerts */}
              <div className="rounded-xl bg-card gold-border p-5">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">🔔 Active Alerts</h3>
                <div className="space-y-4">
                  {alerts.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-lg">{a.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{a.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {a.dot && <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />}
                          <span className={`text-xs ${a.statusColor}`}>{a.status}</span>
                          {a.badge && (
                            <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                              {a.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clark's Recommendation */}
              <div className="rounded-xl bg-card gold-border p-5 border-l-4 border-l-primary">
                <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">💡 Clark's Recommendation</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  Based on current crowd forecasts, arriving Tuesday instead of Wednesday for your May trip saves an estimated 38 minutes of wait time and $0 in ticket cost. Crowds drop significantly mid-week.
                </p>
                <button className="inline-flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                  Adjust My Trip
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* ROW 3 — Upcoming Dates */}
          <div className="rounded-xl bg-card gold-border p-6">
            <h2 className="text-base font-bold text-foreground mb-4">Upcoming Disney Dates</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {upcomingDates.map((d) => (
                <div key={d.date} className="min-w-[180px] rounded-lg bg-muted/30 gold-border p-4 shrink-0">
                  <p className="text-sm font-bold text-foreground">{d.date}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.park}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`w-2 h-2 rounded-full ${d.dot}`} />
                    <span className={`text-xs font-semibold ${d.color}`}>Crowd Level {d.crowd}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
