import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import CompassModal from "@/components/CompassModal";

const rides = [
  { name: "Tron Lightcycle Run", wait: 8, land: "Tomorrowland", ll: true, trend: "↓ dropping", closed: false },
  { name: "Space Mountain", wait: 22, land: "Tomorrowland", ll: true, trend: "↓ dropping", closed: false },
  { name: "Seven Dwarfs Mine Train", wait: 45, land: "Fantasyland", ll: true, trend: "↑ rising", closed: false },
  { name: "Big Thunder Mountain", wait: 18, land: "Frontierland", ll: false, trend: "↓ dropping", closed: false },
  { name: "Haunted Mansion", wait: 12, land: "Liberty Square", ll: false, trend: "→ steady", closed: false },
  { name: "Pirates of the Caribbean", wait: 10, land: "Adventureland", ll: false, trend: "↓ dropping", closed: false },
  { name: "Jungle Cruise", wait: 25, land: "Adventureland", ll: false, trend: "→ steady", closed: false },
  { name: "It's a Small World", wait: 15, land: "Fantasyland", ll: false, trend: "→ steady", closed: false },
  { name: "TRON Lightcycle Run", wait: 0, land: "Tomorrowland", ll: false, trend: "", closed: true, closedNote: "Refurbishment until May 22" },
];

const waitColor = (w: number, closed: boolean) => {
  if (closed) return "text-destructive";
  if (w <= 15) return "text-green-400";
  if (w <= 45) return "text-yellow-400";
  return "text-destructive";
};

const filters = ["All Rides", "Under 15 min", "Under 30 min", "Lightning Lane", "Closed"];

const alerts = [
  { icon: "🟢", text: "Space Mountain just dropped to 22 min — was 52 min 8 min ago", time: "2 min ago", action: "Head There Now →" },
  { icon: "🌧️", text: "Rain radar: Storm arriving in ~34 minutes. Recommend moving to indoor attractions soon.", time: "5 min ago", action: null },
  { icon: "⚡", text: "Lightning Lane tip: You can squeeze in Pirates (10 min wait) before your 2:30 PM LL return", time: "8 min ago", action: "Navigate →" },
  { icon: "🎆", text: "Fireworks in 4h 12min. Best position: Liberty Square Riverboat — board at 8:45 PM", time: "11 min ago", action: null },
  { icon: "📸", text: "PhotoPass photographer near Cinderella Castle fountain — 2 min walk from your location", time: "15 min ago", action: "View Spot →" },
  { icon: "🔴", text: "Tron Lightcycle Run: Unexpected closure. Estimated reopening: 4:30 PM", time: "22 min ago", action: null },
];

const fireworksRides = [
  { ride: "Liberty Riverboat", wait: 0, duration: 17, lineBy: "8:43 PM", status: "🟢 Best View", statusColor: "text-green-400" },
  { ride: "Big Thunder Mountain", wait: 18, duration: 4, lineBy: "8:38 PM", status: "🟢 Great Angle", statusColor: "text-green-400" },
  { ride: "Tiana's Bayou Adventure", wait: 22, duration: 11, lineBy: "8:27 PM", status: "🟡 Good View", statusColor: "text-yellow-400" },
  { ride: "Jungle Cruise", wait: 25, duration: 10, lineBy: "8:25 PM", status: "🟡 Partial View", statusColor: "text-yellow-400" },
  { ride: "Pirates of the Caribbean", wait: 10, duration: 9, lineBy: "8:41 PM", status: "🟢 Good View", statusColor: "text-green-400" },
];

const compassDestinations: Record<string, { destination: string; land: string; walkTime: string; distance: string; directions: string[] }> = {
  "Head There Now →": { destination: "Space Mountain", land: "Tomorrowland", walkTime: "4 min", distance: "0.2 miles", directions: ["Head down Main Street toward the castle", "Turn right at the hub toward Tomorrowland", "Space Mountain is on your right"] },
  "Navigate →": { destination: "Pirates of the Caribbean", land: "Adventureland", walkTime: "6 min", distance: "0.3 miles", directions: ["Walk toward the hub from your current location", "Take the path to Adventureland on your left", "Pirates entrance is past the bridge on your right"] },
  "View Spot →": { destination: "Cinderella Castle Fountain", land: "Main Street U.S.A.", walkTime: "2 min", distance: "0.1 miles", directions: ["Walk toward Cinderella Castle", "The fountain and PhotoPass photographer are on the right side", "Look for the camera setup near the garden"] },
};

const LivePark = () => {
  const [rideFilter, setRideFilter] = useState("All Rides");
  const [compassOpen, setCompassOpen] = useState(false);
  const [compassTarget, setCompassTarget] = useState(compassDestinations["Navigate →"]);

  const openCompass = (action: string) => {
    const target = compassDestinations[action];
    if (target) {
      setCompassTarget(target);
      setCompassOpen(true);
    }
  };

  const filteredRides = rides.filter((r) => {
    if (rideFilter === "Under 15 min") return !r.closed && r.wait <= 15;
    if (rideFilter === "Under 30 min") return !r.closed && r.wait <= 30;
    if (rideFilter === "Lightning Lane") return r.ll && !r.closed;
    if (rideFilter === "Closed") return r.closed;
    return true;
  });

  return (
    <DashboardLayout title="⚡ Live Park Mode" subtitle="Real-time intelligence for every minute you're in the park">
      <div className="space-y-6">
        {/* Status bar */}
        <div className="rounded-xl bg-card gold-border p-4 border-l-4 border-l-green-500 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 live-pulse" />
            <span className="text-sm font-bold text-foreground">LIVE — Magic Kingdom · Today, May 20</span>
          </div>
          <span className="text-sm text-foreground">Current Crowd Level: <span className="font-bold text-green-400">4/10 🟢 Low</span></span>
          <div className="text-sm text-muted-foreground">
            Park Hours: 8:00 AM – 11:00 PM · <span className="text-primary font-medium">Next: Festival of Fantasy 3:00 PM</span>
          </div>
        </div>

        {/* Section 1: Wait Times */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">🎢 Live Wait Times</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Updated 23 seconds ago</span>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary">Auto-refreshes every 30s</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.map((f) => (
              <button key={f} onClick={() => setRideFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${rideFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-primary/30 text-muted-foreground hover:border-primary hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredRides.map((ride, i) => (
              <div key={i} className="rounded-xl bg-card gold-border p-5 flex flex-col items-center text-center">
                <h3 className="text-sm font-bold text-foreground mb-2">{ride.name}</h3>
                {ride.closed ? (
                  <span className="text-3xl font-extrabold text-destructive mb-1">CLOSED</span>
                ) : (
                  <span className={`text-4xl font-extrabold ${waitColor(ride.wait, false)} mb-0`}>{ride.wait}</span>
                )}
                {!ride.closed && <span className="text-xs text-muted-foreground mb-2">min</span>}
                <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap justify-center">
                  <span className="text-[11px] text-muted-foreground">{ride.land}</span>
                  {ride.ll && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">LL</span>}
                  {ride.closed ? (
                    <span className="text-[10px] text-destructive">{ride.closedNote}</span>
                  ) : (
                    <span className={`text-[10px] ${ride.trend.includes("↓") ? "text-green-400" : ride.trend.includes("↑") ? "text-destructive" : "text-muted-foreground"}`}>{ride.trend}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6">
          {/* LL Gap Finder */}
          <div className="rounded-xl bg-card gold-border p-6">
            <h2 className="text-base font-bold text-foreground mb-1">⚡ Lightning Lane Gap Finder</h2>
            <p className="text-sm text-muted-foreground mb-4">What can you fit between your next LL return window?</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Your next LL return time</label>
                <input type="time" defaultValue="14:30" className="w-full bg-muted/30 border border-primary/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Your current location</label>
                <select className="w-full bg-muted/30 border border-primary/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50">
                  {["Main Street", "Tomorrowland", "Fantasyland", "Frontierland", "Liberty Square", "Adventureland"].map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <button className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors mb-5">
              Find My Gap Rides
            </button>

            <div className="rounded-xl bg-muted/20 border border-primary/10 p-4">
              <h3 className="text-sm font-bold text-foreground mb-1">You have 1h 15min before your 2:30 PM Lightning Lane</h3>
              <p className="text-xs text-muted-foreground mb-3">From Tomorrowland, here's what fits:</p>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✅</span>
                  <div>
                    <p className="text-sm text-foreground font-medium">Pirates of the Caribbean</p>
                    <p className="text-xs text-muted-foreground">10 min wait · 15 min ride · 8 min walk = 33 min total</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✅</span>
                  <div>
                    <p className="text-sm text-foreground font-medium">Haunted Mansion</p>
                    <p className="text-xs text-muted-foreground">12 min wait · 9 min ride · 6 min walk = 27 min total</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">⚠️</span>
                  <div>
                    <p className="text-sm text-foreground font-medium">Big Thunder Mountain</p>
                    <p className="text-xs text-muted-foreground">18 min wait · 4 min ride · 12 min walk = 34 min total (tight — recommend skipping)</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-green-400 font-semibold mt-3">Total time used: 1h 14min — fits perfectly ✅</p>
            </div>
          </div>

          {/* Smart Alerts Feed */}
          <div className="rounded-xl bg-card gold-border p-6 flex flex-col">
            <h2 className="text-base font-bold text-foreground mb-4">🔔 Live Alerts</h2>
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-1">
              {alerts.map((a, i) => (
                <div key={i} className="rounded-lg bg-muted/20 border border-primary/5 p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-base">{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">{a.text}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{a.time}</p>
                    </div>
                  </div>
                  {a.action && (
                    <button onClick={() => openCompass(a.action!)} className="mt-2 px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-semibold hover:bg-primary/10 transition-colors">
                      {a.action}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Fireworks Calculator */}
        <div className="rounded-xl bg-card gold-border p-6 border-l-4 border-l-accent">
          <h2 className="text-base font-bold text-foreground mb-1">🎆 Fireworks Ride Timing Calculator</h2>
          <p className="text-sm text-muted-foreground mb-1">Get on a ride AND see the fireworks — perfectly timed</p>
          <p className="text-sm text-foreground font-semibold mb-4">Tonight: Happily Ever After · 9:00 PM</p>

          <div className="rounded-xl bg-muted/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/10">
                  {["Ride", "Current Wait", "Ride Duration", "Get In Line By", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fireworksRides.map((r, i) => (
                  <tr key={i} className="border-b border-primary/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{r.ride}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.wait} min</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.duration} min</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{r.lineBy}</td>
                    <td className={`px-4 py-3 text-xs font-semibold ${r.statusColor}`}>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
            <p className="text-sm text-primary font-bold">⏰ It's currently 4:48 PM — you have 4 hours 12 minutes until showtime</p>
          </div>
        </div>

        {/* Section 4: Rain Radar */}
        <div className="rounded-xl bg-card gold-border p-6">
          <h2 className="text-base font-bold text-foreground mb-4">🌧️ Weather & Rain Radar</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-muted/20 border border-primary/10 h-64 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground text-sm font-medium">Live Radar Map — Magic Kingdom Area</p>
                <p className="text-xs text-muted-foreground mt-1">Interactive radar coming soon</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-foreground font-semibold">Current</p>
                <p className="text-sm text-muted-foreground">82°F · Partly Cloudy · Humidity 74%</p>
              </div>
              <div>
                <p className="text-sm text-foreground font-semibold">Next hour</p>
                <p className="text-sm text-muted-foreground">⛈️ Storm cell approaching from SW · Arrival: ~34 min</p>
              </div>
              <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4">
                <p className="text-sm text-yellow-400 leading-relaxed">
                  Recommend heading to an indoor attraction by 5:20 PM. Post-storm crowds typically drop 30-40% — great time for outdoor rides after the storm passes.
                </p>
              </div>
              <div>
                <p className="text-sm text-foreground font-semibold">Evening forecast</p>
                <p className="text-sm text-muted-foreground">Clear by 7:30 PM · 76°F · Fireworks will be perfect 🎆</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LivePark;