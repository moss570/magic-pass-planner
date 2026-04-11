import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy } from "lucide-react";

const QUESTIONS = [
  { a: "Never fly on an airplane again", b: "Never drive a car again" },
  { a: "Get $10,000 right now", b: "Get $50,000 in 5 years" },
  { a: "Time travel to the past", b: "Time travel to the future" },
  { a: "Have unlimited free food forever", b: "Have unlimited free travel forever" },
  { a: "Be the funniest person in every room", b: "Be the smartest person in every room" },
  { a: "Live in a mansion in the middle of nowhere", b: "Live in a tiny apartment in your favorite city" },
  { a: "Never use social media again", b: "Never watch TV or movies again" },
  { a: "Have perfect memory", b: "Be able to forget anything you want" },
  { a: "Always be 10 minutes late", b: "Always be 20 minutes early" },
  { a: "Know every language", b: "Play every instrument" },
  { a: "Win the lottery but lose all friends", b: "Have incredible friends but always struggle with money" },
  { a: "Live without music", b: "Live without movies" },
  { a: "Be able to fly", b: "Be able to breathe underwater" },
  { a: "Have a personal chef", b: "Have a personal trainer" },
  { a: "Relive the same day forever", b: "Skip ahead 10 years" },
  { a: "Never eat pizza again", b: "Never eat ice cream again" },
  { a: "Be famous but misunderstood", b: "Be unknown but deeply respected" },
  { a: "Have free WiFi everywhere", b: "Have free coffee everywhere" },
  { a: "Always know when someone is lying", b: "Always get away with lying" },
  { a: "Vacation at the beach every year", b: "Vacation in the mountains every year" },
];

export default function WouldYouRatherGame({ onClose }: { onClose: () => void }) {
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [picked, setPicked] = useState<"a"|"b"|null>(null);
  const [fakeStats, setFakeStats] = useState({ a: 0, b: 0 });

  const q = QUESTIONS[qIdx];

  const pick = (choice: "a" | "b") => {
    setPicked(choice);
    const aPercent = Math.floor(Math.random() * 40) + 30; // 30-70%
    setFakeStats({ a: aPercent, b: 100 - aPercent });
    setAnswers(prev => [...prev, choice]);

    // Minority vote = 20 pts, majority = 10 pts
    const majority = aPercent > 50 ? "a" : "b";
    const pts = choice === majority ? 10 : 20;
    setScore(s => s + pts);

    setTimeout(() => {
      setPicked(null);
      if (qIdx < QUESTIONS.length - 1) {
        setQIdx(i => i + 1);
      } else {
        setShowResult(true);
      }
    }, 2000);
  };

  if (showResult) {
    return (
      <div className="min-h-screen bg-[#060a14] p-4 flex items-center justify-center relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full blur-[100px] opacity-20 bg-blue-500" />
      </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 rounded-xl bg-black/40 border border-blue-500/30 max-w-md w-full">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <p className="text-2xl font-bold text-white mb-2">Game Over!</p>
          <p className="text-4xl font-black text-yellow-400 mb-2">{score} points</p>
          <p className="text-sm text-white/60 mb-6">{QUESTIONS.length} questions answered</p>
          <button onClick={onClose} className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg">Back to Games</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a14] p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full blur-[100px] opacity-20 bg-blue-500" />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full blur-[100px] opacity-15 bg-indigo-400" />
      </div>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="text-white/70 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-400 to-purple-400">🤔 Would You Rather</h1>
          <p className="text-sm text-white/60">{qIdx+1}/{QUESTIONS.length}</p>
        </div>

        <div className="text-center mb-2">
          <p className="text-sm text-blue-400 font-semibold">Score: {score}</p>
        </div>

        <p className="text-center text-lg font-bold text-white mb-6">Would you rather...</p>

        <div className="space-y-4">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => !picked && pick("a")}
            className={`w-full p-6 rounded-xl text-left font-semibold text-lg transition-all border-2
              ${picked === "a" ? "bg-blue-500/30 border-blue-500 text-white" :
                picked === "b" ? "bg-white/5 border-white/10 text-white/40" :
                "bg-blue-500/10 border-blue-500/30 text-white hover:bg-blue-500/20"}`}>
            <span className="text-blue-400 font-bold mr-2">A.</span> {q.a}
            {picked && <span className="block text-sm mt-2 text-blue-300">{fakeStats.a}% chose this</span>}
          </motion.button>

          <p className="text-center text-white/40 font-bold">— OR —</p>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => !picked && pick("b")}
            className={`w-full p-6 rounded-xl text-left font-semibold text-lg transition-all border-2
              ${picked === "b" ? "bg-cyan-500/30 border-cyan-500 text-white" :
                picked === "a" ? "bg-white/5 border-white/10 text-white/40" :
                "bg-cyan-500/10 border-cyan-500/30 text-white hover:bg-cyan-500/20"}`}>
            <span className="text-cyan-400 font-bold mr-2">B.</span> {q.b}
            {picked && <span className="block text-sm mt-2 text-cyan-300">{fakeStats.b}% chose this</span>}
          </motion.button>
        </div>

        <p className="text-center text-xs text-white/30 mt-4">Minority vote = 20 pts | Majority = 10 pts</p>
      </div>
    </div>
  );
}
