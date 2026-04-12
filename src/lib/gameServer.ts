/**
 * Game Server Configuration
 * Connects to Colyseus game server on Railway
 */

export const GAME_SERVER_URL = "wss://magic-pass-planner-games-production.up.railway.app";
export const GAME_SERVER_HTTP = "https://magic-pass-planner-games-production.up.railway.app";

/**
 * Game types available on the server
 */
export const GAME_TYPES = {
  MATCH3: "match3",
  POKER: "poker",
  SPIT: "spit",
  MYSTERY: "mystery",
} as const;

/**
 * Game configurations
 */
export const GAME_CONFIG = {
  match3: {
    name: "Theme Park Match-3",
    emoji: "🎪",
    minPlayers: 2,
    maxPlayers: 4,
    description: "Match theme park items — first to 500 wins!",
    difficulties: ["easy", "normal", "hard"],
  },
  poker: {
    name: "Poker Night",
    emoji: "🃏",
    minPlayers: 2,
    maxPlayers: 10,
    description: "Texas Hold'em with bluff tracking & shame photos!",
    difficulties: ["beginner", "challenging"],
  },
  spit: {
    name: "Spit!",
    emoji: "⚡",
    minPlayers: 2,
    maxPlayers: 4,
    description: "Lightning-fast card shedding — first to empty wins!",
    difficulties: [],
  },
  mystery: {
    name: "Mystery at Adventure World",
    emoji: "🔍",
    minPlayers: 1,
    maxPlayers: 8,
    description: "3-4 hour cooperative detective mystery with GPS clues!",
    difficulties: ["half_day", "all_day"],
  },
} as const;

/**
 * Check game server health
 */
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${GAME_SERVER_HTTP}/health`);
    const data = await res.json();
    return data.status === "ok";
  } catch {
    return false;
  }
};
