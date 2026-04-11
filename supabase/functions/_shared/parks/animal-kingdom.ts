// ═══════════════════════════════════════════════════════════════════════════════
// Animal Kingdom — Path Graph, Attractions, Shows, Dining, Crowd Windows
// ═══════════════════════════════════════════════════════════════════════════════

import type { ParkData, PathNode, PathEdge, Attraction, Show, DiningNode, LandCrowdWindow } from "../types.ts";

const PARK_ID = "animal-kingdom";

const nodes: PathNode[] = [
  { id: "ak-entrance", type: "entrance", lat: 28.3590, lng: -81.5902, land: "The Oasis", label: "Animal Kingdom Entrance" },
  { id: "ak-oasis-path", type: "waypoint", lat: 28.3585, lng: -81.5902, land: "The Oasis", label: "Oasis Path" },
  { id: "ak-tree-of-life", type: "landmark", lat: 28.3578, lng: -81.5902, land: "Discovery Island", label: "Tree of Life" },
  { id: "ak-di-hub", type: "waypoint", lat: 28.3575, lng: -81.5902, land: "Discovery Island", label: "Discovery Island Hub" },
  // Pandora
  { id: "ak-pandora-entrance", type: "waypoint", lat: 28.3572, lng: -81.5920, land: "Pandora", label: "Pandora Entrance" },
  { id: "ak-flight-passage", type: "attraction", lat: 28.3568, lng: -81.5928, land: "Pandora", label: "Avatar Flight of Passage", attractionId: "ak-flight-passage" },
  { id: "ak-navi-river", type: "attraction", lat: 28.3566, lng: -81.5925, land: "Pandora", label: "Na'vi River Journey", attractionId: "ak-navi-river" },
  { id: "ak-satuli", type: "restaurant", lat: 28.3569, lng: -81.5926, land: "Pandora", label: "Satu'li Canteen" },
  { id: "ak-restroom-pandora", type: "restroom", lat: 28.3570, lng: -81.5923, land: "Pandora", label: "Pandora Restroom" },
  // Africa
  { id: "ak-africa-entrance", type: "waypoint", lat: 28.3575, lng: -81.5915, land: "Africa", label: "Africa Entrance" },
  { id: "ak-safaris", type: "attraction", lat: 28.3578, lng: -81.5925, land: "Africa", label: "Kilimanjaro Safaris", attractionId: "ak-safaris" },
  { id: "ak-gorilla-falls", type: "attraction", lat: 28.3576, lng: -81.5920, land: "Africa", label: "Gorilla Falls Exploration Trail", attractionId: "ak-gorilla-falls" },
  { id: "ak-tusker-house", type: "restaurant", lat: 28.3577, lng: -81.5918, land: "Africa", label: "Tusker House Restaurant" },
  { id: "ak-restroom-africa", type: "restroom", lat: 28.3576, lng: -81.5916, land: "Africa", label: "Africa Restroom" },
  // Asia
  { id: "ak-asia-entrance", type: "waypoint", lat: 28.3570, lng: -81.5888, land: "Asia", label: "Asia Entrance" },
  { id: "ak-everest", type: "attraction", lat: 28.3565, lng: -81.5880, land: "Asia", label: "Expedition Everest", attractionId: "ak-everest" },
  { id: "ak-kali-rapids", type: "attraction", lat: 28.3567, lng: -81.5885, land: "Asia", label: "Kali River Rapids", attractionId: "ak-kali-rapids" },
  { id: "ak-yak-yeti", type: "restaurant", lat: 28.3568, lng: -81.5887, land: "Asia", label: "Yak & Yeti Restaurant" },
  { id: "ak-restroom-asia", type: "restroom", lat: 28.3569, lng: -81.5886, land: "Asia", label: "Asia Restroom" },
  // DinoLand U.S.A.
  { id: "ak-dino-entrance", type: "waypoint", lat: 28.3572, lng: -81.5892, land: "DinoLand U.S.A.", label: "DinoLand Entrance" },
  { id: "ak-triceratop-spin", type: "attraction", lat: 28.3569, lng: -81.5893, land: "DinoLand U.S.A.", label: "TriceraTop Spin", attractionId: "ak-triceratop-spin" },
  { id: "ak-restaurantosaurus", type: "restaurant", lat: 28.3571, lng: -81.5894, land: "DinoLand U.S.A.", label: "Restaurantosaurus" },
  // Discovery Island dining
  { id: "ak-tiffins", type: "restaurant", lat: 28.3576, lng: -81.5905, land: "Discovery Island", label: "Tiffins Restaurant" },
  { id: "ak-flame-tree", type: "restaurant", lat: 28.3574, lng: -81.5900, land: "Discovery Island", label: "Flame Tree Barbecue" },
  { id: "ak-photopass-tol", type: "photopass", lat: 28.3577, lng: -81.5903, land: "Discovery Island", label: "Tree of Life PhotoPass" },
  { id: "ak-snack-drinkwallah", type: "snack", lat: 28.3571, lng: -81.5890, land: "Asia", label: "Drinkwallah" },
];

const edges: PathEdge[] = [
  { from: "ak-entrance", to: "ak-oasis-path", distance_m: 100, shortcut: false },
  { from: "ak-oasis-path", to: "ak-tree-of-life", distance_m: 150, shortcut: false },
  { from: "ak-tree-of-life", to: "ak-di-hub", distance_m: 50, shortcut: false },
  { from: "ak-tree-of-life", to: "ak-photopass-tol", distance_m: 15, shortcut: false },
  // Hub to lands
  { from: "ak-di-hub", to: "ak-pandora-entrance", distance_m: 200, shortcut: false },
  { from: "ak-di-hub", to: "ak-africa-entrance", distance_m: 150, shortcut: false },
  { from: "ak-di-hub", to: "ak-asia-entrance", distance_m: 180, shortcut: false },
  { from: "ak-di-hub", to: "ak-dino-entrance", distance_m: 150, shortcut: false },
  { from: "ak-di-hub", to: "ak-tiffins", distance_m: 50, shortcut: false },
  { from: "ak-di-hub", to: "ak-flame-tree", distance_m: 40, shortcut: false },
  // Pandora
  { from: "ak-pandora-entrance", to: "ak-flight-passage", distance_m: 120, shortcut: false },
  { from: "ak-pandora-entrance", to: "ak-restroom-pandora", distance_m: 30, shortcut: false },
  { from: "ak-flight-passage", to: "ak-navi-river", distance_m: 60, shortcut: false },
  { from: "ak-flight-passage", to: "ak-satuli", distance_m: 50, shortcut: false },
  // Africa
  { from: "ak-africa-entrance", to: "ak-safaris", distance_m: 100, shortcut: false },
  { from: "ak-africa-entrance", to: "ak-tusker-house", distance_m: 50, shortcut: false },
  { from: "ak-africa-entrance", to: "ak-restroom-africa", distance_m: 25, shortcut: false },
  { from: "ak-safaris", to: "ak-gorilla-falls", distance_m: 80, shortcut: false },
  // Africa → Pandora shortcut
  { from: "ak-africa-entrance", to: "ak-pandora-entrance", distance_m: 100, shortcut: true, throughBuilding: "Path between Africa and Pandora" },
  // Asia
  { from: "ak-asia-entrance", to: "ak-everest", distance_m: 150, shortcut: false },
  { from: "ak-asia-entrance", to: "ak-kali-rapids", distance_m: 100, shortcut: false },
  { from: "ak-asia-entrance", to: "ak-yak-yeti", distance_m: 60, shortcut: false },
  { from: "ak-asia-entrance", to: "ak-restroom-asia", distance_m: 30, shortcut: false },
  { from: "ak-asia-entrance", to: "ak-snack-drinkwallah", distance_m: 40, shortcut: false },
  { from: "ak-kali-rapids", to: "ak-everest", distance_m: 80, shortcut: false },
  // DinoLand
  { from: "ak-dino-entrance", to: "ak-triceratop-spin", distance_m: 60, shortcut: false },
  { from: "ak-dino-entrance", to: "ak-restaurantosaurus", distance_m: 40, shortcut: false },
  // Asia ↔ DinoLand
  { from: "ak-asia-entrance", to: "ak-dino-entrance", distance_m: 120, shortcut: false },
];

const attractions: Attraction[] = [
  { id: "ak-flight-passage", parkId: PARK_ID, name: "Avatar Flight of Passage", land: "Pandora", nodeId: "ak-flight-passage", hasLightningLane: true, llType: "individual", avgDurationMin: 5, rideType: "simulator", thrillLevel: 5, heightReqIn: 44, tips: "Book LL immediately. Best ride in WDW.", avgWait: { low: 50, moderate: 100, high: 165 } },
  { id: "ak-navi-river", parkId: PARK_ID, name: "Na'vi River Journey", land: "Pandora", nodeId: "ak-navi-river", hasLightningLane: true, llType: "multi", avgDurationMin: 5, rideType: "boat-ride", thrillLevel: 1, heightReqIn: null, tips: "Gentle boat ride. Stunning visuals.", avgWait: { low: 25, moderate: 55, high: 90 } },
  { id: "ak-safaris", parkId: PARK_ID, name: "Kilimanjaro Safaris", land: "Africa", nodeId: "ak-safaris", hasLightningLane: true, llType: "multi", avgDurationMin: 18, rideType: "ride", thrillLevel: 2, heightReqIn: null, tips: "Go at rope drop — animals most active.", avgWait: { low: 15, moderate: 35, high: 65 } },
  { id: "ak-gorilla-falls", parkId: PARK_ID, name: "Gorilla Falls Exploration Trail", land: "Africa", nodeId: "ak-gorilla-falls", hasLightningLane: false, llType: null, avgDurationMin: 25, rideType: "walk-through", thrillLevel: 1, heightReqIn: null, tips: "Walking trail after Safaris. Gorillas, hippos.", avgWait: { low: 0, moderate: 0, high: 0 } },
  { id: "ak-everest", parkId: PARK_ID, name: "Expedition Everest", land: "Asia", nodeId: "ak-everest", hasLightningLane: true, llType: "multi", avgDurationMin: 4, rideType: "coaster", thrillLevel: 5, heightReqIn: 44, tips: "Best coaster in AK. Goes backwards!", avgWait: { low: 20, moderate: 45, high: 80 } },
  { id: "ak-kali-rapids", parkId: PARK_ID, name: "Kali River Rapids", land: "Asia", nodeId: "ak-kali-rapids", hasLightningLane: false, llType: null, avgDurationMin: 5, rideType: "raft-ride", thrillLevel: 3, heightReqIn: 38, tips: "You WILL get wet. Great on hot days.", avgWait: { low: 20, moderate: 45, high: 75 } },
  { id: "ak-triceratop-spin", parkId: PARK_ID, name: "TriceraTop Spin", land: "DinoLand U.S.A.", nodeId: "ak-triceratop-spin", hasLightningLane: false, llType: null, avgDurationMin: 2, rideType: "ride", thrillLevel: 1, heightReqIn: null, tips: "Dumbo-style ride for little kids.", avgWait: { low: 10, moderate: 15, high: 25 } },
];

const shows: Show[] = [];

const diningNodes: DiningNode[] = [
  { nodeId: "ak-satuli", name: "Satu'li Canteen", land: "Pandora", diningType: "quick-service", durationMin: 30, requiresReservation: false, tips: "Best QS in AK. Customizable bowls." },
  { nodeId: "ak-tusker-house", name: "Tusker House Restaurant", land: "Africa", diningType: "character-dining", durationMin: 90, requiresReservation: true, tips: "African buffet with Donald Duck." },
  { nodeId: "ak-yak-yeti", name: "Yak & Yeti Restaurant", land: "Asia", diningType: "table-service", durationMin: 75, requiresReservation: true, tips: "Pan-Asian cuisine." },
  { nodeId: "ak-tiffins", name: "Tiffins Restaurant", land: "Discovery Island", diningType: "table-service", durationMin: 75, requiresReservation: true, tips: "Best food in AK." },
  { nodeId: "ak-flame-tree", name: "Flame Tree Barbecue", land: "Discovery Island", diningType: "quick-service", durationMin: 30, requiresReservation: false, tips: "Best BBQ in WDW. Great views." },
  { nodeId: "ak-restaurantosaurus", name: "Restaurantosaurus", land: "DinoLand U.S.A.", diningType: "quick-service", durationMin: 25, requiresReservation: false, tips: "Burgers and sandwiches." },
];

function generateCrowdWindows(): LandCrowdWindow[] {
  const lands = ["The Oasis", "Discovery Island", "Pandora", "Africa", "Asia", "DinoLand U.S.A."];
  const windows: LandCrowdWindow[] = [];
  const patterns: Record<string, Record<number, number>> = {
    "The Oasis": { 8: 4, 9: 2, 10: 1, 11: 1, 12: 1, 13: 1, 14: 1, 15: 1, 16: 2, 17: 3, 18: 3, 19: 3 },
    "Discovery Island": { 8: 3, 9: 3, 10: 3, 11: 3, 12: 4, 13: 4, 14: 3, 15: 3, 16: 3, 17: 3, 18: 3, 19: 3 },
    "Pandora": { 8: 5, 9: 5, 10: 4, 11: 4, 12: 4, 13: 3, 14: 3, 15: 3, 16: 3, 17: 4, 18: 5, 19: 5 },
    "Africa": { 8: 5, 9: 4, 10: 3, 11: 3, 12: 3, 13: 3, 14: 2, 15: 2, 16: 2, 17: 2, 18: 2, 19: 1 },
    "Asia": { 8: 3, 9: 3, 10: 3, 11: 4, 12: 4, 13: 4, 14: 3, 15: 3, 16: 3, 17: 2, 18: 2, 19: 1 },
    "DinoLand U.S.A.": { 8: 2, 9: 2, 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 2, 16: 2, 17: 2, 18: 1, 19: 1 },
  };
  for (const land of lands) {
    const p = patterns[land] || {};
    for (let dow = 0; dow <= 6; dow++) {
      const wm = (dow === 0 || dow === 6) ? 1 : 0;
      for (let h = 8; h <= 19; h++) {
        windows.push({ parkId: PARK_ID, land, dayOfWeek: dow, hour: h, crowdLevel: Math.min(5, (p[h] || 3) + wm) });
      }
    }
  }
  return windows;
}

export const animalKingdomData: ParkData = {
  parkId: PARK_ID,
  graph: { nodes, edges },
  attractions,
  shows,
  diningNodes,
  crowdWindows: generateCrowdWindows(),
  parkMeta: {
    emoji: "🦁",
    bestFor: "Nature, adventure, early morning safari",
    llPriority: ["Avatar Flight of Passage"],
    entranceNodeId: "ak-entrance",
  },
};
