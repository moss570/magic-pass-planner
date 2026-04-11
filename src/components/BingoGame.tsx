import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Volume2 } from "lucide-react";

const PATTERNS = [
  { name: "5 in a Row", check: (card: boolean[][]) => {
    for (let r = 0; r < 5; r++) if (card[r].every(Boolean)) return true;
    for (let c = 0; c < 5; c++) if (card.every(row => row[c])) return true;
    if ([0,1,2,3,4].every(i => card[i][i])) return true;
    if ([0,1,2,3,4].every(i => card[i][4-i])) return true;
    return false;
  }},
  { name: "Four Corners", check: (card: boolean[][]) => card[0][0] && card[0][4] && card[4][0] && card[4][4] },
  { name: "X Pattern", check: (card: boolean[][]) => [0,1,2,3,4].every(i => card[i][i]) && [0,1,2,3,4].every(i => card[i][4-i]) },
  { name: "Blackout", check: (card: boolean[][]) => card.every(row => row.every(Boolean)) },
];

const COLS = ["B","I","N","G","O"];
const ranges = [[1,15],[16,30],[31,45],[46,60],[61,75]];

function generateCard(): number[][] {
  return ranges.map(([min, max]) => {
    const nums: number[] = [];
    while (nums.length < 5) {
      const n = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!nums.includes(n)) nums.push(n);
    }
    return nums;
  });
}

function generateCallOrder(): number[] {
  const nums = Array.from({length: 75}, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

export default function BingoGame({ onClose }: { onClose: () => void }) {
  const [card] = useState(generateCard);
  const [callOrder] = useState(generateCallOrder);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [marked, setMarked] = useState<boolean[][]>(Array.from({length: 5}, () => Array(5).fill(false)));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [callIdx, setCallIdx] = useState(0);
  const [speed, setSpeed] = useState(3000);

  // Auto-call numbers
  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setCallIdx(prev => {
        if (prev >= 75) { setGameOver(true); return prev; }
        setCalledNumbers(cn => [...cn, callOrder[prev]]);
        return prev + 1;
      });
    }, speed);
    return () => clearInterval(timer);
  }, [callOrder, speed, gameOver]);

  // Free space
  useEffect(() => {
    setMarked(prev => { const n = prev.map(r => [...r]); n[2][2] = true; return n; });
  }, []);

  const toggleMark = (col: number, row: number) => {
    const num = card[col][row];
    if (!calledNumbers.includes(num) && !(col === 2 && row === 2)) return;
    setMarked(prev => {
      const n = prev.map(r => [...r]);
      n[col][row] = !n[col][row];
      return n;
    });
  };

  // Check win
  useEffect(() => {
    // Transpose marked for pattern check (patterns expect [row][col])
    const transposed = Array.from({length: 5}, (_, r) => Array.from({length: 5}, (_, c) => marked[c][r]));
    if (round < PATTERNS.length && PATTERNS[round].check(transposed)) {
      setWon(true);
      const pts = [100, 150, 200, 100][round];
      setScore(s => s + pts);
      setTimeout(() => {
        setWon(false);
        if (round < 3) {
          setRound(r => r + 1);
          setMarked(Array.from({length: 5}, () => Array(5).fill(false)));
          setMarked(prev => { const n = prev.map(r => [...r]); n[2][2] = true; return n; });
        } else {
          setGameOver(true);
        }
      }, 2000);
    }
  }, [marked, round]);

  const lastCalled = calledNumbers[calledNumbers.length - 1];
  const lastCol = lastCalled ? COLS[ranges.findIndex(([min, max]) => lastCalled >= min && lastCalled <= max)] : "";

  return (
    <div className="min-h-screen bg-[#060a14] p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full blur-[100px] opacity-20 bg-emerald-500" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full blur-[100px] opacity-15 bg-teal-400" />
      </div>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="flex items-center gap-2 text-white/70 hover:text-white">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-400 to-cyan-400">🎲 BINGO</h1>
            <p className="text-xs text-white/60">Round {round + 1}/4: {PATTERNS[round]?.name || "Complete!"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60">Score</p>
            <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-400">{score}</p>
          </div>
        </div>

        {/* Called Number */}
        <motion.div key={lastCalled} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 backdrop-blur-sm">
          <p className="text-xs text-white/60 mb-1">Now Calling</p>
          <p className="text-4xl font-black text-white">{lastCol}{lastCalled || "—"}</p>
          <p className="text-xs text-white/40 mt-1">{calledNumbers.length} of 75 called</p>
        </motion.div>

        {/* Speed Control */}
        <div className="flex justify-center gap-2 mb-4">
          {[{label: "Slow", ms: 5000}, {label: "Normal", ms: 3000}, {label: "Fast", ms: 1000}].map(s => (
            <button key={s.label} onClick={() => setSpeed(s.ms)}
              className={`px-3 py-1 rounded text-xs font-bold ${speed === s.ms ? "bg-green-500 text-black" : "bg-white/10 text-white/60"}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Bingo Card */}
        <div className="bg-black/30 rounded-xl p-3 border border-white/10">
          {/* Column Headers */}
          <div className="grid grid-cols-5 gap-1 mb-1">
            {COLS.map(c => (
              <div key={c} className="text-center text-lg font-black text-yellow-400">{c}</div>
            ))}
          </div>
          {/* Card Grid */}
          {[0,1,2,3,4].map(row => (
            <div key={row} className="grid grid-cols-5 gap-1 mb-1">
              {[0,1,2,3,4].map(col => {
                const num = card[col][row];
                const isCalled = calledNumbers.includes(num);
                const isMarked = marked[col][row];
                const isFree = col === 2 && row === 2;
                return (
                  <motion.button key={`${col}-${row}`}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleMark(col, row)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all
                      ${isMarked ? "bg-green-500 text-black shadow-lg shadow-green-500/30" :
                        isCalled ? "bg-white/20 text-white border border-green-500/50" :
                        "bg-white/5 text-white/40 border border-white/10"}`}>
                    {isFree ? "⭐" : num}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Win Animation */}
        <AnimatePresence>
          {won && (
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
              <div className="text-center">
                <motion.p animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}
                  className="text-6xl font-black text-yellow-400 mb-4">🎉 BINGO!</motion.p>
                <p className="text-xl text-white">+{[100,150,200,100][round]} points!</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over */}
        {gameOver && !won && (
          <div className="mt-4 text-center p-6 rounded-xl bg-black/30 border border-white/10">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="text-2xl font-bold text-white mb-2">Game Over!</p>
            <p className="text-3xl font-black text-yellow-400 mb-4">{score} points</p>
            <button onClick={onClose} className="px-6 py-2 bg-green-500 text-black font-bold rounded-lg">Back to Games</button>
          </div>
        )}

        {/* Called Numbers History */}
        <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/10">
          <p className="text-xs text-white/40 mb-2">Called Numbers</p>
          <div className="flex flex-wrap gap-1">
            {calledNumbers.slice(-20).map(n => (
              <span key={n} className="px-1.5 py-0.5 rounded text-xs bg-white/10 text-white/60">{n}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
