import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://magicpassplus.com",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

interface TripInput {
  parks: string[];
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  ages?: string;
  ridePreference: string;
  budget: number;
  llOption: string;
  specialNotes?: string;
  apPassTier?: string;
}

interface ItineraryItem {
  time: string;
  activity: string;
  type: "ride" | "dining" | "show" | "break" | "transport" | "rope-drop";
  badge?: string;
  tip: string;
  wait?: number;
  location?: string;
  land?: string;
  priority: "must-do" | "recommended" | "optional";
}

interface DayPlan {
  date: string;
  park: string;
  parkEmoji: string;
  crowdLevel: number;
  items: ItineraryItem[];
  summary: string;
  highlights: string[];
}

// Park knowledge base
const PARK_DATA: Record<string, {
  emoji: string;
  topRides: string[];
  signature: string;
  bestFor: string;
  llPriority: string[];
}> = {
  "Magic Kingdom": {
    emoji: "🏰",
    topRides: ["TRON Lightcycle / Run", "Seven Dwarfs Mine Train", "Big Thunder Mountain Railroad", "Tiana's Bayou Adventure", "Haunted Mansion", "Pirates of the Caribbean"],
    signature: "Cinderella Castle + Happily Ever After fireworks",
    bestFor: "Classic Disney magic, kids, families, fireworks",
    llPriority: ["TRON", "Seven Dwarfs Mine Train"],
  },
  "EPCOT": {
    emoji: "🌍",
    topRides: ["Guardians of the Galaxy: Cosmic Rewind", "Test Track", "Remy's Ratatouille Adventure", "Frozen Ever After", "Soarin'"],
    signature: "World Showcase + Food & Wine + Harmonious",
    bestFor: "Food, culture, adults, International dining",
    llPriority: ["Guardians of the Galaxy", "Cosmic Rewind"],
  },
  "Hollywood Studios": {
    emoji: "🎬",
    topRides: ["Star Wars: Rise of the Resistance", "Millennium Falcon: Smugglers Run", "Slinky Dog Dash", "Tower of Terror", "Rockin' Roller Coaster"],
    signature: "Galaxy's Edge + Fantasmic!",
    bestFor: "Thrill seekers, Star Wars fans, tweens",
    llPriority: ["Rise of the Resistance"],
  },
  "Animal Kingdom": {
    emoji: "🦁",
    topRides: ["Avatar Flight of Passage", "Na'vi River Journey", "Expedition Everest", "Kilimanjaro Safaris", "DINOSAUR"],
    signature: "Pandora + Safari + Tree of Life",
    bestFor: "Nature, adventure, early morning safari",
    llPriority: ["Avatar Flight of Passage"],
  },
};

function getRidesByPreference(park: string, preference: string): string[] {
  const parkInfo = PARK_DATA[park];
  if (!parkInfo) return [];
  
  const all = parkInfo.topRides;
  
  if (preference === "thrill") {
    return all.filter(r => ["TRON", "Big Thunder", "Expedition Everest", "Tower of Terror", "Rockin'", "Rise of the Resistance", "Guardians", "Flight of Passage", "Test Track", "Slinky"].some(t => r.includes(t)));
  }
  if (preference === "little") {
    return all.filter(r => ["Frozen", "Remy", "Na'vi", "Safaris", "Slinky", "Haunted Mansion", "Pirates", "Small World"].some(t => r.includes(t)));
  }
  return all; // mix or family
}

function generateDayItinerary(park: string, date: string, input: TripInput, dayNum: number): DayPlan {
  const parkInfo = PARK_DATA[park] || { emoji: "🎡", topRides: [], signature: "", bestFor: "", llPriority: [] };
  const rides = getRidesByPreference(park, input.ridePreference);
  const isWeekend = [0, 6].includes(new Date(date).getDay());
  const crowdLevel = isWeekend ? 7 : 4;
  
  const items: ItineraryItem[] = [];
  
  // Rope drop
  items.push({
    time: "7:45 AM",
    activity: `Arrive at ${park} — Rope Drop`,
    type: "rope-drop",
    badge: "Rope Drop",
    tip: `Arrive 15-20 min before park open. ${crowdLevel > 5 ? "Weekends are busy — arriving early is critical." : "Great timing — low crowds this day!"}`,
    priority: "must-do",
  });

  // First ride (LL priority if they have it)
  if (parkInfo.llPriority.length > 0 && input.llOption !== "none") {
    const llRide = parkInfo.llPriority[0];
    items.push({
      time: "8:00 AM",
      activity: llRide,
      type: "ride",
      badge: "Lightning Lane",
      tip: `Book your ${llRide} Lightning Lane the moment you enter. These sell out within minutes.`,
      wait: 5,
      location: llRide,
      land: `${park}`,
      priority: "must-do",
    });
  }

  // Morning rides
  const morningRides = rides.slice(0, 3);
  const morningTimes = ["9:15 AM", "10:30 AM", "11:30 AM"];
  morningRides.forEach((ride, i) => {
    if (ride === parkInfo.llPriority[0]) return;
    items.push({
      time: morningTimes[i] || "10:00 AM",
      activity: ride,
      type: "ride",
      tip: `${crowdLevel <= 4 ? "Low crowd window — great time for this one." : "Morning is your best window before crowds build."}`,
      wait: crowdLevel <= 4 ? 15 : 30,
      location: ride,
      land: park,
      priority: "recommended",
    });
  });

  // Lunch break
  items.push({
    time: "12:30 PM",
    activity: "Lunch break",
    type: "dining",
    badge: "Quick Service",
    tip: `Eat lunch slightly early (12:30 instead of 1 PM) to avoid the peak lunch rush. ${park === "EPCOT" ? "World Showcase has incredible international dining options." : ""}`,
    priority: "recommended",
  });

  // Afternoon rest if young kids
  if (input.children > 0) {
    items.push({
      time: "1:30 PM",
      activity: "Rest break / pool time",
      type: "break",
      badge: "Break",
      tip: "Peak crowds are 1-3 PM. Smart families take a midday break and return refreshed for the evening.",
      priority: "recommended",
    });
  }

  // Afternoon rides
  const afternoonRides = rides.slice(3, 6);
  const afternoonTimes = ["2:30 PM", "3:30 PM", "4:30 PM"];
  afternoonRides.forEach((ride, i) => {
    items.push({
      time: afternoonTimes[i] || "3:00 PM",
      activity: ride,
      type: "ride",
      tip: "Afternoon crowds drop significantly after 3 PM. Some of the best waits of the day happen here.",
      wait: crowdLevel <= 4 ? 10 : 20,
      location: ride,
      land: park,
      priority: "recommended",
    });
  });

  // Dinner
  items.push({
    time: "6:00 PM",
    activity: `Dinner at ${park}`,
    type: "dining",
    badge: "Dining",
    tip: `${park === "Magic Kingdom" ? "Be Our Guest (Fantasyland) or Liberty Tree Tavern for a sit-down experience." : park === "EPCOT" ? "World Showcase dining is world-class. Space 220 or Le Cellier if you have a reservation." : "Check your dining alerts for any available reservations tonight."}`,
    priority: "recommended",
  });

  // Evening show / fireworks
  if (park === "Magic Kingdom") {
    items.push({
      time: "8:45 PM",
      activity: "Position for Happily Ever After Fireworks",
      type: "show",
      badge: "Fireworks",
      tip: "Get to Main Street Hub by 8:45 PM. Center position = best projection + fireworks view. The show at 9 PM is not to be missed.",
      location: "Main Street Hub",
      land: "Main Street U.S.A.",
      priority: "must-do",
    });
  } else if (park === "Hollywood Studios") {
    items.push({
      time: "8:00 PM",
      activity: "Fantasmic! Nighttime Show",
      type: "show",
      badge: "Show",
      tip: "Arrive 30-45 min early for good seats. Fantasmic! is a Disney classic — don't miss it.",
      priority: "must-do",
    });
  } else if (park === "EPCOT") {
    items.push({
      time: "9:00 PM",
      activity: "EPCOT Forever or Harmonious Nighttime Show",
      type: "show",
      badge: "Show",
      tip: "World Showcase Lagoon viewing. Arrive 20 min early. Grab a dessert from a World Showcase pavilion to enjoy during the show.",
      priority: "recommended",
    });
  }

  const highlights = [
    parkInfo.llPriority[0] ? `${parkInfo.llPriority[0]} (book LL first thing)` : rides[0],
    parkInfo.signature,
    `${crowdLevel <= 4 ? "🟢 Low crowds expected" : crowdLevel <= 6 ? "🟡 Moderate crowds" : "🔴 Busy day — rope drop critical"}`,
  ].filter(Boolean);

  return {
    date,
    park,
    parkEmoji: parkInfo.emoji,
    crowdLevel,
    items,
    summary: `${parkInfo.bestFor}. ${input.adults + input.children} people, ${input.ridePreference === "thrill" ? "thrill-focused" : input.ridePreference === "little" ? "little ones priority" : "balanced"} day.`,
    highlights,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("x-client-authorization") ?? req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) throw new Error("Invalid session");

    const input: TripInput = await req.json();

    if (!input.parks?.length) throw new Error("Select at least one park");
    if (!input.startDate) throw new Error("Select travel dates");

    // Generate itinerary for each day
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate || input.startDate);
    const numDays = Math.max(1, Math.min(7, Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1));

    const plans: DayPlan[] = [];
    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const parkIndex = i % input.parks.length;
      const park = input.parks[parkIndex];
      
      if (PARK_DATA[park] || park.includes("Typhoon") || park.includes("Blizzard")) {
        plans.push(generateDayItinerary(park, dateStr, input, i + 1));
      }
    }

    // Budget breakdown
    const totalPeople = input.adults + input.children;
    const budgetBreakdown = {
      tickets: input.apPassTier ? 0 : Math.round(totalPeople * 119 * numDays * 0.85),
      hotel: Math.round(200 * numDays),
      dining: Math.round(totalPeople * 65 * numDays),
      ll: input.llOption === "multi" ? Math.round(totalPeople * 22 * numDays) : input.llOption === "individual" ? Math.round(totalPeople * 35) : 0,
      misc: Math.round(totalPeople * 30 * numDays),
    };
    const estimatedTotal = Object.values(budgetBreakdown).reduce((a, b) => a + b, 0);

    return new Response(JSON.stringify({
      success: true,
      plans,
      numDays,
      estimatedTotal,
      budgetBreakdown,
      seed: Date.now(),
      generatedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
