/**
 * Poker Night — Texas Hold'em
 * 2-10 players via Colyseus
 * Daily chip limits, shame photos, bluff stats
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Users, Camera, BarChart3 } from "lucide-react";
import * as Colyseus from "colyseus.js";
import { GAME_SERVER_URL } from "@/lib/gameServer";

const SUIT_SYMBOLS: Record<string, string> = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" };
const SUIT_COLORS: Record<string, string> = { hearts: "#FF6B6B", diamonds: "#FF6B6B", clubs: "#E0E0E0", spades: "#E0E0E0" };

interface CardData { suit: string; rank: string; }

interface Props {
  onClose: () => void;
  difficulty?: "beginner" | "challenging";
  playerName?: string;
  roomId?: string;
  isHost?: boolean;
}

export default function PokerGame({ onClose, difficulty = "beginner", playerName = "Player", roomId, isHost }: Props) {
  const [phase, setPhase] = useState<string>("waiting");
  const [myCards, setMyCards] = useState<CardData[]>([]);
  const [communityCards, setCommunityCards] = useState<CardData[]>([]);
  const [chips, setChips] = useState(1000);
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [players, setPlayers] = useState<{ id: string; name: string; chips: number; folded: boolean; bet: number }[]>([]);
  const [lastAction, setLastAction] = useState("");
  const [winner, setWinner] = useState<{ name: string; hand: string; pot: number } | null>(null);
  const [bluffStats, setBluffStats] = useState<any[]>([]);
  const [showBluffStats, setShowBluffStats] = useState(false);
  const [showShameFrame, setShowShameFrame] = useState<{ name: string; message: string } | null>(null);
  const [connected, setConnected] = useState(false);
  const roomRef = useRef<Colyseus.Room | null>(null);

  useEffect(() => {
    const connect = async () => {
      try {
        const client = new Colyseus.Client(GAME_SERVER_URL);
        let room: Colyseus.Room;

        if (roomId) {
          room = await client.joinById(roomId, { name: playerName, difficulty });
        } else if (isHost) {
          room = await client.create("poker", { name: playerName, difficulty });
        } else {
          // Solo mode with AI opponents — use local state
          setPhase("playing");
          generateSoloHand();
          return;
        }

        roomRef.current = room;
        setConnected(true);

        room.onMessage("your_cards", (data) => setMyCards(data.cards));
        room.onMessage("community_cards", (data) => setCommunityCards(data.cards));
        room.onMessage("hand_started", () => { setPhase("playing"); setWinner(null); });
        room.onMessage("player_called", (data) => setLastAction(`${data.name} called $${data.amount}`));
        room.onMessage("player_raised", (data) => setLastAction(`${data.name} raised $${data.amount}`));
        room.onMessage("player_folded", (data) => setLastAction(`${data.name} folded 😤`));
        room.onMessage("player_all_in", (data) => setLastAction(`${data.name} went ALL IN! 🔥`));
        room.onMessage("player_checked", (data) => setLastAction(`${data.name} checked`));
        room.onMessage("showdown_result", (data) => setWinner({ name: data.winnerName, hand: data.handRanking, pot: data.pot }));
        room.onMessage("hand_won_by_fold", (data) => setWinner({ name: data.winnerName, hand: "Everyone folded!", pot: data.pot }));
        room.onMessage("bluff_stats", (data) => { setBluffStats(data.stats); setShowBluffStats(true); });
        room.onMessage("shame_frame", (data) => { setShowShameFrame({ name: data.playerName, message: data.message }); setTimeout(() => setShowShameFrame(null), 5000); });

      } catch (err) {
        console.error("Poker connection error:", err);
        setPhase("playing");
        generateSoloHand();
      }
    };

    connect();
    return () => { roomRef.current?.leave(); };
  }, [roomId, isHost, playerName, difficulty]);

  const generateSoloHand = () => {
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const deck = suits.flatMap(s => ranks.map(r => ({ suit: s, rank: r })));
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    setMyCards([deck[0], deck[1]]);
    setCommunityCards([deck[2], deck[3], deck[4], deck[5], deck[6]]);
    setPot(60);
    setCurrentBet(20);
  };

  const sendAction = (action: string, data?: any) => {
    if (roomRef.current) roomRef.current.send(action, data);
  };

  const renderCard = (card: CardData, i: number, faceDown = false) => (
    <motion.div
      key={`${card.suit}-${card.rank}-${i}`}
      initial={{ opacity: 0, y: 20, rotateY: 180 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ delay: i * 0.15, duration: 0.4 }}
      className={`w-16 h-24 rounded-xl flex flex-col items-center justify-center font-bold shadow-xl ${
        faceDown ? "bg-gradient-to-br from-blue-800 to-blue-900 border-2 border-blue-600"
          : "bg-gradient-to-br from-white to-gray-100 border-2 border-gray-300"
      }`}
    >
      {!faceDown && (
        <>
          <span className="text-lg" style={{ color: SUIT_COLORS[card.suit] }}>{card.rank}</span>
          <span className="text-2xl" style={{ color: SUIT_COLORS[card.suit] }}>{SUIT_SYMBOLS[card.suit]}</span>
        </>
      )}
      {faceDown && <span className="text-2xl">🂠</span>}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#060a14] p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full blur-[100px] opacity-15 bg-green-600" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full blur-[100px] opacity-10 bg-red-500" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="text-white/60 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-400">🃏 Poker Night</h1>
          <button onClick={() => sendAction("get_bluff_stats")} className="text-white/40 hover:text-white"><BarChart3 className="w-5 h-5" /></button>
        </div>

        {/* Chips & Pot */}
        <div className="flex justify-between items-center mb-4 p-3 rounded-xl bg-green-900/30 border border-green-500/20">
          <div><p className="text-xs text-white/40">Your Chips</p><p className="text-xl font-black text-yellow-400">💰 {chips}</p></div>
          <div className="text-center"><p className="text-xs text-white/40">Pot</p><p className="text-2xl font-black text-green-400">${pot}</p></div>
          <div className="text-right"><p className="text-xs text-white/40">Bet</p><p className="text-lg font-bold text-white/70">${currentBet}</p></div>
        </div>

        {/* Community Cards */}
        <div className="flex justify-center gap-2 mb-6">
          {communityCards.map((card, i) => renderCard(card, i))}
          {Array.from({ length: Math.max(0, 5 - communityCards.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="w-16 h-24 rounded-xl border-2 border-dashed border-white/10" />
          ))}
        </div>

        {/* Last Action */}
        <AnimatePresence>
          {lastAction && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center text-white/50 text-sm mb-4 italic">{lastAction}</motion.p>
          )}
        </AnimatePresence>

        {/* Winner Announcement */}
        <AnimatePresence>
          {winner && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-4">
              <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
              <p className="text-xl font-black text-white">{winner.name} wins!</p>
              <p className="text-yellow-400 font-bold">{winner.hand} — ${winner.pot}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* My Cards */}
        <div className="flex justify-center gap-3 mb-6">
          {myCards.map((card, i) => renderCard(card, i))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => sendAction("fold")}
            className="py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-sm">
            Fold
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => sendAction("call")}
            className="py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-sm">
            Call
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => sendAction("raise", { amount: currentBet * 2 })}
            className="py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-bold text-sm">
            Raise 2×
          </motion.button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => sendAction("check")}
            className="py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm">
            Check
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => sendAction("all_in")}
            className="py-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 font-bold text-sm">
            🔥 ALL IN
          </motion.button>
        </div>

        {/* Shame Frame */}
        <AnimatePresence>
          {showShameFrame && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="bg-gradient-to-br from-red-900/90 to-orange-900/90 border-4 border-yellow-500 rounded-2xl p-8 max-w-sm text-center">
                <p className="text-4xl mb-4">😂🎰</p>
                <p className="text-xl font-black text-white mb-2">{showShameFrame.name}</p>
                <p className="text-white/70">{showShameFrame.message}</p>
                <Camera className="w-8 h-8 text-yellow-400 mx-auto mt-4" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bluff Stats Modal */}
        <AnimatePresence>
          {showBluffStats && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setShowBluffStats(false)}>
              <div className="bg-[#0a0e1a] border border-white/20 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-black text-white mb-4">🎭 Bluff-O-Meter</h3>
                {bluffStats.map((s, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-white/5 mb-2">
                    <span className="text-white text-sm">{s.name}</span>
                    <span className="text-yellow-400 text-sm font-bold">Fold Rate: {s.ratio}</span>
                  </div>
                ))}
                <button onClick={() => setShowBluffStats(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg text-white/60 text-sm">Close</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
