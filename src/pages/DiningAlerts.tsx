import { useState } from "react";
import { Search, Bell, Mail, MessageSquare, X, Eye } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import CompassButton from "@/components/CompassButton";

const restaurants = [
  { name: "Be Our Guest", location: "Magic Kingdom" },
  { name: "Cinderella's Royal Table", location: "Magic Kingdom" },
  { name: "Skipper Canteen", location: "Magic Kingdom" },
  { name: "Steakhouse 71", location: "Resorts" },
  { name: "Space 220", location: "EPCOT" },
  { name: "Coral Reef", location: "EPCOT" },
  { name: "Le Cellier", location: "EPCOT" },
  { name: "Akershus Royal Banquet Hall", location: "EPCOT" },
  { name: "Via Napoli", location: "EPCOT" },
  { name: "Spice Road Table", location: "EPCOT" },
  { name: "Sci-Fi Dine-In Theater", location: "Hollywood Studios" },
  { name: "50's Prime Time Café", location: "Hollywood Studios" },
  { name: "Hollywood & Vine", location: "Hollywood Studios" },
  { name: "Oga's Cantina", location: "Hollywood Studios" },
  { name: "Tiffins", location: "Animal Kingdom" },
  { name: "Yachtsman Steakhouse", location: "Resorts" },
  { name: "Topolino's Terrace", location: "Resorts" },
  { name: "'Ohana", location: "Resorts" },
  { name: "Boma", location: "Resorts" },
  { name: "Sanaa", location: "Resorts" },
  { name: "Jiko", location: "Resorts" },
  { name: "The BOATHOUSE", location: "Disney Springs" },
];

const locationFilters = ["All", "Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom", "Resorts", "Disney Springs", "Water Parks"];

const mealTimes = ["Breakfast", "Lunch", "Dinner", "Any"];

const restaurantContexts: Record<string, string> = {
  "Be Our Guest": "Fantasyland · Magic Kingdom",
  "Cinderella's Royal Table": "Fantasyland · Magic Kingdom",
  "Space 220": "Future World · EPCOT",
  "Skipper Canteen": "Adventureland · Magic Kingdom",
};

const activeAlerts = [
  { restaurant: "Be Our Guest", date: "May 20, 2026", party: 4, meal: "Dinner", status: "watching", checks: "847", lastChecked: "12 seconds ago", channels: ["push", "email"] },
  { restaurant: "Cinderella's Royal Table", date: "May 21, 2026", party: 4, meal: "Breakfast", status: "booked-full", checks: "1,203", lastChecked: "No availability in last 48 hours", channels: ["push", "email"] },
  { restaurant: "Space 220", date: "May 22, 2026", party: 2, meal: "Lunch", status: "available", checks: "", lastChecked: "Opening detected 3 minutes ago", channels: ["push", "email", "sms"] },
];

const historyRows = [
  { restaurant: "Topolino's Terrace", date: "Apr 15", party: 4, status: "booked", alertedAt: "Apr 8, 9:42 AM" },
  { restaurant: "'Ohana", date: "Apr 10", party: 6, status: "booked", alertedAt: "Apr 3, 2:17 PM" },
  { restaurant: "Oga's Cantina", date: "Mar 28", party: 2, status: "expired", alertedAt: "Mar 20, —" },
  { restaurant: "Le Cellier", date: "Mar 15", party: 4, status: "cancelled", alertedAt: "—" },
];

const DiningAlerts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [locationFilter, setLocationFilter] = useState("All");
  const [date, setDate] = useState<Date>();
  const [partySize, setPartySize] = useState(4);
  const [selectedMeals, setSelectedMeals] = useState<string[]>(["Dinner"]);
  const [pushOn, setPushOn] = useState(true);
  const [emailOn, setEmailOn] = useState(true);
  const [smsOn, setSmsOn] = useState(false);

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = locationFilter === "All" || r.location === locationFilter;
    return matchesSearch && matchesLocation;
  });

  const toggleMeal = (meal: string) => {
    setSelectedMeals((prev) =>
      prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal]
    );
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "watching":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-yellow-500/15 text-yellow-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-pulse" />
            Watching...
          </span>
        );
      case "booked-full":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-destructive/15 text-red-400">
            🔴 Fully Booked
          </span>
        );
      case "available":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-green-500/20 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.3)]">
            🟢 AVAILABLE — Book Now!
          </span>
        );
      default:
        return null;
    }
  };

  const historyStatus = (status: string) => {
    switch (status) {
      case "booked": return <span className="text-green-400">✅ Booked</span>;
      case "expired": return <span className="text-yellow-400">⏰ Expired</span>;
      case "cancelled": return <span className="text-red-400">❌ Cancelled</span>;
      default: return null;
    }
  };

  return (
    <DashboardLayout title="🍽️ Dining Reservation Alerts" subtitle="We watch 24/7 and alert you the instant your table opens up">
      <div className="space-y-6">
        {/* Add New Alert */}
        <div className="rounded-xl bg-card gold-border p-6 border-t-2 border-t-primary">
          <h2 className="text-base font-bold text-foreground mb-5">Set a New Alert</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Restaurant search */}
            <div className="relative">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Restaurant</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search any Disney restaurant or resort dining..."
                  value={selectedRestaurant || searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSelectedRestaurant(""); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full bg-muted/30 border border-primary/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {locationFilters.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => { setLocationFilter(loc); setShowDropdown(true); setSelectedRestaurant(""); }}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors border ${
                      locationFilter === loc
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">150+ Disney World restaurants · Updated automatically</p>
              {showDropdown && !selectedRestaurant && (
                <div className="absolute z-50 top-full mt-1 w-full bg-card border border-primary/20 rounded-lg max-h-48 overflow-y-auto shadow-xl">
                  {filteredRestaurants.map((r) => (
                    <button key={r.name} onClick={() => { setSelectedRestaurant(r.name); setShowDropdown(false); setSearchQuery(""); }} className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors flex items-center justify-between">
                      <span>{r.name}</span>
                      <span className="text-[10px] text-muted-foreground">{r.location}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date picker */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn("w-full flex items-center gap-2 bg-muted/30 border border-primary/10 rounded-lg px-3 py-2.5 text-sm text-left", date ? "text-foreground" : "text-muted-foreground")}>
                    📅 {date ? format(date, "PPP") : "Pick a date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Party size */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Party Size</label>
              <div className="flex items-center gap-3 bg-muted/30 border border-primary/10 rounded-lg px-3 py-2">
                <button onClick={() => setPartySize(Math.max(1, partySize - 1))} className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 text-sm font-bold">−</button>
                <span className="text-sm font-bold text-primary w-4 text-center">{partySize}</span>
                <button onClick={() => setPartySize(Math.min(12, partySize + 1))} className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 text-sm font-bold">+</button>
              </div>
            </div>

            {/* Meal time */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Meal Time</label>
              <div className="flex flex-wrap gap-2">
                {mealTimes.map((meal) => (
                  <button
                    key={meal}
                    onClick={() => toggleMeal(meal)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      selectedMeals.includes(meal)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-primary/30 text-muted-foreground hover:border-primary hover:text-foreground"
                    }`}
                  >
                    {meal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Alert channels */}
          <div className="mt-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Alert me via</label>
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Bell, label: "Push Notification", on: pushOn, set: setPushOn, locked: false },
                { icon: Mail, label: "Email", on: emailOn, set: setEmailOn, locked: false },
                { icon: MessageSquare, label: "SMS Text", on: smsOn, set: setSmsOn, locked: true },
              ].map((ch) => (
                <button
                  key={ch.label}
                  onClick={() => ch.set(!ch.on)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    ch.on ? "bg-primary/15 border-primary text-primary" : "border-primary/20 text-muted-foreground"
                  }`}
                >
                  <ch.icon className="w-3.5 h-3.5" />
                  {ch.label}
                  {ch.locked && !ch.on && <span className="text-[10px] text-muted-foreground ml-1">Upgrade to enable</span>}
                </button>
              ))}
            </div>
          </div>

          <button className="w-full mt-5 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
            🔔 Start Watching This Restaurant
          </button>
        </div>

        {/* Active Alerts */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-4">Your Active Alerts (3)</h2>
          <div className="space-y-4">
            {activeAlerts.map((alert) => (
              <div key={alert.restaurant} className="rounded-xl bg-card gold-border p-5 relative">
                <button className="absolute top-4 right-4 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-medium">
                  <X className="w-3 h-3" /> Cancel Alert
                </button>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-foreground">{alert.restaurant}</h3>
                      <CompassButton
                        destination={alert.restaurant}
                        context={restaurantContexts[alert.restaurant] || alert.restaurant}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{alert.date} · Party of {alert.party} · {alert.meal}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {alert.checks && <>Checked {alert.checks} times · </>}{alert.lastChecked}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {alert.channels.includes("push") && <Bell className="w-3.5 h-3.5 text-muted-foreground" />}
                      {alert.channels.includes("email") && <Mail className="w-3.5 h-3.5 text-muted-foreground" />}
                      {alert.channels.includes("sms") && <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </div>
                  <div className="shrink-0">{statusBadge(alert.status)}</div>
                </div>
                {alert.status === "available" && (
                  <div className="mt-4 space-y-2">
                    <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
                      🍽️ Book This Reservation →
                    </button>
                    <div className="flex justify-center">
                      <CompassButton
                        destination={alert.restaurant}
                        context={restaurantContexts[alert.restaurant] || alert.restaurant}
                        size="card"
                      />
                    </div>
                    <p className="text-center text-[11px] text-muted-foreground">Opens Disney dining page directly · Availability may close in seconds</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Alert History */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-4">Recent Alert History</h2>
          <div className="rounded-xl bg-card gold-border overflow-x-auto max-w-full">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-primary/10">
                  {["Restaurant", "Date", "Party", "Status", "Alerted At", "Action"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-primary uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row, i) => (
                  <tr key={i} className="border-b border-primary/5 last:border-0">
                    <td className="px-5 py-3 font-medium text-foreground">{row.restaurant}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.date}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.party}</td>
                    <td className="px-5 py-3">{historyStatus(row.status)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.alertedAt}</td>
                    <td className="px-5 py-3">
                      <button className="text-xs text-primary hover:underline flex items-center gap-1"><Eye className="w-3 h-3" /> View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DiningAlerts;
