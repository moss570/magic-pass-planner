import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Globe } from "lucide-react";

const QUESTIONS = [
  { q: "What is the capital of France?", answer: "Paris", options: ["Paris","London","Berlin","Madrid"] },
  { q: "What is the tallest mountain in the world?", answer: "Mount Everest", options: ["Mount Everest","K2","Kilimanjaro","Mont Blanc"] },
  { q: "Which country has the most people?", answer: "India", options: ["China","India","USA","Indonesia"] },
  { q: "What is the longest river in the world?", answer: "Nile", options: ["Amazon","Nile","Mississippi","Yangtze"] },
  { q: "What continent is Egypt in?", answer: "Africa", options: ["Africa","Asia","Europe","Middle East"] },
  { q: "What is the capital of Japan?", answer: "Tokyo", options: ["Tokyo","Osaka","Kyoto","Seoul"] },
  { q: "Which ocean is the largest?", answer: "Pacific", options: ["Atlantic","Pacific","Indian","Arctic"] },
  { q: "What country is the Colosseum in?", answer: "Italy", options: ["Italy","Greece","Spain","Turkey"] },
  { q: "What is the smallest country in the world?", answer: "Vatican City", options: ["Monaco","Vatican City","San Marino","Liechtenstein"] },
  { q: "What is the capital of Australia?", answer: "Canberra", options: ["Sydney","Melbourne","Canberra","Brisbane"] },
  { q: "Which country has the shape of a boot?", answer: "Italy", options: ["Italy","Chile","Japan","Greece"] },
  { q: "What is the driest continent?", answer: "Antarctica", options: ["Africa","Antarctica","Australia","Asia"] },
  { q: "What river flows through London?", answer: "Thames", options: ["Thames","Seine","Danube","Rhine"] },
  { q: "Which US state is the biggest by area?", answer: "Alaska", options: ["Texas","Alaska","California","Montana"] },
  { q: "What is the capital of Brazil?", answer: "Brasília", options: ["Rio de Janeiro","São Paulo","Brasília","Salvador"] },
];

export default function GeographyGame({ onClose }: { onClose: () => void }) {
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string|null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [gameOver, setGameOver] = useState(false);

  const q = QUESTIONS[qIdx];

  const pick = (answer: string) => {
    if (picked) return;
    setPicked(answer);
    const isCorrect = answer === q.answer;
    if (isCorrect) {
      const timePts = timeLeft > 15 ? 100 : timeLeft > 10 ? 75 : 50;
      setScore(s => s + timePts);
    }
    setTimeout(() => {
      setPicked(null);
      setTimeLeft(20);
      if (qIdx < QUESTIONS.length - 1) setQIdx(i => i + 1);
      else setGameOver(true);
    }, 1500);
  };

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0d2137] to-[#0a1628] p-4 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 rounded-xl bg-black/40 border border-green-500/30 max-w-md w-full">
          <Globe className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <p className="text-2xl font-bold text-white mb-2">Game Over!</p>
          <p className="text-4xl font-black text-yellow-400 mb-6">{score} points</p>
          <button onClick={onClose} className="px-6 py-3 bg-green-500 text-black font-bold rounded-lg">Back to Games</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0d2137] to-[#0a1628] p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="text-white/70 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold text-white">🌍 Geography</h1>
          <p className="text-sm text-white/60">{qIdx+1}/{QUESTIONS.length}</p>
        </div>

        <p className="text-center text-sm text-green-400 mb-4">Score: {score}</p>

        <div className="bg-black/30 rounded-xl p-6 border border-green-500/20 mb-6 text-center">
          <Globe className="w-8 h-8 text-green-400 mx-auto mb-3" />
          <p className="text-xl font-bold text-white">{q.q}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {q.options.map(opt => (
            <motion.button key={opt} whileTap={{ scale: 0.95 }} onClick={() => pick(opt)}
              className={`p-4 rounded-xl font-bold text-base transition-all border-2
                ${picked === opt ? (opt === q.answer ? "bg-green-500/30 border-green-500 text-green-300" : "bg-red-500/30 border-red-500 text-red-300") :
                  picked && opt === q.answer ? "bg-green-500/30 border-green-500 text-green-300" :
                  "bg-white/10 border-white/10 text-white hover:bg-white/20"}`}>
              {opt}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
