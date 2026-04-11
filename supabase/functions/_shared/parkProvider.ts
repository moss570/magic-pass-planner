// ═══════════════════════════════════════════════════════════════════════════════
// Park Provider — Abstraction layer for park data
// DisneyParkProvider is the first implementation
// UniversalParkProvider and SeaWorldParkProvider can be added later
// ═══════════════════════════════════════════════════════════════════════════════

import type { ParkProvider, ParkData, PathGraph, Attraction, Show, LandCrowdWindow, TransitMatrix, DiningNode } from "./types.ts";
import { magicKingdomData } from "./parks/magic-kingdom.ts";
import { epcotData } from "./parks/epcot.ts";
import { hollywoodStudiosData } from "./parks/hollywood-studios.ts";
import { animalKingdomData } from "./parks/animal-kingdom.ts";
import { WDW_TRANSIT } from "./transitMatrix.ts";

// Map display names → internal park IDs
const PARK_NAME_MAP: Record<string, string> = {
  "Magic Kingdom": "magic-kingdom",
  "EPCOT": "epcot",
  "Hollywood Studios": "hollywood-studios",
  "Animal Kingdom": "animal-kingdom",
  "Typhoon Lagoon": "typhoon-lagoon",
  "Blizzard Beach": "blizzard-beach",
  "🌊 Typhoon Lagoon": "typhoon-lagoon",
  "❄️ Blizzard Beach": "blizzard-beach",
};

export function normalizeParkId(parkNameOrId: string): string {
  return PARK_NAME_MAP[parkNameOrId] || parkNameOrId;
}

const PARK_DATA_MAP: Record<string, ParkData> = {
  "magic-kingdom": magicKingdomData,
  "epcot": epcotData,
  "hollywood-studios": hollywoodStudiosData,
  "animal-kingdom": animalKingdomData,
};

export class DisneyParkProvider implements ParkProvider {
  getPathGraph(parkId: string): PathGraph {
    const data = PARK_DATA_MAP[parkId];
    if (!data) return { nodes: [], edges: [] };
    return data.graph;
  }

  getAttractions(parkId: string): Attraction[] {
    return PARK_DATA_MAP[parkId]?.attractions || [];
  }

  getShows(parkId: string): Show[] {
    return PARK_DATA_MAP[parkId]?.shows || [];
  }

  getLandCrowdWindows(parkId: string): LandCrowdWindow[] {
    return PARK_DATA_MAP[parkId]?.crowdWindows || [];
  }

  getTransitMatrix(): TransitMatrix {
    return WDW_TRANSIT;
  }

  getDiningNodes(parkId: string): DiningNode[] {
    return PARK_DATA_MAP[parkId]?.diningNodes || [];
  }

  getParkMeta(parkId: string): ParkData['parkMeta'] | null {
    return PARK_DATA_MAP[parkId]?.parkMeta || null;
  }

  /** Check if we have v2 path graph data for this park */
  hasPathData(parkId: string): boolean {
    const data = PARK_DATA_MAP[parkId];
    return !!data && data.graph.nodes.length > 0 && data.graph.edges.length > 0;
  }

  /** Get all supported park IDs */
  getSupportedParkIds(): string[] {
    return Object.keys(PARK_DATA_MAP);
  }
}

// Singleton
export const disneyProvider = new DisneyParkProvider();
