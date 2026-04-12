/**
 * Match-3 Room (Colyseus)
 * Simultaneous multiplayer puzzle — first to 500 wins
 * Theme: Generic theme park items (tickets, popcorn, balloons, etc.)
 */

import { Room, Client } from "colyseus";
import { Match3State, Player } from "../schemas/GameState";

const CANDY_TYPES = ["ticket", "popcorn", "balloon", "coaster", "cotton_candy", "carousel"];
const GRID_SIZE = 8;
const TARGET_SCORE = 500;

// Difficulty settings
const DIFFICULTY_CONFIG = {
  easy: { types: 4, timerSeconds: 600 },     // 4 item types, 10 min
  normal: { types: 5, timerSeconds: 300 },    // 5 item types, 5 min
  hard: { types: 6, timerSeconds: 180 },      // 6 item types, 3 min
};

export class Match3Room extends Room<Match3State> {
  maxClients = 4;
  private grids: Map<string, (string | null)[][]> = new Map();
  private gameTimer: NodeJS.Timeout | null = null;

  onCreate(options: any) {
    this.setState(new Match3State());
    this.state.difficulty = options.difficulty || "normal";
    this.state.joinCode = this.generateJoinCode();
    this.state.targetScore = TARGET_SCORE;

    // Handle game messages
    this.onMessage("start_game", (client) => this.handleStartGame(client));
    this.onMessage("swap_tiles", (client, data) => this.handleSwap(client, data));
    this.onMessage("ready", (client) => this.handleReady(client));
  }

  onJoin(client: Client, options: any) {
    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name || `Player ${this.state.players.size + 1}`;
    player.avatarUrl = options.avatarUrl || "";
    player.isHost = this.state.players.size === 0;
    this.state.players.set(client.sessionId, player);

    console.log(`🎮 Match-3: ${player.name} joined (${this.state.players.size} players)`);
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.isConnected = false;
      console.log(`👋 Match-3: ${player.name} left`);
    }
  }

  onDispose() {
    if (this.gameTimer) clearInterval(this.gameTimer);
    console.log("🗑️ Match-3 room disposed");
  }

  // ─── Game Logic ──────────────────────────────────────────

  private handleReady(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) player.isReady = true;
  }

  private handleStartGame(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (!player?.isHost) return;

    // Initialize grids for all players
    const config = DIFFICULTY_CONFIG[this.state.difficulty as keyof typeof DIFFICULTY_CONFIG];
    const types = CANDY_TYPES.slice(0, config.types);

    this.state.players.forEach((p, id) => {
      this.grids.set(id, this.generateGrid(types));
    });

    this.state.phase = "playing";
    this.state.timeRemaining = config.timerSeconds;

    // Start countdown timer
    this.gameTimer = setInterval(() => {
      this.state.timeRemaining--;
      if (this.state.timeRemaining <= 0) {
        this.endGame();
      }
    }, 1000);

    // Send each player their grid
    this.clients.forEach(c => {
      const grid = this.grids.get(c.sessionId);
      c.send("grid_update", { grid });
    });

    this.broadcast("game_started", { difficulty: this.state.difficulty });
  }

  private handleSwap(client: Client, data: { r1: number; c1: number; r2: number; c2: number }) {
    if (this.state.phase !== "playing") return;

    const grid = this.grids.get(client.sessionId);
    if (!grid) return;

    const { r1, c1, r2, c2 } = data;
    if (!this.isValidSwap(r1, c1, r2, c2)) return;

    // Perform swap
    [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];

    // Find and clear matches
    const matchCount = this.processAllMatches(grid);

    if (matchCount > 0) {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        // Scoring: 3-match = 10, 4-match = 25, 5+ = 50
        const points = matchCount >= 5 ? 50 : matchCount >= 4 ? 25 : 10;
        player.score += points;

        // Send updated grid back
        client.send("grid_update", { grid, score: player.score, points });

        // Broadcast score update to all
        this.broadcast("score_update", {
          playerId: client.sessionId,
          playerName: player.name,
          score: player.score,
          points,
        });

        // Check win condition
        if (player.score >= this.state.targetScore) {
          this.state.winnerId = client.sessionId;
          this.endGame();
        }
      }
    } else {
      // Invalid swap (no matches) — swap back
      [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
      client.send("invalid_swap", {});
    }
  }

  private endGame() {
    this.state.phase = "finished";
    if (this.gameTimer) clearInterval(this.gameTimer);

    // Find winner (highest score if no one hit 500)
    if (!this.state.winnerId) {
      let maxScore = 0;
      this.state.players.forEach((p, id) => {
        if (p.score > maxScore) {
          maxScore = p.score;
          this.state.winnerId = id;
        }
      });
    }

    const winner = this.state.players.get(this.state.winnerId);
    this.broadcast("game_over", {
      winnerId: this.state.winnerId,
      winnerName: winner?.name,
      winnerScore: winner?.score,
      scores: Array.from(this.state.players.entries()).map(([id, p]) => ({
        id, name: p.name, score: p.score,
      })),
    });
  }

  // ─── Grid Utilities ──────────────────────────────────────

  private generateGrid(types: string[]): (string | null)[][] {
    const grid: (string | null)[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        let item: string;
        do {
          item = types[Math.floor(Math.random() * types.length)];
        } while (
          (c >= 2 && grid[r][c - 1] === item && grid[r][c - 2] === item) ||
          (r >= 2 && grid[r - 1][c] === item && grid[r - 2][c] === item)
        );
        grid[r][c] = item;
      }
    }
    return grid;
  }

  private isValidSwap(r1: number, c1: number, r2: number, c2: number): boolean {
    return (
      r1 >= 0 && r1 < GRID_SIZE && c1 >= 0 && c1 < GRID_SIZE &&
      r2 >= 0 && r2 < GRID_SIZE && c2 >= 0 && c2 < GRID_SIZE &&
      Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1
    );
  }

  private processAllMatches(grid: (string | null)[][]): number {
    let totalMatched = 0;
    let hasMatches = true;

    while (hasMatches) {
      const matches = this.findMatches(grid);
      if (matches.size === 0) {
        hasMatches = false;
        break;
      }
      totalMatched += matches.size;
      matches.forEach(key => {
        const [r, c] = key.split(",").map(Number);
        grid[r][c] = null;
      });
      this.cascadeGrid(grid);
    }

    return totalMatched;
  }

  private findMatches(grid: (string | null)[][]): Set<string> {
    const matches = new Set<string>();

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const t = grid[r][c];
        if (t && t === grid[r][c + 1] && t === grid[r][c + 2]) {
          matches.add(`${r},${c}`);
          matches.add(`${r},${c + 1}`);
          matches.add(`${r},${c + 2}`);
        }
      }
    }
    for (let r = 0; r < GRID_SIZE - 2; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const t = grid[r][c];
        if (t && t === grid[r + 1][c] && t === grid[r + 2][c]) {
          matches.add(`${r},${c}`);
          matches.add(`${r + 1},${c}`);
          matches.add(`${r + 2},${c}`);
        }
      }
    }
    return matches;
  }

  private cascadeGrid(grid: (string | null)[][]) {
    const config = DIFFICULTY_CONFIG[this.state.difficulty as keyof typeof DIFFICULTY_CONFIG];
    const types = CANDY_TYPES.slice(0, config.types);

    for (let c = 0; c < GRID_SIZE; c++) {
      let write = GRID_SIZE - 1;
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (grid[r][c] !== null) {
          grid[write][c] = grid[r][c];
          if (write !== r) grid[r][c] = null;
          write--;
        }
      }
      for (let r = 0; r <= write; r++) {
        grid[r][c] = types[Math.floor(Math.random() * types.length)];
      }
    }
  }

  private generateJoinCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }
}
