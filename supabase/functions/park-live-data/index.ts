import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

// ThemeParks.wiki park IDs
const PARK_IDS: Record<string, string> = {
  "magic-kingdom": "75ea578a-adc8-4116-a54d-dccb60765ef9",
  "epcot": "47f90d2c-e191-4239-a466-5892ef59a88b",
  "hollywood-studios": "288747d1-8b4f-4a64-867e-ea7c9b27bad8",
  "animal-kingdom": "1c84a229-8862-4648-9c71-378ddd2c7693",
  "typhoon-lagoon": "b070cbc5-feaa-4b87-a8c1-f94cca037a18",
  "blizzard-beach": "ead53ea5-22e5-4095-9a83-8c29300d7c63",
};

// Magic Kingdom ride coordinates (lat/lng) for distance calc
// Sourced from publicly available park maps
const RIDE_COORDS: Record<string, { lat: number; lng: number; area: string; rideTime: number }> = {
  "TRON Lightcycle / Run": { lat: 28.4195, lng: -81.5814, area: "Tomorrowland", rideTime: 1.5 },
  "Space Mountain": { lat: 28.4191, lng: -81.5793, area: "Tomorrowland", rideTime: 2.5 },
  "Tomorrowland Transit Authority PeopleMover": { lat: 28.4183, lng: -81.5793, area: "Tomorrowland", rideTime: 10 },
  "Tomorrowland Speedway": { lat: 28.4196, lng: -81.5783, area: "Tomorrowland", rideTime: 5 },
  "Buzz Lightyear's Space Ranger Spin": { lat: 28.4187, lng: -81.5801, area: "Tomorrowland", rideTime: 5 },
  "Seven Dwarfs Mine Train": { lat: 28.4214, lng: -81.5816, area: "Fantasyland", rideTime: 2.5 },
  "\"it's a small world\"": { lat: 28.4218, lng: -81.5830, area: "Fantasyland", rideTime: 11 },
  "Peter Pan's Flight": { lat: 28.4216, lng: -81.5821, area: "Fantasyland", rideTime: 3 },
  "The Barnstormer": { lat: 28.4224, lng: -81.5827, area: "Fantasyland", rideTime: 1.5 },
  "Dumbo the Flying Elephant": { lat: 28.4218, lng: -81.5832, area: "Fantasyland", rideTime: 2 },
  "Under the Sea - Journey of The Little Mermaid": { lat: 28.4212, lng: -81.5832, area: "Fantasyland", rideTime: 6 },
  "Mad Tea Party": { lat: 28.4209, lng: -81.5822, area: "Fantasyland", rideTime: 2 },
  "Prince Charming Regal Carrousel": { lat: 28.4213, lng: -81.5825, area: "Fantasyland", rideTime: 2 },
  "Mickey's PhilharMagic": { lat: 28.4215, lng: -81.5815, area: "Fantasyland", rideTime: 12 },
  "Big Thunder Mountain Railroad": { lat: 28.4203, lng: -81.5841, area: "Frontierland", rideTime: 3.5 },
  "Tiana's Bayou Adventure": { lat: 28.4193, lng: -81.5842, area: "Frontierland", rideTime: 11 },
  "Haunted Mansion": { lat: 28.4198, lng: -81.5827, area: "Liberty Square", rideTime: 9 },
  "Pirates of the Caribbean": { lat: 28.4188, lng: -81.5836, area: "Adventureland", rideTime: 9 },
  "Jungle Cruise": { lat: 28.4188, lng: -81.5829, area: "Adventureland", rideTime: 10 },
  "Walt Disney's Enchanted Tiki Room": { lat: 28.4185, lng: -81.5833, area: "Adventureland", rideTime: 12 },
};

// Fireworks viewing spots from rides (researched from Disney Tourist Blog, WDWInfo)
// Fireworks viewing data — researched from Magic Kingdom ride experiences
// Community photos enabled for each location
const FIREWORKS_RIDE_DATA: Record<string, { viewQuality: "excellent" | "great" | "good" | "partial"; description: string; tip: string; photoTip: string; emoji: string }> = {
  "TRON Lightcycle / Run": {
    viewQuality: "excellent",
    description: "The undisputed king of fireworks rides. As your Lightcycle launches into the open-air section of the track, the neon canopy disappears and the full Happily Ever After sky opens above you — fireworks bursting in every direction against the glow of Tomorrowland below.",
    tip: "Time your boarding for about 5 minutes before showtime. The open-air section lasts roughly 30 seconds and lines up perfectly with the finale bursts if you board at the right moment.",
    photoTip: "The open section faces northeast — position yourself in the rear cars for the widest sky view. The castle is visible in the distance lit in purple and gold.",
    emoji: "⚡"
  },
  "Big Thunder Mountain Railroad": {
    viewQuality: "great",
    description: "The wildest ride in the wilderness gets even wilder after dark. As your mine train crests the final hill before the big drop, the Frontierland sky opens up and fireworks explode directly overhead — all while you're seconds from a screaming descent into the canyon below.",
    tip: "Sit in the rear cars for the best overhead view at the crest. Aim to board 15-20 minutes before the show so the timing lines up at the top of the hill.",
    photoTip: "The rear of the train crests the hill facing the castle. You'll catch gold and red bursts framed against the Frontierland rockwork — a shot no one else gets.",
    emoji: "🌋"
  },
  "Tiana's Bayou Adventure": {
    viewQuality: "great",
    description: "One of Magic Kingdom's most underrated fireworks experiences. As you climb toward the big drop, the bayou canopy opens and you catch a breathtaking glimpse of the fireworks sky — perfectly framed between the Spanish moss and the night air — right before you plunge into the bayou below.",
    tip: "The fireworks view happens at the very top of the lift hill. Board so you reach the top during the middle or finale of the show for the most dramatic burst-to-drop combo.",
    photoTip: "Front-row riders get a clean sky shot at the top. Castle is visible northwest — look left as you crest the hill for the best framing.",
    emoji: "🎷"
  },
  "Astro Orbiter": {
    viewQuality: "great",
    description: "No ride in Magic Kingdom puts you higher above the action than Astro Orbiter. Spinning 60 feet above Tomorrowland, you get a full 360° view of Happily Ever After — fireworks bursting at eye level in every direction, Cinderella Castle glowing below you, and the entire park lit up like a map.",
    tip: "Lines are minimal during fireworks — everyone is on the ground. Ride it during the show for one of the most cinematic views in the park. Brace for wind at the top.",
    photoTip: "You're literally eye-level with the lower shells. Wide-angle or portrait mode works best — you'll capture bursts, the castle, and Main Street all in one shot from above.",
    emoji: "🚀"
  },
  "Dumbo the Flying Elephant": {
    viewQuality: "good",
    description: "Quietly one of the most magical ways to experience the fireworks. The short line during showtime means you'll be airborne in minutes, floating in gentle circles above Fantasyland while Happily Ever After lights up the sky above you and the little ones beside you experience pure wonder.",
    tip: "This is the perfect fireworks ride for families with young kids. Lines drop to near zero during the show. You'll get 2-3 full laps in the air during the peak of the fireworks.",
    photoTip: "Face your camera up and outward at the top of the circle for bursts framed with the Fantasyland rooftops below. The warm purple and gold shells photograph beautifully from this height.",
    emoji: "🐘"
  },
  "Seven Dwarfs Mine Train": {
    viewQuality: "good",
    description: "When the timing is right, riding Seven Dwarfs Mine Train during the fireworks is pure movie magic. The combination of smooth swooping turns, twinkling gemstones inside the mine, and fireworks bursting above Fantasyland creates a sensory experience you simply cannot recreate anywhere else on earth.",
    tip: "Lines thin significantly during fireworks as most guests stake out viewing spots. Strategic timing here nets you a shorter wait AND a fireworks show from the ride. Board 12-15 minutes before showtime.",
    photoTip: "The outdoor sections face southwest toward the castle. Sit in the rear car and look left during the ascents for the cleanest sky framing with Fantasyland below.",
    emoji: "💎"
  },
  "Jungle Cruise": {
    viewQuality: "good",
    description: "The Jungle Cruise after dark is already a different animal — the lantern glow on the water, the audio jokes that land better at night, the animatronics with a spookier edge. Add Happily Ever After bursting above the tropical canopy and you have one of the most atmospheric fireworks experiences in the park.",
    tip: "Board right as the show begins. The open-air boat gives you clear sky views throughout the entire journey. The skippers often acknowledge the fireworks — it adds to the magic.",
    photoTip: "The boat faces all directions throughout the ride. Look for breaks in the tree canopy — you'll get layered shots of bursts with palm fronds and jungle animals in the foreground.",
    emoji: "🐊"
  },
  "Haunted Mansion": {
    viewQuality: "partial",
    description: "The outdoor queue along the mansion's front grounds offers surprising fireworks views between burst sequences. If you time your wait in the exterior queue, you'll catch flashes of color through the wrought iron gates with the candlelit mansion behind you — genuinely haunting.",
    tip: "Don't rush through the outdoor queue during fireworks season. Stand at the gate section facing the hub for the best sightlines. Inside, the stretching room occasionally syncs with outside bursts audible through the walls.",
    photoTip: "The wrought iron gate with fireworks in the background is one of the most unique shots in Magic Kingdom. Long exposure at night with the gate in foreground = stunning.",
    emoji: "👻"
  },
  "\"it\'s a small world\"": {
    viewQuality: "partial",
    description: "The outdoor boarding area and the final exterior boat section offer glimpses of the fireworks sky. If you're in the outdoor queue as the show begins, you'll see colorful reflections dancing on the water of the loading canal — a surprisingly beautiful and crowd-free vantage point.",
    tip: "The best fireworks views here are actually while you're waiting to board, not while riding. Position yourself in the outdoor queue near the water for the most open sky exposure.",
    photoTip: "The reflection of fireworks in the loading canal at night is an unexpected magic shot. Set your phone to Night mode and capture the bursts reflected in the still water below the clock facade.",
    emoji: "🌍"
  },
};

// Crowd level estimation based on wait times
function estimateCrowdLevel(avgWait: number): { level: number; label: string; color: string } {
  if (avgWait < 15) return { level: 2, label: "Low", color: "green" };
  if (avgWait < 25) return { level: 4, label: "Moderate", color: "green" };
  if (avgWait < 40) return { level: 6, label: "Busy", color: "yellow" };
  if (avgWait < 55) return { level: 8, label: "Very Busy", color: "orange" };
  return { level: 10, label: "Packed", color: "red" };
}

// Haversine distance in meters
function distanceBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Walking time in minutes at different speeds (meters per minute)
const WALK_SPEEDS = {
  slowStroll: 50,    // ~1.8 km/h — elderly, stroller
  standard: 80,      // ~4.8 km/h — average family
  speedWalk: 110,    // ~6.6 km/h — purposeful
  jog: 160,          // ~9.6 km/h
  run: 220,          // ~13.2 km/h
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "wait-times";
    const parkSlug = url.searchParams.get("park") || "magic-kingdom";
    const userLat = parseFloat(url.searchParams.get("lat") || "0");
    const userLng = parseFloat(url.searchParams.get("lng") || "0");
    const userSpeed = parseFloat(url.searchParams.get("speed") || "80"); // meters/min
    const fireworksTime = url.searchParams.get("fireworks"); // ISO time string

    const parkId = PARK_IDS[parkSlug];
    if (!parkId) throw new Error(`Unknown park: ${parkSlug}`);

    // ── WAIT TIMES ──────────────────────────────────────────
    if (action === "wait-times") {
      const liveRes = await fetch(`https://api.themeparks.wiki/v1/entity/${parkId}/live`);
      if (!liveRes.ok) throw new Error("Failed to fetch live data");
      const liveData = await liveRes.json();

      const hasLocation = userLat !== 0 && userLng !== 0;

      const rides = liveData.liveData
        .filter((e: any) => e.entityType === "ATTRACTION")
        .map((e: any) => {
          const standbyWait = e.queue?.STANDBY?.waitTime ?? null;
          const singleRiderWait = e.queue?.SINGLE_RIDER?.waitTime ?? null;
          const llWait = e.queue?.RETURN_TIME?.state ?? null;
          const coords = RIDE_COORDS[e.name];
          const fireworksData = FIREWORKS_RIDE_DATA[e.name];

          let distanceMeters: number | null = null;
          let walkTimes: Record<string, number> | null = null;
          let totalTimeToRide: Record<string, number> | null = null;

          if (hasLocation && coords) {
            distanceMeters = distanceBetween(userLat, userLng, coords.lat, coords.lng);
            walkTimes = {
              slowStroll: Math.round(distanceMeters / WALK_SPEEDS.slowStroll),
              standard: Math.round(distanceMeters / WALK_SPEEDS.standard),
              speedWalk: Math.round(distanceMeters / WALK_SPEEDS.speedWalk),
              jog: Math.round(distanceMeters / WALK_SPEEDS.jog),
              run: Math.round(distanceMeters / WALK_SPEEDS.run),
            };
            // Total time = walk + wait + ride
            if (standbyWait !== null && coords.rideTime) {
              totalTimeToRide = {};
              for (const [speed, walkMin] of Object.entries(walkTimes)) {
                totalTimeToRide[speed] = walkMin + standbyWait + coords.rideTime;
              }
            }
          }

          // Fireworks timing calculation
          let fireworksTiming: any = null;
          if (fireworksTime && coords?.rideTime && standbyWait !== null) {
            const showTime = new Date(fireworksTime);
            const nowTime = new Date();
            const minutesUntilShow = (showTime.getTime() - nowTime.getTime()) / 60000;
            // Get in line time = fireworks - ride duration - current wait - 2 min buffer
            const getInLineMinutes = minutesUntilShow - coords.rideTime - standbyWait - 2;
            const getInLineTime = new Date(nowTime.getTime() + getInLineMinutes * 60000);
            fireworksTiming = {
              minutesUntilShow: Math.round(minutesUntilShow),
              getInLineInMinutes: Math.round(getInLineMinutes),
              getInLineAt: getInLineTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
              feasible: getInLineMinutes > 0,
              fireworksView: fireworksData || null,
            };
          }

          return {
            id: e.id,
            name: e.name,
            status: e.status,
            area: coords?.area || "Unknown",
            standbyWait,
            singleRiderWait,
            llState: llWait,
            lastUpdated: e.lastUpdated,
            rideTime: coords?.rideTime || null,
            distanceMeters: distanceMeters !== null ? Math.round(distanceMeters) : null,
            distanceFeet: distanceMeters !== null ? Math.round(distanceMeters * 3.281) : null,
            walkTimes,
            totalTimeToRide,
            fireworksTiming,
            hasFireworksView: !!fireworksData,
            fireworksViewQuality: fireworksData?.viewQuality || null,
          };
        })
        .sort((a: any, b: any) => {
          // Sort by distance if available, else by wait time
          if (a.distanceMeters !== null && b.distanceMeters !== null) {
            return a.distanceMeters - b.distanceMeters;
          }
          if (a.standbyWait !== null && b.standbyWait !== null) {
            return a.standbyWait - b.standbyWait;
          }
          return 0;
        });

      // Crowd level from average waits
      const waitTimes = rides.filter((r: any) => r.standbyWait !== null && r.status === "OPERATING");
      const avgWait = waitTimes.length > 0
        ? waitTimes.reduce((sum: number, r: any) => sum + r.standbyWait, 0) / waitTimes.length
        : 0;
      const crowd = estimateCrowdLevel(avgWait);

      return new Response(JSON.stringify({
        parkSlug,
        parkId,
        rides,
        crowdLevel: crowd,
        averageWait: Math.round(avgWait),
        totalAttractions: rides.length,
        openAttractions: rides.filter((r: any) => r.status === "OPERATING").length,
        hasUserLocation: hasLocation,
        fetchedAt: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ── PARK SCHEDULE ────────────────────────────────────────
    if (action === "schedule") {
      const schedRes = await fetch(`https://api.themeparks.wiki/v1/entity/${parkId}/schedule`);
      if (!schedRes.ok) throw new Error("Failed to fetch schedule");
      const schedData = await schedRes.json();

      const today = new Date().toISOString().split("T")[0];
      const todaySchedule = schedData.schedule?.filter((s: any) => s.date === today) || [];
      const nextDays = schedData.schedule?.filter((s: any) => s.date > today).slice(0, 7) || [];

      const operating = todaySchedule.find((s: any) => s.type === "OPERATING");
      const earlyEntry = todaySchedule.find((s: any) => s.type === "TICKETED_EVENT" && s.description?.includes("Early Entry"));

      return new Response(JSON.stringify({
        today: {
          date: today,
          openingTime: operating?.openingTime || null,
          closingTime: operating?.closingTime || null,
          earlyEntry: earlyEntry ? { open: earlyEntry.openingTime, close: earlyEntry.closingTime } : null,
          lightningLane: operating?.purchases?.find((p: any) => p.name?.includes("Multi Pass")) || null,
        },
        upcomingDays: nextDays.filter((s: any) => s.type === "OPERATING").map((s: any) => ({
          date: s.date,
          openingTime: s.openingTime,
          closingTime: s.closingTime,
        })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ── FIREWORKS CALCULATOR ─────────────────────────────────
    if (action === "fireworks") {
      const fireworksIso = url.searchParams.get("time");
      if (!fireworksIso) throw new Error("time parameter required (ISO format)");

      const liveRes = await fetch(`https://api.themeparks.wiki/v1/entity/${parkId}/live`);
      const liveData = await liveRes.json();

      const showTime = new Date(fireworksIso);
      const now = new Date();
      const minutesUntil = (showTime.getTime() - now.getTime()) / 60000;

      const results = Object.entries(FIREWORKS_RIDE_DATA).map(([rideName, viewData]) => {
        const liveRide = liveData.liveData?.find((r: any) => r.name === rideName);
        const coords = RIDE_COORDS[rideName];
        const standbyWait = liveRide?.queue?.STANDBY?.waitTime ?? 0;
        const rideTime = coords?.rideTime ?? 5;
        const getInLineIn = minutesUntil - standbyWait - rideTime - 2;
        const getInLineAt = new Date(now.getTime() + getInLineIn * 60000);

        return {
          rideName,
          area: coords?.area || "Unknown",
          viewQuality: viewData.viewQuality,
          description: viewData.description,
          tip: viewData.tip,
          currentWait: standbyWait,
          rideTime,
          getInLineInMinutes: Math.round(getInLineIn),
          getInLineAt: getInLineIn > 0 ? getInLineAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "NOW or skip",
          feasible: getInLineIn > -5,
          status: liveRide?.status || "UNKNOWN",
        };
      }).sort((a, b) => {
        const order = { excellent: 0, great: 1, good: 2, partial: 3 };
        return (order[a.viewQuality as keyof typeof order] || 3) - (order[b.viewQuality as keyof typeof order] || 3);
      });

      return new Response(JSON.stringify({
        fireworksShow: "Happily Ever After",
        showTime: fireworksIso,
        minutesUntilShow: Math.round(minutesUntil),
        rides: results,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
