/**
 * Match-3 Puzzle Game — Theme Park Edition
 * Multiplayer via Colyseus (2-4 players, first to 500 wins)
 * Items: tickets, popcorn, balloons, coaster cars, cotton candy, carousel
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Users, Zap } from "lucide-react";
import * as Colyseus from "colyseus.js";
import { GAME_SERVER_URL } from "@/lib/gameServer";
import ConfettiEffect from "@/components/ConfettiEffect";

const GRID_SIZE = 8;
const TILE_SIZE = 42;

const ITEM_EMOJIS: Record<string, string> = {
  ticket: "🎫",
  popcorn: "🍿",
  balloon: "🎈",
  coaster: "🎢",
  cotton_candy: "🧁",
  carousel: "🎠",
};

const ITEM_COLORS: Record<string, string> = {
  ticket: "#FF6B6B",
  popcorn: "#FFD93D",
  balloon: "#4ECDC4",
  coaster: "#FF8C42",
  cotton_candy: "#FF69B4",
  carousel: "#B19CD9",
};

interface PlayerScore {
  id: string;
  name: string;
  score: number;
}

interface Props {
  onClose: () => void;
  difficulty?: "easy" | "normal" | "hard";
  playerName?: string;
  roomId?: string;
  isHost?: boolean;
}

export default function Match3Game({ onClose, difficulty = "normal", playerName = "Player", roomId, isHost }: Props) {
  const [grid, setGrid] = useState<(string | null)[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(30);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [phase, setPhase] = useState<"waiting" | "playing" | "finished">("waiting");
  const [winner, setWinner] = useState<string | null>(null);
  const [lastPoints, setLastPoints] = useState(0);
  const [showPoints, setShowPoints] = useState(false);
  const [connected, setConnected] = useState(false);
  const [playerCount, setPlayerCount] = useState(1);
  const roomRef = useRef<Colyseus.Room | null>(null);

  // Generate local grid for solo/offline play
  const generateGrid = useCallback(() => {
    const types = Object.keys(ITEM_EMOJIS).slice(0, difficulty === "easy" ? 4 : difficulty === "hard" ? 6 : 5);
    const g: (string | null)[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        let item: string;
        do {
          item = types[Math.floor(Math.random() * types.length)];
        } while (
          (c >= 2 && g[r][c - 1] === item && g[r][c - 2] === item) ||
          (r >= 2 && g[r - 1][c] === item && g[r - 2][c] === item)
        );
        g[r][c] = item;
      }
    }
    return g;
  }, [difficulty]);

  // Connect to Colyseus server
  useEffect(() => {
    const connectToServer = async () => {
      try {
        const client = new Colyseus.Client(GAME_SERVER_URL);
        let room: Colyseus.Room;

        if (roomId) {
          room = await client.joinById(roomId, { name: playerName, difficulty });
        } else if (isHost) {
          room = await client.create("match3", { name: playerName, difficulty });
        } else {
          // Solo mode — skip server
          setGrid(generateGrid());
          setPhase("playing");
          return;
        }

        roomRef.current = room;
        setConnected(true);

        room.onMessage("grid_update", (data: any) => {
          setGrid(data.grid);
          if (data.score !== undefined) setScore(data.score);
          if (data.points) {
            setLastPoints(data.points);
            setShowPoints(true);
            setTimeout(() => setShowPoints(false), 1000);
          }
        });

        room.onMessage("score_update", (data: any) => {
          setScores(prev => {
            const existing = prev.find(p => p.id === data.playerId);
            if (existing) {
              return prev.map(p => p.id === data.playerId ? { ...p, score: data.score } : p);
            }
            return [...prev, { id: data.playerId, name: data.playerName, score: data.score }];
          });
        });

        room.onMessage("game_started", () => setPhase("playing"));
        room.onMessage("invalid_swap", () => {/* shake animation */});

        room.onMessage("game_over", (data: any) => {
          setPhase("finished");
          setWinner(data.winnerName);
          setScores(data.scores);
        });

        room.state.listen("players", (players: any) => {
          setPlayerCount(players?.size || 1);
        });

      } catch (err) {
        console.error("Failed to connect to game server:", err);
        // Fallback to solo mode
        setGrid(generateGrid());
        setPhase("playing");
      }
    };

    connectToServer();

    return () => {
      roomRef.current?.leave();
    };
  }, [roomId, isHost, playerName, difficulty, generateGrid]);

  // Local match processing (for solo mode)
  const findMatches = (g: (string | null)[][]): Set<string> => {
    const matches = new Set<string>();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const t = g[r][c];
        if (t && t === g[r][c + 1] && t === g[r][c + 2]) {
          matches.add(`${r},${c}`); matches.add(`${r},${c + 1}`); matches.add(`${r},${c + 2}`);
        }
      }
    }
    for (let r = 0; r < GRID_SIZE - 2; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const t = g[r][c];
        if (t && t === g[r + 1][c] && t === g[r + 2][c]) {
          matches.add(`${r},${c}`); matches.add(`${r + 1},${c}`); matches.add(`${r + 2},${c}`);
        }
      }
    }
    return matches;
  };

  const cascadeGrid = (g: (string | null)[][]) => {
    const types = Object.keys(ITEM_EMOJIS).slice(0, difficulty === "easy" ? 4 : difficulty === "hard" ? 6 : 5);
    for (let c = 0; c < GRID_SIZE; c++) {
      let w = GRID_SIZE - 1;
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (g[r][c] !== null) {
          g[w][c] = g[r][c];
          if (w !== r) g[r][c] = null;
          w--;
        }
      }
      for (let r = 0; r <= w; r++) {
        g[r][c] = types[Math.floor(Math.random() * types.length)];
      }
    }
  };

  const processMatches = (g: (string | null)[][]) => {
    let totalPts = 0;
    let hasMatches = true;
    while (hasMatches) {
      const matches = findMatches(g);
      if (matches.size === 0) { hasMatches = false; break; }
      const pts = matches.size >= 5 ? 50 : matches.size >= 4 ? 25 : 10;
      totalPts += pts;
      matches.forEach(key => {
        const [r, c] = key.split(",").map(Number);
        g[r][c] = null;
      });
      cascadeGrid(g);
    }
    return totalPts;
  };

  const handleTileClick = (row: number, col: number) => {
    if (phase !== "playing") return;

    if (roomRef.current) {
      // Multiplayer: send swap to server
      if (selected) {
        const [pr, pc] = selected;
        if (Math.abs(row - pr) + Math.abs(col - pc) === 1) {
          roomRef.current.send("swap_tiles", { r1: pr, c1: pc, r2: row, c2: col });
        }
        setSelected(null);
      } else {
        setSelected([row, col]);
      }
      return;
    }

    // Solo mode: local processing
    if (!selected) {
      setSelected([row, col]);
      return;
    }

    const [pr, pc] = selected;
    if (Math.abs(row - pr) + Math.abs(col - pc) !== 1) {
      setSelected([row, col]);
      return;
    }

    // Swap
    const newGrid = grid.map(r => [...r]);
    [newGrid[pr][pc], newGrid[row][col]] = [newGrid[row][col], newGrid[pr][pc]];

    const pts = processMatches(newGrid);
    if (pts > 0) {
      setScore(s => s + pts);
      setGrid(newGrid);
      setMoves(m => m - 1);
      setLastPoints(pts);
      setShowPoints(true);
      setTimeout(() => setShowPoints(false), 1000);

      if (score + pts >= 500) {
        setPhase("finished");
        setWinner(playerName);
      }
    } else {
      // Invalid swap — swap back
      [newGrid[pr][pc], newGrid[row][col]] = [newGrid[row][col], newGrid[pr][pc]];
    }

    setSelected(null);
  };

  // ─── RENDER ──────────────────────────────────────────────

  if (phase === "finished") {
    return (
      <div className="min-h-screen bg-[#060a14] p-4 flex items-center justify-center relative overflow-hidden">
        <ConfettiEffect trigger={true} />
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 rounded-2xl bg-black/60 backdrop-blur-sm border border-yellow-500/30 max-w-md w-full">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-white mb-2">{winner === playerName ? "YOU WIN!" : `${winner} Wins!`}</h2>
          <p className="text-5xl font-black text-yellow-400 mb-6">{score} pts</p>
          {scores.length > 0 && (
            <div className="space-y-2 mb-6">
              {scores.sort((a, b) => b.score - a.score).map((p, i) => (
                <div key={p.id} className={`flex justify-between items-center p-3 rounded-lg ${i === 0 ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-white/5"}`}>
                  <span className="text-white font-bold">{i === 0 ? "👑" : `#${i + 1}`} {p.name}</span>
                  <span className="text-yellow-400 font-bold">{p.score}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={onClose} className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl">
            Back to Games
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a14] p-4 relative overflow-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full blur-[100px] opacity-15 bg-yellow-500" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full blur-[100px] opacity-10 bg-pink-500" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="flex items-center gap-2 text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <div className="text-center">
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
              🎪 Theme Park Match-3
            </h1>
            <p className="text-xs text-white/40">{difficulty.toUpperCase()} • First to 500</p>
          </div>
          <div className="flex items-center gap-1 text-white/40 text-sm">
            <Users className="w-4 h-4" /> {playerCount}
          </div>
        </div>

        {/* Score Bar */}
        <div className="flex justify-between items-center mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <div>
            <p className="text-xs text-white/40">Score</p>
            <p className="text-2xl font-black text-yellow-400">{score}</p>
          </div>
          <div className="w-32 h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
              animate={{ width: `${Math.min((score / 500) * 100, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">Target</p>
            <p className="text-lg font-bold text-white/70">500</p>
          </div>
        </div>

        {/* Points Popup */}
        <AnimatePresence>
          {showPoints && lastPoints > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -30, scale: 1.2 }}
              exit={{ opacity: 0, y: -60 }}
              className="absolute top-32 left-1/2 -translate-x-1/2 z-50 text-3xl font-black text-yellow-400 drop-shadow-lg"
            >
              +{lastPoints}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        <div className="flex justify-center mb-4">
          <div
            className="grid gap-1 p-3 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/10"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)` }}
          >
            {grid.map((row, r) =>
              row.map((item, c) => (
                <motion.button
                  key={`${r}-${c}`}
                  onClick={() => handleTileClick(r, c)}
                  whileTap={{ scale: 0.85 }}
                  animate={{
                    scale: selected && selected[0] === r && selected[1] === c ? 1.15 : 1,
                    boxShadow: selected && selected[0] === r && selected[1] === c
                      ? `0 0 12px ${ITEM_COLORS[item || "ticket"]}80`
                      : "none",
                  }}
                  className="flex items-center justify-center rounded-lg transition-all"
                  style={{
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    background: item ? `${ITEM_COLORS[item]}20` : "transparent",
                    border: selected && selected[0] === r && selected[1] === c
                      ? `2px solid ${ITEM_COLORS[item || "ticket"]}`
                      : "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span className="text-xl">{item ? ITEM_EMOJIS[item] : ""}</span>
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* Multiplayer Scoreboard */}
        {scores.length > 0 && (
          <div className="space-y-2 mt-4">
            <h3 className="text-sm font-bold text-white/50 flex items-center gap-1"><Zap className="w-4 h-4" /> Live Scores</h3>
            {scores.sort((a, b) => b.score - a.score).map((p, i) => (
              <div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                <span className="text-white text-sm">{i === 0 ? "👑" : ""} {p.name}</span>
                <span className="text-yellow-400 font-bold text-sm">{p.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
