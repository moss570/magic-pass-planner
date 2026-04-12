import { saveHighScore } from "@/lib/gameScores";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Eraser } from "lucide-react";

const PROMPTS = ["House","Tree","Car","Dog","Cat","Sun","Moon","Star","Fish","Bird","Flower","Mountain","Ocean","Cloud","Rain","Fire","Heart","Crown","Rocket","Guitar"];

export default function PicturePerfectGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [guess, setGuess] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [guessed, setGuessed] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const lastPos = useRef<{x:number,y:number}|null>(null);

  useEffect(() => {
    if (gameOver || guessed) return;
    const timer = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { setGameOver(true); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, guessed]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e: any) => {
    setDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: any) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const pos = getPos(e);
    if (!ctx || !pos || !lastPos.current) return;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#F0B429";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => { setDrawing(false); lastPos.current = null; };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, 300, 300);
  };

  const submitGuess = () => {
    if (guess.trim().toLowerCase() === prompt.toLowerCase()) {
      const pts = timeLeft > 40 ? 100 : timeLeft > 20 ? 50 : 25;
      setScore(pts);
      saveHighScore("picture-perfect", pts, "normal", true);
      setGuessed(true);
    } else {
      setGuess("");
    }
  };

  if (gameOver || guessed) {
    return (
      <div className="min-h-screen bg-[#060a14] p-4 flex items-center justify-center relative overflow-hidden">
      <><div className="absolute inset-0 bg-black/60 pointer-events-none" /><div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full blur-[100px] opacity-20 bg-pink-500" />
      </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 rounded-xl bg-black/40 border border-pink-500/30 max-w-md w-full">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <p className="text-xl font-bold text-white mb-2">The word was: <span className="text-yellow-400">{prompt}</span></p>
          <p className="text-3xl font-black text-yellow-400 mb-4">{score} points</p>
          <button onClick={onClose} className="px-6 py-3 bg-pink-500 text-white font-bold rounded-lg">Back to Games</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a14] p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full blur-[100px] opacity-20 bg-pink-500" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-[100px] opacity-15 bg-rose-400" />
      </div>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="text-white/70 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-400 to-red-400">🎨 Picture Perfect</h1>
          <p className={`text-lg font-bold ${timeLeft < 10 ? "text-red-400" : "text-white"}`}>{timeLeft}s</p>
        </div>

        <div className="bg-black/30 rounded-xl p-3 border border-pink-500/20 mb-4 text-center">
          <p className="text-sm text-pink-300">Draw this word:</p>
          <p className="text-2xl font-black text-yellow-400">{prompt}</p>
        </div>

        <div className="flex justify-center mb-4">
          <canvas ref={canvasRef} width={280} height={280}
            className="bg-black/50 rounded-xl border border-white/20 touch-none cursor-crosshair max-w-full"
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
        </div>

        <div className="flex justify-center mb-4">
          <button onClick={clearCanvas} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white/60 hover:text-white">
            <Eraser className="w-4 h-4" /> Clear
          </button>
        </div>

        <div className="flex gap-2">
          <input value={guess} onChange={e => setGuess(e.target.value)} placeholder="Type your guess..."
            onKeyDown={e => e.key === "Enter" && submitGuess()}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/30" />
          <button onClick={submitGuess} className="px-6 py-3 bg-pink-500 text-white font-bold rounded-lg">Guess</button>
        </div>
      </div>
    </div>
  );
}
