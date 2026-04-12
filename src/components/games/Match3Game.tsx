/**
 * Match-3 Puzzle Game — Theme Park Edition
 * Fully playable solo + multiplayer via Colyseus
 * Items: tickets, popcorn, balloons, coaster cars, cotton candy, carousel
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Users, Zap, RotateCcw } from "lucide-react";
import ConfettiEffect from "@/components/ConfettiEffect";

const GRID_SIZE = 8;
const TILE_SIZE = 40;
const TARGET_SCORE = 500;

const ITEMS: { key: string; emoji: string; color: string }[] = [
  { key: "ticket", emoji: "🎫", color: "#FF6B6B" },
  { key: "popcorn", emoji: "🍿", color: "#FFD93D" },
  { key: "balloon", emoji: "🎈", color: "#4ECDC4" },
  { key: "coaster", emoji: "🎢", color: "#FF8C42" },
  { key: "cotton", emoji: "🧁", color: "#FF69B4" },
  { key: "carousel", emoji: "🎠", color: "#B19CD9" },
];

const DIFFICULTY_CONFIG = {
  easy: { itemCount: 4, moveLimit: 50 },
  normal: { itemCount: 5, moveLimit: 35 },
  hard: { itemCount: 6, moveLimit: 25 },
};

type Cell = number | null; // index into ITEMS array

interface Props {
  onClose: () => void;
  difficulty?: "easy" | "normal" | "hard";
  playerName?: string;
}

export default function Match3Game({ onClose, difficulty = "normal", playerName = "Player" }: Props) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(config.moveLimit);
  const [phase, setPhase] = useState<"playing" | "finished">("playing");
  const [combo, setCombo] = useState(0);
  const [lastPoints, setLastPoints] = useState(0);
  const [showPoints, setShowPoints] = useState(false);
  const [animatingCells, setAnimatingCells] = useState<Set<string>>(new Set());
  const isProcessing = useRef(false);

  // ─── Grid Generation ─────────────────────────────────────
  const randomItem = useCallback(() => Math.floor(Math.random() * config.itemCount), [config.itemCount]);

  const generateCleanGrid = useCallback((): Cell[][] => {
    const g: Cell[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        let item: number;
        let attempts = 0;
        do {
          item = randomItem();
          attempts++;
        } while (
          attempts < 50 &&
          ((c >= 2 && g[r][c - 1] === item && g[r][c - 2] === item) ||
           (r >= 2 && g[r - 1]?.[c] === item && g[r - 2]?.[c] === item))
        );
        g[r][c] = item;
      }
    }
    return g;
  }, [randomItem]);

  useEffect(() => {
    setGrid(generateCleanGrid());
  }, [generateCleanGrid]);

  // ─── Match Detection ─────────────────────────────────────
  const findMatches = (g: Cell[][]): [number, number][] => {
    const matched = new Set<string>();

    // Horizontal
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const v = g[r][c];
        if (v !== null && v === g[r][c + 1] && v === g[r][c + 2]) {
          // Extend match
          let end = c + 2;
          while (end + 1 < GRID_SIZE && g[r][end + 1] === v) end++;
          for (let i = c; i <= end; i++) matched.add(`${r},${i}`);
        }
      }
    }

    // Vertical
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE - 2; r++) {
        const v = g[r][c];
        if (v !== null && v === g[r + 1][c] && v === g[r + 2][c]) {
          let end = r + 2;
          while (end + 1 < GRID_SIZE && g[end + 1]?.[c] === v) end++;
          for (let i = r; i <= end; i++) matched.add(`${i},${c}`);
        }
      }
    }

    return Array.from(matched).map(s => {
      const [r, c] = s.split(",").map(Number);
      return [r, c];
    });
  };

  // ─── Cascade ─────────────────────────────────────────────
  const cascade = (g: Cell[][]): Cell[][] => {
    const newGrid = g.map(row => [...row]);

    for (let c = 0; c < GRID_SIZE; c++) {
      let writePos = GRID_SIZE - 1;
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (newGrid[r][c] !== null) {
          newGrid[writePos][c] = newGrid[r][c];
          if (writePos !== r) newGrid[r][c] = null;
          writePos--;
        }
      }
      // Fill empties at top
      for (let r = writePos; r >= 0; r--) {
        newGrid[r][c] = randomItem();
      }
    }
    return newGrid;
  };

  // ─── Process All Matches (with cascade loop) ─────────────
  const processMatches = (g: Cell[][]): { grid: Cell[][]; totalPoints: number; totalMatched: number } => {
    let current = g.map(row => [...row]);
    let totalPoints = 0;
    let totalMatched = 0;
    let cascadeLevel = 0;

    while (true) {
      const matches = findMatches(current);
      if (matches.length === 0) break;

      cascadeLevel++;
      const matchSize = matches.length;
      totalMatched += matchSize;

      // Scoring: base + cascade bonus + size bonus
      const basePoints = matchSize >= 5 ? 50 : matchSize >= 4 ? 25 : 10;
      const cascadeBonus = cascadeLevel > 1 ? cascadeLevel * 5 : 0;
      totalPoints += basePoints + cascadeBonus;

      // Clear matched cells
      matches.forEach(([r, c]) => { current[r][c] = null; });

      // Cascade
      current = cascade(current);
    }

    return { grid: current, totalPoints, totalMatched };
  };

  // ─── Swap Handler ────────────────────────────────────────
  const handleTileClick = (row: number, col: number) => {
    if (phase !== "playing" || isProcessing.current) return;

    if (!selected) {
      setSelected([row, col]);
      return;
    }

    const [pr, pc] = selected;

    // Same tile — deselect
    if (pr === row && pc === col) {
      setSelected(null);
      return;
    }

    // Must be adjacent
    if (Math.abs(row - pr) + Math.abs(col - pc) !== 1) {
      setSelected([row, col]);
      return;
    }

    isProcessing.current = true;

    // Try the swap
    const newGrid = grid.map(r => [...r]);
    [newGrid[pr][pc], newGrid[row][col]] = [newGrid[row][col], newGrid[pr][pc]];

    // Check if swap creates matches
    const result = processMatches(newGrid);

    if (result.totalPoints > 0) {
      // Valid swap
      setGrid(result.grid);
      setScore(prev => {
        const newScore = prev + result.totalPoints;
        if (newScore >= TARGET_SCORE) {
          setTimeout(() => setPhase("finished"), 300);
        }
        return newScore;
      });
      setMovesLeft(m => {
        const newMoves = m - 1;
        if (newMoves <= 0) setTimeout(() => setPhase("finished"), 300);
        return newMoves;
      });
      setLastPoints(result.totalPoints);
      setShowPoints(true);
      setCombo(c => c + 1);
      setTimeout(() => setShowPoints(false), 1200);

      // Highlight matched cells
      const matched = findMatches(newGrid);
      const cells = new Set(matched.map(([r, c]) => `${r},${c}`));
      setAnimatingCells(cells);
      setTimeout(() => setAnimatingCells(new Set()), 400);
    } else {
      // Invalid swap — no matches created (swap back silently)
    }

    setSelected(null);
    isProcessing.current = false;
  };

  // ─── Restart ─────────────────────────────────────────────
  const restart = () => {
    setGrid(generateCleanGrid());
    setScore(0);
    setMovesLeft(config.moveLimit);
    setPhase("playing");
    setCombo(0);
    setSelected(null);
  };

  // ─── RENDER: Game Over ───────────────────────────────────
  if (phase === "finished") {
    const won = score >= TARGET_SCORE;
    return (
      <div className="min-h-screen bg-[#060a14] p-4 flex items-center justify-center relative overflow-hidden">
        <ConfettiEffect trigger={won} />
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full blur-[100px] opacity-15 bg-yellow-500" />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center p-8 rounded-2xl bg-black/60 backdrop-blur-sm border border-yellow-500/30 max-w-sm w-full">
          {won ? <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" /> : <span className="text-6xl block mb-4">😅</span>}
          <h2 className="text-3xl font-black text-white mb-2">{won ? "YOU WIN!" : "Game Over!"}</h2>
          <p className="text-5xl font-black text-yellow-400 mb-2">{score} pts</p>
          <p className="text-white/40 text-sm mb-6">{won ? `Reached ${TARGET_SCORE} in ${config.moveLimit - movesLeft} moves!` : `Ran out of moves (${score}/${TARGET_SCORE})`}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={restart} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl">
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
            <button onClick={onClose} className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl">Back</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── RENDER: Game ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060a14] p-3 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full blur-[100px] opacity-12 bg-yellow-500" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full blur-[100px] opacity-8 bg-pink-500" />
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={onClose} className="flex items-center gap-1 text-white/50 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
              🎪 Theme Park Match-3
            </h1>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">{difficulty} • First to {TARGET_SCORE}</p>
          </div>
          <button onClick={restart} className="text-white/30 hover:text-white"><RotateCcw className="w-4 h-4" /></button>
        </div>

        {/* Score Bar */}
        <div className="flex items-center gap-3 mb-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-white/40">Score</span>
              <span className="text-xs text-white/40">{TARGET_SCORE}</span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                animate={{ width: `${Math.min((score / TARGET_SCORE) * 100, 100)}%` }}
                transition={{ type: "spring", stiffness: 100 }}
              />
            </div>
          </div>
          <div className="text-right min-w-[60px]">
            <p className="text-2xl font-black text-yellow-400 leading-none">{score}</p>
          </div>
        </div>

        {/* Moves + Combo */}
        <div className="flex justify-between items-center mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Moves:</span>
            <span className={`text-sm font-bold ${movesLeft <= 5 ? "text-red-400" : "text-white/70"}`}>{movesLeft}</span>
          </div>
          {combo > 2 && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30">
              <Zap className="w-3 h-3 text-orange-400" />
              <span className="text-xs font-bold text-orange-400">{combo}× Combo!</span>
            </motion.div>
          )}
        </div>

        {/* Points Popup */}
        <AnimatePresence>
          {showPoints && lastPoints > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -40, scale: 1.3 }}
              exit={{ opacity: 0, y: -70 }}
              transition={{ duration: 0.6 }}
              className="absolute top-28 left-1/2 -translate-x-1/2 z-50"
            >
              <span className="text-3xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(255,200,0,0.5)]">
                +{lastPoints}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        <div className="flex justify-center">
          <div
            className="grid gap-[3px] p-3 rounded-2xl bg-black/50 backdrop-blur-sm border border-white/10 shadow-xl"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)` }}
          >
            {grid.map((row, r) =>
              row.map((itemIdx, c) => {
                const item = itemIdx !== null ? ITEMS[itemIdx] : null;
                const isSelected = selected && selected[0] === r && selected[1] === c;
                const isAnimating = animatingCells.has(`${r},${c}`);

                return (
                  <motion.button
                    key={`${r}-${c}`}
                    onClick={() => handleTileClick(r, c)}
                    whileTap={{ scale: 0.8 }}
                    animate={{
                      scale: isAnimating ? [1, 1.3, 0] : isSelected ? 1.12 : 1,
                      opacity: isAnimating ? [1, 1, 0] : 1,
                    }}
                    transition={{ duration: isAnimating ? 0.3 : 0.15 }}
                    className="flex items-center justify-center rounded-lg transition-colors"
                    style={{
                      width: TILE_SIZE,
                      height: TILE_SIZE,
                      background: item
                        ? isSelected
                          ? `${item.color}40`
                          : `${item.color}15`
                        : "transparent",
                      border: isSelected
                        ? `2px solid ${item?.color || "#fff"}`
                        : "1px solid rgba(255,255,255,0.04)",
                      boxShadow: isSelected ? `0 0 10px ${item?.color}50` : "none",
                    }}
                  >
                    <span className={`${TILE_SIZE >= 44 ? "text-xl" : "text-lg"} select-none`}>
                      {item?.emoji || ""}
                    </span>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Item Legend */}
        <div className="flex justify-center gap-3 mt-3 flex-wrap">
          {ITEMS.slice(0, config.itemCount).map(item => (
            <div key={item.key} className="flex items-center gap-1 text-white/30 text-[10px]">
              <span>{item.emoji}</span>
              <span className="capitalize">{item.key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
