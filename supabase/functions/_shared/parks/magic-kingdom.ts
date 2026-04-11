// ═══════════════════════════════════════════════════════════════════════════════
// Magic Kingdom — Path Graph, Attractions, Shows, Dining, Crowd Windows
// ═══════════════════════════════════════════════════════════════════════════════

import type { ParkData, PathNode, PathEdge, Attraction, Show, DiningNode, LandCrowdWindow } from "../types.ts";

const PARK_ID = "magic-kingdom";

// ─── PATH GRAPH ──────────────────────────────────────────────────────────────
const nodes: PathNode[] = [
  // Entrance & Main Street
  { id: "mk-entrance", type: "entrance", lat: 28.4164, lng: -81.5812, land: "Main Street U.S.A.", label: "Park Entrance" },
  { id: "mk-mainst-mid", type: "waypoint", lat: 28.4172, lng: -81.5812, land: "Main Street U.S.A.", label: "Main Street Midpoint" },
  { id: "mk-hub", type: "landmark", lat: 28.4187, lng: -81.5812, land: "Hub", label: "Castle Hub" },
  { id: "mk-restroom-mainst", type: "restroom", lat: 28.4170, lng: -81.5818, land: "Main Street U.S.A.", label: "Main Street Restroom" },
  // Tomorrowland
  { id: "mk-tl-entrance", type: "waypoint", lat: 28.4190, lng: -81.5795, land: "Tomorrowland", label: "Tomorrowland Entrance" },
  { id: "mk-tron", type: "attraction", lat: 28.4212, lng: -81.5778, land: "Tomorrowland", label: "TRON Lightcycle / Run", attractionId: "mk-tron" },
  { id: "mk-space-mountain", type: "attraction", lat: 28.4209, lng: -81.5782, land: "Tomorrowland", label: "Space Mountain", attractionId: "mk-space-mountain" },
  { id: "mk-buzz", type: "attraction", lat: 28.4199, lng: -81.5789, land: "Tomorrowland", label: "Buzz Lightyear's Space Ranger Spin", attractionId: "mk-buzz" },
  { id: "mk-peoplemover", type: "attraction", lat: 28.4202, lng: -81.5787, land: "Tomorrowland", label: "Tomorrowland Transit Authority PeopleMover", attractionId: "mk-peoplemover" },
  { id: "mk-speedway", type: "attraction", lat: 28.4215, lng: -81.5790, land: "Tomorrowland", label: "Tomorrowland Speedway", attractionId: "mk-speedway" },
  { id: "mk-astro", type: "attraction", lat: 28.4195, lng: -81.5790, land: "Tomorrowland", label: "Astro Orbiter", attractionId: "mk-astro" },
  { id: "mk-carousel-progress", type: "show", lat: 28.4206, lng: -81.5783, land: "Tomorrowland", label: "Walt Disney's Carousel of Progress" },
  { id: "mk-tl-terrace", type: "restaurant", lat: 28.4192, lng: -81.5798, land: "Tomorrowland", label: "Tomorrowland Terrace" },
  { id: "mk-restroom-tl", type: "restroom", lat: 28.4197, lng: -81.5793, land: "Tomorrowland", label: "Tomorrowland Restroom" },
  // Fantasyland
  { id: "mk-fl-entrance", type: "waypoint", lat: 28.4196, lng: -81.5812, land: "Fantasyland", label: "Castle Passage to Fantasyland" },
  { id: "mk-mine-train", type: "attraction", lat: 28.4210, lng: -81.5812, land: "Fantasyland", label: "Seven Dwarfs Mine Train", attractionId: "mk-mine-train" },
  { id: "mk-peter-pan", type: "attraction", lat: 28.4202, lng: -81.5820, land: "Fantasyland", label: "Peter Pan's Flight", attractionId: "mk-peter-pan" },
  { id: "mk-small-world", type: "attraction", lat: 28.4208, lng: -81.5825, land: "Fantasyland", label: "\"it's a small world\"", attractionId: "mk-small-world" },
  { id: "mk-little-mermaid", type: "attraction", lat: 28.4213, lng: -81.5828, land: "Fantasyland", label: "Under the Sea", attractionId: "mk-little-mermaid" },
  { id: "mk-dumbo", type: "attraction", lat: 28.4216, lng: -81.5818, land: "Fantasyland", label: "Dumbo the Flying Elephant", attractionId: "mk-dumbo" },
  { id: "mk-barnstormer", type: "attraction", lat: 28.4218, lng: -81.5822, land: "Fantasyland", label: "The Barnstormer", attractionId: "mk-barnstormer" },
  { id: "mk-mad-tea", type: "attraction", lat: 28.4200, lng: -81.5808, land: "Fantasyland", label: "Mad Tea Party", attractionId: "mk-mad-tea" },
  { id: "mk-philharmagic", type: "show", lat: 28.4198, lng: -81.5815, land: "Fantasyland", label: "Mickey's PhilharMagic" },
  { id: "mk-bog", type: "restaurant", lat: 28.4205, lng: -81.5823, land: "Fantasyland", label: "Be Our Guest Restaurant" },
  { id: "mk-pinocchio", type: "restaurant", lat: 28.4207, lng: -81.5826, land: "Fantasyland", label: "Pinocchio Village Haus" },
  { id: "mk-snack-storybook", type: "snack", lat: 28.4204, lng: -81.5816, land: "Fantasyland", label: "Storybook Treats" },
  { id: "mk-restroom-fl", type: "restroom", lat: 28.4211, lng: -81.5820, land: "Fantasyland", label: "Fantasyland Restroom" },
  // Liberty Square
  { id: "mk-ls-entrance", type: "waypoint", lat: 28.4192, lng: -81.5828, land: "Liberty Square", label: "Liberty Square Entrance" },
  { id: "mk-haunted-mansion", type: "attraction", lat: 28.4200, lng: -81.5838, land: "Liberty Square", label: "Haunted Mansion", attractionId: "mk-haunted-mansion" },
  { id: "mk-columbia", type: "restaurant", lat: 28.4198, lng: -81.5835, land: "Liberty Square", label: "Columbia Harbour House" },
  { id: "mk-liberty-tavern", type: "restaurant", lat: 28.4195, lng: -81.5833, land: "Liberty Square", label: "Liberty Tree Tavern" },
  // Frontierland
  { id: "mk-frl-entrance", type: "waypoint", lat: 28.4197, lng: -81.5842, land: "Frontierland", label: "Frontierland Entrance" },
  { id: "mk-big-thunder", type: "attraction", lat: 28.4202, lng: -81.5850, land: "Frontierland", label: "Big Thunder Mountain Railroad", attractionId: "mk-big-thunder" },
  { id: "mk-tianas", type: "attraction", lat: 28.4198, lng: -81.5848, land: "Frontierland", label: "Tiana's Bayou Adventure", attractionId: "mk-tianas" },
  { id: "mk-pecos-bill", type: "restaurant", lat: 28.4195, lng: -81.5845, land: "Frontierland", label: "Pecos Bill Tall Tale Inn & Cafe" },
  { id: "mk-golden-oak", type: "snack", lat: 28.4200, lng: -81.5847, land: "Frontierland", label: "Golden Oak Outpost" },
  { id: "mk-restroom-frl", type: "restroom", lat: 28.4196, lng: -81.5846, land: "Frontierland", label: "Frontierland Restroom" },
  // Adventureland
  { id: "mk-al-entrance", type: "waypoint", lat: 28.4185, lng: -81.5832, land: "Adventureland", label: "Adventureland Entrance" },
  { id: "mk-pirates", type: "attraction", lat: 28.4187, lng: -81.5843, land: "Adventureland", label: "Pirates of the Caribbean", attractionId: "mk-pirates" },
  { id: "mk-jungle-cruise", type: "attraction", lat: 28.4184, lng: -81.5847, land: "Adventureland", label: "Jungle Cruise", attractionId: "mk-jungle-cruise" },
  { id: "mk-tiki-room", type: "show", lat: 28.4182, lng: -81.5840, land: "Adventureland", label: "Walt Disney's Enchanted Tiki Room" },
  { id: "mk-skipper-canteen", type: "restaurant", lat: 28.4183, lng: -81.5845, land: "Adventureland", label: "The Skipper Canteen" },
  { id: "mk-aloha-isle", type: "snack", lat: 28.4186, lng: -81.5841, land: "Adventureland", label: "Aloha Isle (Dole Whip)" },
  { id: "mk-restroom-al", type: "restroom", lat: 28.4185, lng: -81.5838, land: "Adventureland", label: "Adventureland Restroom" },
  // Fireworks
  { id: "mk-fireworks-hub", type: "landmark", lat: 28.4185, lng: -81.5812, land: "Main Street U.S.A.", label: "Main Street Hub (Fireworks)" },
  { id: "mk-photopass-castle", type: "photopass", lat: 28.4188, lng: -81.5812, land: "Hub", label: "Castle PhotoPass" },
];

const edges: PathEdge[] = [
  // Main Street corridor
  { from: "mk-entrance", to: "mk-mainst-mid", distance_m: 90, shortcut: false },
  { from: "mk-mainst-mid", to: "mk-hub", distance_m: 170, shortcut: false },
  { from: "mk-mainst-mid", to: "mk-restroom-mainst", distance_m: 15, shortcut: false },
  { from: "mk-hub", to: "mk-fireworks-hub", distance_m: 25, shortcut: false },
  { from: "mk-hub", to: "mk-photopass-castle", distance_m: 10, shortcut: false },
  // Hub to lands
  { from: "mk-hub", to: "mk-tl-entrance", distance_m: 130, shortcut: false },
  { from: "mk-hub", to: "mk-fl-entrance", distance_m: 80, shortcut: false },
  { from: "mk-hub", to: "mk-ls-entrance", distance_m: 150, shortcut: false },
  { from: "mk-hub", to: "mk-al-entrance", distance_m: 180, shortcut: false },
  // Tomorrowland internal
  { from: "mk-tl-entrance", to: "mk-astro", distance_m: 60, shortcut: false },
  { from: "mk-tl-entrance", to: "mk-tl-terrace", distance_m: 50, shortcut: false },
  { from: "mk-astro", to: "mk-buzz", distance_m: 70, shortcut: false },
  { from: "mk-astro", to: "mk-restroom-tl", distance_m: 30, shortcut: false },
  { from: "mk-buzz", to: "mk-peoplemover", distance_m: 40, shortcut: false },
  { from: "mk-peoplemover", to: "mk-space-mountain", distance_m: 80, shortcut: false },
  { from: "mk-peoplemover", to: "mk-carousel-progress", distance_m: 50, shortcut: false },
  { from: "mk-space-mountain", to: "mk-tron", distance_m: 100, shortcut: false },
  { from: "mk-tron", to: "mk-speedway", distance_m: 90, shortcut: false },
  { from: "mk-speedway", to: "mk-mine-train", distance_m: 120, shortcut: true, throughBuilding: "Path behind Tomorrowland" },
  // Fantasyland internal
  { from: "mk-fl-entrance", to: "mk-philharmagic", distance_m: 50, shortcut: false },
  { from: "mk-fl-entrance", to: "mk-mad-tea", distance_m: 60, shortcut: false },
  { from: "mk-philharmagic", to: "mk-peter-pan", distance_m: 45, shortcut: false },
  { from: "mk-peter-pan", to: "mk-small-world", distance_m: 60, shortcut: false },
  { from: "mk-peter-pan", to: "mk-bog", distance_m: 55, shortcut: false },
  { from: "mk-small-world", to: "mk-pinocchio", distance_m: 30, shortcut: false },
  { from: "mk-small-world", to: "mk-little-mermaid", distance_m: 50, shortcut: false },
  { from: "mk-little-mermaid", to: "mk-barnstormer", distance_m: 60, shortcut: false },
  { from: "mk-barnstormer", to: "mk-dumbo", distance_m: 40, shortcut: false },
  { from: "mk-dumbo", to: "mk-mine-train", distance_m: 70, shortcut: false },
  { from: "mk-mine-train", to: "mk-restroom-fl", distance_m: 20, shortcut: false },
  { from: "mk-philharmagic", to: "mk-snack-storybook", distance_m: 35, shortcut: false },
  { from: "mk-mad-tea", to: "mk-mine-train", distance_m: 80, shortcut: false },
  // Liberty Square internal
  { from: "mk-ls-entrance", to: "mk-liberty-tavern", distance_m: 50, shortcut: false },
  { from: "mk-liberty-tavern", to: "mk-columbia", distance_m: 40, shortcut: false },
  { from: "mk-columbia", to: "mk-haunted-mansion", distance_m: 50, shortcut: false },
  // Liberty Square ↔ Frontierland
  { from: "mk-haunted-mansion", to: "mk-frl-entrance", distance_m: 60, shortcut: false },
  { from: "mk-ls-entrance", to: "mk-frl-entrance", distance_m: 120, shortcut: false },
  // Frontierland internal
  { from: "mk-frl-entrance", to: "mk-pecos-bill", distance_m: 50, shortcut: false },
  { from: "mk-frl-entrance", to: "mk-restroom-frl", distance_m: 25, shortcut: false },
  { from: "mk-pecos-bill", to: "mk-golden-oak", distance_m: 30, shortcut: false },
  { from: "mk-golden-oak", to: "mk-big-thunder", distance_m: 60, shortcut: false },
  { from: "mk-big-thunder", to: "mk-tianas", distance_m: 70, shortcut: false },
  // Frontierland ↔ Adventureland
  { from: "mk-tianas", to: "mk-pirates", distance_m: 80, shortcut: true, throughBuilding: "Pirates of the Caribbean exit" },
  { from: "mk-frl-entrance", to: "mk-al-entrance", distance_m: 100, shortcut: false },
  // Adventureland internal
  { from: "mk-al-entrance", to: "mk-aloha-isle", distance_m: 40, shortcut: false },
  { from: "mk-al-entrance", to: "mk-restroom-al", distance_m: 20, shortcut: false },
  { from: "mk-aloha-isle", to: "mk-pirates", distance_m: 35, shortcut: false },
  { from: "mk-pirates", to: "mk-skipper-canteen", distance_m: 30, shortcut: false },
  { from: "mk-skipper-canteen", to: "mk-jungle-cruise", distance_m: 40, shortcut: false },
  { from: "mk-al-entrance", to: "mk-tiki-room", distance_m: 60, shortcut: false },
  { from: "mk-tiki-room", to: "mk-jungle-cruise", distance_m: 50, shortcut: false },
  // Cross-land shortcuts
  { from: "mk-peter-pan", to: "mk-haunted-mansion", distance_m: 100, shortcut: true, throughBuilding: "Path between Fantasyland and Liberty Square" },
];

// ─── ATTRACTIONS ─────────────────────────────────────────────────────────────
const attractions: Attraction[] = [
  { id: "mk-tron", parkId: PARK_ID, name: "TRON Lightcycle / Run", land: "Tomorrowland", nodeId: "mk-tron", hasLightningLane: true, llType: "individual", avgDurationMin: 2, rideType: "coaster", thrillLevel: 5, heightReqIn: 48, tips: "Book LL at park open. Fastest coaster on property.", avgWait: { low: 40, moderate: 75, high: 120 } },
  { id: "mk-space-mountain", parkId: PARK_ID, name: "Space Mountain", land: "Tomorrowland", nodeId: "mk-space-mountain", hasLightningLane: true, llType: "multi", avgDurationMin: 3, rideType: "coaster", thrillLevel: 4, heightReqIn: 44, tips: "Dark indoor coaster, classic WDW.", avgWait: { low: 25, moderate: 55, high: 90 } },
  { id: "mk-buzz", parkId: PARK_ID, name: "Buzz Lightyear's Space Ranger Spin", land: "Tomorrowland", nodeId: "mk-buzz", hasLightningLane: false, llType: null, avgDurationMin: 5, rideType: "dark-ride", thrillLevel: 2, heightReqIn: null, tips: "Interactive shooter, all ages.", avgWait: { low: 15, moderate: 30, high: 50 } },
  { id: "mk-peoplemover", parkId: PARK_ID, name: "Tomorrowland Transit Authority PeopleMover", land: "Tomorrowland", nodeId: "mk-peoplemover", hasLightningLane: false, llType: null, avgDurationMin: 10, rideType: "ride", thrillLevel: 1, heightReqIn: null, tips: "Almost no wait, great overview.", avgWait: { low: 5, moderate: 10, high: 15 } },
  { id: "mk-speedway", parkId: PARK_ID, name: "Tomorrowland Speedway", land: "Tomorrowland", nodeId: "mk-speedway", hasLightningLane: false, llType: null, avgDurationMin: 5, rideType: "ride", thrillLevel: 1, heightReqIn: 32, tips: "Cars on a track, popular with kids.", avgWait: { low: 15, moderate: 30, high: 45 } },
  { id: "mk-astro", parkId: PARK_ID, name: "Astro Orbiter", land: "Tomorrowland", nodeId: "mk-astro", hasLightningLane: false, llType: null, avgDurationMin: 3, rideType: "ride", thrillLevel: 2, heightReqIn: null, tips: "Elevated rockets, great views. Go in evening.", avgWait: { low: 15, moderate: 25, high: 40 } },
  { id: "mk-mine-train", parkId: PARK_ID, name: "Seven Dwarfs Mine Train", land: "Fantasyland", nodeId: "mk-mine-train", hasLightningLane: true, llType: "multi", avgDurationMin: 3, rideType: "coaster", thrillLevel: 3, heightReqIn: 38, tips: "Most popular family coaster. Book LL after TRON.", avgWait: { low: 35, moderate: 70, high: 110 } },
  { id: "mk-peter-pan", parkId: PARK_ID, name: "Peter Pan's Flight", land: "Fantasyland", nodeId: "mk-peter-pan", hasLightningLane: true, llType: "multi", avgDurationMin: 3, rideType: "dark-ride", thrillLevel: 2, heightReqIn: null, tips: "Always long waits despite being gentle.", avgWait: { low: 40, moderate: 75, high: 110 } },
  { id: "mk-small-world", parkId: PARK_ID, name: "\"it's a small world\"", land: "Fantasyland", nodeId: "mk-small-world", hasLightningLane: false, llType: null, avgDurationMin: 11, rideType: "boat-ride", thrillLevel: 1, heightReqIn: null, tips: "Classic, low waits, great midday refuge.", avgWait: { low: 5, moderate: 15, high: 25 } },
  { id: "mk-little-mermaid", parkId: PARK_ID, name: "Under the Sea - Journey of The Little Mermaid", land: "Fantasyland", nodeId: "mk-little-mermaid", hasLightningLane: false, llType: null, avgDurationMin: 6, rideType: "dark-ride", thrillLevel: 1, heightReqIn: null, tips: "Good for young kids.", avgWait: { low: 10, moderate: 20, high: 35 } },
  { id: "mk-dumbo", parkId: PARK_ID, name: "Dumbo the Flying Elephant", land: "Fantasyland", nodeId: "mk-dumbo", hasLightningLane: false, llType: null, avgDurationMin: 2, rideType: "ride", thrillLevel: 1, heightReqIn: null, tips: "Indoor play area in queue.", avgWait: { low: 10, moderate: 20, high: 35 } },
  { id: "mk-barnstormer", parkId: PARK_ID, name: "The Barnstormer", land: "Fantasyland", nodeId: "mk-barnstormer", hasLightningLane: false, llType: null, avgDurationMin: 2, rideType: "coaster", thrillLevel: 2, heightReqIn: 35, tips: "Mini coaster for first-time riders.", avgWait: { low: 10, moderate: 20, high: 35 } },
  { id: "mk-mad-tea", parkId: PARK_ID, name: "Mad Tea Party", land: "Fantasyland", nodeId: "mk-mad-tea", hasLightningLane: false, llType: null, avgDurationMin: 2, rideType: "ride", thrillLevel: 2, heightReqIn: null, tips: "Teacups, moderate wait.", avgWait: { low: 10, moderate: 20, high: 30 } },
  { id: "mk-haunted-mansion", parkId: PARK_ID, name: "Haunted Mansion", land: "Liberty Square", nodeId: "mk-haunted-mansion", hasLightningLane: true, llType: "multi", avgDurationMin: 9, rideType: "dark-ride", thrillLevel: 2, heightReqIn: null, tips: "Best in evenings for atmosphere.", avgWait: { low: 15, moderate: 30, high: 55 } },
  { id: "mk-big-thunder", parkId: PARK_ID, name: "Big Thunder Mountain Railroad", land: "Frontierland", nodeId: "mk-big-thunder", hasLightningLane: true, llType: "multi", avgDurationMin: 4, rideType: "coaster", thrillLevel: 3, heightReqIn: 40, tips: "Wildest ride in the wilderness. Great fireworks views.", avgWait: { low: 20, moderate: 40, high: 70 } },
  { id: "mk-tianas", parkId: PARK_ID, name: "Tiana's Bayou Adventure", land: "Frontierland", nodeId: "mk-tianas", hasLightningLane: true, llType: "individual", avgDurationMin: 11, rideType: "flume", thrillLevel: 3, heightReqIn: 40, tips: "New and popular. Book LL when available.", avgWait: { low: 25, moderate: 50, high: 90 } },
  { id: "mk-pirates", parkId: PARK_ID, name: "Pirates of the Caribbean", land: "Adventureland", nodeId: "mk-pirates", hasLightningLane: false, llType: null, avgDurationMin: 9, rideType: "boat-ride", thrillLevel: 2, heightReqIn: null, tips: "Classic ride. Go after 3 PM for short waits.", avgWait: { low: 10, moderate: 20, high: 40 } },
  { id: "mk-jungle-cruise", parkId: PARK_ID, name: "Jungle Cruise", land: "Adventureland", nodeId: "mk-jungle-cruise", hasLightningLane: true, llType: "multi", avgDurationMin: 10, rideType: "boat-ride", thrillLevel: 2, heightReqIn: null, tips: "Best jokes in WDW. Morning or evening.", avgWait: { low: 10, moderate: 25, high: 50 } },
];

// ─── SHOWS ───────────────────────────────────────────────────────────────────
const shows: Show[] = [
  { id: "mk-carousel-progress", parkId: PARK_ID, name: "Walt Disney's Carousel of Progress", nodeId: "mk-carousel-progress", land: "Tomorrowland", durationMin: 21, tips: "Great A/C break, classic show." },
  { id: "mk-philharmagic", parkId: PARK_ID, name: "Mickey's PhilharMagic", nodeId: "mk-philharmagic", land: "Fantasyland", durationMin: 12, tips: "4D movie, good A/C break." },
  { id: "mk-tiki-room", parkId: PARK_ID, name: "Walt Disney's Enchanted Tiki Room", nodeId: "mk-tiki-room", land: "Adventureland", durationMin: 12, tips: "Classic show, great A/C." },
];

// ─── DINING ──────────────────────────────────────────────────────────────────
const diningNodes: DiningNode[] = [
  { nodeId: "mk-tl-terrace", name: "Tomorrowland Terrace", land: "Tomorrowland", diningType: "quick-service", durationMin: 30, requiresReservation: false, tips: "Quick service, castle views." },
  { nodeId: "mk-bog", name: "Be Our Guest Restaurant", land: "Fantasyland", diningType: "table-service", durationMin: 75, requiresReservation: true, tips: "Reservation required. Most iconic dining in MK." },
  { nodeId: "mk-pinocchio", name: "Pinocchio Village Haus", land: "Fantasyland", diningType: "quick-service", durationMin: 30, requiresReservation: false, tips: "QS, overlooks Small World." },
  { nodeId: "mk-columbia", name: "Columbia Harbour House", land: "Liberty Square", diningType: "quick-service", durationMin: 30, requiresReservation: false, tips: "Best QS in MK. Second floor has castle views." },
  { nodeId: "mk-liberty-tavern", name: "Liberty Tree Tavern", land: "Liberty Square", diningType: "table-service", durationMin: 75, requiresReservation: true, tips: "Reservation required. Colonial American comfort food." },
  { nodeId: "mk-pecos-bill", name: "Pecos Bill Tall Tale Inn & Cafe", land: "Frontierland", diningType: "quick-service", durationMin: 30, requiresReservation: false, tips: "Largest QS in MK, good for groups." },
  { nodeId: "mk-skipper-canteen", name: "The Skipper Canteen", land: "Adventureland", diningType: "table-service", durationMin: 75, requiresReservation: true, tips: "Reservation required. Creative menu." },
  { nodeId: "mk-aloha-isle", name: "Aloha Isle (Dole Whip)", land: "Adventureland", diningType: "snack", durationMin: 10, requiresReservation: false, tips: "Dole Whip! Only place to get it in MK." },
  { nodeId: "mk-golden-oak", name: "Golden Oak Outpost", land: "Frontierland", diningType: "snack", durationMin: 10, requiresReservation: false, tips: "Waffle fries and nuggets, fast." },
];

// ─── CROWD WINDOWS ───────────────────────────────────────────────────────────
// crowdLevel 1-5: 1=empty, 5=packed
// Generic weekday pattern (dayOfWeek 1-5)
function generateCrowdWindows(): LandCrowdWindow[] {
  const lands = ["Main Street U.S.A.", "Tomorrowland", "Fantasyland", "Liberty Square", "Frontierland", "Adventureland"];
  const windows: LandCrowdWindow[] = [];

  // Peak patterns per land (hour → crowd level for weekdays)
  const patterns: Record<string, Record<number, number>> = {
    "Main Street U.S.A.": { 8: 4, 9: 2, 10: 2, 11: 3, 12: 3, 13: 3, 14: 2, 15: 2, 16: 3, 17: 3, 18: 4, 19: 4, 20: 5, 21: 5 },
    "Tomorrowland": { 8: 5, 9: 4, 10: 4, 11: 3, 12: 3, 13: 3, 14: 2, 15: 3, 16: 3, 17: 2, 18: 2, 19: 3, 20: 3, 21: 2 },
    "Fantasyland": { 8: 4, 9: 5, 10: 5, 11: 4, 12: 4, 13: 4, 14: 3, 15: 3, 16: 3, 17: 3, 18: 2, 19: 2, 20: 2, 21: 1 },
    "Liberty Square": { 8: 2, 9: 2, 10: 3, 11: 3, 12: 4, 13: 4, 14: 3, 15: 3, 16: 2, 17: 2, 18: 3, 19: 4, 20: 3, 21: 2 },
    "Frontierland": { 8: 2, 9: 3, 10: 3, 11: 4, 12: 4, 13: 4, 14: 3, 15: 3, 16: 3, 17: 2, 18: 2, 19: 3, 20: 3, 21: 2 },
    "Adventureland": { 8: 2, 9: 2, 10: 3, 11: 4, 12: 4, 13: 5, 14: 4, 15: 3, 16: 3, 17: 2, 18: 2, 19: 2, 20: 2, 21: 1 },
  };

  for (const land of lands) {
    const pattern = patterns[land] || {};
    for (let dow = 0; dow <= 6; dow++) {
      const weekendMult = (dow === 0 || dow === 6) ? 1 : 0;
      for (let hour = 8; hour <= 21; hour++) {
        const base = pattern[hour] || 3;
        windows.push({
          parkId: PARK_ID,
          land,
          dayOfWeek: dow,
          hour,
          crowdLevel: Math.min(5, base + weekendMult),
        });
      }
    }
  }
  return windows;
}

export const magicKingdomData: ParkData = {
  parkId: PARK_ID,
  graph: { nodes, edges },
  attractions,
  shows,
  diningNodes,
  crowdWindows: generateCrowdWindows(),
  parkMeta: {
    emoji: "🏰",
    bestFor: "Classic Disney, kids, families, fireworks",
    llPriority: ["TRON Lightcycle / Run", "Seven Dwarfs Mine Train"],
    entranceNodeId: "mk-entrance",
    fireworksNodeId: "mk-fireworks-hub",
    fireworksName: "Happily Ever After Fireworks 🎆",
  },
};
