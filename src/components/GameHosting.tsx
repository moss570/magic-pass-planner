import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import { Copy, Check, Users, Share2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

interface GameHostingProps {
  gameType: string;
  gameName: string;
  onStart: () => void;
  onClose: () => void;
}

export default function GameHosting({ gameType, gameName, onStart, onClose }: GameHostingProps) {
  const { user } = useAuth();
  const [joinCode] = useState(generateJoinCode);
  const [copied, setCopied] = useState(false);
  const [players, setPlayers] = useState(1);
  const [hostId, setHostId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const joinUrl = `https://magicpassplus.com/games?join=${joinCode}`;

  // Create game host record in DB
  useEffect(() => {
    if (!user) return;
    const createHost = async () => {
      const { data } = await (supabase.from as any)("game_hosts").insert({
        user_id: user.id,
        game_type: gameType,
        game_title: gameName,
        join_code: joinCode,
        status: "pending",
        host_nickname: nickname || "Host",
        max_players: 10,
        current_players: 1,
      }).select("id").single();
      if (data) setHostId((data as any).id);
    };
    createHost();
  }, [user, gameType, gameName, joinCode, nickname]);

  const copyCode = () => {
    navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareGame = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Join my ${gameName} game!`,
        text: `Join code: ${joinCode}`,
        url: joinUrl,
      });
    } else {
      navigator.clipboard.writeText(`Join my ${gameName} game! Code: ${joinCode}\n${joinUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070b15] via-[#0c1225] to-[#070b15] p-4">
      <div className="max-w-md mx-auto">
        <button onClick={onClose} className="flex items-center gap-2 text-white/60 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Host: {gameName}</h1>
          <p className="text-white/60">Share the code or QR to invite players</p>
        </motion.div>

        {/* QR Code */}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 mx-auto w-fit mb-6">
          <QRCode value={joinUrl} size={200} level="H" />
        </motion.div>

        {/* Join Code */}
        <div className="text-center mb-6">
          <p className="text-sm text-white/40 mb-2">JOIN CODE</p>
          <div className="flex items-center justify-center gap-3">
            <p className="text-4xl font-black text-yellow-400 tracking-widest">{joinCode}</p>
            <button onClick={copyCode} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-white/60" />}
            </button>
          </div>
        </div>

        {/* Player Count */}
        <div className="flex items-center justify-center gap-2 mb-6 text-white/60">
          <Users className="w-5 h-5" />
          <span>{players} player{players > 1 ? "s" : ""} joined</span>
        </div>

        {/* Share Button */}
        <motion.button whileTap={{ scale: 0.95 }} onClick={shareGame}
          className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl flex items-center justify-center gap-2 mb-4 border border-white/10">
          <Share2 className="w-5 h-5" /> Share Game Link
        </motion.button>

        {/* Start Game */}
        <motion.button whileTap={{ scale: 0.95 }} onClick={onStart}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-500/20">
          🎮 Start Game
        </motion.button>

        <p className="text-center text-xs text-white/30 mt-4">Max 10 players • Game starts when host clicks Start</p>
      </div>
    </div>
  );
}

// Join Game Component
export function JoinGame({ joinCode, onJoined, onClose }: { joinCode: string; onJoined: () => void; onClose: () => void }) {
  const { user } = useAuth();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  const join = async () => {
    if (!nickname.trim()) { setError("Enter a nickname"); return; }
    setJoining(true);

    const { data: host } = await (supabase.from as any)("game_hosts")
      .select("id, game_type, game_title, current_players, max_players")
      .eq("join_code", joinCode.toUpperCase())
      .single();

    if (!host) { setError("Game not found. Check code."); setJoining(false); return; }
    if ((host as any).current_players >= (host as any).max_players) { setError("Game is full!"); setJoining(false); return; }

    await (supabase.from as any)("game_players").insert({
      game_host_id: (host as any).id,
      user_id: user?.id || null,
      player_nickname: nickname.trim(),
      is_host: false,
    });

    await (supabase.from as any)("game_hosts").update({ current_players: (host as any).current_players + 1 }).eq("id", (host as any).id);

    onJoined();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070b15] via-[#0c1225] to-[#070b15] p-4 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-6 rounded-2xl bg-card border border-primary/20">
        <h1 className="text-2xl font-bold text-white text-center mb-2">Join Game</h1>
        <p className="text-white/60 text-center mb-6">Code: <span className="text-yellow-400 font-bold">{joinCode}</span></p>

        <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Your nickname"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/30 mb-4" />

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <motion.button whileTap={{ scale: 0.95 }} onClick={join} disabled={joining}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-lg disabled:opacity-50">
          {joining ? "Joining..." : "Join Game 🎮"}
        </motion.button>

        <button onClick={onClose} className="w-full mt-3 py-2 text-white/40 hover:text-white text-sm">Cancel</button>
      </motion.div>
    </div>
  );
}
