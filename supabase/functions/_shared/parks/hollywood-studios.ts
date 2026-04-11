// ═══════════════════════════════════════════════════════════════════════════════
// Hollywood Studios — Path Graph, Attractions, Shows, Dining, Crowd Windows
// ═══════════════════════════════════════════════════════════════════════════════

import type { ParkData, PathNode, PathEdge, Attraction, Show, DiningNode, LandCrowdWindow } from "../types.ts";

const PARK_ID = "hollywood-studios";

const nodes: PathNode[] = [
  { id: "hs-entrance", type: "entrance", lat: 28.3575, lng: -81.5584, land: "Hollywood Boulevard", label: "Hollywood Studios Entrance" },
  { id: "hs-hub", type: "waypoint", lat: 28.3565, lng: -81.5584, land: "Hollywood Boulevard", label: "Hollywood Boulevard Hub" },
  // Galaxy's Edge
  { id: "hs-ge-entrance", type: "waypoint", lat: 28.3540, lng: -81.5610, land: "Galaxy's Edge", label: "Galaxy's Edge Entrance" },
  { id: "hs-rise", type: "attraction", lat: 28.3535, lng: -81.5618, land: "Galaxy's Edge", label: "Star Wars: Rise of the Resistance", attractionId: "hs-rise" },
  { id: "hs-falcon", type: "attraction", lat: 28.3538, lng: -81.5615, land: "Galaxy's Edge", label: "Millennium Falcon: Smugglers Run", attractionId: "hs-falcon" },
  { id: "hs-docking-bay", type: "restaurant", lat: 28.3536, lng: -81.5616, land: "Galaxy's Edge", label: "Docking Bay 7 Food and Cargo" },
  { id: "hs-ogas", type: "restaurant", lat: 28.3537, lng: -81.5613, land: "Galaxy's Edge", label: "Oga's Cantina" },
  { id: "hs-restroom-ge", type: "restroom", lat: 28.3539, lng: -81.5612, land: "Galaxy's Edge", label: "Galaxy's Edge Restroom" },
  // Toy Story Land
  { id: "hs-tsl-entrance", type: "waypoint", lat: 28.3545, lng: -81.5560, land: "Toy Story Land", label: "Toy Story Land Entrance" },
  { id: "hs-slinky", type: "attraction", lat: 28.3540, lng: -81.5555, land: "Toy Story Land", label: "Slinky Dog Dash", attractionId: "hs-slinky" },
  { id: "hs-aliens", type: "attraction", lat: 28.3538, lng: -81.5552, land: "Toy Story Land", label: "Alien Swirling Saucers", attractionId: "hs-aliens" },
  { id: "hs-toy-mania", type: "attraction", lat: 28.3542, lng: -81.5558, land: "Toy Story Land", label: "Toy Story Mania!", attractionId: "hs-toy-mania" },
  { id: "hs-woodys", type: "restaurant", lat: 28.3539, lng: -81.5556, land: "Toy Story Land", label: "Woody's Lunch Box" },
  // Sunset Boulevard
  { id: "hs-sunset-entrance", type: "waypoint", lat: 28.3560, lng: -81.5568, land: "Sunset Boulevard", label: "Sunset Boulevard Entrance" },
  { id: "hs-tower", type: "attraction", lat: 28.3548, lng: -81.5560, land: "Sunset Boulevard", label: "Tower of Terror", attractionId: "hs-tower" },
  { id: "hs-rockin", type: "attraction", lat: 28.3546, lng: -81.5563, land: "Sunset Boulevard", label: "Rock 'n' Roller Coaster", attractionId: "hs-rockin" },
  { id: "hs-fantasmic", type: "show", lat: 28.3543, lng: -81.5566, land: "Sunset Boulevard", label: "Fantasmic! Amphitheater" },
  { id: "hs-beauty-beast", type: "show", lat: 28.3550, lng: -81.5562, land: "Sunset Boulevard", label: "Beauty and the Beast - Live on Stage" },
  { id: "hs-restroom-sunset", type: "restroom", lat: 28.3549, lng: -81.5565, land: "Sunset Boulevard", label: "Sunset Boulevard Restroom" },
  // Echo Lake / Hollywood Blvd
  { id: "hs-echo-lake", type: "waypoint", lat: 28.3558, lng: -81.5578, land: "Echo Lake", label: "Echo Lake" },
  { id: "hs-runaway", type: "attraction", lat: 28.3562, lng: -81.5582, land: "Hollywood Boulevard", label: "Mickey & Minnie's Runaway Railway", attractionId: "hs-runaway" },
  { id: "hs-indiana", type: "show", lat: 28.3555, lng: -81.5575, land: "Echo Lake", label: "Indiana Jones Epic Stunt Spectacular" },
  { id: "hs-scifi", type: "restaurant", lat: 28.3557, lng: -81.5577, land: "Echo Lake", label: "Sci-Fi Dine-In Theater Restaurant" },
  { id: "hs-50s", type: "restaurant", lat: 28.3556, lng: -81.5579, land: "Echo Lake", label: "50's Prime Time Café" },
  { id: "hs-backlot", type: "restaurant", lat: 28.3554, lng: -81.5576, land: "Echo Lake", label: "Backlot Express" },
  { id: "hs-brown-derby", type: "restaurant", lat: 28.3568, lng: -81.5584, land: "Hollywood Boulevard", label: "Hollywood Brown Derby" },
  { id: "hs-photopass-hub", type: "photopass", lat: 28.3566, lng: -81.5583, land: "Hollywood Boulevard", label: "Hollywood Studios PhotoPass" },
];

const edges: PathEdge[] = [
  { from: "hs-entrance", to: "hs-hub", distance_m: 120, shortcut: false },
  { from: "hs-hub", to: "hs-runaway", distance_m: 50, shortcut: false },
  { from: "hs-hub", to: "hs-brown-derby", distance_m: 40, shortcut: false },
  { from: "hs-hub", to: "hs-photopass-hub", distance_m: 20, shortcut: false },
  { from: "hs-hub", to: "hs-sunset-entrance", distance_m: 150, shortcut: false },
  { from: "hs-hub", to: "hs-echo-lake", distance_m: 100, shortcut: false },
  // Echo Lake
  { from: "hs-echo-lake", to: "hs-indiana", distance_m: 60, shortcut: false },
  { from: "hs-echo-lake", to: "hs-scifi", distance_m: 40, shortcut: false },
  { from: "hs-echo-lake", to: "hs-50s", distance_m: 45, shortcut: false },
  { from: "hs-echo-lake", to: "hs-backlot", distance_m: 50, shortcut: false },
  { from: "hs-echo-lake", to: "hs-ge-entrance", distance_m: 200, shortcut: false },
  // Galaxy's Edge
  { from: "hs-ge-entrance", to: "hs-falcon", distance_m: 80, shortcut: false },
  { from: "hs-ge-entrance", to: "hs-restroom-ge", distance_m: 30, shortcut: false },
  { from: "hs-falcon", to: "hs-rise", distance_m: 100, shortcut: false },
  { from: "hs-falcon", to: "hs-ogas", distance_m: 40, shortcut: false },
  { from: "hs-falcon", to: "hs-docking-bay", distance_m: 50, shortcut: false },
  // Sunset Boulevard
  { from: "hs-sunset-entrance", to: "hs-tower", distance_m: 150, shortcut: false },
  { from: "hs-sunset-entrance", to: "hs-beauty-beast", distance_m: 100, shortcut: false },
  { from: "hs-sunset-entrance", to: "hs-restroom-sunset", distance_m: 60, shortcut: false },
  { from: "hs-tower", to: "hs-rockin", distance_m: 60, shortcut: false },
  { from: "hs-rockin", to: "hs-fantasmic", distance_m: 80, shortcut: false },
  // Toy Story Land
  { from: "hs-echo-lake", to: "hs-tsl-entrance", distance_m: 180, shortcut: false },
  { from: "hs-tsl-entrance", to: "hs-toy-mania", distance_m: 60, shortcut: false },
  { from: "hs-toy-mania", to: "hs-slinky", distance_m: 70, shortcut: false },
  { from: "hs-slinky", to: "hs-aliens", distance_m: 50, shortcut: false },
  { from: "hs-slinky", to: "hs-woodys", distance_m: 30, shortcut: false },
  // Cross-land
  { from: "hs-ge-entrance", to: "hs-tsl-entrance", distance_m: 250, shortcut: true, throughBuilding: "Path between Galaxy's Edge and Toy Story Land" },
];

const attractions: Attraction[] = [
  { id: "hs-rise", parkId: PARK_ID, name: "Star Wars: Rise of the Resistance", land: "Galaxy's Edge", nodeId: "hs-rise", hasLightningLane: true, llType: "individual", avgDurationMin: 20, rideType: "dark-ride", thrillLevel: 4, heightReqIn: 40, tips: "Book LL immediately. Most immersive ride in WDW.", avgWait: { low: 50, moderate: 90, high: 150 } },
  { id: "hs-falcon", parkId: PARK_ID, name: "Millennium Falcon: Smugglers Run", land: "Galaxy's Edge", nodeId: "hs-falcon", hasLightningLane: true, llType: "multi", avgDurationMin: 5, rideType: "simulator", thrillLevel: 3, heightReqIn: 38, tips: "Pilot role gets the best experience.", avgWait: { low: 25, moderate: 55, high: 90 } },
  { id: "hs-slinky", parkId: PARK_ID, name: "Slinky Dog Dash", land: "Toy Story Land", nodeId: "hs-slinky", hasLightningLane: true, llType: "multi", avgDurationMin: 3, rideType: "coaster", thrillLevel: 3, heightReqIn: 38, tips: "Best family coaster in HS. Book LL early.", avgWait: { low: 30, moderate: 65, high: 110 } },
  { id: "hs-aliens", parkId: PARK_ID, name: "Alien Swirling Saucers", land: "Toy Story Land", nodeId: "hs-aliens", hasLightningLane: false, llType: null, avgDurationMin: 2, rideType: "ride", thrillLevel: 1, heightReqIn: 32, tips: "Good for little kids.", avgWait: { low: 15, moderate: 30, high: 50 } },
  { id: "hs-toy-mania", parkId: PARK_ID, name: "Toy Story Mania!", land: "Toy Story Land", nodeId: "hs-toy-mania", hasLightningLane: true, llType: "multi", avgDurationMin: 7, rideType: "dark-ride", thrillLevel: 2, heightReqIn: null, tips: "Interactive 4D shooter. Families love this.", avgWait: { low: 20, moderate: 45, high: 75 } },
  { id: "hs-tower", parkId: PARK_ID, name: "Tower of Terror", land: "Sunset Boulevard", nodeId: "hs-tower", hasLightningLane: true, llType: "multi", avgDurationMin: 5, rideType: "drop-tower", thrillLevel: 5, heightReqIn: 40, tips: "Haunted elevator drops. Best thrill in HS.", avgWait: { low: 25, moderate: 55, high: 90 } },
  { id: "hs-rockin", parkId: PARK_ID, name: "Rock 'n' Roller Coaster", land: "Sunset Boulevard", nodeId: "hs-rockin", hasLightningLane: true, llType: "multi", avgDurationMin: 2, rideType: "coaster", thrillLevel: 5, heightReqIn: 48, tips: "Launching coaster with Aerosmith.", avgWait: { low: 25, moderate: 55, high: 90 } },
  { id: "hs-runaway", parkId: PARK_ID, name: "Mickey & Minnie's Runaway Railway", land: "Hollywood Boulevard", nodeId: "hs-runaway", hasLightningLane: true, llType: "multi", avgDurationMin: 7, rideType: "dark-ride", thrillLevel: 2, heightReqIn: null, tips: "Book LL. Major ride.", avgWait: { low: 25, moderate: 55, high: 85 } },
];

const shows: Show[] = [
  { id: "hs-fantasmic", parkId: PARK_ID, name: "Fantasmic!", nodeId: "hs-fantasmic", land: "Sunset Boulevard", durationMin: 30, tips: "Evening show. Arrive 45 min early." },
  { id: "hs-beauty-beast", parkId: PARK_ID, name: "Beauty and the Beast - Live on Stage", nodeId: "hs-beauty-beast", land: "Sunset Boulevard", durationMin: 30, tips: "Great stage show. Good afternoon break." },
  { id: "hs-indiana", parkId: PARK_ID, name: "Indiana Jones Epic Stunt Spectacular", nodeId: "hs-indiana", land: "Echo Lake", durationMin: 30, tips: "Great live stunt show. Arrive 15 min early." },
];

const diningNodes: DiningNode[] = [
  { nodeId: "hs-docking-bay", name: "Docking Bay 7 Food and Cargo", land: "Galaxy's Edge", diningType: "quick-service", durationMin: 30, requiresReservation: false, tips: "QS in Galaxy's Edge. Themed menu." },
  { nodeId: "hs-ogas", name: "Oga's Cantina", land: "Galaxy's Edge", diningType: "bar", durationMin: 45, requiresReservation: true, tips: "45 min limit. Galaxy cocktail bar." },
  { nodeId: "hs-woodys", name: "Woody's Lunch Box", land: "Toy Story Land", diningType: "quick-service", durationMin: 25, requiresReservation: false, tips: "Pop Tart French Toast is a fan favorite." },
  { nodeId: "hs-scifi", name: "Sci-Fi Dine-In Theater Restaurant", land: "Echo Lake", diningType: "table-service", durationMin: 75, requiresReservation: true, tips: "Drive-in movie atmosphere." },
  { nodeId: "hs-50s", name: "50's Prime Time Café", land: "Echo Lake", diningType: "table-service", durationMin: 75, requiresReservation: true, tips: "Interactive servers, comfort food." },
  { nodeId: "hs-backlot", name: "Backlot Express", land: "Echo Lake", diningType: "quick-service", durationMin: 25, requiresReservation: false, tips: "Best QS in HS area." },
  { nodeId: "hs-brown-derby", name: "Hollywood Brown Derby", land: "Hollywood Boulevard", diningType: "table-service", durationMin: 75, requiresReservation: true, tips: "Fine dining, Cobb salad." },
];

function generateCrowdWindows(): LandCrowdWindow[] {
  const lands = ["Hollywood Boulevard", "Galaxy's Edge", "Toy Story Land", "Sunset Boulevard", "Echo Lake"];
  const windows: LandCrowdWindow[] = [];
  const patterns: Record<string, Record<number, number>> = {
    "Hollywood Boulevard": { 8: 4, 9: 3, 10: 3, 11: 3, 12: 3, 13: 3, 14: 2, 15: 2, 16: 3, 17: 3, 18: 4, 19: 4, 20: 4, 21: 3 },
    "Galaxy's Edge": { 8: 5, 9: 5, 10: 4, 11: 4, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3, 17: 3, 18: 4, 19: 4, 20: 3, 21: 2 },
    "Toy Story Land": { 8: 5, 9: 5, 10: 4, 11: 4, 12: 4, 13: 3, 14: 3, 15: 3, 16: 3, 17: 2, 18: 2, 19: 2, 20: 1, 21: 1 },
    "Sunset Boulevard": { 8: 2, 9: 3, 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3, 17: 3, 18: 4, 19: 4, 20: 5, 21: 5 },
    "Echo Lake": { 8: 2, 9: 2, 10: 3, 11: 3, 12: 4, 13: 4, 14: 3, 15: 3, 16: 2, 17: 2, 18: 2, 19: 2, 20: 2, 21: 1 },
  };
  for (const land of lands) {
    const p = patterns[land] || {};
    for (let dow = 0; dow <= 6; dow++) {
      const wm = (dow === 0 || dow === 6) ? 1 : 0;
      for (let h = 8; h <= 21; h++) {
        windows.push({ parkId: PARK_ID, land, dayOfWeek: dow, hour: h, crowdLevel: Math.min(5, (p[h] || 3) + wm) });
      }
    }
  }
  return windows;
}

export const hollywoodStudiosData: ParkData = {
  parkId: PARK_ID,
  graph: { nodes, edges },
  attractions,
  shows,
  diningNodes,
  crowdWindows: generateCrowdWindows(),
  parkMeta: {
    emoji: "🎬",
    bestFor: "Thrill seekers, Star Wars fans, tweens",
    llPriority: ["Star Wars: Rise of the Resistance"],
    entranceNodeId: "hs-entrance",
    fireworksNodeId: "hs-fantasmic",
    fireworksName: "Fantasmic! 🎆",
  },
};
