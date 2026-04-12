/**
 * Spit! — Lightning-Fast Card Game
 * Play cards ±1 of pile top. First to empty hand wins!
 * 2-4 players (solo vs AI)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap, Trophy, RotateCcw } from "lucide-react";
import ConfettiEffect from "@/components/ConfettiEffect";

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const RANK_VAL: Record<string, number> = { A: 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13 };
const SUIT_DISPLAY: Record<string, { s: string; c: string }> = {
  hearts: { s: "♥", c: "#FF4444" }, diamonds: { s: "♦", c: "#FF4444" },
  clubs: { s: "♣", c: "#DDD" }, spades: { s: "♠", c: "#DDD" },
};

interface Card { suit: string; rank: string; }

interface Props {
  onClose: () => void;
  playerName?: string;
}

export default function SpitGame({ onClose, playerName = "You" }: Props) {
  const [myHand, setMyHand] = useState<Card[]>([]);
  const [aiHand, setAiHand] = useState<Card[]>([]);
  const [pile1, setPile1] = useState<Card[]>([]);
  const [pile2, setPile2] = useState<Card[]>([]);
  const [phase, setPhase] = useState<"idle" | "playing" | "finished">("idle");
  const [winner, setWinner] = useState("");
  const [timer, setTimer] = useState(0);
  const [lastPlay, setLastPlay] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const aiInterval = useRef<NodeJS.Timeout | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  const createDeck = (): Card[] => {
    const deck: Card[] = [];
    for (const suit of SUITS) for (const rank of RANKS) deck.push({ suit, rank });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };

  const canPlay = (card: Card, pileTop: Card): boolean => {
    const cv = RANK_VAL[card.rank];
    const pv = RANK_VAL[pileTop.rank];
    const diff = Math.abs(cv - pv);
    return diff === 1 || diff === 12; // K↔A wrapping
  };

  const startGame = useCallback(() => {
    const deck = createDeck();
    setMyHand(deck.slice(0, 20));
    setAiHand(deck.slice(20, 40));
    setPile1([deck[40]]);
    setPile2([deck[41]]);
    setPhase("playing");
    setWinner("");
    setTimer(0);
    setLastPlay("");
  }, []);

  // Timer
  useEffect(() => {
    if (phase === "playing") {
      timerInterval.current = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
  }, [phase]);

  // AI plays automatically
  useEffect(() => {
    if (phase !== "playing") return;

    aiInterval.current = setInterval(() => {
      setAiHand(prev => {
        if (prev.length === 0) return prev;

        // Try to play on either pile
        for (let i = 0; i < Math.min(5, prev.length); i++) {
          const card = prev[i];
          const p1Top = pile1[pile1.length - 1];
          const p2Top = pile2[pile2.length - 1];

          if (p1Top && canPlay(card, p1Top)) {
            setPile1(p => [...p, card]);
            setLastPlay(`AI played ${card.rank}${SUIT_DISPLAY[card.suit].s} on Pile 1`);
            const newHand = [...prev];
            newHand.splice(i, 1);
            if (newHand.length === 0) {
              setWinner("AI");
              setPhase("finished");
            }
            return newHand;
          }
          if (p2Top && canPlay(card, p2Top)) {
            setPile2(p => [...p, card]);
            setLastPlay(`AI played ${card.rank}${SUIT_DISPLAY[card.suit].s} on Pile 2`);
            const newHand = [...prev];
            newHand.splice(i, 1);
            if (newHand.length === 0) {
              setWinner("AI");
              setPhase("finished");
            }
            return newHand;
          }
        }
        return prev;
      });
    }, 1500 + Math.random() * 1000); // AI plays every 1.5-2.5s

    return () => { if (aiInterval.current) clearInterval(aiInterval.current); };
  }, [phase, pile1, pile2]);

  const playCard = (cardIndex: number, pileIndex: number) => {
    if (phase !== "playing") return;
    if (cardIndex >= myHand.length) return;

    const card = myHand[cardIndex];
    const pileTop = pileIndex === 0 ? pile1[pile1.length - 1] : pile2[pile2.length - 1];

    if (!pileTop || !canPlay(card, pileTop)) {
      setLastPlay("Can't play that card! Must be ±1 of pile top.");
      return;
    }

    // Valid play
    if (pileIndex === 0) setPile1(p => [...p, card]);
    else setPile2(p => [...p, card]);

    const newHand = [...myHand];
    newHand.splice(cardIndex, 1);
    setMyHand(newHand);
    setLastPlay(`You played ${card.rank}${SUIT_DISPLAY[card.suit].s}!`);

    if (newHand.length === 0) {
      setWinner(playerName);
      setPhase("finished");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const CardView = ({ card, onClick, small = false }: { card: Card; onClick?: () => void; small?: boolean }) => (
    <motion.div
      whileTap={onClick ? { scale: 0.9 } : {}}
      onClick={onClick}
      className={`flex flex-col items-center justify-center font-bold shadow-lg rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 ${
        small ? "w-10 h-14 text-[10px]" : "w-14 h-20"
      } ${onClick ? "cursor-pointer hover:shadow-xl active:scale-95" : ""}`}
    >
      <span className={small ? "text-[9px]" : "text-xs"} style={{ color: SUIT_DISPLAY[card.suit].c }}>{card.rank}</span>
      <span className={small ? "text-sm" : "text-lg"} style={{ color: SUIT_DISPLAY[card.suit].c }}>{SUIT_DISPLAY[card.suit].s}</span>
    </motion.div>
  );

  // ─── FINISHED ────────────────────────────────────────────
  if (phase === "finished") {
    const won = winner === playerName;
    return (
      <div className="min-h-screen bg-[#060a14] p-4 flex items-center justify-center relative overflow-hidden">
        <ConfettiEffect trigger={won} />
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 rounded-2xl bg-black/60 backdrop-blur-sm border border-cyan-500/30 max-w-sm w-full">
          {won ? <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" /> : <span className="text-6xl block mb-4">😤</span>}
          <h2 className="text-3xl font-black text-white mb-2">{won ? "YOU WIN!" : "AI Wins!"}</h2>
          <p className="text-white/50 mb-1">Time: {formatTime(timer)}</p>
          <p className="text-white/40 text-sm mb-6">{won ? "Lightning reflexes!" : "AI was too fast this time"}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={startGame} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl">
              <RotateCcw className="w-4 h-4" /> Again
            </button>
            <button onClick={onClose} className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl">Back</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── IDLE ────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="min-h-screen bg-[#060a14] p-4 flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-white mb-2">⚡ Spit!</h1>
          <p className="text-white/50 mb-6 max-w-xs mx-auto">Play cards ±1 of pile top. First to empty hand wins! K wraps to A.</p>
          <button onClick={startGame} className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black rounded-xl text-lg">
            Start Game
          </button>
          <button onClick={onClose} className="block mx-auto mt-4 text-white/30 text-sm hover:text-white">← Back to Games</button>
        </div>
      </div>
    );
  }

  // ─── PLAYING ─────────────────────────────────────────────
  const p1Top = pile1[pile1.length - 1];
  const p2Top = pile2[pile2.length - 1];

  return (
    <div className="min-h-screen bg-[#060a14] p-3 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full blur-[100px] opacity-12 bg-cyan-500" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full blur-[100px] opacity-8 bg-blue-500" />
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={onClose} className="text-white/50 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">⚡ Spit!</h1>
          <span className="text-white/30 text-sm">{formatTime(timer)}</span>
        </div>

        {/* AI Section */}
        <div className="text-center mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/15">
          <p className="text-xs text-white/40 mb-1">AI ({aiHand.length} cards left)</p>
          <div className="flex justify-center gap-0.5">
            {Array.from({ length: Math.min(5, aiHand.length) }).map((_, i) => (
              <div key={i} className="w-8 h-12 rounded bg-gradient-to-br from-red-800 to-red-950 border border-red-600" />
            ))}
          </div>
        </div>

        {/* Piles */}
        <div className="flex justify-center gap-8 mb-3">
          <div className="text-center">
            <p className="text-[10px] text-white/30 mb-1">Pile 1 ({pile1.length})</p>
            {p1Top && <CardView card={p1Top} />}
          </div>
          <div className="text-center">
            <p className="text-[10px] text-white/30 mb-1">Pile 2 ({pile2.length})</p>
            {p2Top && <CardView card={p2Top} />}
          </div>
        </div>

        {/* Message */}
        <AnimatePresence>
          {lastPlay && (
            <motion.p key={lastPlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center text-xs text-white/50 mb-2">{lastPlay}</motion.p>
          )}
        </AnimatePresence>

        {/* Your Hand — tap card, then tap pile */}
        <div className="text-center mb-2">
          <p className="text-xs text-white/40 mb-1">Your Hand ({myHand.length} cards) — Tap card → Tap pile</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Play on Pile 1 */}
          <div>
            <p className="text-[10px] text-center text-white/20 mb-1">→ Pile 1</p>
            <div className="flex flex-wrap gap-1 justify-center">
              {myHand.slice(0, 5).map((card, i) => {
                const playable = p1Top && canPlay(card, p1Top);
                return (
                  <motion.div key={`p1-${i}`} whileTap={{ scale: 0.85 }}
                    onClick={() => playable && playCard(i, 0)}
                    className={`${playable ? "ring-2 ring-green-400 ring-offset-1 ring-offset-[#060a14] cursor-pointer" : "opacity-40"}`}>
                    <CardView card={card} small />
                  </motion.div>
                );
              })}
            </div>
          </div>
          {/* Play on Pile 2 */}
          <div>
            <p className="text-[10px] text-center text-white/20 mb-1">→ Pile 2</p>
            <div className="flex flex-wrap gap-1 justify-center">
              {myHand.slice(0, 5).map((card, i) => {
                const playable = p2Top && canPlay(card, p2Top);
                return (
                  <motion.div key={`p2-${i}`} whileTap={{ scale: 0.85 }}
                    onClick={() => playable && playCard(i, 1)}
                    className={`${playable ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-[#060a14] cursor-pointer" : "opacity-40"}`}>
                    <CardView card={card} small />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Remaining cards indicator */}
        <div className="flex justify-center gap-1">
          {Array.from({ length: Math.min(15, myHand.length - 5) }).map((_, i) => (
            <div key={i} className="w-1.5 h-3 rounded-sm bg-white/10" />
          ))}
          {myHand.length > 20 && <span className="text-white/20 text-[9px] ml-1">+{myHand.length - 20}</span>}
        </div>
      </div>
    </div>
  );
}
