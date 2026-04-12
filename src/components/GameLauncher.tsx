import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Users, User, QrCode, Keyboard } from "lucide-react";
import GameHosting, { JoinGame } from "@/components/GameHosting";
import { useNavigate } from "react-router-dom";

interface GameLauncherProps {
  gameType: string;
  gameName: string;
  gameEmoji: string;
  gradient: string;
  onStartSolo: () => void;
  onClose: () => void;
}

export default function GameLauncher({ gameType, gameName, gameEmoji, gradient, onStartSolo, onClose }: GameLauncherProps) {
  const [mode, setMode] = useState<"choose" | "host" | "join" | "join-code">("choose");
  const [joinCode, setJoinCode] = useState("");
  const navigate = useNavigate();

  if (mode === "host") {
    return <GameHosting gameType={gameType} gameName={gameName} onStart={onStartSolo} onClose={() => setMode("choose")} />;
  }

  if (mode === "join-code") {
    return (
      <div className="min-h-screen bg-[#060a14] p-4 flex items-center justify-center relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full blur-[100px] opacity-15 bg-purple-500" />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 max-w-md w-full p-8 rounded-2xl bg-[#0a0e1a]/90 border border-white/10 backdrop-blur-sm">
          <button onClick={() => setMode("choose")} className="flex items-center gap-2 text-white/50 hover:text-white mb-6">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{gameEmoji}</div>
            <h2 className="text-2xl font-black text-white">Join {gameName}</h2>
            <p className="text-white/40 text-sm mt-1">Enter the 6-character game code</p>
          </div>
          <input 
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
            placeholder="A7F2K9"
            className="w-full text-center text-3xl font-black tracking-[0.3em] px-4 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-yellow-500/50 mb-4"
            maxLength={6}
            autoFocus
          />
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => { if (joinCode.length === 6) onStartSolo(); }}
            disabled={joinCode.length < 6}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              joinCode.length === 6 
                ? "bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg shadow-green-500/20"
                : "bg-white/5 text-white/20"}`}>
            Join Game →
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Choose mode screen
  return (
    <div className="min-h-screen bg-[#060a14] p-4 flex items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full blur-[100px] opacity-15 bg-yellow-500" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full blur-[100px] opacity-10 bg-purple-500" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-md w-full">
        
        {/* Back */}
        <button onClick={onClose} className="flex items-center gap-2 text-white/50 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" /> Back to Games
        </button>

        {/* Game info with characters */}
        <div className="text-center mb-8">
          {/* Characters */}
          <div className="flex justify-center gap-4 mb-6 h-32">
            <motion.img 
              src="/game-characters/character-happy-tourist-1.png"
              alt="Player 1"
              className="h-full w-auto rounded-lg shadow-lg"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            />
            <motion.img 
              src="/game-characters/character-happy-tourist-2.png"
              alt="Player 2"
              className="h-full w-auto rounded-lg shadow-lg"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, delay: 0.2 }}
            />
          </div>
          
          {/* Game emoji */}
          <motion.div className="text-5xl mb-2" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
            {gameEmoji}
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-1">{gameName}</h1>
          <p className="text-white/40">Choose how to play</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Solo */}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onStartSolo}
            className="w-full p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all text-left flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-white text-lg">Play Solo</p>
              <p className="text-white/40 text-sm">Practice mode — just you</p>
            </div>
          </motion.button>

          {/* Host */}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setMode("host")}
            className="w-full p-5 rounded-2xl bg-gradient-to-r from-green-500/10 to-teal-500/10 border border-green-500/20 hover:border-green-500/40 transition-all text-left flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="font-bold text-white text-lg">Host Game</p>
              <p className="text-white/40 text-sm">Create room — share QR code with friends</p>
            </div>
          </motion.button>

          {/* Join */}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setMode("join-code")}
            className="w-full p-5 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-all text-left flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Keyboard className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="font-bold text-white text-lg">Join Game</p>
              <p className="text-white/40 text-sm">Enter a 6-character code to join a friend's game</p>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
