/**
 * Poker Night Room (Colyseus)
 * Texas Hold'em — 2-10 players
 * Daily chip limits, bluffing stats, silly photo shame frames
 */

import { Room, Client } from "colyseus";
import { PokerState, PokerPlayer, Card } from "../schemas/GameState";

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const STARTING_CHIPS = 1000;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;

const HAND_RANKINGS = [
  "High Card", "One Pair", "Two Pair", "Three of a Kind",
  "Straight", "Flush", "Full House", "Four of a Kind",
  "Straight Flush", "Royal Flush",
];

export class PokerRoom extends Room<PokerState> {
  maxClients = 10;
  private deck: { suit: string; rank: string }[] = [];
  private turnOrder: string[] = [];
  private roundTimer: NodeJS.Timeout | null = null;
  private bluffTracker: Map<string, { bluffs: number; calls: number; folds: number }> = new Map();

  onCreate(options: any) {
    this.setState(new PokerState());
    this.state.difficulty = options.difficulty || "beginner";
    this.state.joinCode = this.generateJoinCode();

    this.onMessage("start_game", (client) => this.handleStartGame(client));
    this.onMessage("bet", (client, data) => this.handleBet(client, data));
    this.onMessage("call", (client) => this.handleCall(client));
    this.onMessage("raise", (client, data) => this.handleRaise(client, data));
    this.onMessage("fold", (client) => this.handleFold(client));
    this.onMessage("all_in", (client) => this.handleAllIn(client));
    this.onMessage("check", (client) => this.handleCheck(client));
    this.onMessage("buy_chips_photo", (client, data) => this.handleBuyChipsPhoto(client, data));
    this.onMessage("get_bluff_stats", (client) => this.sendBluffStats(client));
  }

  onJoin(client: Client, options: any) {
    const player = new PokerPlayer();
    player.id = client.sessionId;
    player.name = options.name || `Player ${this.state.players.size + 1}`;
    player.avatarUrl = options.avatarUrl || "";
    player.chips = STARTING_CHIPS;
    player.isHost = this.state.players.size === 0;
    this.state.players.set(client.sessionId, player);

    this.bluffTracker.set(client.sessionId, { bluffs: 0, calls: 0, folds: 0 });
    console.log(`🃏 Poker: ${player.name} joined (${this.state.players.size} players)`);
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.isConnected = false;
      player.folded = true;
      this.checkAllFolded();
    }
  }

  onDispose() {
    if (this.roundTimer) clearTimeout(this.roundTimer);
  }

  // ─── Game Flow ───────────────────────────────────────────

  private handleStartGame(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (!player?.isHost || this.state.players.size < 2) return;

    this.startNewHand();
  }

  private startNewHand() {
    // Reset deck
    this.deck = this.createShuffledDeck();

    // Reset players
    this.state.communityCards.clear();
    this.state.pot = 0;
    this.state.currentBet = 0;
    this.turnOrder = [];

    this.state.players.forEach((p, id) => {
      if (p.chips > 0 && p.isConnected) {
        p.folded = false;
        p.allIn = false;
        p.currentBet = 0;
        p.hand.clear();
        this.turnOrder.push(id);
      }
    });

    if (this.turnOrder.length < 2) return;

    // Rotate dealer
    this.state.dealerIndex = (this.state.dealerIndex + 1) % this.turnOrder.length;

    // Post blinds
    const sbIndex = (this.state.dealerIndex + 1) % this.turnOrder.length;
    const bbIndex = (this.state.dealerIndex + 2) % this.turnOrder.length;
    this.postBlind(this.turnOrder[sbIndex], SMALL_BLIND);
    this.postBlind(this.turnOrder[bbIndex], BIG_BLIND);
    this.state.currentBet = BIG_BLIND;

    // Deal hole cards (2 per player)
    this.turnOrder.forEach(id => {
      const player = this.state.players.get(id) as PokerPlayer;
      for (let i = 0; i < 2; i++) {
        const cardData = this.deck.pop()!;
        const card = new Card();
        card.suit = cardData.suit;
        card.rank = cardData.rank;
        card.faceUp = false;
        player.hand.push(card);
      }
    });

    // Send each player their private cards
    this.clients.forEach(c => {
      const player = this.state.players.get(c.sessionId) as PokerPlayer;
      if (player?.hand) {
        c.send("your_cards", {
          cards: player.hand.map(card => ({ suit: card.suit, rank: card.rank })),
        });
      }
    });

    this.state.phase = "preflop";
    this.state.currentTurnId = this.turnOrder[(bbIndex + 1) % this.turnOrder.length];

    this.broadcast("hand_started", {
      dealer: this.turnOrder[this.state.dealerIndex],
      smallBlind: this.turnOrder[sbIndex],
      bigBlind: this.turnOrder[bbIndex],
    });
  }

  private postBlind(playerId: string, amount: number) {
    const player = this.state.players.get(playerId) as PokerPlayer;
    if (!player) return;
    const bet = Math.min(amount, player.chips);
    player.chips -= bet;
    player.currentBet = bet;
    this.state.pot += bet;
  }

  // ─── Player Actions ──────────────────────────────────────

  private handleCheck(client: Client) {
    if (this.state.currentTurnId !== client.sessionId) return;
    const player = this.state.players.get(client.sessionId) as PokerPlayer;
    if (!player || player.currentBet < this.state.currentBet) return; // Can't check if behind

    this.broadcast("player_checked", { playerId: client.sessionId, name: player.name });
    this.advanceTurn();
  }

  private handleCall(client: Client) {
    if (this.state.currentTurnId !== client.sessionId) return;
    const player = this.state.players.get(client.sessionId) as PokerPlayer;
    if (!player) return;

    const callAmount = Math.min(this.state.currentBet - player.currentBet, player.chips);
    player.chips -= callAmount;
    player.currentBet += callAmount;
    this.state.pot += callAmount;

    this.bluffTracker.get(client.sessionId)!.calls++;
    this.broadcast("player_called", { playerId: client.sessionId, name: player.name, amount: callAmount });
    this.advanceTurn();
  }

  private handleRaise(client: Client, data: { amount: number }) {
    if (this.state.currentTurnId !== client.sessionId) return;
    const player = this.state.players.get(client.sessionId) as PokerPlayer;
    if (!player) return;

    const raiseAmount = Math.min(data.amount, player.chips);
    const totalBet = this.state.currentBet - player.currentBet + raiseAmount;
    player.chips -= totalBet;
    player.currentBet += totalBet;
    this.state.pot += totalBet;
    this.state.currentBet = player.currentBet;

    this.broadcast("player_raised", { playerId: client.sessionId, name: player.name, amount: raiseAmount });
    this.advanceTurn();
  }

  private handleBet(client: Client, data: { amount: number }) {
    this.handleRaise(client, data);
  }

  private handleFold(client: Client) {
    if (this.state.currentTurnId !== client.sessionId) return;
    const player = this.state.players.get(client.sessionId) as PokerPlayer;
    if (!player) return;

    player.folded = true;
    this.bluffTracker.get(client.sessionId)!.folds++;

    this.broadcast("player_folded", { playerId: client.sessionId, name: player.name });
    this.checkAllFolded();
    if (this.state.phase !== "finished") this.advanceTurn();
  }

  private handleAllIn(client: Client) {
    if (this.state.currentTurnId !== client.sessionId) return;
    const player = this.state.players.get(client.sessionId) as PokerPlayer;
    if (!player) return;

    const allInAmount = player.chips;
    player.currentBet += allInAmount;
    player.chips = 0;
    player.allIn = true;
    this.state.pot += allInAmount;
    if (player.currentBet > this.state.currentBet) {
      this.state.currentBet = player.currentBet;
    }

    this.broadcast("player_all_in", {
      playerId: client.sessionId, name: player.name, amount: allInAmount,
    });
    this.advanceTurn();
  }

  // ─── Buy Chips (Silly Photo) ─────────────────────────────

  private handleBuyChipsPhoto(client: Client, data: { photoUrl: string }) {
    const player = this.state.players.get(client.sessionId) as PokerPlayer;
    if (!player) return;

    // Grant 500 bonus chips
    player.chips += 500;

    // Broadcast the shame frame to everyone!
    this.broadcast("shame_frame", {
      playerId: client.sessionId,
      playerName: player.name,
      photoUrl: data.photoUrl,
      message: `🎰 ${player.name} lost all their chips and had to post a shame photo! What a gambler! 😂`,
      frame: "poker_shame", // Client renders a silly frame around the photo
    });

    // Post to Social Feed (via client-side Supabase call)
    client.send("post_shame_to_feed", {
      photoUrl: data.photoUrl,
      message: `${player.name} went broke at Poker Night and had to take the Walk of Shame! 🃏😂`,
    });
  }

  // ─── Bluff Stats ─────────────────────────────────────────

  private sendBluffStats(client: Client) {
    const stats: { name: string; bluffs: number; calls: number; folds: number; ratio: string }[] = [];

    this.state.players.forEach((p, id) => {
      const tracker = this.bluffTracker.get(id);
      if (tracker) {
        const total = tracker.bluffs + tracker.calls + tracker.folds;
        const bluffRatio = total > 0 ? `${Math.round((tracker.folds / total) * 100)}%` : "0%";
        stats.push({
          name: p.name,
          bluffs: tracker.bluffs,
          calls: tracker.calls,
          folds: tracker.folds,
          ratio: bluffRatio,
        });
      }
    });

    client.send("bluff_stats", {
      stats,
      title: "🎭 Bluff-O-Meter",
      description: "Who's the biggest bluffer at the table?",
    });
  }

  // ─── Turn Management ─────────────────────────────────────

  private advanceTurn() {
    const activePlayers = this.turnOrder.filter(id => {
      const p = this.state.players.get(id) as PokerPlayer;
      return p && !p.folded && !p.allIn;
    });

    if (activePlayers.length <= 1) {
      this.advancePhase();
      return;
    }

    // Check if betting round is complete
    const allMatched = activePlayers.every(id => {
      const p = this.state.players.get(id) as PokerPlayer;
      return p.currentBet === this.state.currentBet;
    });

    if (allMatched) {
      this.advancePhase();
      return;
    }

    // Move to next active player
    const currentIdx = this.turnOrder.indexOf(this.state.currentTurnId);
    let nextIdx = (currentIdx + 1) % this.turnOrder.length;
    while (true) {
      const nextPlayer = this.state.players.get(this.turnOrder[nextIdx]) as PokerPlayer;
      if (nextPlayer && !nextPlayer.folded && !nextPlayer.allIn) break;
      nextIdx = (nextIdx + 1) % this.turnOrder.length;
      if (nextIdx === currentIdx) break;
    }
    this.state.currentTurnId = this.turnOrder[nextIdx];
  }

  private advancePhase() {
    // Reset bets for new round
    this.state.players.forEach(p => { (p as PokerPlayer).currentBet = 0; });
    this.state.currentBet = 0;

    switch (this.state.phase) {
      case "preflop":
        this.dealCommunityCards(3); // Flop
        this.state.phase = "flop";
        break;
      case "flop":
        this.dealCommunityCards(1); // Turn
        this.state.phase = "turn";
        break;
      case "turn":
        this.dealCommunityCards(1); // River
        this.state.phase = "river";
        break;
      case "river":
        this.showdown();
        return;
    }

    this.state.currentTurnId = this.turnOrder[(this.state.dealerIndex + 1) % this.turnOrder.length];
  }

  private dealCommunityCards(count: number) {
    for (let i = 0; i < count; i++) {
      const cardData = this.deck.pop()!;
      const card = new Card();
      card.suit = cardData.suit;
      card.rank = cardData.rank;
      card.faceUp = true;
      this.state.communityCards.push(card);
    }

    this.broadcast("community_cards", {
      cards: this.state.communityCards.map(c => ({ suit: c.suit, rank: c.rank })),
    });
  }

  private showdown() {
    this.state.phase = "showdown";

    // Simple winner determination (highest hand)
    let bestScore = -1;
    let winnerId = "";

    this.turnOrder.forEach(id => {
      const player = this.state.players.get(id) as PokerPlayer;
      if (!player.folded) {
        const handScore = this.evaluateHand(player);
        if (handScore > bestScore) {
          bestScore = handScore;
          winnerId = id;
        }
      }
    });

    const winner = this.state.players.get(winnerId) as PokerPlayer;
    if (winner) {
      winner.chips += this.state.pot;
      winner.winCount++;
      this.state.winnerId = winnerId;
    }

    this.broadcast("showdown_result", {
      winnerId,
      winnerName: winner?.name,
      pot: this.state.pot,
      handRanking: HAND_RANKINGS[Math.min(bestScore, HAND_RANKINGS.length - 1)],
    });

    // Auto-start next hand after 5 seconds
    this.roundTimer = setTimeout(() => this.startNewHand(), 5000);
  }

  private checkAllFolded() {
    const active = this.turnOrder.filter(id => {
      const p = this.state.players.get(id) as PokerPlayer;
      return p && !p.folded;
    });

    if (active.length === 1) {
      const winner = this.state.players.get(active[0]) as PokerPlayer;
      if (winner) {
        winner.chips += this.state.pot;
        winner.winCount++;
        this.state.winnerId = active[0];
        this.state.phase = "finished";

        this.broadcast("hand_won_by_fold", {
          winnerId: active[0],
          winnerName: winner.name,
          pot: this.state.pot,
        });

        this.roundTimer = setTimeout(() => this.startNewHand(), 3000);
      }
    }
  }

  // ─── Utilities ───────────────────────────────────────────

  private evaluateHand(player: PokerPlayer): number {
    // Simplified hand evaluation (0-9 scale matching HAND_RANKINGS)
    // Full implementation would use poker hand evaluator library
    const allCards = [
      ...player.hand.map(c => ({ suit: c.suit, rank: c.rank })),
      ...this.state.communityCards.map(c => ({ suit: c.suit, rank: c.rank })),
    ];

    const rankValues: Record<string, number> = {
      "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
      "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
    };

    const ranks = allCards.map(c => rankValues[c.rank]).sort((a, b) => b - a);
    const suits = allCards.map(c => c.suit);

    // Check for pairs, three of a kind, etc.
    const rankCounts = new Map<number, number>();
    ranks.forEach(r => rankCounts.set(r, (rankCounts.get(r) || 0) + 1));
    const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);

    if (counts[0] === 4) return 7; // Four of a kind
    if (counts[0] === 3 && counts[1] === 2) return 6; // Full house
    if (counts[0] === 3) return 3; // Three of a kind
    if (counts[0] === 2 && counts[1] === 2) return 2; // Two pair
    if (counts[0] === 2) return 1; // One pair

    // Check flush
    const suitCounts = new Map<string, number>();
    suits.forEach(s => suitCounts.set(s, (suitCounts.get(s) || 0) + 1));
    const hasFlush = Array.from(suitCounts.values()).some(c => c >= 5);
    if (hasFlush) return 5;

    // Check straight
    const uniqueRanks = [...new Set(ranks)].sort((a, b) => a - b);
    for (let i = 0; i <= uniqueRanks.length - 5; i++) {
      if (uniqueRanks[i + 4] - uniqueRanks[i] === 4) return 4; // Straight
    }

    return 0; // High card
  }

  private createShuffledDeck(): { suit: string; rank: string }[] {
    const deck: { suit: string; rank: string }[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank });
      }
    }
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  private generateJoinCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }
}
