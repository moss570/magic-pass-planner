import { Castle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/DashboardLayout";
import CompassButton from "@/components/CompassButton";

const itinerary = [
  { time: "8:00 AM", activity: "Arrive at park, rope drop Tron Lightcycle Run", badge: "wait: 12 min ✅", badgeColor: "text-green-400", location: "Tron Lightcycle Run", land: "Tomorrowland · Magic Kingdom" },
  { time: "9:30 AM", activity: "Breakfast: Be Our Guest", badge: "reservation confirmed 🍽️", badgeColor: "text-primary", location: "Be Our Guest Restaurant", land: "Fantasyland · Magic Kingdom" },
  { time: "11:00 AM", activity: "Space Mountain", badge: "Lightning Lane booked ⚡", badgeColor: "text-primary", location: "Space Mountain", land: "Tomorrowland · Magic Kingdom" },
  { time: "1:00 PM", activity: "Columbia Harbour House lunch", badge: "quick service", badgeColor: "text-muted-foreground", location: "Columbia Harbour House", land: "Liberty Square · Magic Kingdom" },
  { time: "2:30 PM", activity: "Festival of Fantasy Parade", badge: null, badgeColor: "", location: null, land: "" },
  { time: "4:00 PM", activity: "Rest / pool time", badge: null, badgeColor: "", location: null, land: "" },
  { time: "7:00 PM", activity: "Dinner: Cinderella's Royal Table", badge: null, badgeColor: "", location: "Cinderella's Royal Table", land: "Fantasyland · Magic Kingdom" },
  { time: "9:00 PM", activity: "Happily Ever After Fireworks", badge: "best view: Liberty Riverboat 🎆", badgeColor: "text-primary", location: "Liberty Square Riverboat", land: "Liberty Square · Magic Kingdom" },
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
    <DashboardLayout title="Good morning, Brandon 👋" subtitle="Your next Disney trip is 47 days away">
      <div className="space-y-6">
        {/* ROW 1 — Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Active Alerts", value: "3", valueColor: "text-primary", sub: "Dining, hotel & gift card" },
            { label: "Days to Trip", value: "47", valueColor: "text-primary", sub: "Magic Kingdom · May 20" },
            { label: "Est. Trip Savings", value: "$340", valueColor: "text-green-400", sub: "Gift cards + hotel discount" },
          ].map((card) => (
            <div key={card.label} className="rounded-xl bg-card gold-border p-4 md:p-5">
              <p className="text-[10px] md:text-xs text-muted-foreground mb-1">{card.label}</p>
              <p className={`text-2xl md:text-3xl font-extrabold ${card.valueColor}`}>{card.value}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">{card.sub}</p>
            </div>
          ))}
          <div className="rounded-xl bg-card gold-border p-4 md:p-5">
            <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Budget Status</p>
            <p className="text-2xl md:text-3xl font-extrabold text-foreground">$4,200</p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">of $6,500 budget used</p>
            <Progress value={65} className="h-1.5 mt-3 bg-muted" />
          </div>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Itinerary — 3/5 */}
          <div className="lg:col-span-3 rounded-xl bg-card gold-border p-4 md:p-6">
            <h2 className="text-sm md:text-base font-bold text-foreground mb-1">Your Trip Itinerary</h2>
            <p className="text-xs text-muted-foreground mb-5">Magic Kingdom · May 20</p>
            <div className="space-y-0">
              {itinerary.map((item, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                    {i < itinerary.length - 1 && <div className="w-px flex-1 bg-primary/20" />}
                  </div>
                  <div className="pb-5">
                    <p className="text-xs font-semibold text-primary">{item.time}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-foreground">{item.activity}</p>
                      {item.location && (
                        <CompassButton destination={item.location} context={item.land} />
                      )}
                    </div>
                    {item.badge && <p className={`text-xs mt-0.5 ${item.badgeColor}`}>{item.badge}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — 2/5 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Alerts */}
            <div className="rounded-xl bg-card gold-border p-4 md:p-5">
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
            <div className="rounded-xl bg-card gold-border p-4 md:p-5 border-l-4 border-l-primary">
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
        <div className="rounded-xl bg-card gold-border p-4 md:p-6">
          <h2 className="text-sm md:text-base font-bold text-foreground mb-4">Upcoming Disney Dates</h2>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2">
            {upcomingDates.map((d) => (
              <div key={d.date} className="min-w-[150px] md:min-w-[180px] rounded-lg bg-muted/30 gold-border p-3 md:p-4 shrink-0">
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
    </DashboardLayout>
  );
};

export default Dashboard;
