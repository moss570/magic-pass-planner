import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

interface TripInput {
  parks: string[]; startDate: string; endDate: string;
  adults: number; children: number; ages?: string;
  ridePreference: string; budget: number; llOption: string;
  specialNotes?: string; apPassTier?: string;
}

// 2026 Disney World pricing data
const TICKET_PRICES = {
  oneDay: { adult: { weekday: 119, weekend: 189 }, child: { weekday: 114, weekend: 179 } },
  twoDay: { adult: 270, child: 255 },
  threeDay: { adult: 385, child: 365 },
  fourDay: { adult: 469, child: 449 },
  fiveDay: { adult: 529, child: 509 },
  sevenDay: { adult: 589, child: 569 },
  annualPass: { pixieDust: 399, pirate: 649, sorcerer: 899, incredi: 1399 },
};

const HOTELS = {
  value: [
    { name: "Disney's All-Star Music Resort", priceRange: "$125-200/night", tier: "Value", amenities: ["Pool", "Shuttle", "Food Court"], bestFor: "Budget families" },
    { name: "Disney's All-Star Sports Resort", priceRange: "$115-190/night", tier: "Value", amenities: ["Pool", "Shuttle", "Food Court"], bestFor: "Sports fans, budget" },
    { name: "Disney's Pop Century Resort", priceRange: "$135-220/night", tier: "Value", amenities: ["Skyliner", "Pool", "Food Court"], bestFor: "EPCOT/HS access via Skyliner" },
    { name: "Disney's Art of Animation Resort", priceRange: "$185-290/night", tier: "Value+", amenities: ["Skyliner", "Pool", "Family Suites"], bestFor: "Families with kids" },
  ],
  moderate: [
    { name: "Disney's Caribbean Beach Resort", priceRange: "$270-400/night", tier: "Moderate", amenities: ["Skyliner", "Pool", "Table Service"], bestFor: "EPCOT/HS via Skyliner, relaxed vibe" },
    { name: "Disney's Coronado Springs Resort", priceRange: "$290-440/night", tier: "Moderate", amenities: ["Pool", "Gran Destino Tower", "Multiple Dining"], bestFor: "Adults, couples, convention guests" },
    { name: "Disney's Port Orleans Riverside", priceRange: "$260-390/night", tier: "Moderate", amenities: ["Boat to Disney Springs", "Pool", "Charming Atmosphere"], bestFor: "Romance, relaxed pace" },
  ],
  deluxe: [
    { name: "Disney's Grand Floridian Resort & Spa", priceRange: "$750-1,800/night", tier: "Deluxe", amenities: ["Monorail", "Multiple Fine Dining", "Spa"], bestFor: "Luxury, honeymoons, special occasions" },
    { name: "Disney's Wilderness Lodge", priceRange: "$430-800/night", tier: "Deluxe", amenities: ["Boat to MK", "Pools", "Artist Point"], bestFor: "Nature lovers, quieter luxury" },
    { name: "Disney's Contemporary Resort", priceRange: "$580-1,200/night", tier: "Deluxe", amenities: ["Monorail (steps from MK)", "California Grill", "Pool"], bestFor: "Magic Kingdom focus, monorail access" },
    { name: "Disney's Animal Kingdom Lodge", priceRange: "$400-900/night", tier: "Deluxe", amenities: ["Savanna Views", "Jiko", "Boma"], bestFor: "Animal lovers, unique African dining" },
  ],
  offsite: [
    { name: "Hilton Orlando Bonnet Creek", priceRange: "$180-350/night", tier: "Off-Site Premium", amenities: ["Free Disney Shuttle", "Pool", "Multiple Dining"], bestFor: "Value-conscious, large groups" },
    { name: "Marriott World Center", priceRange: "$200-400/night", tier: "Off-Site Premium", amenities: ["Disney Area", "Pool", "Golf"], bestFor: "Convention guests, families" },
  ],
};

// Dining recommendations by park
const DINING_RECOMMENDATIONS: Record<string, Array<{name: string; type: string; priceRange: string; why: string; reservationTips: string}>> = {
  "Magic Kingdom": [
    { name: "Be Our Guest Restaurant", type: "Table Service", priceRange: "$$$", why: "Iconic Beast's Castle dining, breakfast/lunch/dinner", reservationTips: "Book 60 days out — sells out in minutes" },
    { name: "Cinderella's Royal Table", type: "Character Dining", priceRange: "$$$$", why: "Inside the castle, princess characters, unforgettable experience", reservationTips: "Book exactly at the 60-day mark — most popular in WDW" },
    { name: "Liberty Tree Tavern", type: "Table Service", priceRange: "$$$", why: "Colonial American comfort food, turkey leg highlights", reservationTips: "Easier to get than castle dining, 3-4 weeks out" },
    { name: "Columbia Harbour House", type: "Quick Service", priceRange: "$$", why: "Best quick service in MK, upstairs seating with great views", reservationTips: "No reservation needed — go at off-peak times" },
  ],
  "EPCOT": [
    { name: "Space 220 Restaurant", type: "Table Service", priceRange: "$$$$", why: "Incredible 'space station' atmosphere, must-see experience", reservationTips: "Book immediately — hardest table in WDW to get" },
    { name: "Le Cellier Steakhouse", type: "Signature Dining", priceRange: "$$$$", why: "Best steak in WDW, Canadian atmosphere in World Showcase", reservationTips: "Book 45-60 days out" },
    { name: "Via Napoli", type: "Table Service", priceRange: "$$$", why: "Authentic Neapolitan pizza in Italy pavilion", reservationTips: "Easier than other EPCOT Signature dining" },
    { name: "Topolino's Terrace", type: "Character Dining", priceRange: "$$$$", why: "Rooftop character breakfast at EPCOT resort area", reservationTips: "Book 45 days out for breakfast" },
  ],
  "Hollywood Studios": [
    { name: "Sci-Fi Dine-In Theater", type: "Table Service", priceRange: "$$$", why: "Unique drive-in movie atmosphere, 1950s B-movies playing", reservationTips: "2-3 weeks out usually works" },
    { name: "50's Prime Time Café", type: "Table Service", priceRange: "$$$", why: "Interactive servers, comfort food, retro kitchen decor", reservationTips: "1-2 weeks out" },
    { name: "Oga's Cantina", type: "Bar/Lounge", priceRange: "$$", why: "Galaxy's Edge cocktail bar, Star Wars experience, no kids after 10PM", reservationTips: "Book 60 days out — 45 min max stay" },
  ],
  "Animal Kingdom": [
    { name: "Tiffins Restaurant", type: "Signature Dining", priceRange: "$$$$", why: "Best food in AK, globally-inspired menu, beautiful decor", reservationTips: "2-3 weeks out" },
    { name: "Tusker House Restaurant", type: "Character Dining", priceRange: "$$$", why: "African buffet with Donald Duck & friends, great variety", reservationTips: "3-4 weeks out" },
    { name: "Yak & Yeti Restaurant", type: "Table Service", priceRange: "$$$", why: "Pan-Asian cuisine in Asia section, outdoor seating", reservationTips: "1-2 weeks out" },
  ],
};

const PARK_DATA: Record<string, { emoji: string; topRides: string[]; signature: string; bestFor: string; llPriority: string[] }> = {
  "Magic Kingdom": { emoji: "🏰", topRides: ["TRON Lightcycle / Run", "Seven Dwarfs Mine Train", "Big Thunder Mountain Railroad", "Tiana's Bayou Adventure", "Haunted Mansion", "Pirates of the Caribbean"], signature: "Cinderella Castle + Happily Ever After fireworks", bestFor: "Classic Disney magic, kids, families, fireworks", llPriority: ["TRON Lightcycle / Run", "Seven Dwarfs Mine Train"] },
  "EPCOT": { emoji: "🌍", topRides: ["Guardians of the Galaxy: Cosmic Rewind", "Test Track", "Remy's Ratatouille Adventure", "Frozen Ever After", "Soarin'"], signature: "World Showcase + international dining", bestFor: "Food, culture, adults, International dining", llPriority: ["Guardians of the Galaxy: Cosmic Rewind"] },
  "Hollywood Studios": { emoji: "🎬", topRides: ["Star Wars: Rise of the Resistance", "Millennium Falcon: Smugglers Run", "Slinky Dog Dash", "Tower of Terror", "Rockin' Roller Coaster"], signature: "Galaxy's Edge + Fantasmic!", bestFor: "Thrill seekers, Star Wars fans, tweens", llPriority: ["Rise of the Resistance"] },
  "Animal Kingdom": { emoji: "🦁", topRides: ["Avatar Flight of Passage", "Na'vi River Journey", "Expedition Everest", "Kilimanjaro Safaris"], signature: "Pandora + Safari + Tree of Life", bestFor: "Nature, adventure, early morning safari", llPriority: ["Avatar Flight of Passage"] },
};

function calculateTicketCost(adults: number, children: number, numDays: number, budget: number, apTier?: string): {
  cost: number; recommendation: string; perPersonPerDay: number; options: string[];
} {
  if (apTier) return { cost: 0, recommendation: `Annual Pass (${apTier}) — tickets included!`, perPersonPerDay: 0, options: [] };
  
  const tp = TICKET_PRICES;
  const dayKey = numDays === 1 ? "oneDay" : numDays === 2 ? "twoDay" : numDays === 3 ? "threeDay" : numDays === 4 ? "fourDay" : numDays <= 5 ? "fiveDay" : "sevenDay";
  
  let adultCost = 0, childCost = 0;
  if (numDays === 1) {
    adultCost = tp.oneDay.adult.weekday;
    childCost = tp.oneDay.child.weekday;
  } else {
    adultCost = (tp as any)[dayKey]?.adult || tp.sevenDay.adult;
    childCost = (tp as any)[dayKey]?.child || tp.sevenDay.child;
  }
  
  const totalCost = (adults * adultCost) + (children * childCost);
  const perPersonPerDay = Math.round((adults * adultCost + children * childCost) / (adults + children) / numDays);
  
  const options = [
    `${numDays}-Day Tickets: Adults $${adultCost}/person${children > 0 ? `, Children $${childCost}/person` : ""}`,
    `Total tickets: $${totalCost}`,
    numDays >= 3 ? "💡 Tip: Add Park Hopper for $65/person to visit multiple parks daily" : "",
  ].filter(Boolean);
  
  // If AP makes sense (visiting 3+ days, would visit again)
  if (numDays >= 3 && adults * tp.annualPass.sorcerer < adults * adultCost * 2) {
    options.push(`💡 Annual Pass may save money if you visit twice/year (Sorcerer: $${tp.annualPass.sorcerer}/person)`);
  }
  
  return { cost: totalCost, recommendation: `${numDays}-Day Ticket`, perPersonPerDay, options };
}

function recommendHotel(budget: number, numDays: number, adults: number, children: number, parks: string[]): {
  recommendations: typeof HOTELS.value; tier: string; nightlyBudget: number;
} {
  const peopleCost = (adults + children) * 65 * numDays; // dining estimate
  const llCost = adults * 22 * numDays;
  const ticketCost = adults * 469; // rough 4-day estimate
  const remaining = budget - ticketCost - peopleCost - llCost;
  const nightlyBudget = Math.round(remaining / numDays);
  
  let tier = "value";
  let recommendations = HOTELS.value;
  
  if (nightlyBudget >= 700) { tier = "deluxe"; recommendations = HOTELS.deluxe; }
  else if (nightlyBudget >= 350) { tier = "moderate-deluxe"; recommendations = [...HOTELS.moderate, HOTELS.deluxe[2]]; }
  else if (nightlyBudget >= 200) { tier = "moderate"; recommendations = HOTELS.moderate; }
  else if (nightlyBudget >= 100) { tier = "value"; recommendations = HOTELS.value; }
  else { tier = "offsite"; recommendations = HOTELS.offsite; }
  
  // Smart recommendation based on parks
  if (parks.includes("EPCOT") || parks.includes("Hollywood Studios")) {
    const skyliner = HOTELS.value.filter(h => h.amenities.includes("Skyliner"));
    if (skyliner.length && nightlyBudget < 350) recommendations = [...skyliner, ...recommendations.slice(0, 2)];
  }
  if (parks.includes("Magic Kingdom") && nightlyBudget >= 580) {
    const monorail = HOTELS.deluxe.filter(h => h.amenities.some(a => a.includes("Monorail")));
    if (monorail.length) recommendations = [...monorail, ...recommendations.slice(0, 2)];
  }
  
  return { recommendations: recommendations.slice(0, 3), tier, nightlyBudget };
}

function generateDayItinerary(park: string, date: string, input: TripInput, dayNum: number) {
  const parkInfo = PARK_DATA[park] || { emoji: "🎡", topRides: [], signature: "", bestFor: "", llPriority: [] };
  const isWeekend = [0, 6].includes(new Date(date).getDay());
  const crowdLevel = isWeekend ? 7 : 4;
  const items: any[] = [];

  items.push({ time: "7:45 AM", activity: `Arrive at ${park} — Rope Drop`, type: "rope-drop", badge: "Rope Drop", tip: `Arrive 15-20 min before park open. ${crowdLevel > 5 ? "Weekends are busy — arriving early is critical." : "Great timing — low crowds this day!"}`, priority: "must-do" });

  if (parkInfo.llPriority.length > 0 && input.llOption !== "none") {
    items.push({ time: "8:00 AM", activity: parkInfo.llPriority[0], type: "ride", badge: "Lightning Lane", tip: `Book your ${parkInfo.llPriority[0]} Lightning Lane the moment you enter. These sell out within minutes.`, wait: 5, location: parkInfo.llPriority[0], land: park, priority: "must-do" });
  }

  const rides = parkInfo.topRides.filter(r => r !== parkInfo.llPriority[0]);
  const times = ["9:15 AM", "10:30 AM", "11:30 AM", "2:30 PM", "3:30 PM", "4:30 PM"];
  rides.slice(0, 3).forEach((ride, i) => {
    items.push({ time: times[i] || "10:00 AM", activity: ride, type: "ride", tip: i === 0 ? "Morning is your best window before crowds build." : "Afternoon crowds drop significantly after 3 PM.", wait: crowdLevel <= 4 ? 15 : 30, location: ride, land: park, priority: "recommended" });
  });

  items.push({ time: "12:30 PM", activity: "Lunch", type: "dining", badge: "Quick Service", tip: `Eat at 12:30 to beat the 1 PM rush. ${park === "EPCOT" ? "World Showcase has incredible international options." : ""}`, priority: "recommended" });

  if (input.children > 0) {
    items.push({ time: "1:30 PM", activity: "Rest break / pool time", type: "break", badge: "Break", tip: "Peak crowds are 1-3 PM. Smart families take a midday break.", priority: "recommended" });
  }

  rides.slice(3, 6).forEach((ride, i) => {
    items.push({ time: times[i + 3] || "3:00 PM", activity: ride, type: "ride", tip: "Afternoon crowds often drop significantly — great time for these.", wait: crowdLevel <= 4 ? 10 : 20, location: ride, land: park, priority: "recommended" });
  });

  items.push({ time: "6:00 PM", activity: "Dinner", type: "dining", badge: "Dining", tip: DINING_RECOMMENDATIONS[park]?.[0] ? `Consider ${DINING_RECOMMENDATIONS[park][0].name} — ${DINING_RECOMMENDATIONS[park][0].why}` : "Check your dining alerts for any available reservations.", priority: "recommended" });

  if (park === "Magic Kingdom") {
    items.push({ time: "8:45 PM", activity: "Happily Ever After Fireworks", type: "show", badge: "Fireworks", tip: "Get to Main Street Hub by 8:45 PM. Don't miss this.", location: "Main Street Hub", land: "Main Street U.S.A.", priority: "must-do" });
  } else if (park === "Hollywood Studios") {
    items.push({ time: "8:00 PM", activity: "Fantasmic! Nighttime Show", type: "show", badge: "Show", tip: "Arrive 30-45 min early for good seats.", priority: "must-do" });
  }

  return {
    date, park, parkEmoji: parkInfo.emoji, crowdLevel, items,
    summary: `${parkInfo.bestFor}.`,
    highlights: [parkInfo.llPriority[0] ? `${parkInfo.llPriority[0]} (book LL first)` : rides[0], parkInfo.signature, crowdLevel <= 4 ? "🟢 Low crowds" : crowdLevel <= 6 ? "🟡 Moderate crowds" : "🔴 Busy day"].filter(Boolean),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });

  try {
    const authHeader = req.headers.get("x-client-authorization") ?? req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) throw new Error("Invalid session");

    const input: TripInput = await req.json();
    if (!input.parks?.length) throw new Error("Select at least one park");
    if (!input.startDate) throw new Error("Select travel dates");

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate || input.startDate);
    const numDays = Math.max(1, Math.min(7, Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1));
    const totalPeople = input.adults + input.children;

    // Generate day plans
    const plans = [];
    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const parkIndex = i % input.parks.length;
      const park = input.parks[parkIndex];
      if (PARK_DATA[park]) plans.push(generateDayItinerary(park, date.toISOString().split("T")[0], input, i + 1));
    }

    // Accurate budget breakdown
    const tickets = calculateTicketCost(input.adults, input.children, numDays, input.budget, input.apPassTier);
    const llCost = input.llOption === "multi" ? Math.round(totalPeople * 22 * numDays) : input.llOption === "individual" ? Math.round(input.adults * 35) : 0;
    const diningPerDay = input.adults * 75 + input.children * 45;
    const diningTotal = diningPerDay * numDays;
    const miscTotal = Math.round(totalPeople * 35 * numDays);
    
    const hotelRec = recommendHotel(input.budget, numDays, input.adults, input.children, input.parks);
    const hotelEstimate = hotelRec.nightlyBudget * numDays;
    const estimatedTotal = tickets.cost + llCost + diningTotal + miscTotal + hotelEstimate;

    const budgetBreakdown = {
      tickets: tickets.cost,
      hotel: hotelEstimate,
      dining: diningTotal,
      lightningLane: llCost,
      miscSouvenirs: miscTotal,
    };

    // Dining recommendations for parks visited
    const uniqueParks = [...new Set(input.parks)];
    const diningRecs: Record<string, typeof DINING_RECOMMENDATIONS["Magic Kingdom"]> = {};
    uniqueParks.forEach(park => {
      if (DINING_RECOMMENDATIONS[park]) diningRecs[park] = DINING_RECOMMENDATIONS[park];
    });

    return new Response(JSON.stringify({
      success: true, plans, numDays, estimatedTotal, budgetBreakdown,
      ticketInfo: tickets,
      hotelRecommendations: hotelRec.recommendations,
      hotelTier: hotelRec.tier,
      hotelNightlyBudget: hotelRec.nightlyBudget,
      diningRecommendations: diningRecs,
      seed: Date.now(),
      generatedAt: new Date().toISOString(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
