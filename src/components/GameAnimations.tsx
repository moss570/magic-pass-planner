// Game Animation Framework — Framer Motion + Pixi.js
import { motion } from "framer-motion";
import React from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCORE POPUP ANIMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ScorePopup = ({ points, x, y }: { points: number; x: number; y: number }) => (
  <motion.div
    initial={{ opacity: 1, y: 0, scale: 1 }}
    animate={{ opacity: 0, y: -50, scale: 1.2 }}
    transition={{ duration: 1, ease: "easeOut" }}
    style={{ position: "absolute", left: x, top: y, pointerEvents: "none" }}
    className="text-2xl font-bold text-yellow-400 drop-shadow-lg"
  >
    +{points}
  </motion.div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GAME CARD ENTRANCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const GameCard = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
    whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}
    className="rounded-xl border border-primary/20 bg-card p-4 cursor-pointer"
  >
    {children}
  </motion.div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUTTON PRESS ANIMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const AnimatedButton = ({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    disabled={disabled}
    className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50"
  >
    {children}
  </motion.button>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCORE COUNTER (Animated Number Ticking)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const AnimatedScore = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDisplayValue((prev) => {
        if (prev >= value) return value;
        return Math.min(prev + Math.ceil((value - prev) / 10), value);
      });
    }, 30);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <motion.div className="text-3xl font-bold text-yellow-400">
      {displayValue.toLocaleString()}
    </motion.div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE TRANSITION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEADERBOARD SMOOTH SCROLL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const LeaderboardEntry = ({ rank, name, score, delay = 0 }: { rank: number; name: string; score: number; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay }}
    className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 mb-2"
  >
    <div className="flex items-center gap-3">
      <span className="text-lg font-bold text-primary w-8">{rank}</span>
      <span className="text-foreground font-semibold">{name}</span>
    </div>
    <span className="text-lg font-bold text-yellow-400">{score.toLocaleString()}</span>
  </motion.div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFETTI CELEBRATION (Pixi.js ready)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CelebrationBurst = ({ trigger }: { trigger: boolean }) => {
  return trigger ? (
    <>
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 1, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
          }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="fixed pointer-events-none text-3xl"
          style={{
            left: "50%",
            top: "50%",
          }}
        >
          🎉
        </motion.div>
      ))}
    </>
  ) : null;
};
