/**
 * Shared Game State Schemas (Colyseus)
 * Used by all game rooms for state synchronization
 */

import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

// ─── Player Schema ────────────────────────────────────────
export class Player extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") avatarUrl: string = "";
  @type("number") score: number = 0;
  @type("boolean") isReady: boolean = false;
  @type("boolean") isHost: boolean = false;
  @type("boolean") isConnected: boolean = true;
  @type("number") joinedAt: number = Date.now();
}

// ─── Match-3 State ────────────────────────────────────────
export class Match3Tile extends Schema {
  @type("string") type: string = "";
  @type("boolean") matched: boolean = false;
}

export class Match3State extends Schema {
  @type("string") phase: string = "waiting"; // waiting, playing, finished
  @type("string") difficulty: string = "normal";
  @type("number") targetScore: number = 500;
  @type("number") timeRemaining: number = 300; // 5 min fallback timer
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("string") winnerId: string = "";
  @type("string") joinCode: string = "";
}

// ─── Poker State ──────────────────────────────────────────
export class Card extends Schema {
  @type("string") suit: string = ""; // hearts, diamonds, clubs, spades
  @type("string") rank: string = ""; // 2-10, J, Q, K, A
  @type("boolean") faceUp: boolean = false;
}

export class PokerPlayer extends Player {
  @type("number") chips: number = 1000;
  @type("number") currentBet: number = 0;
  @type("boolean") folded: boolean = false;
  @type("boolean") allIn: boolean = false;
  @type("number") bluffCount: number = 0;
  @type("number") winCount: number = 0;
  @type([ Card ]) hand = new ArraySchema<Card>();
}

export class PokerState extends Schema {
  @type("string") phase: string = "waiting"; // waiting, preflop, flop, turn, river, showdown
  @type("string") difficulty: string = "beginner";
  @type("number") pot: number = 0;
  @type("number") currentBet: number = 0;
  @type("string") currentTurnId: string = "";
  @type("number") dealerIndex: number = 0;
  @type({ map: PokerPlayer }) players = new MapSchema<PokerPlayer>();
  @type([ Card ]) communityCards = new ArraySchema<Card>();
  @type("string") winnerId: string = "";
  @type("string") joinCode: string = "";
}

// ─── Spit State ───────────────────────────────────────────
export class SpitPlayer extends Player {
  @type("number") cardsRemaining: number = 26;
  @type("boolean") slapReady: boolean = false;
}

export class SpitState extends Schema {
  @type("string") phase: string = "waiting"; // waiting, playing, finished
  @type({ map: SpitPlayer }) players = new MapSchema<SpitPlayer>();
  @type([ Card ]) pile1 = new ArraySchema<Card>();
  @type([ Card ]) pile2 = new ArraySchema<Card>();
  @type("string") winnerId: string = "";
  @type("string") joinCode: string = "";
}

// ─── Mystery State ────────────────────────────────────────
export class Clue extends Schema {
  @type("string") id: string = "";
  @type("string") text: string = "";
  @type("string") category: string = ""; // witness, evidence, location, motive
  @type("string") act: string = ""; // act1, act2, act3, act4
  @type("boolean") revealed: boolean = false;
  @type("boolean") isRedHerring: boolean = false;
  @type("number") points: number = 10;
  @type("string") gpsZone: string = ""; // ride_line, restaurant, merchandise, any
  @type("number") lat: number = 0;
  @type("number") lng: number = 0;
}

export class Suspect extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") role: string = "";
  @type("string") description: string = "";
  @type("string") motive: string = "";
  @type("string") alibi: string = "";
  @type("boolean") isCulprit: boolean = false;
  @type("boolean") isAccomplice: boolean = false;
}

export class MysteryPlayer extends Player {
  @type("string") role: string = "detective"; // detective, analyst, expert
  @type("number") hintsUsed: number = 0;
  @type("number") cluesFound: number = 0;
  @type("string") vote: string = ""; // suspect ID they voted for
}

export class MysteryState extends Schema {
  @type("string") phase: string = "waiting"; // waiting, act1, act2, act3, act4, voting, results
  @type("string") duration: string = "all_day"; // all_day, half_day
  @type("string") title: string = "";
  @type("string") crimeDescription: string = "";
  @type("string") introStory: string = "";
  @type("string") twistReveal: string = "";
  @type("string") secondaryMystery: string = "";
  @type("string") resolution: string = "";
  @type("number") currentAct: number = 1;
  @type("number") startedAt: number = 0;
  @type("number") totalCluesAvailable: number = 0;
  @type("number") totalCluesFound: number = 0;
  @type({ map: MysteryPlayer }) players = new MapSchema<MysteryPlayer>();
  @type([ Suspect ]) suspects = new ArraySchema<Suspect>();
  @type([ Clue ]) clues = new ArraySchema<Clue>();
  @type("string") joinCode: string = "";
  @type("string") culpritId: string = "";
  @type("string") accompliceId: string = "";
}
