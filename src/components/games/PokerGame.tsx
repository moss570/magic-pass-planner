/**
 * Poker Night — Texas Hold'em
 * Full solo game loop with AI opponents
 * Multiplayer via Colyseus when connected
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, BarChart3, RotateCcw, Eye } from "lucide-react";
import ConfettiEffect from "@/components/ConfettiEffect";

const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"] as const;
const SUIT_DISPLAY: Record<string, { symbol: string; color: string }> = {
  hearts: { symbol: "♥", color: "#FF4444" },
  diamonds: { symbol: "♦", color: "#FF4444" },
  clubs: { symbol: "♣", color: "#DDDDDD" },
  spades: { symbol: "♠", color: "#DDDDDD" },
};

const RANK_VALUE: Record<string, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
  "9": 9, "10": 10, J: 11, Q: 12, K: 13, A: 14,
};

interface Card { suit: string; rank: string; }
interface AIPlayer { name: string; chips: number; hand: Card[]; folded: boolean; bet: number; personality: string; }

const AI_NAMES = ["Lucky Lou", "Bluffin' Betty", "Cool Cal", "Risk-it Rita", "Steady Steve"];
const AI_PERSONALITIES = ["aggressive", "conservative", "bluffer", "tight", "wild"];

interface Props {
  onClose: () => void;
  difficulty?: "beginner" | "challenging";
  playerName?: string;
}

export default function PokerGame({ onClose, difficulty = "beginner", playerName = "You" }: Props) {
  const [chips, setChips] = useState(1000);
  const [aiPlayers, setAiPlayers] = useState<AIPlayer[]>([]);
  const [myHand, setMyHand] = useState<Card[]>([]);
  const [community, setCommunity] = useState<Card[]>([]);
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [myBet, setMyBet] = useState(0);
  const [phase, setPhase] = useState<"idle" | "preflop" | "flop" | "turn" | "river" | "showdown" | "finished">("idle");
  const [message, setMessage] = useState("");
  const [handResult, setHandResult] = useState<{ winner: string; hand: string; pot: number } | null>(null);
  const [handsPlayed, setHandsPlayed] = useState(0);
  const [handsWon, setHandsWon] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [bluffStats, setBluffStats] = useState<{ name: string; folds: number; calls: number; raises: number }[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [revealAI, setRevealAI] = useState(false);

  // ─── Deck ────────────────────────────────────────────────
  const createDeck = (): Card[] => {
    const deck: Card[] = [];
    for (const suit of SUITS) for (const rank of RANKS) deck.push({ suit, rank });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };

  // ─── Hand Evaluation (simplified) ────────────────────────
  const evaluateHand = (cards: Card[]): { score: number; name: string } => {
    const vals = cards.map(c => RANK_VALUE[c.rank]).sort((a, b) => b - a);
    const suits = cards.map(c => c.suit);

    const counts = new Map<number, number>();
    vals.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
    const groups = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || b[0] - a[0]);

    // Flush check
    const suitCounts = new Map<string, number>();
    suits.forEach(s => suitCounts.set(s, (suitCounts.get(s) || 0) + 1));
    const hasFlush = Array.from(suitCounts.values()).some(c => c >= 5);

    // Straight check
    const unique = [...new Set(vals)].sort((a, b) => a - b);
    let hasStraight = false;
    for (let i = 0; i <= unique.length - 5; i++) {
      if (unique[i + 4] - unique[i] === 4) hasStraight = true;
    }

    if (hasFlush && hasStraight) return { score: 800 + vals[0], name: "Straight Flush 🔥" };
    if (groups[0][1] === 4) return { score: 700 + groups[0][0], name: "Four of a Kind 💪" };
    if (groups[0][1] === 3 && groups[1]?.[1] >= 2) return { score: 600 + groups[0][0], name: "Full House 🏠" };
    if (hasFlush) return { score: 500 + vals[0], name: "Flush ♠️" };
    if (hasStraight) return { score: 400 + vals[0], name: "Straight ➡️" };
    if (groups[0][1] === 3) return { score: 300 + groups[0][0], name: "Three of a Kind 🎯" };
    if (groups[0][1] === 2 && groups[1]?.[1] === 2) return { score: 200 + groups[0][0], name: "Two Pair ✌️" };
    if (groups[0][1] === 2) return { score: 100 + groups[0][0], name: "One Pair 👫" };
    return { score: vals[0], name: "High Card 🃏" };
  };

  // ─── Deal New Hand ───────────────────────────────────────
  const dealHand = useCallback(() => {
    const deck = createDeck();
    let idx = 0;

    // Create AI opponents (2-4 based on difficulty)
    const aiCount = difficulty === "beginner" ? 2 : 4;
    const newAI: AIPlayer[] = [];
    for (let i = 0; i < aiCount; i++) {
      newAI.push({
        name: AI_NAMES[i],
        chips: 1000,
        hand: [deck[idx++], deck[idx++]],
        folded: false,
        bet: 0,
        personality: AI_PERSONALITIES[i],
      });
    }

    // Player cards
    const playerCards = [deck[idx++], deck[idx++]];

    // Community cards (pre-deal all 5, reveal progressively)
    const communityAll = [deck[idx++], deck[idx++], deck[idx++], deck[idx++], deck[idx++]];

    setAiPlayers(newAI);
    setMyHand(playerCards);
    setCommunity(communityAll);
    setPot(30); // blinds
    setCurrentBet(20);
    setMyBet(0);
    setPhase("preflop");
    setHandResult(null);
    setRevealAI(false);
    setMessage("Your turn! Check, Call, Raise, or Fold.");
    setHandsPlayed(h => h + 1);
  }, [difficulty]);

  // ─── AI Decision ─────────────────────────────────────────
  const aiDecide = (ai: AIPlayer, _communityVisible: Card[]): "fold" | "call" | "raise" => {
    const roll = Math.random();
    if (ai.personality === "aggressive") return roll < 0.3 ? "raise" : "call";
    if (ai.personality === "conservative") return roll < 0.4 ? "fold" : "call";
    if (ai.personality === "bluffer") return roll < 0.5 ? "raise" : roll < 0.8 ? "call" : "fold";
    if (ai.personality === "tight") return roll < 0.5 ? "fold" : "call";
    return roll < 0.3 ? "raise" : roll < 0.6 ? "call" : "fold"; // wild
  };

  // ─── Process AI Actions ──────────────────────────────────
  const processAI = (nextPhase: string, communityCount: number) => {
    const visible = community.slice(0, communityCount);
    const updated = aiPlayers.map(ai => {
      if (ai.folded) return ai;
      const decision = aiDecide(ai, visible);

      // Update bluff stats
      setBluffStats(prev => {
        const existing = prev.find(s => s.name === ai.name);
        if (existing) {
          return prev.map(s => s.name === ai.name ? {
            ...s,
            folds: s.folds + (decision === "fold" ? 1 : 0),
            calls: s.calls + (decision === "call" ? 1 : 0),
            raises: s.raises + (decision === "raise" ? 1 : 0),
          } : s);
        }
        return [...prev, { name: ai.name, folds: decision === "fold" ? 1 : 0, calls: decision === "call" ? 1 : 0, raises: decision === "raise" ? 1 : 0 }];
      });

      if (decision === "fold") return { ...ai, folded: true };
      if (decision === "raise") {
        const raiseAmt = 20;
        setPot(p => p + currentBet + raiseAmt);
        return { ...ai, bet: ai.bet + currentBet + raiseAmt };
      }
      setPot(p => p + currentBet);
      return { ...ai, bet: ai.bet + currentBet };
    });
    setAiPlayers(updated);
    setPhase(nextPhase as any);
  };

  // ─── Player Actions ──────────────────────────────────────
  const playerAction = (action: "fold" | "call" | "raise" | "check" | "allin") => {
    if (action === "fold") {
      setMessage("You folded. 😔");
      setPhase("showdown");
      // AI wins the pot
      const activeAI = aiPlayers.find(a => !a.folded);
      setHandResult({ winner: activeAI?.name || "AI", hand: "You folded!", pot });
      return;
    }

    let addToPot = 0;
    if (action === "call") { addToPot = currentBet; }
    if (action === "raise") { addToPot = currentBet * 2; setCurrentBet(currentBet * 2); }
    if (action === "allin") { addToPot = chips; }
    if (action === "check") { addToPot = 0; }

    const actualBet = Math.min(addToPot, chips);
    setChips(c => c - actualBet);
    setMyBet(b => b + actualBet);
    setPot(p => p + actualBet);

    // Advance phase
    if (phase === "preflop") {
      setMessage("Flop dealt! 3 community cards revealed.");
      processAI("flop", 3);
    } else if (phase === "flop") {
      setMessage("Turn dealt! 4th community card revealed.");
      processAI("turn", 4);
    } else if (phase === "turn") {
      setMessage("River dealt! Final community card revealed.");
      processAI("river", 5);
    } else if (phase === "river") {
      // Showdown!
      doShowdown();
    }
  };

  // ─── Showdown ────────────────────────────────────────────
  const doShowdown = () => {
    setPhase("showdown");
    setRevealAI(true);

    // Evaluate all hands
    const playerEval = evaluateHand([...myHand, ...community]);
    let bestScore = playerEval.score;
    let bestName = playerName;
    let bestHand = playerEval.name;

    aiPlayers.forEach(ai => {
      if (ai.folded) return;
      const eval_ = evaluateHand([...ai.hand, ...community]);
      if (eval_.score > bestScore) {
        bestScore = eval_.score;
        bestName = ai.name;
        bestHand = eval_.name;
      }
    });

    const playerWon = bestName === playerName;
    if (playerWon) {
      setChips(c => c + pot);
      setHandsWon(w => w + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    setHandResult({ winner: bestName, hand: bestHand, pot });
    setMessage(playerWon ? `You win with ${bestHand}! +$${pot} 🎉` : `${bestName} wins with ${bestHand}`);
  };

  // ─── Card Component ──────────────────────────────────────
  const CardDisplay = ({ card, hidden = false, delay = 0 }: { card: Card; hidden?: boolean; delay?: number }) => {
    const { symbol, color } = SUIT_DISPLAY[card.suit] || { symbol: "?", color: "#888" };
    return (
      <motion.div
        initial={{ opacity: 0, rotateY: 180, y: 10 }}
        animate={{ opacity: 1, rotateY: hidden ? 180 : 0, y: 0 }}
        transition={{ delay, duration: 0.4, type: "spring" }}
        className={`w-14 h-20 rounded-xl flex flex-col items-center justify-center font-bold shadow-lg ${
          hidden ? "bg-gradient-to-br from-indigo-800 to-indigo-950 border border-indigo-600" :
          "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
        }`}
      >
        {!hidden && (
          <>
            <span className="text-xs font-black leading-none" style={{ color }}>{card.rank}</span>
            <span className="text-lg leading-none" style={{ color }}>{symbol}</span>
          </>
        )}
        {hidden && <span className="text-lg">🂠</span>}
      </motion.div>
    );
  };

  // ─── Visible Community Cards (based on phase) ────────────
  const visibleCount = phase === "preflop" ? 0 : phase === "flop" ? 3 : phase === "turn" ? 4 : 5;

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060a14] p-3 relative overflow-hidden">
      <ConfettiEffect trigger={showConfetti} />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full blur-[100px] opacity-12 bg-green-600" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full blur-[100px] opacity-8 bg-red-500" />
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={onClose} className="text-white/50 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-400">🃏 Poker Night</h1>
          <button onClick={() => setShowStats(true)} className="text-white/30 hover:text-white"><BarChart3 className="w-5 h-5" /></button>
        </div>

        {/* Chips & Pot */}
        <div className="flex justify-between items-center mb-3 p-2.5 rounded-xl bg-green-900/20 border border-green-500/15">
          <div><p className="text-[10px] text-white/30">Chips</p><p className="text-lg font-black text-yellow-400">💰 {chips}</p></div>
          <div className="text-center"><p className="text-[10px] text-white/30">Pot</p><p className="text-2xl font-black text-green-400">${pot}</p></div>
          <div className="text-right"><p className="text-[10px] text-white/30">Wins</p><p className="text-lg font-bold text-white/50">{handsWon}/{handsPlayed}</p></div>
        </div>

        {/* AI Players */}
        <div className="flex justify-center gap-2 mb-3">
          {aiPlayers.map((ai, i) => (
            <div key={ai.name} className={`flex-1 p-2 rounded-lg text-center ${ai.folded ? "bg-red-500/10 border border-red-500/20" : "bg-white/5 border border-white/10"}`}>
              <p className="text-[10px] font-bold text-white/60 truncate">{ai.name}</p>
              <div className="flex justify-center gap-1 my-1">
                {ai.hand.map((card, ci) => (
                  <CardDisplay key={ci} card={card} hidden={!revealAI} delay={ci * 0.1} />
                ))}
              </div>
              <p className="text-[9px] text-white/30">{ai.folded ? "FOLDED" : `$${ai.chips}`}</p>
            </div>
          ))}
        </div>

        {/* Community Cards */}
        <div className="flex justify-center gap-2 mb-3 min-h-[88px]">
          {community.slice(0, 5).map((card, i) => (
            <CardDisplay key={i} card={card} hidden={i >= visibleCount} delay={i * 0.12} />
          ))}
        </div>

        {/* Message */}
        <motion.p key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center text-sm text-white/60 mb-3 min-h-[20px]">{message}</motion.p>

        {/* Hand Result */}
        <AnimatePresence>
          {handResult && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className={`text-center p-4 rounded-xl mb-3 ${
                handResult.winner === playerName ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-red-500/10 border border-red-500/20"
              }`}>
              <p className="text-lg font-black text-white">{handResult.winner === playerName ? "🎉 You Win!" : `${handResult.winner} Wins`}</p>
              <p className="text-sm text-yellow-400 font-bold">{handResult.hand}</p>
              <p className="text-xs text-white/40">Pot: ${handResult.pot}</p>
              <button onClick={dealHand} className="mt-3 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-black font-bold rounded-lg text-sm">
                <RotateCcw className="w-3 h-3 inline mr-1" /> Deal Next Hand
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* My Hand */}
        <div className="flex justify-center gap-3 mb-4">
          {myHand.map((card, i) => (
            <div key={i} className="relative">
              <CardDisplay card={card} delay={i * 0.2} />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        {phase !== "idle" && phase !== "showdown" && !handResult && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => playerAction("fold")}
                className="py-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 font-bold text-sm">Fold</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => playerAction("call")}
                className="py-3 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400 font-bold text-sm">Call ${currentBet}</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => playerAction("raise")}
                className="py-3 rounded-xl bg-green-500/15 border border-green-500/25 text-green-400 font-bold text-sm">Raise ${currentBet * 2}</motion.button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => playerAction("check")}
                className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 font-bold text-sm">Check</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => playerAction("allin")}
                className="py-2.5 rounded-xl bg-gradient-to-r from-yellow-500/15 to-orange-500/15 border border-yellow-500/25 text-yellow-400 font-bold text-sm">🔥 ALL IN</motion.button>
            </div>
          </div>
        )}

        {/* Start Button (if idle) */}
        {phase === "idle" && (
          <div className="text-center mt-6">
            <button onClick={dealHand}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-black font-black rounded-xl text-lg shadow-lg shadow-green-500/20">
              🃏 Deal Cards
            </button>
            <p className="text-white/30 text-xs mt-2">{difficulty === "beginner" ? "2 AI opponents" : "4 AI opponents"}</p>
          </div>
        )}

        {/* Bluff Stats Modal */}
        <AnimatePresence>
          {showStats && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setShowStats(false)}>
              <div className="bg-[#0a0e1a] border border-white/20 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-black text-white mb-4">🎭 Bluff-O-Meter</h3>
                {bluffStats.length === 0 ? (
                  <p className="text-white/40 text-sm">Play a few hands to see stats!</p>
                ) : bluffStats.map((s, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-white/5 mb-2">
                    <span className="text-white text-sm">{s.name}</span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-red-400">F:{s.folds}</span>
                      <span className="text-blue-400">C:{s.calls}</span>
                      <span className="text-green-400">R:{s.raises}</span>
                    </div>
                  </div>
                ))}
                <button onClick={() => setShowStats(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg text-white/60 text-sm">Close</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
