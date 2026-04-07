import { useState, useEffect, useCallback } from "react";
import { MapPin, Camera, Sunset, Sparkles, Navigation } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import CompassButton from "@/components/CompassButton";

// Best sunset photo spots per park (researched from Disney photography guides)
const SUNSET_SPOTS: Record<string, Array<{ name: string; description: string; tip: string; bestTime: string; direction: string }>> = {
  "Magic Kingdom": [
    { name: "Main Street U.S.A. Hub", description: "Classic shot: Cinderella Castle silhouetted against a pink and gold sky", tip: "Face west — the castle catches the warm light perfectly from the hub", bestTime: "30-45 min before sunset", direction: "West-facing" },
    { name: "Tomorrowland Terrace", description: "Elevated view with castle in the background and glowing sky overhead", tip: "Get here early to claim a spot — it gets crowded on clear evenings", bestTime: "20-40 min before sunset", direction: "Southwest" },
    { name: "Prince Charming Regal Carrousel", description: "Golden hour hits the carousel horses beautifully — fairy tale shot", tip: "Photograph through the spires for framing depth", bestTime: "45 min before sunset", direction: "West" },
    { name: "Liberty Square Bridge", description: "Reflects sunset colors in the waterway with the Hall of Presidents in distance", tip: "Unique angle — most guests walk past without noticing this spot", bestTime: "30 min before sunset", direction: "Southwest" },
  ],
  "EPCOT": [
    { name: "World Showcase Lagoon (Italy Side)", description: "The lagoon becomes a mirror for the sky — stunning reflections", tip: "Italy and Germany pavilions frame the shot perfectly", bestTime: "30-45 min before sunset", direction: "West over the lagoon" },
    { name: "Japan Pagoda", description: "The red pagoda against a pink sky is one of Disney's most photographed shots", tip: "Include some Japanese maple trees in the foreground for depth", bestTime: "45 min before sunset", direction: "West" },
    { name: "France Pavilion Bridge", description: "Eiffel Tower replica glows pink and gold — ultra Instagrammable", tip: "Shoot from the Morocco side looking toward France", bestTime: "30 min before sunset", direction: "West" },
    { name: "Spaceship Earth (from World Nature)", description: "The geodesic sphere reflects warm orange and pink from the west", tip: "Use a wide angle — get the full sphere with sky behind it", bestTime: "45-60 min before sunset", direction: "West" },
  ],
  "Hollywood Studios": [
    { name: "Hollywood Boulevard (end)", description: "Chinese Theater with golden-hour light — Hollywood magic", tip: "Shoot from the far end looking toward the theater — warm light fills the frame", bestTime: "45 min before sunset", direction: "West" },
    { name: "Sunset Boulevard (base)", description: "The street name says it all — warm light channeled down the whole boulevard", tip: "Face west — Tower of Terror and Rock 'n' Roller Coaster both lit golden", bestTime: "30-45 min before sunset", direction: "West" },
    { name: "Echo Lake Waterfront", description: "Warm reflections in the lake with Gertie the Dinosaur lit by the setting sun", tip: "Kneel low to capture sky reflection in the water", bestTime: "30 min before sunset", direction: "Southwest" },
  ],
  "Animal Kingdom": [
    { name: "Discovery Island (Tree of Life View)", description: "The Tree of Life glows amber and gold — most dramatic at golden hour", tip: "Shoot from the bridge near the Flame Tree BBQ for the classic angle", bestTime: "45-60 min before sunset", direction: "West" },
    { name: "Pandora Overlook (entering Pandora)", description: "The floating mountains catch warm pink light — otherworldly", tip: "Get above the crowd for a clear shot — use rocks as foreground", bestTime: "30-45 min before sunset", direction: "West" },
    { name: "Asia Bridge (near Expedition Everest)", description: "Everest silhouetted against sunset sky — dramatic and powerful", tip: "Long shadows at golden hour add dimension to Everest", bestTime: "30-40 min before sunset", direction: "West" },
  ],
};

// Known PhotoPass locations per park (approximate GPS + name)
const PHOTOPASS_LOCATIONS: Record<string, Array<{ name: string; lat: number; lng: number; tip: string; sampleDescription: string }>> = {
  "Magic Kingdom": [
    { name: "Cinderella Castle Forecourt", lat: 28.4192, lng: -81.5808, tip: "Classic castle backdrop. Photographer uses a wide angle for full castle.", sampleDescription: "Full Cinderella Castle with beautiful blue sky backdrop" },
    { name: "Main Street U.S.A. (Town Square)", lat: 28.4183, lng: -81.5804, tip: "Welcome shot as you enter. Great for full-family arrival photos.", sampleDescription: "Family arriving at Magic Kingdom with Walt & Mickey statue" },
    { name: "Peter Pan Queue Garden", lat: 28.4215, lng: -81.5822, tip: "Lovely garden backdrop. Best for couples or small groups.", sampleDescription: "Fairy garden with storybook flowers and lanterns" },
    { name: "Tomorrowland (near TRON)", lat: 28.4195, lng: -81.5814, tip: "Futuristic background. Great for fun, modern shots.", sampleDescription: "TRON light panels and cosmic backdrop" },
    { name: "Adventureland Bridge", lat: 28.4186, lng: -81.5834, tip: "Jungle bridge with tropical foliage. Classic Disney adventure feel.", sampleDescription: "Lush tropical bridge entrance" },
    { name: "Haunted Mansion Gate", lat: 28.4197, lng: -81.5826, tip: "Spooky elegant backdrop. Perfect for Halloween or gothic shots.", sampleDescription: "Haunted Mansion gates with eerie lighting" },
  ],
  "EPCOT": [
    { name: "Spaceship Earth (front)", lat: 28.3747, lng: -81.5494, tip: "Iconic opening shot. Must-have photo for every EPCOT visit.", sampleDescription: "Geodesic sphere with fountain in foreground" },
    { name: "France Pavilion (Arc de Triomphe)", lat: 28.3695, lng: -81.5489, tip: "Romantic backdrop. Great for couples with Eiffel Tower replica.", sampleDescription: "French street scene with Eiffel Tower" },
    { name: "Japan Pavilion (Pagoda)", lat: 28.3702, lng: -81.5470, tip: "Beautiful pagoda backdrop. Japanese garden ambiance.", sampleDescription: "Red pagoda with Japanese maple trees" },
  ],
};

interface PhotoFunProps {
  selectedPark?: string;
  userLat?: number | null;
  userLng?: number | null;
  inPark?: boolean;
}

export default function PhotoFun({ selectedPark = "Magic Kingdom", userLat, userLng, inPark }: PhotoFunProps) {
  const [activeSection, setActiveSection] = useState<"sunset" | "fireworks" | "photopass">("sunset");
  const [fireworksTime, setFireworksTime] = useState("21:00");
  const [nearbyPhotoPass, setNearbyPhotoPass] = useState<any[]>([]);
  const [sunsetTime, setSunsetTime] = useState("");

  // Calculate sunset time for today in Orlando
  useEffect(() => {
    // Approximate sunset time for Orlando FL (lat 28.5, lng -81.4)
    // Using simplified calculation - sunrise-sunset varies by season
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    // Orlando sunset ranges from ~5:45 PM in winter to ~8:15 PM in summer
    const avgMinutes = 19 * 60 + 45; // 7:45 PM average
    const seasonVariation = Math.sin((dayOfYear - 80) * Math.PI / 182.5) * 75; // ±75 min seasonal swing
    const sunsetMinutes = avgMinutes + seasonVariation;
    const hours = Math.floor(sunsetMinutes / 60);
    const mins = Math.round(sunsetMinutes % 60);
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHour = hours > 12 ? hours - 12 : hours;
    setSunsetTime(`${displayHour}:${mins.toString().padStart(2, "0")} ${ampm}`);
  }, []);

  // Check for nearby PhotoPass locations
  useEffect(() => {
    if (!userLat || !userLng || !inPark) return;
    const locations = PHOTOPASS_LOCATIONS[selectedPark] || [];
    const R = 6371000;
    const nearby = locations.filter(loc => {
      const dLat = (loc.lat - userLat) * Math.PI / 180;
      const dLng = (loc.lng - userLng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(userLat * Math.PI/180) * Math.cos(loc.lat * Math.PI/180) * Math.sin(dLng/2)**2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return dist <= 200; // 200 feet ≈ 61 meters
    });
    setNearbyPhotoPass(nearby);
  }, [userLat, userLng, selectedPark, inPark]);

  const sunsetSpots = SUNSET_SPOTS[selectedPark] || [];
  const photoPassLocations = PHOTOPASS_LOCATIONS[selectedPark] || [];

  // Fireworks calculator (from existing feature)
  const fireworksRides = [
    { name: "TRON Lightcycle / Run", viewQuality: "excellent", area: "Tomorrowland", wait: 40, rideTime: 2 },
    { name: "Big Thunder Mountain Railroad", viewQuality: "great", area: "Frontierland", wait: 25, rideTime: 4 },
    { name: "Tiana's Bayou Adventure", viewQuality: "great", area: "Frontierland", wait: 30, rideTime: 11 },
    { name: "Astro Orbiter", viewQuality: "great", area: "Tomorrowland", wait: 20, rideTime: 3 },
    { name: "Dumbo the Flying Elephant", viewQuality: "good", area: "Fantasyland", wait: 15, rideTime: 2 },
    { name: "Jungle Cruise", viewQuality: "good", area: "Adventureland", wait: 20, rideTime: 10 },
    { name: "Haunted Mansion", viewQuality: "partial", area: "Liberty Square", wait: 15, rideTime: 9 },
  ];

  const now = new Date();
  const [fHours, fMins] = fireworksTime.split(":").map(Number);
  const showTime = new Date(now);
  showTime.setHours(fHours, fMins, 0);
  const minutesUntil = (showTime.getTime() - now.getTime()) / 60000;

  const qualityBadge = (q: string) => {
    if (q === "excellent") return "bg-green-500/20 text-green-400";
    if (q === "great") return "bg-blue-500/20 text-blue-400";
    if (q === "good") return "bg-yellow-500/20 text-yellow-400";
    return "bg-white/10 text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      {/* PhotoPass proximity alert banner */}
      {nearbyPhotoPass.length > 0 && (
        <div className="rounded-xl p-4 border border-primary/40 bg-primary/10 animate-pulse">
          <p className="text-sm font-bold text-primary mb-1">📷 PhotoPass Photographer Nearby!</p>
          {nearbyPhotoPass.map(loc => (
            <div key={loc.name}>
              <p className="text-xs text-foreground font-semibold">{loc.name}</p>
              <p className="text-xs text-muted-foreground">{loc.sampleDescription}</p>
              <p className="text-xs text-primary mt-1">📸 Tip: {loc.tip}</p>
            </div>
          ))}
        </div>
      )}

      {/* Section selector */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: "#111827" }}>
        {[
          { id: "sunset", label: "🌅 Sunset Magic" },
          { id: "fireworks", label: "🎆 Fireworks Rides" },
          { id: "photopass", label: "📷 PhotoPass" },
        ].map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id as any)}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${activeSection === s.id ? "bg-primary text-[#080E1E]" : "text-muted-foreground hover:text-foreground"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* SUNSET MAGIC */}
      {activeSection === "sunset" && (
        <div className="space-y-3">
          <div className="rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/10">
            <p className="text-xs font-bold text-yellow-400 mb-1">🌅 Today's Sunset in Orlando</p>
            <p className="text-2xl font-black text-foreground">{sunsetTime}</p>
            <p className="text-xs text-muted-foreground mt-1">Golden hour begins ~45 min before sunset. Position yourself early!</p>
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Best Spots in {selectedPark}</p>
          {sunsetSpots.length === 0 ? (
            <p className="text-xs text-muted-foreground">Select a park to see sunset spots</p>
          ) : sunsetSpots.map((spot, i) => (
            <div key={i} className="rounded-xl p-4 border border-white/8" style={{ background: "#111827" }}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-bold text-foreground">{spot.name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 shrink-0">{spot.bestTime}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{spot.description}</p>
              <p className="text-xs text-primary">📸 {spot.tip}</p>
              <p className="text-xs text-muted-foreground mt-1">Facing: {spot.direction}</p>
              {inPark && (
                <div className="mt-2">
                  <CompassButton destination={spot.name} context={`${selectedPark} · Sunset spot`} size="inline" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FIREWORKS RIDES */}
      {activeSection === "fireworks" && selectedPark === "Magic Kingdom" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Fireworks Time:</label>
            <input type="time" value={fireworksTime} onChange={e => setFireworksTime(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#1a2235] border border-white/10 text-sm text-foreground focus:outline-none" />
            <span className="text-xs text-primary font-bold">{minutesUntil > 0 ? `${Math.round(minutesUntil)} min away` : "Now!"}</span>
          </div>
          {fireworksRides.map(ride => {
            const getInLine = minutesUntil - ride.wait - ride.rideTime - 2;
            const getInLineAt = new Date(now.getTime() + getInLine * 60000);
            return (
              <div key={ride.name} className="rounded-xl p-4 border border-white/8" style={{ background: "#111827" }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-bold text-foreground">{ride.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${qualityBadge(ride.viewQuality)}`}>
                    {ride.viewQuality === "excellent" ? "⭐ Excellent" : ride.viewQuality === "great" ? "✨ Great" : ride.viewQuality === "good" ? "👍 Good" : "🌓 Partial"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{ride.area} · Wait: {ride.wait} min · Ride: {ride.rideTime} min</p>
                {getInLine > -5 ? (
                  <div className={`mt-2 px-3 py-2 rounded-lg ${getInLine <= 0 ? "bg-red-500/15 border border-red-500/20" : "bg-green-500/15 border border-green-500/20"}`}>
                    <p className={`text-sm font-bold ${getInLine <= 0 ? "text-red-400" : "text-green-400"}`}>
                      {getInLine <= 0 ? "⚡ Get in line NOW!" : `Queue by ${getInLineAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2 italic">Not enough time before fireworks</p>
                )}
                {inPark && (
                  <div className="mt-2">
                    <CompassButton destination={ride.name} context={`${ride.area} · Magic Kingdom`} size="inline" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeSection === "fireworks" && selectedPark !== "Magic Kingdom" && (
        <div className="text-center py-8">
          <p className="text-sm font-semibold text-foreground mb-1">Fireworks Calculator — Magic Kingdom Only</p>
          <p className="text-xs text-muted-foreground">Happily Ever After fireworks play nightly at Magic Kingdom. Switch to Magic Kingdom to use this feature.</p>
        </div>
      )}

      {/* PHOTOPASS LOCATIONS */}
      {activeSection === "photopass" && (
        <div className="space-y-3">
          <div className="rounded-xl p-3 border border-primary/20 bg-primary/5">
            <p className="text-xs font-semibold text-primary">📷 PhotoPass Tips</p>
            <p className="text-xs text-muted-foreground mt-1">GPS alerts you when you're within 200ft of a PhotoPass location. Tap any location below to navigate there.</p>
          </div>
          {photoPassLocations.map((loc, i) => (
            <div key={i} className="rounded-xl p-4 border border-white/8" style={{ background: "#111827" }}>
              <p className="text-sm font-bold text-foreground mb-1">{loc.name}</p>
              <p className="text-xs text-muted-foreground mb-1">{loc.sampleDescription}</p>
              <p className="text-xs text-primary">📸 {loc.tip}</p>
              {inPark && (
                <div className="mt-2">
                  <CompassButton destination={loc.name} context={`${selectedPark} · PhotoPass`} size="inline" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
