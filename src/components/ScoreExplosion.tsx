import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface ScoreExplosionProps {
  points: number;
  show: boolean;
  onComplete?: () => void;
}

export default function ScoreExplosion({ points, show, onComplete }: ScoreExplosionProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  
  useEffect(() => {
    if (!show) return;
    const emojis = ["⭐", "🌟", "✨", "💫", "🎯", "🔥", "💥"];
    setParticles(
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 300,
        y: (Math.random() - 0.5) * 300,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
      }))
    );
    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 1200);
    return () => clearTimeout(timer);
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          {/* Score text */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -10 }}
            animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 1], rotate: [−10, 5, 0] }}
            exit={{ scale: 0, opacity: 0, y: -50 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-400 to-orange-500 drop-shadow-2xl">
              +{points}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg font-bold text-white/80 text-center mt-1"
            >
              {points >= 100 ? "🔥 INCREDIBLE!" : points >= 50 ? "⭐ GREAT!" : "✅ Nice!"}
            </motion.div>
          </motion.div>

          {/* Particle emojis */}
          {particles.map(p => (
            <motion.div key={p.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{ x: p.x, y: p.y, scale: [0, 1.5, 0], opacity: [1, 1, 0] }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="fixed text-3xl pointer-events-none"
              style={{ left: "50%", top: "50%" }}
            >
              {p.emoji}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
