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
const FIREWORKS_RIDE_DATA: Record<string, { viewQuality: "excellent" | "great" | "good" | "partial"; description: string; tip: string }> = {
  "Big Thunder Mountain Railroad": {
    viewQuality: "great",
    description: "Brilliant overhead view of fireworks as you crest the final hill",
    tip: "Get in line so you exit during the finale — the timing is magical from the final drop"
  },
  "Tiana's Bayou Adventure": {
    viewQuality: "great",
    description: "Clear sky view of castle fireworks from the open-air sections of the ride",
    tip: "Aim for the second half of the show — the log flume exit area has a direct castle sightline"
  },
  "\"it's a small world\"": {
    viewQuality: "good",
    description: "Partially visible through the outdoor section near the loading area",
    tip: "The outdoor waiting area and boarding zone offer partial fireworks views between launches"
  },
  "Jungle Cruise": {
    viewQuality: "good",
    description: "Open-air ride with overhead sky visibility throughout",
    tip: "Evening boat rides have clear sky views — time to be on the river during the finale"
  },
  "Walt Disney's Enchanted Tiki Room": {
    viewQuality: "partial",
    description: "Exit area has an open courtyard with castle fireworks visible",
    tip: "Position yourself at the exit during the show — the courtyard faces the castle"
  },
  "Haunted Mansion": {
    viewQuality: "partial",
    description: "The stretching room delay sometimes syncs with fireworks bursts overhead",
    tip: "The outdoor queue area near Liberty Square has good sky views before boarding"
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
