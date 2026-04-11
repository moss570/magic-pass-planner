// ═══════════════════════════════════════════════════════════════════════════════
// EPCOT — Path Graph, Attractions, Shows, Dining, Crowd Windows
// ═══════════════════════════════════════════════════════════════════════════════

import type { ParkData, PathNode, PathEdge, Attraction, Show, DiningNode, LandCrowdWindow } from "../types.ts";

const PARK_ID = "epcot";

const nodes: PathNode[] = [
  { id: "ep-entrance", type: "entrance", lat: 28.3747, lng: -81.5494, land: "World Celebration", label: "EPCOT Main Entrance" },
  { id: "ep-spaceship-earth", type: "attraction", lat: 28.3756, lng: -81.5494, land: "World Celebration", label: "Spaceship Earth", attractionId: "ep-spaceship-earth" },
  { id: "ep-hub", type: "waypoint", lat: 28.3765, lng: -81.5494, land: "World Celebration", label: "EPCOT Central Hub" },
  // World Discovery
  { id: "ep-wd-entrance", type: "waypoint", lat: 28.3768, lng: -81.5475, land: "World Discovery", label: "World Discovery Entrance" },
  { id: "ep-guardians", type: "attraction", lat: 28.3773, lng: -81.5468, land: "World Discovery", label: "Guardians of the Galaxy: Cosmic Rewind", attractionId: "ep-guardians" },
  { id: "ep-test-track", type: "attraction", lat: 28.3775, lng: -81.5462, land: "World Discovery", label: "Test Track", attractionId: "ep-test-track" },
  { id: "ep-mission-space", type: "attraction", lat: 28.3772, lng: -81.5465, land: "World Discovery", label: "Mission: SPACE", attractionId: "ep-mission-space" },
  { id: "ep-space-220", type: "restaurant", lat: 28.3770, lng: -81.5470, land: "World Discovery", label: "Space 220 Restaurant" },
  { id: "ep-restroom-wd", type: "restroom", lat: 28.3771, lng: -81.5472, land: "World Discovery", label: "World Discovery Restroom" },
  // World Nature
  { id: "ep-wn-entrance", type: "waypoint", lat: 28.3768, lng: -81.5512, land: "World Nature", label: "World Nature Entrance" },
  { id: "ep-soarin", type: "attraction", lat: 28.3773, lng: -81.5518, land: "World Nature", label: "Soarin' Around the World", attractionId: "ep-soarin" },
  { id: "ep-nemo", type: "attraction", lat: 28.3770, lng: -81.5520, land: "World Nature", label: "The Seas with Nemo & Friends", attractionId: "ep-nemo" },
  { id: "ep-sunshine-seasons", type: "restaurant", lat: 28.3772, lng: -81.5515, land: "World Nature", label: "Sunshine Seasons" },
  { id: "ep-garden-grill", type: "restaurant", lat: 28.3774, lng: -81.5516, land: "World Nature", label: "Garden Grill Restaurant" },
  { id: "ep-turtle-talk", type: "show", lat: 28.3771, lng: -81.5521, land: "World Nature", label: "Turtle Talk with Crush" },
  { id: "ep-restroom-wn", type: "restroom", lat: 28.3769, lng: -81.5516, land: "World Nature", label: "World Nature Restroom" },
  // World Showcase
  { id: "ep-ws-entrance", type: "waypoint", lat: 28.3780, lng: -81.5494, land: "World Showcase", label: "World Showcase Entrance" },
  { id: "ep-mexico", type: "waypoint", lat: 28.3790, lng: -81.5520, land: "World Showcase - Mexico", label: "Mexico Pavilion" },
  { id: "ep-norway", type: "waypoint", lat: 28.3795, lng: -81.5515, land: "World Showcase - Norway", label: "Norway Pavilion" },
  { id: "ep-frozen", type: "attraction", lat: 28.3796, lng: -81.5513, land: "World Showcase - Norway", label: "Frozen Ever After", attractionId: "ep-frozen" },
  { id: "ep-akershus", type: "restaurant", lat: 28.3794, lng: -81.5514, land: "World Showcase - Norway", label: "Akershus Royal Banquet Hall" },
  { id: "ep-china", type: "waypoint", lat: 28.3800, lng: -81.5508, land: "World Showcase - China", label: "China Pavilion" },
  { id: "ep-germany", type: "waypoint", lat: 28.3803, lng: -81.5501, land: "World Showcase - Germany", label: "Germany Pavilion" },
  { id: "ep-italy", type: "waypoint", lat: 28.3805, lng: -81.5494, land: "World Showcase - Italy", label: "Italy Pavilion" },
  { id: "ep-via-napoli", type: "restaurant", lat: 28.3804, lng: -81.5493, land: "World Showcase - Italy", label: "Via Napoli Ristorante e Pizzeria" },
  { id: "ep-america", type: "waypoint", lat: 28.3803, lng: -81.5487, land: "World Showcase - America", label: "The American Adventure" },
  { id: "ep-japan", type: "waypoint", lat: 28.3800, lng: -81.5480, land: "World Showcase - Japan", label: "Japan Pavilion" },
  { id: "ep-teppan-edo", type: "restaurant", lat: 28.3799, lng: -81.5479, land: "World Showcase - Japan", label: "Teppan Edo" },
  { id: "ep-morocco", type: "waypoint", lat: 28.3795, lng: -81.5475, land: "World Showcase - Morocco", label: "Morocco Pavilion" },
  { id: "ep-france", type: "waypoint", lat: 28.3790, lng: -81.5470, land: "World Showcase - France", label: "France Pavilion" },
  { id: "ep-remy", type: "attraction", lat: 28.3789, lng: -81.5468, land: "World Showcase - France", label: "Remy's Ratatouille Adventure", attractionId: "ep-remy" },
  { id: "ep-uk", type: "waypoint", lat: 28.3785, lng: -81.5472, land: "World Showcase - UK", label: "United Kingdom Pavilion" },
  { id: "ep-canada", type: "waypoint", lat: 28.3782, lng: -81.5478, land: "World Showcase - Canada", label: "Canada Pavilion" },
  { id: "ep-le-cellier", type: "restaurant", lat: 28.3781, lng: -81.5477, land: "World Showcase - Canada", label: "Le Cellier Steakhouse" },
  { id: "ep-lagoon", type: "landmark", lat: 28.3795, lng: -81.5494, land: "World Showcase", label: "World Showcase Lagoon (Fireworks)" },
  { id: "ep-restroom-ws", type: "restroom", lat: 28.3788, lng: -81.5494, land: "World Showcase", label: "World Showcase Restroom" },
  { id: "ep-photopass-earth", type: "photopass", lat: 28.3758, lng: -81.5494, land: "World Celebration", label: "Spaceship Earth PhotoPass" },
];

const edges: PathEdge[] = [
  { from: "ep-entrance", to: "ep-spaceship-earth", distance_m: 100, shortcut: false },
  { from: "ep-spaceship-earth", to: "ep-hub", distance_m: 100, shortcut: false },
  { from: "ep-spaceship-earth", to: "ep-photopass-earth", distance_m: 20, shortcut: false },
  { from: "ep-hub", to: "ep-wd-entrance", distance_m: 150, shortcut: false },
  { from: "ep-hub", to: "ep-wn-entrance", distance_m: 150, shortcut: false },
  { from: "ep-hub", to: "ep-ws-entrance", distance_m: 200, shortcut: false },
  // World Discovery
  { from: "ep-wd-entrance", to: "ep-guardians", distance_m: 100, shortcut: false },
  { from: "ep-wd-entrance", to: "ep-space-220", distance_m: 80, shortcut: false },
  { from: "ep-wd-entrance", to: "ep-restroom-wd", distance_m: 40, shortcut: false },
  { from: "ep-guardians", to: "ep-mission-space", distance_m: 70, shortcut: false },
  { from: "ep-mission-space", to: "ep-test-track", distance_m: 60, shortcut: false },
  { from: "ep-space-220", to: "ep-mission-space", distance_m: 50, shortcut: false },
  // World Nature
  { from: "ep-wn-entrance", to: "ep-soarin", distance_m: 80, shortcut: false },
  { from: "ep-wn-entrance", to: "ep-sunshine-seasons", distance_m: 60, shortcut: false },
  { from: "ep-wn-entrance", to: "ep-restroom-wn", distance_m: 30, shortcut: false },
  { from: "ep-soarin", to: "ep-garden-grill", distance_m: 40, shortcut: false },
  { from: "ep-soarin", to: "ep-nemo", distance_m: 80, shortcut: false },
  { from: "ep-nemo", to: "ep-turtle-talk", distance_m: 30, shortcut: false },
  // World Showcase loop (clockwise from entrance)
  { from: "ep-ws-entrance", to: "ep-mexico", distance_m: 200, shortcut: false },
  { from: "ep-ws-entrance", to: "ep-canada", distance_m: 200, shortcut: false },
  { from: "ep-mexico", to: "ep-norway", distance_m: 120, shortcut: false },
  { from: "ep-norway", to: "ep-frozen", distance_m: 30, shortcut: false },
  { from: "ep-norway", to: "ep-akershus", distance_m: 25, shortcut: false },
  { from: "ep-norway", to: "ep-china", distance_m: 140, shortcut: false },
  { from: "ep-china", to: "ep-germany", distance_m: 130, shortcut: false },
  { from: "ep-germany", to: "ep-italy", distance_m: 120, shortcut: false },
  { from: "ep-italy", to: "ep-via-napoli", distance_m: 20, shortcut: false },
  { from: "ep-italy", to: "ep-america", distance_m: 100, shortcut: false },
  { from: "ep-america", to: "ep-japan", distance_m: 120, shortcut: false },
  { from: "ep-japan", to: "ep-teppan-edo", distance_m: 20, shortcut: false },
  { from: "ep-japan", to: "ep-morocco", distance_m: 120, shortcut: false },
  { from: "ep-morocco", to: "ep-france", distance_m: 100, shortcut: false },
  { from: "ep-france", to: "ep-remy", distance_m: 40, shortcut: false },
  { from: "ep-france", to: "ep-uk", distance_m: 100, shortcut: false },
  { from: "ep-uk", to: "ep-canada", distance_m: 120, shortcut: false },
  { from: "ep-canada", to: "ep-le-cellier", distance_m: 20, shortcut: false },
  { from: "ep-ws-entrance", to: "ep-lagoon", distance_m: 100, shortcut: false },
  { from: "ep-ws-entrance", to: "ep-restroom-ws", distance_m: 50, shortcut: false },
];

const attractions: Attraction[] = [
  { id: "ep-guardians", parkId: PARK_ID, name: "Guardians of the Galaxy: Cosmic Rewind", land: "World Discovery", nodeId: "ep-guardians", hasLightningLane: true, llType: "individual", avgDurationMin: 4, rideType: "coaster", thrillLevel: 5, heightReqIn: 42, tips: "Book LL immediately — sells out first. Indoor coaster.", avgWait: { low: 45, moderate: 90, high: 150 } },
  { id: "ep-test-track", parkId: PARK_ID, name: "Test Track", land: "World Discovery", nodeId: "ep-test-track", hasLightningLane: true, llType: "multi", avgDurationMin: 5, rideType: "ride", thrillLevel: 4, heightReqIn: 40, tips: "Design a car, then test it at 65 mph.", avgWait: { low: 20, moderate: 50, high: 90 } },
  { id: "ep-mission-space", parkId: PARK_ID, name: "Mission: SPACE", land: "World Discovery", nodeId: "ep-mission-space", hasLightningLane: false, llType: null, avgDurationMin: 5, rideType: "simulator", thrillLevel: 4, heightReqIn: 40, tips: "Orange mission is intense, Green is tamer.", avgWait: { low: 15, moderate: 30, high: 55 } },
  { id: "ep-soarin", parkId: PARK_ID, name: "Soarin' Around the World", land: "World Nature", nodeId: "ep-soarin", hasLightningLane: true, llType: "multi", avgDurationMin: 5, rideType: "simulator", thrillLevel: 2, heightReqIn: 40, tips: "Classic hang glider simulation.", avgWait: { low: 20, moderate: 40, high: 70 } },
  { id: "ep-nemo", parkId: PARK_ID, name: "The Seas with Nemo & Friends", land: "World Nature", nodeId: "ep-nemo", hasLightningLane: false, llType: null, avgDurationMin: 6, rideType: "dark-ride", thrillLevel: 1, heightReqIn: null, tips: "Great for young kids.", avgWait: { low: 10, moderate: 20, high: 35 } },
  { id: "ep-spaceship-earth", parkId: PARK_ID, name: "Spaceship Earth", land: "World Celebration", nodeId: "ep-spaceship-earth", hasLightningLane: false, llType: null, avgDurationMin: 15, rideType: "dark-ride", thrillLevel: 1, heightReqIn: null, tips: "Iconic EPCOT landmark. Low waits.", avgWait: { low: 10, moderate: 20, high: 35 } },
  { id: "ep-frozen", parkId: PARK_ID, name: "Frozen Ever After", land: "World Showcase - Norway", nodeId: "ep-frozen", hasLightningLane: true, llType: "multi", avgDurationMin: 5, rideType: "boat-ride", thrillLevel: 2, heightReqIn: null, tips: "Boat ride through Arendelle. Book LL morning.", avgWait: { low: 25, moderate: 55, high: 90 } },
  { id: "ep-remy", parkId: PARK_ID, name: "Remy's Ratatouille Adventure", land: "World Showcase - France", nodeId: "ep-remy", hasLightningLane: true, llType: "multi", avgDurationMin: 5, rideType: "dark-ride", thrillLevel: 2, heightReqIn: null, tips: "Charming ride, popular with families.", avgWait: { low: 30, moderate: 60, high: 95 } },
];

const shows: Show[] = [
  { id: "ep-turtle-talk", parkId: PARK_ID, name: "Turtle Talk with Crush", nodeId: "ep-turtle-talk", land: "World Nature", durationMin: 15, tips: "Interactive show with Crush. Kids love it." },
];

const diningNodes: DiningNode[] = [
  { nodeId: "ep-space-220", name: "Space 220 Restaurant", land: "World Discovery", diningType: "table-service", durationMin: 90, requiresReservation: true, tips: "Hardest table in WDW." },
  { nodeId: "ep-sunshine-seasons", name: "Sunshine Seasons", land: "World Nature", diningType: "quick-service", durationMin: 30, requiresReservation: false, tips: "Best QS in EPCOT." },
  { nodeId: "ep-garden-grill", name: "Garden Grill Restaurant", land: "World Nature", diningType: "character-dining", durationMin: 75, requiresReservation: true, tips: "Rotating character dining." },
  { nodeId: "ep-akershus", name: "Akershus Royal Banquet Hall", land: "World Showcase - Norway", diningType: "character-dining", durationMin: 75, requiresReservation: true, tips: "Princess character dining." },
  { nodeId: "ep-le-cellier", name: "Le Cellier Steakhouse", land: "World Showcase - Canada", diningType: "table-service", durationMin: 75, requiresReservation: true, tips: "Best steak in WDW." },
  { nodeId: "ep-via-napoli", name: "Via Napoli Ristorante e Pizzeria", land: "World Showcase - Italy", diningType: "table-service", durationMin: 75, requiresReservation: true, tips: "Authentic Neapolitan pizza." },
  { nodeId: "ep-teppan-edo", name: "Teppan Edo", land: "World Showcase - Japan", diningType: "table-service", durationMin: 75, requiresReservation: true, tips: "Teppanyaki style." },
];

function generateCrowdWindows(): LandCrowdWindow[] {
  const lands = ["World Celebration", "World Discovery", "World Nature", "World Showcase"];
  const windows: LandCrowdWindow[] = [];
  const patterns: Record<string, Record<number, number>> = {
    "World Celebration": { 9: 4, 10: 3, 11: 3, 12: 3, 13: 3, 14: 2, 15: 2, 16: 3, 17: 3, 18: 3, 19: 3, 20: 4, 21: 4 },
    "World Discovery": { 9: 5, 10: 5, 11: 4, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3, 17: 2, 18: 2, 19: 2, 20: 2, 21: 1 },
    "World Nature": { 9: 4, 10: 4, 11: 4, 12: 3, 13: 3, 14: 3, 15: 2, 16: 2, 17: 2, 18: 2, 19: 2, 20: 1, 21: 1 },
    "World Showcase": { 9: 1, 10: 1, 11: 2, 12: 3, 13: 3, 14: 3, 15: 4, 16: 4, 17: 5, 18: 5, 19: 5, 20: 5, 21: 5 },
  };
  for (const land of lands) {
    const p = patterns[land] || {};
    for (let dow = 0; dow <= 6; dow++) {
      const wm = (dow === 0 || dow === 6) ? 1 : 0;
      for (let h = 9; h <= 21; h++) {
        windows.push({ parkId: PARK_ID, land, dayOfWeek: dow, hour: h, crowdLevel: Math.min(5, (p[h] || 3) + wm) });
      }
    }
  }
  return windows;
}

export const epcotData: ParkData = {
  parkId: PARK_ID,
  graph: { nodes, edges },
  attractions,
  shows,
  diningNodes,
  crowdWindows: generateCrowdWindows(),
  parkMeta: {
    emoji: "🌍",
    bestFor: "Food, culture, adults, International dining",
    llPriority: ["Guardians of the Galaxy: Cosmic Rewind"],
    entranceNodeId: "ep-entrance",
    fireworksNodeId: "ep-lagoon",
    fireworksName: "Luminous: The Symphony of Us 🎆",
  },
};
