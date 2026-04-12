import { saveHighScore } from "@/lib/gameScores";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Eye, EyeOff } from "lucide-react";

const WORD_SETS = [
  { words: ["Apple","Beach","Castle","Dragon","Eagle","Forest","Garden","Harbor","Island","Jungle","Knight","Lemon","Mountain","Night","Ocean","Piano","Queen","River","Snow","Tower","Umbrella","Violin","Whale","Xylophone","Yacht"], spyWords: [0,3,7,12,19], assassin: 23 },
  { words: ["Anchor","Banana","Camera","Diamond","Engine","Falcon","Ghost","Hammer","Ice","Jazz","Kite","Lamp","Mirror","Ninja","Opera","Parrot","Quilt","Robot","Sword","Tiger","Unicorn","Vault","Wizard","Zero","Arrow"], spyWords: [1,5,9,15,20], assassin: 22 },
  { words: ["Atlas","Bridge","Cloud","Dawn","Echo","Flame","Globe","Hawk","Ivy","Jewel","Key","Lotus","Maze","Nest","Orbit","Pearl","Quest","Reef","Star","Torch","Unity","Vine","Wave","Fox","Zen"], spyWords: [2,6,11,16,21], assassin: 24 },
];

export default function SpyWordGame({ onClose }: { onClose: () => void }) {
  const [setIdx] = useState(() => Math.floor(Math.random() * WORD_SETS.length));
  const wordSet = WORD_SETS[setIdx];
  const [revealed, setRevealed] = useState<boolean[]>(Array(25).fill(false));
  const [showSpy, setShowSpy] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [spyFound, setSpyFound] = useState(0);

  const revealWord = (idx: number) => {
    if (revealed[idx] || gameOver) return;
    const newR = [...revealed]; newR[idx] = true; setRevealed(newR);

    if (idx === wordSet.assassin) {
      setGameOver(true); // Hit assassin = game over
    } else if (wordSet.spyWords.includes(idx)) {
      setScore(s => s + 100);
      setSpyFound(s => {
        if (s + 1 >= wordSet.spyWords.length) { setGameOver(true); saveHighScore("spy-word", score + 100, "normal", true); }
        return s + 1;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#060a14] p-4 relative overflow-hidden">
      <><div className="absolute inset-0 bg-black/60 pointer-events-none" /><div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full blur-[100px] opacity-20 bg-cyan-500" />
        <div className="absolute bottom-20 right-1/3 w-64 h-64 rounded-full blur-[100px] opacity-15 bg-blue-400" />
      </div>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="text-white/70 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400">🕵️ Spy Word</h1>
          <button onClick={() => setShowSpy(!showSpy)} className="text-cyan-400">
            {showSpy ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex justify-between mb-4 text-sm">
          <span className="text-cyan-400">Spy words: {spyFound}/{wordSet.spyWords.length}</span>
          <span className="text-yellow-400 font-bold">Score: {score}</span>
        </div>

        {showSpy && (
          <div className="mb-3 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 text-center">
            🕵️ Spymaster view — spy words highlighted
          </div>
        )}

        <div className="grid grid-cols-5 gap-1.5 md:gap-2 mb-4">
          {wordSet.words.map((word, idx) => {
            const isSpy = wordSet.spyWords.includes(idx);
            const isAssassin = idx === wordSet.assassin;
            return (
              <motion.button key={idx} whileTap={{ scale: 0.9 }} onClick={() => revealWord(idx)}
                className={`p-1.5 md:p-2 rounded-lg text-[10px] md:text-xs font-bold h-12 md:h-16 flex items-center justify-center transition-all border
                  ${revealed[idx] ? (isAssassin ? "bg-red-600 border-red-500 text-white" : isSpy ? "bg-cyan-500 border-cyan-400 text-black" : "bg-white/20 border-white/10 text-white/40") :
                    showSpy && isSpy ? "bg-cyan-500/20 border-cyan-500/40 text-white" :
                    showSpy && isAssassin ? "bg-red-500/20 border-red-500/40 text-white" :
                    "bg-white/10 border-white/10 text-white hover:bg-white/20"}`}>
                {word}
              </motion.button>
            );
          })}
        </div>

        {gameOver && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center p-6 rounded-xl bg-black/40 border border-cyan-500/30">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="text-2xl font-bold text-white mb-2">
              {spyFound >= wordSet.spyWords.length ? "All Spy Words Found!" : "Game Over!"}
            </p>
            <p className="text-3xl font-black text-yellow-400 mb-4">{score} points</p>
            <button onClick={onClose} className="px-6 py-2 bg-cyan-500 text-black font-bold rounded-lg">Back to Games</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
