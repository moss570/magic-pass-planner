import { useState } from "react";
import { Castle, RefreshCw, Calendar, FileText, Users, Minus, Plus } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Slider } from "@/components/ui/slider";
import CompassButton from "@/components/CompassButton";

const parks = ["Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom", "Disney Springs", "🌊 Typhoon Lagoon", "❄️ Blizzard Beach"];

const ridePreferences = [
  { label: "🎢 Thrill Seeker", value: "thrill" },
  { label: "🎠 Family Friendly", value: "family" },
  { label: "👶 Little Ones First", value: "little" },
  { label: "⚖️ Mix of Everything", value: "mix" },
];

const llOptions = [
  { label: "Individual Lightning Lane", value: "individual" },
  { label: "Lightning Lane Multi Pass", value: "multi" },
  { label: "None", value: "none" },
];

const itineraryItems = [
  { time: "7:45 AM", activity: "Arrive at park entrance", badge: "Rope Drop", badgeColor: "bg-primary/20 text-primary", tip: "Arrive 15 min before park open — rope drop gives you 45 min of low crowds", wait: null, location: null, land: "" },
  { time: "8:00 AM", activity: "Tron Lightcycle Run", badge: "Lightning Lane", badgeColor: "bg-yellow-500/20 text-yellow-400", tip: "Book this LL first — it sells out by 7:02 AM on busy days", wait: 8, waitColor: "text-green-400", location: "Tron Lightcycle Run", land: "Tomorrowland · Magic Kingdom" },
  { time: "9:15 AM", activity: "Seven Dwarfs Mine Train", badge: null, badgeColor: "", tip: "Best window is right after Tron while crowds are still moving to Fantasyland", wait: 22, waitColor: "text-yellow-400", location: "Seven Dwarfs Mine Train", land: "Fantasyland · Magic Kingdom" },
  { time: "10:00 AM", activity: "Meet Mickey at Town Square", badge: "Show", badgeColor: "bg-secondary/20 text-secondary", tip: "Great photo op — lines stay short until 11 AM", wait: null, location: "Town Square", land: "Main Street U.S.A. · Magic Kingdom" },
  { time: "11:30 AM", activity: "Be Our Guest Restaurant", badge: "Dining", badgeColor: "bg-orange-500/20 text-orange-400", tip: "Reservation confirmed ✅ — arrive 5 min early, ask for a window table", wait: null, location: "Be Our Guest Restaurant", land: "Fantasyland · Magic Kingdom" },
  { time: "1:00 PM", activity: "Rest break / hotel return", badge: "Break", badgeColor: "bg-muted text-muted-foreground", tip: "Crowds peak 1-3 PM — this is the smartest time to leave and return refreshed", wait: null, location: null, land: "" },
  { time: "3:30 PM", activity: "Return to park for afternoon", badge: null, badgeColor: "", tip: "Crowds drop significantly after 3 PM — ideal for Fantasyland rides", wait: null, location: null, land: "" },
  { time: "4:00 PM", activity: "Haunted Mansion", badge: null, badgeColor: "", tip: "Consistent low waits mid-afternoon", wait: 18, waitColor: "text-green-400", location: "Haunted Mansion", land: "Liberty Square · Magic Kingdom" },
  { time: "5:00 PM", activity: "Pirates of the Caribbean", badge: null, badgeColor: "", tip: "One of the best waits of the day at this time", wait: 12, waitColor: "text-green-400", location: "Pirates of the Caribbean", land: "Adventureland · Magic Kingdom" },
  { time: "6:30 PM", activity: "Columbia Harbour House dinner", badge: "Quick Service", badgeColor: "bg-blue-500/20 text-blue-400", tip: "Best quick service in Magic Kingdom — second floor has great views", wait: null, location: "Columbia Harbour House", land: "Liberty Square · Magic Kingdom" },
  { time: "8:00 PM", activity: "Get in position for Happily Ever After Fireworks", badge: "Show", badgeColor: "bg-secondary/20 text-secondary", tip: "Best spot: Liberty Square near the Riverboat — center view, less crowded than Main Street", wait: null, location: "Liberty Square Riverboat", land: "Liberty Square · Magic Kingdom" },
  { time: "9:00 PM", activity: "Happily Ever After Fireworks 🎆", badge: "Show", badgeColor: "bg-secondary/20 text-secondary", tip: "Formula: Show starts 9 PM. Board Liberty Riverboat at 8:45 for perfect elevation view", wait: null, location: null, land: "" },
];

const TripPlanner = () => {
  const [selectedParks, setSelectedParks] = useState<string[]>(["Magic Kingdom"]);
  const [ridePreference, setRidePreference] = useState("mix");
  const [llOption, setLlOption] = useState("multi");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(2);
  const [budget, setBudget] = useState([6500]);
  const [generated, setGenerated] = useState(true);

  const togglePark = (park: string) => {
    setSelectedParks((prev) =>
      prev.includes(park) ? prev.filter((p) => p !== park) : [...prev, park]
    );
  };

  return (
    <DashboardLayout title="🗺️ Trip Planner" subtitle="Build your perfect Disney day with AI-powered itineraries">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT — Form (2/5) */}
        <div className="lg:col-span-2 rounded-xl bg-card gold-border p-6 h-fit">
          <h2 className="text-base font-bold text-foreground mb-5">🗺️ Plan Your Trip</h2>

          <div className="space-y-5">
            {/* Parks */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Which park(s)?</label>
              <div className="flex flex-wrap gap-2">
                {parks.map((park) => (
                  <button
                    key={park}
                    onClick={() => togglePark(park)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      selectedParks.includes(park)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-primary/30 text-muted-foreground hover:border-primary hover:text-foreground"
                    }`}
                  >
                    {park}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Travel dates</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2.5 border border-primary/10">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">May 20, 2026</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2.5 border border-primary/10">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">May 23, 2026</span>
                </div>
              </div>
            </div>

            {/* Party size */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Party size</label>
              <div className="space-y-3">
                {[
                  { label: "Adults", value: adults, set: setAdults },
                  { label: "Children", value: children, set: setChildren },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 border border-primary/10">
                    <span className="text-sm text-foreground">{row.label}</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => row.set(Math.max(0, row.value - 1))} className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-foreground hover:bg-muted/80">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold text-primary w-4 text-center">{row.value}</span>
                      <button onClick={() => row.set(row.value + 1)} className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ages */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Ages in your group</label>
              <input
                type="text"
                placeholder="e.g. 38, 35, 8, 6"
                defaultValue="38, 35, 8, 6"
                className="w-full bg-muted/30 border border-primary/10 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Ride preference */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Ride preference</label>
              <div className="flex flex-wrap gap-2">
                {ridePreferences.map((pref) => (
                  <button
                    key={pref.value}
                    onClick={() => setRidePreference(pref.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      ridePreference === pref.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-primary/30 text-muted-foreground hover:border-primary hover:text-foreground"
                    }`}
                  >
                    {pref.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Budget for this trip</label>
              <p className="text-2xl font-extrabold text-primary mb-3">${budget[0].toLocaleString()}</p>
              <Slider
                value={budget}
                onValueChange={setBudget}
                min={2000}
                max={15000}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>$2,000</span>
                <span>$15,000</span>
              </div>
            </div>

            {/* Lightning Lane */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Lightning Lane pass?</label>
              <div className="flex flex-wrap gap-2">
                {llOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLlOption(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      llOption === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-primary/30 text-muted-foreground hover:border-primary hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Special notes for AI</label>
              <textarea
                placeholder="e.g. celebrating a birthday, first trip, grandparents coming, must do Tron"
                rows={3}
                className="w-full bg-muted/30 border border-primary/10 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
              />
            </div>

            {/* CTA */}
            <button
              onClick={() => setGenerated(true)}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              ✨ Generate My Itinerary
            </button>
            <p className="text-center text-[11px] text-muted-foreground">Powered by Magic Pass AI · Takes about 10 seconds</p>
          </div>
        </div>

        {/* RIGHT — Itinerary (3/5) */}
        <div className="lg:col-span-3">
          {!generated ? (
            <div className="rounded-xl border-2 border-dashed border-primary/30 p-12 flex flex-col items-center justify-center text-center min-h-[500px]">
              <Castle className="w-16 h-16 text-primary/50 mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">Your personalized itinerary will appear here</h3>
              <p className="text-sm text-muted-foreground max-w-sm">Fill in your trip details and hit Generate to build your custom Disney day plan</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl bg-card gold-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Magic Kingdom · May 20, 2026 · Party of 4</h2>
                  </div>
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border border-primary/20 px-3 py-1.5 rounded-lg hover:text-foreground hover:border-primary/40 transition-colors">
                    <RefreshCw className="w-3 h-3" />
                    Regenerate
                  </button>
                </div>

                <div className="space-y-0">
                  {itineraryItems.map((item, i) => (
                    <div key={i} className="flex gap-4 relative">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                        {i < itineraryItems.length - 1 && <div className="w-px flex-1 bg-primary/20" />}
                      </div>
                      <div className="pb-5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-primary">{item.time}</span>
                          {item.badge && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          )}
                          {item.wait !== null && (
                            <span className={`text-[10px] font-semibold ${item.waitColor}`}>
                              Wait: {item.wait} min {item.wait < 20 ? "🟢" : item.wait <= 45 ? "🟡" : "🔴"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <p className="text-sm font-medium text-foreground">{item.activity}</p>
                          {item.location && (
                            <CompassButton destination={item.location} context={item.land} />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground italic mt-0.5">{item.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary stats */}
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: "⏱️", label: "Est. Total Wait Time: 1h 42min" },
                  { icon: "⚡", label: "Lightning Lane Bookings: 2" },
                  { icon: "🎢", label: "Attractions: 7" },
                ].map((stat) => (
                  <div key={stat.label} className="inline-flex items-center gap-2 bg-card gold-border rounded-full px-4 py-2 text-xs font-semibold text-foreground">
                    <span>{stat.icon}</span>
                    {stat.label}
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
                  <Calendar className="w-3.5 h-3.5" />
                  Add to Calendar
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-secondary/30 text-secondary hover:bg-secondary/10 transition-colors">
                  <Users className="w-3.5 h-3.5" />
                  Share with Group
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-muted-foreground/30 text-muted-foreground hover:bg-muted/30 transition-colors">
                  <FileText className="w-3.5 h-3.5" />
                  Export PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TripPlanner;
