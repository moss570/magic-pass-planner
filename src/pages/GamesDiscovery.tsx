import { useState } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Users, Trophy, Clock, Zap, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import GameCard from "@/components/GameCard";

const games = [
  {
    id: "trivia", name: "Trivia", emoji: "🎓",
    description: "Test your knowledge across multiple categories",
    players: "2-10", time: "15 min",
    gradient: "bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500",
    glowColor: "#FF6B6B",
    imageUrl: "/game-cards/trivia.png",
    path: "/ride-line-quest?game=trivia",
  },
  {
    id: "bingo", name: "Bingo", emoji: "🎲",
    description: "Classic 5×5 cards with 4 rounds of patterns",
    players: "2-10", time: "20 min",
    gradient: "bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500",
    glowColor: "#06D6A0",
    imageUrl: "/game-cards/bingo.png",
    path: "/ride-line-quest?game=bingo",
  },
  {
    id: "who-did-it", name: "Who Did It?", emoji: "🕵️",
    description: "Gather clues and solve the mystery",
    players: "2-10", time: "15 min",
    gradient: "bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500",
    glowColor: "#9D84B7",
    imageUrl: "/game-cards/who-did-it.png",
    path: "/ride-line-quest?game=who-did-it",
  },
  {
    id: "would-you-rather", name: "Would You Rather", emoji: "🤔",
    description: "Make impossible choices. Dare to be different!",
    players: "2-10", time: "10 min",
    gradient: "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500",
    glowColor: "#4361EE",
    imageUrl: "/game-cards/would-you-rather.png",
    path: "/ride-line-quest?game=would-you-rather",
  },
  {
    id: "picture-perfect", name: "Picture Perfect", emoji: "🎨",
    description: "Draw fast, guess faster. Can your friends read your art?",
    players: "2-10", time: "15 min",
    gradient: "bg-gradient-to-br from-pink-500 via-rose-500 to-red-500",
    glowColor: "#FF006E",
    imageUrl: "/game-cards/picture-perfect.png",
    path: "/ride-line-quest?game=picture-perfect",
  },
  {
    id: "song-lyric", name: "Song Lyric", emoji: "🎵",
    description: "Fill in the missing lyrics from iconic songs",
    players: "2-10", time: "12 min",
    gradient: "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500",
    glowColor: "#FB8500",
    imageUrl: "/game-cards/song-lyric.png",
    path: "/ride-line-quest?game=song-lyric",
  },
  {
    id: "geography", name: "Geography", emoji: "🌍",
    description: "Capitals, landmarks, flags — how well do you know Earth?",
    players: "1-10", time: "10 min",
    gradient: "bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500",
    glowColor: "#2D6A4F",
    imageUrl: "/game-cards/geography.png",
    path: "/ride-line-quest?game=geography",
  },
  {
    id: "spy-word", name: "Spy Word", emoji: "🕵️‍♂️",
    description: "Find the hidden spy words before the assassin gets you",
    players: "4-10", time: "15 min",
    gradient: "bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600",
    glowColor: "#00B4DB",
    imageUrl: "/game-cards/spy-word.png",
    path: "/ride-line-quest?game=spy-word",
  },
  {
    id: "haaaa", name: "HAAAA!", emoji: "😂",
    description: "Bluff your way to victory. Fake answers, real laughs!",
    players: "2-10", time: "12 min",
    gradient: "bg-gradient-to-br from-teal-400 via-green-500 to-emerald-500",
    glowColor: "#06D6A0",
    imageUrl: "/game-cards/haaaa.png",
    path: "/ride-line-quest?game=haaaa",
  },
  {
    id: "line-mind", name: "Line Mind", emoji: "🧠",
    description: "Hold phone to forehead — friends give clues, you guess!",
    players: "2-10", time: "10 min",
    gradient: "bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500",
    glowColor: "#7C3AED",
    path: "/ride-line-quest?game=line-mind",
  },
  {
    id: "mystery-case", name: "Mystery Case", emoji: "🔍",
    description: "An all-day mystery that unfolds clue by clue. Pause anytime!",
    players: "1", time: "All day",
    gradient: "bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600",
    glowColor: "#F59E0B",
    imageUrl: "/game-cards/mystery-case.png",
    path: "/ride-line-quest?game=mystery-case",
  },
];

const GamesDiscovery = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "hard" | "expert">("easy");

  return (
    <div className="min-h-screen bg-[#060a14] p-4 md:p-8 overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-10 bg-purple-500" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-10 bg-teal-500" />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 rounded-full blur-[100px] opacity-5 bg-yellow-500" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Back to Dashboard */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-6">
          <button onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
            <Home className="w-4 h-4" />
            <span className="text-sm font-semibold">Dashboard</span>
          </button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 text-center"
        >
          <motion.div 
            className="inline-flex items-center gap-3 mb-4"
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <Gamepad2 className="w-10 h-10 text-yellow-400" />
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500">
              GAMES
            </h1>
            <Zap className="w-8 h-8 text-yellow-400" />
          </motion.div>
          <p className="text-lg text-white/40 max-w-xl mx-auto">
            11 games to play solo or with up to 10 friends. Compete globally!
          </p>
        </motion.div>

        {/* Difficulty Selector */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex justify-center gap-2 mb-10">
          {(["easy", "hard", "expert"] as const).map((level, i) => (
            <motion.button key={level}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDifficulty(level)}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all ${
                difficulty === level
                  ? level === "easy" ? "bg-gradient-to-r from-green-400 to-emerald-500 text-black shadow-lg shadow-green-500/20"
                    : level === "hard" ? "bg-gradient-to-r from-orange-400 to-red-500 text-black shadow-lg shadow-orange-500/20"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20"
                  : "bg-white/5 text-white/40 hover:bg-white/10 border border-white/10"}`}>
              {level === "easy" ? "⚡ EASY" : level === "hard" ? "🔥 HARD" : "💀 EXPERT"}
            </motion.button>
          ))}
        </motion.div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {games.map((game, idx) => (
            <GameCard
              key={game.id}
              emoji={game.emoji}
              name={game.name}
              description={game.description}
              players={game.players}
              time={game.time}
              gradient={game.gradient}
              glowColor={game.glowColor}
              onClick={() => session ? navigate(game.path) : navigate("/signup")}
              delay={idx * 0.06}
            />
          ))}
        </div>

        {/* Leaderboard CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mt-14 text-center">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/leaderboards")}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg
              bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 
              text-yellow-400 hover:border-yellow-500/40 transition-all">
            <Trophy className="w-6 h-6" />
            View Global Leaderboards
            <Trophy className="w-6 h-6" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default GamesDiscovery;
