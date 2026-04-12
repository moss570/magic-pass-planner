/**
 * Spit Card Game Room (Colyseus)
 * Fast-paced real-time card shedding — 2-4 players
 * First to empty their hand wins
 */

import { Room, Client } from "colyseus";
import { SpitState, SpitPlayer, Card } from "../schemas/GameState";

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const RANK_VALUES: Record<string, number> = {
  "A": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13,
};

export class SpitRoom extends Room<SpitState> {
  maxClients = 4;
  private playerHands: Map<string, { suit: string; rank: string }[]> = new Map();
  private pileCards: { suit: string; rank: string }[][] = [[], []];
  private gameActive = false;

  onCreate(options: any) {
    this.setState(new SpitState());
    this.state.joinCode = this.generateJoinCode();

    this.onMessage("start_game", (client) => this.handleStartGame(client));
    this.onMessage("play_card", (client, data) => this.handlePlayCard(client, data));
    this.onMessage("slap_pile", (client, data) => this.handleSlapPile(client, data));
  }

  onJoin(client: Client, options: any) {
    const player = new SpitPlayer();
    player.id = client.sessionId;
    player.name = options.name || `Player ${this.state.players.size + 1}`;
    player.isHost = this.state.players.size === 0;
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) player.isConnected = false;
  }

  // ─── Game Logic ──────────────────────────────────────────

  private handleStartGame(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (!player?.isHost || this.state.players.size < 2) return;

    const deck = this.createShuffledDeck();
    const playerIds = Array.from(this.state.players.keys());
    const cardsPerPlayer = Math.floor(deck.length / playerIds.length);

    playerIds.forEach((id, i) => {
      const hand = deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer);
      this.playerHands.set(id, hand);
      const p = this.state.players.get(id) as SpitPlayer;
      p.cardsRemaining = hand.length;
    });

    // Start with one card on each pile
    this.pileCards = [[deck.pop()!], [deck.pop()!]];
    this.updatePiles();

    this.state.phase = "playing";
    this.gameActive = true;

    // Send each player their hand
    this.clients.forEach(c => {
      const hand = this.playerHands.get(c.sessionId);
      c.send("your_hand", { cards: hand?.slice(0, 5) }); // Show top 5 cards
    });

    this.broadcast("game_started", {});
  }

  private handlePlayCard(client: Client, data: { cardIndex: number; pileIndex: number }) {
    if (!this.gameActive) return;

    const hand = this.playerHands.get(client.sessionId);
    if (!hand || hand.length === 0) return;

    const { cardIndex, pileIndex } = data;
    if (pileIndex < 0 || pileIndex >= 2 || cardIndex < 0 || cardIndex >= Math.min(5, hand.length)) return;

    const card = hand[cardIndex];
    const pileTop = this.pileCards[pileIndex][this.pileCards[pileIndex].length - 1];

    // Card must be +1 or -1 of pile top (with wrapping: K→A, A→K)
    const cardVal = RANK_VALUES[card.rank];
    const pileVal = RANK_VALUES[pileTop.rank];
    const diff = Math.abs(cardVal - pileVal);

    if (diff === 1 || diff === 12) { // Adjacent (including K↔A wrap)
      // Valid play!
      hand.splice(cardIndex, 1);
      this.pileCards[pileIndex].push(card);

      const player = this.state.players.get(client.sessionId) as SpitPlayer;
      player.cardsRemaining = hand.length;

      // Send updated hand
      client.send("your_hand", { cards: hand.slice(0, 5) });
      this.updatePiles();

      this.broadcast("card_played", {
        playerId: client.sessionId,
        playerName: player.name,
        card: { suit: card.suit, rank: card.rank },
        pileIndex,
        cardsRemaining: hand.length,
      });

      // Check win condition
      if (hand.length === 0) {
        this.state.winnerId = client.sessionId;
        this.state.phase = "finished";
        this.gameActive = false;

        this.broadcast("game_over", {
          winnerId: client.sessionId,
          winnerName: player.name,
          scores: Array.from(this.state.players.entries()).map(([id, p]) => ({
            id, name: p.name, cardsRemaining: (p as SpitPlayer).cardsRemaining,
          })),
        });
      }
    } else {
      client.send("invalid_play", { reason: "Card must be +1 or -1 of pile top" });
    }
  }

  private handleSlapPile(client: Client, data: { pileIndex: number }) {
    // When both piles are stuck, players can slap the smaller pile
    if (!this.gameActive) return;

    const { pileIndex } = data;
    if (pileIndex < 0 || pileIndex >= 2) return;

    // Add pile cards to player's hand (penalty for taking larger pile)
    const hand = this.playerHands.get(client.sessionId);
    if (!hand) return;

    const pileToTake = this.pileCards[pileIndex];
    hand.push(...pileToTake);
    this.pileCards[pileIndex] = [];

    const player = this.state.players.get(client.sessionId) as SpitPlayer;
    player.cardsRemaining = hand.length;

    // Reset piles with new cards from hands
    const firstPlayerId = Array.from(this.playerHands.keys())[0];
    const firstHand = this.playerHands.get(firstPlayerId);
    if (firstHand && firstHand.length > 0) {
      this.pileCards[pileIndex] = [firstHand.pop()!];
    }

    this.updatePiles();
    client.send("your_hand", { cards: hand.slice(0, 5) });

    this.broadcast("pile_slapped", {
      playerId: client.sessionId,
      playerName: player.name,
      pileIndex,
      penalty: pileToTake.length,
    });
  }

  // ─── Utilities ───────────────────────────────────────────

  private updatePiles() {
    this.broadcast("pile_update", {
      pile1Top: this.pileCards[0].length > 0 ? this.pileCards[0][this.pileCards[0].length - 1] : null,
      pile2Top: this.pileCards[1].length > 0 ? this.pileCards[1][this.pileCards[1].length - 1] : null,
      pile1Count: this.pileCards[0].length,
      pile2Count: this.pileCards[1].length,
    });
  }

  private createShuffledDeck(): { suit: string; rank: string }[] {
    const deck: { suit: string; rank: string }[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank });
      }
    }
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
