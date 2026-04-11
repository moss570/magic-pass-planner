// ═══════════════════════════════════════════════════════════════════════════════
// Inter-park transit matrix for Walt Disney World
// All times include wait + travel + walking to/from stop
// ═══════════════════════════════════════════════════════════════════════════════

import type { TransitMatrix } from "./types.ts";

export const WDW_TRANSIT: TransitMatrix = {
  "magic-kingdom": {
    "magic-kingdom": { durationMin: 0, method: "same park" },
    "epcot": { durationMin: 35, method: "Monorail → TTC → Monorail/Walk" },
    "hollywood-studios": { durationMin: 40, method: "Bus" },
    "animal-kingdom": { durationMin: 45, method: "Bus" },
    "typhoon-lagoon": { durationMin: 35, method: "Bus" },
    "blizzard-beach": { durationMin: 35, method: "Bus" },
  },
  "epcot": {
    "magic-kingdom": { durationMin: 35, method: "Monorail → TTC → Monorail" },
    "epcot": { durationMin: 0, method: "same park" },
    "hollywood-studios": { durationMin: 20, method: "Skyliner / Walk" },
    "animal-kingdom": { durationMin: 40, method: "Bus" },
    "typhoon-lagoon": { durationMin: 30, method: "Bus" },
    "blizzard-beach": { durationMin: 30, method: "Bus" },
  },
  "hollywood-studios": {
    "magic-kingdom": { durationMin: 40, method: "Bus" },
    "epcot": { durationMin: 20, method: "Skyliner / Walk" },
    "hollywood-studios": { durationMin: 0, method: "same park" },
    "animal-kingdom": { durationMin: 35, method: "Bus" },
    "typhoon-lagoon": { durationMin: 30, method: "Bus" },
    "blizzard-beach": { durationMin: 30, method: "Bus" },
  },
  "animal-kingdom": {
    "magic-kingdom": { durationMin: 45, method: "Bus" },
    "epcot": { durationMin: 40, method: "Bus" },
    "hollywood-studios": { durationMin: 35, method: "Bus" },
    "animal-kingdom": { durationMin: 0, method: "same park" },
    "typhoon-lagoon": { durationMin: 35, method: "Bus" },
    "blizzard-beach": { durationMin: 35, method: "Bus" },
  },
  "typhoon-lagoon": {
    "magic-kingdom": { durationMin: 35, method: "Bus" },
    "epcot": { durationMin: 30, method: "Bus" },
    "hollywood-studios": { durationMin: 30, method: "Bus" },
    "animal-kingdom": { durationMin: 35, method: "Bus" },
    "typhoon-lagoon": { durationMin: 0, method: "same park" },
    "blizzard-beach": { durationMin: 25, method: "Bus" },
  },
  "blizzard-beach": {
    "magic-kingdom": { durationMin: 35, method: "Bus" },
    "epcot": { durationMin: 30, method: "Bus" },
    "hollywood-studios": { durationMin: 30, method: "Bus" },
    "animal-kingdom": { durationMin: 35, method: "Bus" },
    "typhoon-lagoon": { durationMin: 25, method: "Bus" },
    "blizzard-beach": { durationMin: 0, method: "same park" },
  },
};
