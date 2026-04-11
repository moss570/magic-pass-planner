import { useState } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Users, Trophy, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const games = [
  {
    id: "trivia",
    name: "Trivia",
    emoji: "🎓",
    description: "Test your knowledge",
    players: "2-10",
    time: "15 min",
    color: "from-red-500 to-orange-500",
    path: "/trivia",
  },
  {
    id: "bingo",
    name: "Bingo",
    emoji: "🎲",
    description: "Classic 5x5 cards with patterns",
    players: "2-10",
    time: "20 min",
    color: "from-green-500 to-teal-500",
    path: "/bingo",
  },
  {
    id: "who-did-it",
    name: "Who Did It?",
    emoji: "🕵️",
    description: "Solve the mystery",
    players: "2-10",
    time: "15 min",
    color: "from-purple-500 to-pink-500",
    path: "/who-did-it",
  },
  {
    id: "would-you-rather",
    name: "Would You Rather",
    emoji: "🤔",
    description: "Quick-fire choices",
    players: "2-10",
    time: "10 min",
    color: "from-blue-500 to-cyan-500",
    path: "/would-you-rather",
  },
  {
    id: "picture-perfect",
    name: "Picture Perfect",
    emoji: "🎨",
    description: "Draw & guess",
    players: "2-10",
    time: "15 min",
    color: "from-pink-500 to-rose-500",
    path: "/picture-perfect",
  },
  {
    id: "song-lyric",
    name: "Song Lyric",
    emoji: "🎵",
    description: "Fill in the lyrics",
    players: "2-10",
    time: "12 min",
    color: "from-yellow-500 to-orange-500",
    path: "/song-lyric",
  },
  {
    id: "geography",
    name: "Geography",
    emoji: "🌍",
    description: "Landmarks & capitals",
    players: "1-10",
    time: "10 min",
    color: "from-green-600 to-blue-600",
    path: "/geography",
  },
  {
    id: "spy-word",
    name: "Spy Word",
    emoji: "🕵️",
    description: "Codenames-style",
    players: "4-10",
    time: "15 min",
    color: "from-indigo-500 to-purple-500",
    path: "/spy-word",
  },
  {
    id: "haaaa",
    name: "HAAAA!",
    emoji: "😂",
    description: "Bluffing trivia",
    players: "2-10",
    time: "12 min",
    color: "from-teal-500 to-green-500",
    path: "/haaaa",
  },
  {
    id: "line-mind",
    name: "Line Mind",
    emoji: "🎯",
    description: "Guess the drawing",
    players: "1-10",
    time: "10 min",
    color: "from-violet-500 to-fuchsia-500",
    path: "/ride-line-quest",
  },
];

const GamesDiscovery = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "hard" | "expert">("easy");

  const handleGameClick = (path: string) => {
    if (session) {
      navigate(path);
    } else {
      navigate("/signup");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background p-4 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Gamepad2 className="w-10 h-10 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Magic Pass Games</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Play 10 exciting games with friends. Compete globally. Track your high scores.
        </p>
      </motion.div>

      {/* Difficulty Selector */}
      <div className="flex justify-center gap-3 mb-12">
        {(["easy", "hard", "expert"] as const).map((level) => (
          <motion.button
            key={level}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedDifficulty(level)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              selectedDifficulty === level
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-secondary/20 text-foreground hover:bg-secondary/30"
            }`}
          >
            {level.toUpperCase()}
          </motion.button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {games.map((game, idx) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.02, y: -5 }}
            onClick={() => handleGameClick(game.path)}
            className={`relative overflow-hidden rounded-xl cursor-pointer group bg-gradient-to-br ${game.color} p-0.5`}
          >
            <div className="bg-card rounded-[10px] p-6 h-full flex flex-col justify-between">
              {/* Game Header */}
              <div>
                <div className="text-5xl mb-3">{game.emoji}</div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{game.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
              </div>

              {/* Game Stats */}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {game.players}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {game.time}
                </div>
              </div>

              {/* Play Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4 w-full bg-primary text-primary-foreground font-bold py-2 rounded-lg group-hover:shadow-lg transition-all"
              >
                PLAY →
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Leaderboard CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 text-center"
      >
        <button
          onClick={() => navigate("/admin")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-secondary/20 hover:bg-secondary/30 rounded-lg font-semibold text-foreground transition-all"
        >
          <Trophy className="w-5 h-5 text-secondary" />
          View Global Leaderboards
        </button>
      </motion.div>
    </div>
  );
};

export default GamesDiscovery;
