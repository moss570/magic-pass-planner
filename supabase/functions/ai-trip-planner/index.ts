import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

// ─── MAGIC KINGDOM PARK MAP ──────────────────────────────────────────────────
// Positions are relative (0-100 scale), approximate from park map
// Origin (0,0) = Main Gate / Town Square
const MK_LOCATIONS: Record<string, {
  x: number; y: number; land: string;
  rideTime?: number; category: "ride" | "dining" | "show" | "landmark";
  thrillLevel: 1 | 2 | 3 | 4 | 5;  // 1=family, 5=extreme thrill
  avgWait: { low: number; moderate: number; high: number };
  llAvailable: boolean;
  tips: string;
}> = {
  // Main Street / Entry
  "Main Gate / Town Square":         { x: 50, y: 0,  land: "Main Street U.S.A.", category: "landmark", thrillLevel: 1, avgWait: {low:0,moderate:0,high:0}, llAvailable:false, tips:"Start of the day" },
  "Cinderella Castle":               { x: 50, y: 50, land: "Hub", category: "landmark", thrillLevel: 1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"Photo spot, center of the park" },
  "Walt Disney's Carousel of Progress":{ x:80,y:75,land:"Tomorrowland",category:"show",thrillLevel:1,avgWait:{low:5,moderate:5,high:5},llAvailable:false,tips:"Great A/C break, 21 min show" },
  "Tomorrowland Terrace":            { x:70, y:60, land:"Tomorrowland",category:"dining",thrillLevel:1,avgWait:{low:5,moderate:10,high:15},llAvailable:false,tips:"Quick service, good views of castle" },
  
  // Tomorrowland
  "TRON Lightcycle / Run":           { x:85, y:80, land:"Tomorrowland", rideTime:2, category:"ride", thrillLevel:5, avgWait:{low:40,moderate:75,high:120}, llAvailable:true, tips:"Book LL the instant you enter. Fastest coaster on property." },
  "Space Mountain":                  { x:88, y:75, land:"Tomorrowland", rideTime:3, category:"ride", thrillLevel:4, avgWait:{low:25,moderate:55,high:90}, llAvailable:true, tips:"Dark indoor coaster, classic WDW. LL usually available." },
  "Buzz Lightyear's Space Ranger Spin":{ x:82, y:68, land:"Tomorrowland", rideTime:5, category:"ride", thrillLevel:2, avgWait:{low:15,moderate:30,high:50}, llAvailable:false, tips:"Interactive shooter, good for all ages" },
  "Tomorrowland Transit Authority PeopleMover":{ x:85,y:70,land:"Tomorrowland",rideTime:10,category:"ride",thrillLevel:1,avgWait:{low:5,moderate:10,high:15},llAvailable:false,tips:"Great overview of Tomorrowland, almost no wait" },
  "Tomorrowland Speedway":           { x:78, y:85, land:"Tomorrowland", rideTime:5, category:"ride", thrillLevel:1, avgWait:{low:15,moderate:30,high:45}, llAvailable:false, tips:"Cars on a track, popular with kids" },
  "Astro Orbiter":                   { x:83, y:65, land:"Tomorrowland", rideTime:3, category:"ride", thrillLevel:2, avgWait:{low:15,moderate:25,high:40}, llAvailable:false, tips:"Elevated rockets, great views. Go in evening." },
  
  // Fantasyland
  "Seven Dwarfs Mine Train":         { x:55, y:80, land:"Fantasyland", rideTime:3, category:"ride", thrillLevel:3, avgWait:{low:35,moderate:70,high:110}, llAvailable:true, tips:"Most popular family coaster, book LL immediately after TRON" },
  "Peter Pan's Flight":              { x:45, y:75, land:"Fantasyland", rideTime:3, category:"ride", thrillLevel:2, avgWait:{low:40,moderate:75,high:110}, llAvailable:true, tips:"Despite being a gentle ride, waits are always long" },
  "\"it's a small world\"":          { x:40, y:82, land:"Fantasyland", rideTime:11, category:"ride", thrillLevel:1, avgWait:{low:5,moderate:15,high:25}, llAvailable:false, tips:"Classic, very low waits, great midday refuge" },
  "Under the Sea - Journey of The Little Mermaid":{ x:42,y:85,land:"Fantasyland",rideTime:6,category:"ride",thrillLevel:1,avgWait:{low:10,moderate:20,high:35},llAvailable:false,tips:"Great for young kids, modest waits" },
  "Dumbo the Flying Elephant":       { x:48, y:83, land:"Fantasyland", rideTime:2, category:"ride", thrillLevel:1, avgWait:{low:10,moderate:20,high:35}, llAvailable:false, tips:"Queue has indoor play area, go morning or evening" },
  "The Barnstormer":                 { x:46, y:86, land:"Fantasyland", rideTime:2, category:"ride", thrillLevel:2, avgWait:{low:10,moderate:20,high:35}, llAvailable:false, tips:"Mini coaster for first-time riders" },
  "Mad Tea Party":                   { x:52, y:75, land:"Fantasyland", rideTime:2, category:"ride", thrillLevel:2, avgWait:{low:10,moderate:20,high:30}, llAvailable:false, tips:"Teacups, moderate wait, afternoon is fine" },
  "Prince Charming Regal Carrousel": { x:50, y:77, land:"Fantasyland", rideTime:2, category:"ride", thrillLevel:1, avgWait:{low:5,moderate:10,high:15}, llAvailable:false, tips:"Usually walk-on" },
  "Mickey's PhilharMagic":           { x:47, y:73, land:"Fantasyland", rideTime:12, category:"show", thrillLevel:1, avgWait:{low:5,moderate:10,high:20}, llAvailable:false, tips:"4D movie, good A/C break" },
  "Be Our Guest Restaurant":         { x:43, y:78, land:"Fantasyland", rideTime:45, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required. Dinner table service, breakfast/lunch QS" },
  "Pinocchio Village Haus":          { x:42, y:80, land:"Fantasyland", rideTime:30, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:10,high:15}, llAvailable:false, tips:"Quick service, overlooks Small World ride" },
  "Storybook Treats":                { x:49, y:79, land:"Fantasyland", rideTime:5, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:10,high:15}, llAvailable:false, tips:"Ice cream and snacks, walk-up" },
  
  // Liberty Square
  "Haunted Mansion":                 { x:32, y:70, land:"Liberty Square", rideTime:9, category:"ride", thrillLevel:2, avgWait:{low:15,moderate:30,high:55}, llAvailable:true, tips:"Atmospheric dark ride, best in evenings for immersion" },
  "Columbia Harbour House":          { x:33, y:68, land:"Liberty Square", rideTime:20, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:12,high:20}, llAvailable:false, tips:"Best QS in MK. Second floor has castle views. Order clam chowder." },
  "Liberty Tree Tavern":             { x:35, y:65, land:"Liberty Square", rideTime:45, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required. Colonial American comfort food." },
  
  // Frontierland
  "Big Thunder Mountain Railroad":   { x:22, y:70, land:"Frontierland", rideTime:4, category:"ride", thrillLevel:3, avgWait:{low:20,moderate:40,high:70}, llAvailable:true, tips:"'Wildest ride in the wilderness.' Great fireworks views from the top." },
  "Tiana's Bayou Adventure":         { x:20, y:65, land:"Frontierland", rideTime:11, category:"ride", thrillLevel:3, avgWait:{low:25,moderate:50,high:90}, llAvailable:true, tips:"New splash mountain replacement. Book LL if available." },
  "Splash Zone (Tiana's exit)":      { x:19, y:62, land:"Frontierland", category:"landmark", thrillLevel:1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"You'll get wet. Pack a change of shirt on hot days." },
  "Pecos Bill Tall Tale Inn & Cafe": { x:25, y:65, land:"Frontierland", rideTime:20, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:12,high:20}, llAvailable:false, tips:"Largest QS in MK, good for groups" },
  "Golden Oak Outpost":              { x:22, y:68, land:"Frontierland", rideTime:5, category:"dining", thrillLevel:1, avgWait:{low:3,moderate:8,high:12}, llAvailable:false, tips:"Waffle fries and nuggets, fast" },
  
  // Adventureland
  "Pirates of the Caribbean":        { x:18, y:58, land:"Adventureland", rideTime:9, category:"ride", thrillLevel:2, avgWait:{low:10,moderate:20,high:40}, llAvailable:false, tips:"Classic ride, dark boat. Nearly always walkable. Go after 3 PM." },
  "Jungle Cruise":                   { x:15, y:55, land:"Adventureland", rideTime:10, category:"ride", thrillLevel:2, avgWait:{low:10,moderate:25,high:50}, llAvailable:true, tips:"Best jokes in WDW. Morning or evening for best experience." },
  "Walt Disney's Enchanted Tiki Room":{ x:13, y:52, land:"Adventureland", rideTime:12, category:"show", thrillLevel:1, avgWait:{low:5,moderate:10,high:15}, llAvailable:false, tips:"Classic show, great A/C, nearly always available" },
  "The Skipper Canteen":             { x:14, y:53, land:"Adventureland", rideTime:45, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required. Creative pan-Asian menu." },
  "Aloha Isle":                      { x:17, y:57, land:"Adventureland", rideTime:5, category:"dining", thrillLevel:1, avgWait:{low:3,moderate:8,high:15}, llAvailable:false, tips:"Dole Whip! The only place to get it in MK." },
  
  // Fireworks positions
  "Main Street Hub":                 { x:50, y:48, land:"Main Street U.S.A.", category:"landmark", thrillLevel:1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"Center of hub = best fireworks view. Get here by 8:45 PM." },
};

// ─── WALK TIME CALCULATOR ─────────────────────────────────────────────────────
// Uses Euclidean distance scaled to real park (MK is roughly 500m across)
const PARK_SCALE_METERS = 500; // 100 units = 500 meters

function walkTime(from: string, to: string, park: string): { minutes: number; description: string } {
  if (park !== "Magic Kingdom") return { minutes: 8, description: `Walking to ${to}` };
  
  const fromLoc = MK_LOCATIONS[from];
  const toLoc = MK_LOCATIONS[to];
  
  if (!fromLoc || !toLoc) return { minutes: 8, description: `Walking to ${to}` };
  
  const dx = (toLoc.x - fromLoc.x) / 100 * PARK_SCALE_METERS;
  const dy = (toLoc.y - fromLoc.y) / 100 * PARK_SCALE_METERS;
  const distMeters = Math.sqrt(dx * dx + dy * dy);
  
  // Average walking speed in a theme park with crowds: ~3.5 km/h = ~58 m/min
  const walkingSpeed = 58;
  const minutes = Math.max(2, Math.round(distMeters / walkingSpeed));
  
  const desc = minutes <= 3 ? `Short walk to ${to} (${minutes} min)` :
               minutes <= 8 ? `Walk to ${to} (~${minutes} min)` :
               `Walk across park to ${to} (~${minutes} min)`;
  
  return { minutes, description: desc };
}

// ─── QUEUE NEARBY DINING ─────────────────────────────────────────────────────
function nearbyDining(location: string, park: string): string[] {
  if (park !== "Magic Kingdom") return [];
  const loc = MK_LOCATIONS[location];
  if (!loc) return [];
  
  const nearby = Object.entries(MK_LOCATIONS)
    .filter(([name, info]) => info.category === "dining" && name !== location)
    .map(([name, info]) => {
      const dx = (info.x - loc.x) / 100 * PARK_SCALE_METERS;
      const dy = (info.y - loc.y) / 100 * PARK_SCALE_METERS;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return { name, dist, land: info.land };
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3)
    .map(d => d.name);
  
  return nearby;
}

// ─── OPTIMAL ROUTE PLANNER ────────────────────────────────────────────────────
function planOptimalRoute(park: string, preference: string, crowdLevel: number, input: any): any[] {
  if (park !== "Magic Kingdom") return [];
  
  const crowd = crowdLevel <= 3 ? "low" : crowdLevel <= 6 ? "moderate" : "high";
  const isThrill = preference === "thrill";
  const isFamily = preference === "family" || preference === "little";
  
  // Priority rides by preference
  const allRides = Object.entries(MK_LOCATIONS)
    .filter(([, info]) => info.category === "ride")
    .sort((a, b) => {
      const aInfo = a[1];
      const bInfo = b[1];
      if (isThrill) return (bInfo.thrillLevel - aInfo.thrillLevel) || (bInfo.avgWait.moderate - aInfo.avgWait.moderate);
      if (isFamily) return (aInfo.thrillLevel - bInfo.thrillLevel);
      return bInfo.avgWait.moderate - aInfo.avgWait.moderate; // sort by popularity
    });
  
  // Build route with time calculations
  const route: any[] = [];
  let currentTime = 480; // 8:00 AM in minutes
  let currentLocation = "Main Gate / Town Square";
  let mealsServed = { breakfast: false, lunch: false, dinner: false };
  
  // Rope drop (7:45 AM)
  route.push({
    startTime: 465, // 7:45
    duration: 15,
    activity: "Arrive at park — Rope Drop",
    type: "rope-drop",
    badge: "Rope Drop",
    tip: "Arrive 15-20 min before park open. Rope drop gives you a critical head start.",
    walkMinutes: 0,
    waitMinutes: 0,
    location: "Main Gate / Town Square",
    priority: "must-do",
  });
  
  // Add TRON LL first thing (thrill or general)
  if (MK_LOCATIONS["TRON Lightcycle / Run"] && input.llOption !== "none") {
    const walk = walkTime("Main Gate / Town Square", "TRON Lightcycle / Run", park);
    const waitMin = MK_LOCATIONS["TRON Lightcycle / Run"].avgWait[crowd];
    const rideMin = MK_LOCATIONS["TRON Lightcycle / Run"].rideTime || 2;
    
    route.push({
      startTime: currentTime + walk.minutes,
      duration: waitMin + rideMin,
      walkMinutes: walk.minutes,
      waitMinutes: input.llOption !== "none" ? 5 : waitMin, // LL = 5 min
      rideMinutes: rideMin,
      activity: "TRON Lightcycle / Run",
      type: "ride",
      badge: "Lightning Lane",
      tip: `Book LL at park open. Walk: ${walk.minutes} min. ${input.llOption !== "none" ? "LL wait: ~5 min" : `Standby wait: ~${waitMin} min`}. Ride: ${rideMin} min.`,
      location: "TRON Lightcycle / Run",
      land: "Tomorrowland",
      priority: "must-do",
    });
    
    currentTime += walk.minutes + (input.llOption !== "none" ? 5 : waitMin) + rideMin;
    currentLocation = "TRON Lightcycle / Run";
  }
  
  // Build rest of day
  const scheduledRides = new Set(["TRON Lightcycle / Run"]);
  const ridesForDay = isThrill 
    ? ["Seven Dwarfs Mine Train", "Big Thunder Mountain Railroad", "Tiana's Bayou Adventure", "Space Mountain", "Haunted Mansion", "Pirates of the Caribbean", "Jungle Cruise"]
    : isFamily
    ? ["Seven Dwarfs Mine Train", "Dumbo the Flying Elephant", "Under the Sea - Journey of The Little Mermaid", "Peter Pan's Flight", "\"it's a small world\"", "Big Thunder Mountain Railroad", "Pirates of the Caribbean"]
    : ["Seven Dwarfs Mine Train", "Big Thunder Mountain Railroad", "Haunted Mansion", "Pirates of the Caribbean", "Jungle Cruise", "Space Mountain", "Tiana's Bayou Adventure"];
  
  for (const rideName of ridesForDay) {
    if (scheduledRides.has(rideName)) continue;
    if (!MK_LOCATIONS[rideName]) continue;
    
    const rideInfo = MK_LOCATIONS[rideName];
    const walk = walkTime(currentLocation, rideName, park);
    const waitMin = rideInfo.avgWait[crowd];
    const rideMin = rideInfo.rideTime || 5;
    const totalBlock = walk.minutes + waitMin + rideMin;
    
    // Insert lunch around 12:00-12:30 PM
    if (currentTime < 750 && currentTime + totalBlock > 750 && !mealsServed.lunch) {
      // Find nearby QS options
      const nearbyQS = nearbyDining(currentLocation, park).filter(n => {
        const info = MK_LOCATIONS[n];
        return info?.category === "dining" && info.rideTime && info.rideTime <= 30;
      });
      
      const lunchSpot = nearbyQS[0] || "Columbia Harbour House";
      const lunchWalk = walkTime(currentLocation, lunchSpot, park);
      const lunchDuration = 30;
      
      route.push({
        startTime: currentTime + lunchWalk.minutes,
        duration: lunchDuration,
        walkMinutes: lunchWalk.minutes,
        waitMinutes: 5,
        activity: `Lunch — ${lunchSpot}`,
        type: "dining",
        badge: "Quick Service",
        tip: `${lunchWalk.description}. ${nearbyQS.slice(0, 3).join(", ")} are all nearby — pick based on your group. Eating at 12:00-12:30 PM beats the peak 1 PM rush.`,
        location: lunchSpot,
        land: MK_LOCATIONS[lunchSpot]?.land || "Magic Kingdom",
        alternativeDining: nearbyQS.slice(1, 3),
        priority: "recommended",
      });
      
      currentTime += lunchWalk.minutes + lunchDuration;
      currentLocation = lunchSpot;
      mealsServed.lunch = true;
      
      // Midday break for families with kids
      if (input.children > 0 && currentTime < 810) {
        route.push({
          startTime: currentTime,
          duration: 60,
          walkMinutes: 0,
          waitMinutes: 0,
          activity: "Rest break — return to hotel for pool time",
          type: "break",
          badge: "Break",
          tip: "1-3 PM are peak crowd hours. Smart strategy: leave, rest at hotel pool, return at 3 PM when crowds thin. You'll enjoy the evening far more.",
          priority: "recommended",
        });
        currentTime += 60;
      }
    }
    
    // Add the ride
    if (currentTime < 18 * 60) { // Before 6 PM
      route.push({
        startTime: currentTime + walk.minutes,
        duration: waitMin + rideMin,
        walkMinutes: walk.minutes,
        waitMinutes: waitMin,
        rideMinutes: rideMin,
        activity: rideName,
        type: "ride",
        tip: `${walk.description}. ${crowd === "high" ? `Busy day — expect ${waitMin} min wait.` : crowd === "moderate" ? `${waitMin} min average wait.` : `Low wait day — ~${waitMin} min.`} Ride: ${rideMin} min. Total at this attraction: ~${walk.minutes + waitMin + rideMin} min.`,
        location: rideName,
        land: rideInfo.land,
        priority: rideInfo.thrillLevel >= 4 ? "must-do" : "recommended",
      });
      
      currentTime += walk.minutes + waitMin + rideMin;
      currentLocation = rideName;
      scheduledRides.add(rideName);
    }
    
    if (currentTime >= 17 * 60 && !mealsServed.dinner) break; // Stop adding rides after 5 PM
  }
  
  // Add A/C break / show in afternoon if time gap
  const lastRideTime = route[route.length - 1]?.startTime + route[route.length - 1]?.duration || currentTime;
  if (currentTime < 17 * 60) {
    // Fill gap with something
    route.push({
      startTime: currentTime,
      duration: 21,
      walkMinutes: 5,
      waitMinutes: 0,
      activity: "Walt Disney's Carousel of Progress",
      type: "show",
      badge: "Show",
      tip: "Walk to Tomorrowland (~5 min). A/C break + classic Disney show. 21 min. Great gap filler when you need to rest legs.",
      location: "Walt Disney's Carousel of Progress",
      land: "Tomorrowland",
      priority: "optional",
    });
    currentTime += 5 + 21;
    currentLocation = "Walt Disney's Carousel of Progress";
  }
  
  // Dinner around 6 PM
  if (!mealsServed.dinner) {
    const dinnerSpot = "Columbia Harbour House";
    const dWalk = walkTime(currentLocation, dinnerSpot, park);
    route.push({
      startTime: 18 * 60 + dWalk.minutes,
      duration: 45,
      walkMinutes: dWalk.minutes,
      waitMinutes: 5,
      activity: `Dinner — ${dinnerSpot}`,
      type: "dining",
      badge: "Quick Service",
      tip: `${dWalk.description}. Columbia Harbour House: second floor views of Liberty Square, clam chowder is a must. Alternatively: Liberty Tree Tavern (reservation required) or Pecos Bill in Frontierland.`,
      location: dinnerSpot,
      land: "Liberty Square",
      priority: "recommended",
    });
    currentTime = 18 * 60 + dWalk.minutes + 45;
    currentLocation = dinnerSpot;
    mealsServed.dinner = true;
  }
  
  // Evening rides (Haunted Mansion if not done, Pirates)
  if (!scheduledRides.has("Haunted Mansion")) {
    const hWalk = walkTime(currentLocation, "Haunted Mansion", park);
    route.push({
      startTime: currentTime + hWalk.minutes,
      duration: 9 + 15,
      walkMinutes: hWalk.minutes,
      waitMinutes: 15, // Evening waits are shorter
      rideMinutes: 9,
      activity: "Haunted Mansion",
      type: "ride",
      tip: `${hWalk.description}. Evening is the best time for Haunted Mansion — shorter waits, more atmospheric. Wait: ~15 min. Ride: 9 min.`,
      location: "Haunted Mansion",
      land: "Liberty Square",
      priority: "recommended",
    });
    currentTime += hWalk.minutes + 15 + 9;
    currentLocation = "Haunted Mansion";
  }
  
  // Position for fireworks
  const fWalk = walkTime(currentLocation, "Main Street Hub", park);
  route.push({
    startTime: 20 * 60 + 45 - fWalk.minutes, // 8:45 PM minus walk time
    duration: fWalk.minutes,
    walkMinutes: fWalk.minutes,
    waitMinutes: 0,
    activity: "Walk to Main Street Hub for fireworks",
    type: "transport",
    tip: `${fWalk.description}. Arrive by 8:45 PM. Center of hub = best projection mapping + fireworks view.`,
    location: "Main Street Hub",
    land: "Main Street U.S.A.",
    priority: "must-do",
  });
  
  route.push({
    startTime: 21 * 60,
    duration: 20,
    walkMinutes: 0,
    waitMinutes: 0,
    activity: "Happily Ever After Fireworks 🎆",
    type: "show",
    badge: "Fireworks",
    tip: "20-minute spectacular. Best views from center Hub. After the show, wait 15 min before leaving — the crowd rush to the exits is intense.",
    location: "Main Street Hub",
    land: "Main Street U.S.A.",
    priority: "must-do",
  });
  
  return route;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ─── PARK DATA ────────────────────────────────────────────────────────────────
const PARK_META: Record<string, { emoji: string; bestFor: string; llPriority: string[] }> = {
  "Magic Kingdom": { emoji: "🏰", bestFor: "Classic Disney, kids, families, fireworks", llPriority: ["TRON Lightcycle / Run", "Seven Dwarfs Mine Train"] },
  "EPCOT": { emoji: "🌍", bestFor: "Food, culture, adults, International dining", llPriority: ["Guardians of the Galaxy: Cosmic Rewind"] },
  "Hollywood Studios": { emoji: "🎬", bestFor: "Thrill seekers, Star Wars fans, tweens", llPriority: ["Star Wars: Rise of the Resistance"] },
  "Animal Kingdom": { emoji: "🦁", bestFor: "Nature, adventure, early morning safari", llPriority: ["Avatar Flight of Passage"] },
};

const DINING_RECOMMENDATIONS: Record<string, any[]> = {
  "Magic Kingdom": [
    { name: "Be Our Guest Restaurant", type: "Table Service", priceRange: "$$$", why: "Iconic Beast's Castle dining", reservationTips: "Book 60 days out — sells out in minutes" },
    { name: "Cinderella's Royal Table", type: "Character Dining", priceRange: "$$$$", why: "Inside the castle, princess characters", reservationTips: "Book exactly at the 60-day mark — most popular in WDW" },
    { name: "Liberty Tree Tavern", type: "Table Service", priceRange: "$$$", why: "Colonial American comfort food", reservationTips: "Easier to get, 3-4 weeks out" },
    { name: "Columbia Harbour House", type: "Quick Service", priceRange: "$$", why: "Best QS in MK, great views", reservationTips: "No reservation needed" },
  ],
  "EPCOT": [
    { name: "Space 220 Restaurant", type: "Table Service", priceRange: "$$$$", why: "Incredible 'space station' atmosphere", reservationTips: "Book immediately — hardest table in WDW" },
    { name: "Le Cellier Steakhouse", type: "Signature Dining", priceRange: "$$$$", why: "Best steak in WDW, Canadian atmosphere", reservationTips: "Book 45-60 days out" },
    { name: "Via Napoli", type: "Table Service", priceRange: "$$$", why: "Authentic Neapolitan pizza in Italy pavilion", reservationTips: "2-3 weeks out" },
    { name: "Topolino's Terrace", type: "Character Dining", priceRange: "$$$$", why: "Rooftop character breakfast", reservationTips: "Book 45 days out" },
  ],
  "Hollywood Studios": [
    { name: "Sci-Fi Dine-In Theater", type: "Table Service", priceRange: "$$$", why: "Unique drive-in movie atmosphere", reservationTips: "2-3 weeks out" },
    { name: "50's Prime Time Café", type: "Table Service", priceRange: "$$$", why: "Interactive servers, comfort food", reservationTips: "1-2 weeks out" },
    { name: "Oga's Cantina", type: "Bar/Lounge", priceRange: "$$", why: "Galaxy's Edge cocktail bar", reservationTips: "Book 60 days out — 45 min max stay" },
  ],
  "Animal Kingdom": [
    { name: "Tiffins Restaurant", type: "Signature Dining", priceRange: "$$$$", why: "Best food in AK, globally-inspired", reservationTips: "2-3 weeks out" },
    { name: "Tusker House Restaurant", type: "Character Dining", priceRange: "$$$", why: "African buffet with Donald Duck", reservationTips: "3-4 weeks out" },
    { name: "Yak & Yeti Restaurant", type: "Table Service", priceRange: "$$$", why: "Pan-Asian cuisine in Asia section", reservationTips: "1-2 weeks out" },
  ],
};

const HOTEL_DATA = {
  value: [
    { name: "Disney's All-Star Music Resort", priceRange: "$125-200/night", tier: "Value", amenities: ["Pool", "Shuttle", "Food Court"], bestFor: "Budget families" },
    { name: "Disney's Pop Century Resort", priceRange: "$135-220/night", tier: "Value", amenities: ["Skyliner", "Pool", "Food Court"], bestFor: "EPCOT/HS via Skyliner" },
    { name: "Disney's Art of Animation Resort", priceRange: "$185-290/night", tier: "Value+", amenities: ["Skyliner", "Pool", "Family Suites"], bestFor: "Families with young kids" },
  ],
  moderate: [
    { name: "Disney's Caribbean Beach Resort", priceRange: "$270-400/night", tier: "Moderate", amenities: ["Skyliner", "Pool", "Table Service"], bestFor: "EPCOT/HS via Skyliner" },
    { name: "Disney's Coronado Springs Resort", priceRange: "$290-440/night", tier: "Moderate", amenities: ["Pool", "Gran Destino Tower", "Multiple Dining"], bestFor: "Adults, couples" },
    { name: "Disney's Port Orleans Riverside", priceRange: "$260-390/night", tier: "Moderate", amenities: ["Boat to Disney Springs", "Pool"], bestFor: "Romance, relaxed pace" },
  ],
  deluxe: [
    { name: "Disney's Grand Floridian Resort & Spa", priceRange: "$750-1,800/night", tier: "Deluxe", amenities: ["Monorail", "Fine Dining", "Spa"], bestFor: "Luxury, honeymoons" },
    { name: "Disney's Contemporary Resort", priceRange: "$580-1,200/night", tier: "Deluxe", amenities: ["Monorail to MK", "California Grill"], bestFor: "Magic Kingdom focus" },
    { name: "Disney's Animal Kingdom Lodge", priceRange: "$400-900/night", tier: "Deluxe", amenities: ["Savanna Views", "Jiko", "Boma"], bestFor: "Animal lovers" },
  ],
  offsite: [
    { name: "Hilton Orlando Bonnet Creek", priceRange: "$180-350/night", tier: "Off-Site Premium", amenities: ["Free Disney Shuttle", "Pool"], bestFor: "Value-conscious, large groups" },
  ],
};

const TICKET_PRICES: any = {
  oneDay: { adult: 119, child: 114 },
  twoDay: { adult: 270, child: 255 },
  threeDay: { adult: 385, child: 365 },
  fourDay: { adult: 469, child: 449 },
  fiveDay: { adult: 529, child: 509 },
  sevenDay: { adult: 589, child: 569 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });

  try {
    const authHeader = req.headers.get("x-client-authorization") ?? req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) throw new Error("Invalid session");

    const input = await req.json();
    if (!input.parks?.length) throw new Error("Select at least one park");
    if (!input.startDate) throw new Error("Select travel dates");

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate || input.startDate);
    const numDays = Math.max(1, Math.min(7, Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1));
    const totalPeople = (input.adults || 2) + (input.children || 0);

    // Generate day plans with optimized routes
    const plans = [];
    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const isWeekend = [0, 6].includes(date.getDay());
      const crowdLevel = isWeekend ? 7 : 4;
      const park = input.parks[i % input.parks.length];
      const parkMeta = PARK_META[park] || { emoji: "🎡", bestFor: "", llPriority: [] };
      
      // Build optimized route (full logic for MK, simplified for others)
      const routeItems = park === "Magic Kingdom"
        ? planOptimalRoute(park, input.ridePreference || "mix", crowdLevel, input)
        : null;
      
      // Convert route items to itinerary items
      const items = routeItems ? routeItems.map(item => ({
        time: minutesToTime(item.startTime),
        activity: item.activity,
        type: item.type,
        badge: item.badge,
        tip: item.tip,
        wait: item.waitMinutes > 0 ? item.waitMinutes : undefined,
        location: item.location,
        land: item.land,
        priority: item.priority,
        walkMinutes: item.walkMinutes,
        rideMinutes: item.rideMinutes,
        durationMinutes: item.duration,
        alternativeDining: item.alternativeDining,
      })) : generateFallbackItinerary(park, dateStr, input, i + 1, crowdLevel);
      
      plans.push({
        date: dateStr,
        park,
        parkEmoji: parkMeta.emoji,
        crowdLevel,
        items,
        summary: `${parkMeta.bestFor}`,
        highlights: [
          parkMeta.llPriority[0] ? `${parkMeta.llPriority[0]} (book LL first)` : items[1]?.activity,
          crowdLevel <= 4 ? "🟢 Low crowds expected" : crowdLevel <= 6 ? "🟡 Moderate crowds" : "🔴 Busy day — rope drop critical",
          isWeekend ? "Weekend — arrive extra early" : "Weekday — better waits",
        ].filter(Boolean),
      });
    }

    // Budget calculations
    const dayKey = numDays <= 1 ? "oneDay" : numDays === 2 ? "twoDay" : numDays === 3 ? "threeDay" : numDays === 4 ? "fourDay" : numDays <= 5 ? "fiveDay" : "sevenDay";
    const adultTicket = TICKET_PRICES[dayKey]?.adult || TICKET_PRICES.sevenDay.adult;
    const childTicket = TICKET_PRICES[dayKey]?.child || TICKET_PRICES.sevenDay.child;
    const ticketCost = (input.adults || 2) * adultTicket + (input.children || 0) * childTicket;
    const llCost = input.llOption === "multi" ? totalPeople * 22 * numDays : input.llOption === "individual" ? (input.adults || 2) * 35 : 0;
    const diningCost = ((input.adults || 2) * 75 + (input.children || 0) * 45) * numDays;
    const miscCost = totalPeople * 35 * numDays;
    const nightlyBudget = Math.max(100, Math.round((input.budget - ticketCost - llCost - diningCost - miscCost) / numDays));
    const hotelCost = nightlyBudget * numDays;
    const estimatedTotal = ticketCost + hotelCost + diningCost + llCost + miscCost;

    const hotels = nightlyBudget >= 700 ? HOTEL_DATA.deluxe : nightlyBudget >= 350 ? HOTEL_DATA.moderate : nightlyBudget >= 100 ? HOTEL_DATA.value : HOTEL_DATA.offsite;

    const uniqueParks = [...new Set(input.parks as string[])];
    const diningRecs: any = {};
    uniqueParks.forEach((p: string) => { if (DINING_RECOMMENDATIONS[p]) diningRecs[p] = DINING_RECOMMENDATIONS[p]; });

    return new Response(JSON.stringify({
      success: true, plans, numDays, estimatedTotal,
      budgetBreakdown: { tickets: ticketCost, hotel: hotelCost, dining: diningCost, lightningLane: llCost, miscSouvenirs: miscCost },
      ticketInfo: {
        cost: ticketCost,
        recommendation: `${numDays}-Day Ticket`,
        perPersonPerDay: Math.round(adultTicket / numDays),
        options: [`Adults: $${adultTicket}/person`, input.children > 0 ? `Children: $${childTicket}/person` : null, `Total tickets: $${ticketCost}`, numDays >= 3 ? "💡 Add Park Hopper (+$65/person) to visit multiple parks daily" : null].filter(Boolean),
      },
      hotelRecommendations: hotels.slice(0, 3),
      hotelNightlyBudget: nightlyBudget,
      diningRecommendations: diningRecs,
      seed: Date.now(),
      generatedAt: new Date().toISOString(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});

function generateFallbackItinerary(park: string, date: string, input: any, dayNum: number, crowdLevel: number) {
  const crowd = crowdLevel <= 3 ? "low" : crowdLevel <= 6 ? "moderate" : "high";
  const rideWait = crowd === "low" ? 20 : crowd === "moderate" ? 40 : 65;
  
  const items: any[] = [
    { time: "7:45 AM", activity: `Arrive at ${park} — Rope Drop`, type: "rope-drop", badge: "Rope Drop", tip: "Arrive 15-20 min before open. Rope drop is your most valuable strategy.", priority: "must-do" },
    { time: "8:00 AM", activity: "Top priority ride (book LL immediately)", type: "ride", badge: "Lightning Lane", tip: `Book your Lightning Lane the moment you enter. Wait: ~5 min with LL. Ride: ~3 min.`, wait: 5, priority: "must-do" },
    { time: "9:15 AM", activity: "Second priority ride", type: "ride", tip: `~${rideWait} min wait. Morning is best window.`, wait: rideWait, priority: "recommended" },
    { time: "10:45 AM", activity: "Third priority ride", type: "ride", tip: `~${rideWait} min wait.`, wait: rideWait, priority: "recommended" },
    { time: "12:15 PM", activity: "Lunch (walk to nearby quick service)", type: "dining", badge: "Quick Service", tip: "Eat at 12:15-12:30 PM to beat the 1 PM rush. Multiple options near your current location.", priority: "recommended" },
    { time: "1:00 PM", activity: input.children > 0 ? "Rest break / hotel pool time" : "Fourth priority ride", type: input.children > 0 ? "break" : "ride", badge: input.children > 0 ? "Break" : undefined, tip: input.children > 0 ? "Peak crowds 1-3 PM. Families who rest midday enjoy evening 5x more." : `~${Math.round(rideWait * 0.8)} min wait — crowds improving.`, wait: input.children > 0 ? undefined : Math.round(rideWait * 0.8), priority: "recommended" },
    { time: "3:00 PM", activity: "Fifth priority ride", type: "ride", tip: `Crowds typically drop after 3 PM. ~${Math.round(rideWait * 0.7)} min wait.`, wait: Math.round(rideWait * 0.7), priority: "recommended" },
    { time: "4:30 PM", activity: "Sixth priority ride", type: "ride", tip: `~${Math.round(rideWait * 0.6)} min wait.`, wait: Math.round(rideWait * 0.6), priority: "recommended" },
    { time: "6:00 PM", activity: "Dinner — see dining recommendations below", type: "dining", badge: "Dining", tip: "Check dining recommendations in your plan for the best options in this park.", priority: "recommended" },
    { time: "7:30 PM", activity: "Evening rides (shorter waits)", type: "ride", tip: "Evening waits are often the shortest of the day. Hit any remaining must-dos now.", priority: "recommended" },
    { time: "9:00 PM", activity: "Nighttime spectacular / fireworks", type: "show", badge: "Show", tip: "Don't miss the nighttime show. Position yourself 20-30 min early.", priority: "must-do" },
  ];
  
  return items;
}
