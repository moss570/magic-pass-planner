import { useState, useEffect } from "react";
import { Gamepad2, Camera, Search, Zap, Trophy, Code } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import WhereAmI from "@/components/WhereAmI";
import DisneyTrivia from "@/components/DisneyTrivia";
import LineMind from "@/components/LineMind";
import HaaaaGame from "@/components/HaaaaGame";
import BingoGame from "@/components/BingoGame";
import WhoDidItGame from "@/components/WhoDidItGame";
import WouldYouRatherGame from "@/components/WouldYouRatherGame";
import SongLyricGame from "@/components/SongLyricGame";
import GeographyGame from "@/components/GeographyGame";
import SpyWordGame from "@/components/SpyWordGame";
import PicturePerfectGame from "@/components/PicturePerfectGame";
import MysteryCaseGame from "@/components/MysteryCaseGame";
import GameLauncher from "@/components/GameLauncher";
import Match3Game from "@/components/games/Match3Game";
import PokerGame from "@/components/games/PokerGame";
import SpitGame from "@/components/games/SpitGame";
import MysteryGame from "@/components/games/MysteryGame";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface GameCard {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  available: boolean;
  tag?: string;
}

const GAMES: GameCard[] = [

  {
    id: "trivia",
    emoji: "🧠",
    title: "Disney Trivia",
    subtitle: "Test your Disney knowledge",
    description: "Answer questions about rides, history, characters, and park secrets. Harder questions earn more points!",
    color: "#8B5CF6",
    available: true,
    tag: "Quiz",
  },
  {
    id: "linemind",
    emoji: "🤳",
    title: "Line Mind",
    subtitle: "Hold phone to forehead",
    description: "One player holds the phone on their forehead while friends give clues. Tilt to answer — how many can you guess in 60 seconds?",
    color: "#F59E0B",
    available: true,
    tag: "Party",
  },
  {
    id: "haaaa",
    emoji: "🤪",
    title: "Haaaa!!",
    subtitle: "Bluff your friends",
    description: "A Disney trivia prompt appears — everyone makes up a fake answer. Then guess which one is real! Fool your friends for bonus points.",
    color: "#EC4899",
    available: true,
    tag: "Party",
  },
  {
    id: "scavenger-hunt",
    emoji: "🔍",
    title: "Queue Scavenger Hunt",
    subtitle: "Find hidden details",
    description: "Discover hidden Mickeys, props, and secrets tucked into ride queues. Snap a photo when you find them!",
    color: "#10B981",
    available: false,
    tag: "Coming Soon",
  },
];

// Map GamesDiscovery query params to LineGames game IDs
const gameParamMap: { [key: string]: string } = {
  "trivia": "trivia",
  "bingo": "bingo",
  "who-did-it": "who-did-it",
  "would-you-rather": "would-you-rather",
  "picture-perfect": "picture-perfect",
  "song-lyric": "song-lyric",
  "geography": "geography",
  "spy-word": "spy-word",
  "haaaa": "haaaa",
  "line-mind": "linemind",
  "mystery-case": "mystery-case",
  "match3": "match3",
  "poker": "poker",
  "spit": "spit",
  "mystery-adventure": "mystery-adventure",
};


const GAME_META: { [key: string]: { name: string; emoji: string; gradient: string } } = {
  "trivia": { name: "Trivia", emoji: "🎓", gradient: "bg-gradient-to-br from-red-500 to-orange-500" },
  "bingo": { name: "Bingo", emoji: "🎲", gradient: "bg-gradient-to-br from-emerald-400 to-teal-500" },
  "who-did-it": { name: "Who Did It?", emoji: "🕵️", gradient: "bg-gradient-to-br from-purple-500 to-fuchsia-500" },
  "would-you-rather": { name: "Would You Rather", emoji: "🤔", gradient: "bg-gradient-to-br from-blue-500 to-indigo-500" },
  "picture-perfect": { name: "Picture Perfect", emoji: "🎨", gradient: "bg-gradient-to-br from-pink-500 to-rose-500" },
  "song-lyric": { name: "Song Lyric", emoji: "🎵", gradient: "bg-gradient-to-br from-amber-400 to-red-500" },
  "geography": { name: "Geography", emoji: "🌍", gradient: "bg-gradient-to-br from-green-500 to-teal-500" },
  "spy-word": { name: "Spy Word", emoji: "🕵️", gradient: "bg-gradient-to-br from-cyan-400 to-indigo-600" },
  "haaaa": { name: "HAAAA!", emoji: "😂", gradient: "bg-gradient-to-br from-teal-400 to-emerald-500" },
  "linemind": { name: "Line Mind", emoji: "🧠", gradient: "bg-gradient-to-br from-violet-500 to-fuchsia-500" },
  "mystery-case": { name: "Mystery Case", emoji: "🔍", gradient: "bg-gradient-to-br from-amber-500 to-orange-600" },
  "match3": { name: "Theme Park Match-3", emoji: "🎪", gradient: "bg-gradient-to-br from-yellow-500 to-pink-500" },
  "poker": { name: "Poker Night", emoji: "🃏", gradient: "bg-gradient-to-br from-green-500 to-emerald-600" },
  "spit": { name: "Spit!", emoji: "⚡", gradient: "bg-gradient-to-br from-cyan-400 to-purple-600" },
  "mystery-adventure": { name: "Mystery at Adventure World", emoji: "🔍", gradient: "bg-gradient-to-br from-amber-600 to-purple-800" },
};

export default function LineGames() {
  const [searchParams] = useSearchParams();
  const gameParam = searchParams.get("game");
  const mappedGameId = gameParam ? gameParamMap[gameParam] || null : null;
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [launchingGame, setLaunchingGame] = useState<string | null>(mappedGameId || null);
  const [isGameDev, setIsGameDev] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    supabase.rpc("is_game_developer", { _user_id: user.id }).then(({ data }) => {
      if (data) setIsGameDev(true);
    });
  }, [user]);


  // Show launcher (Solo/Host/Join) before starting any game
  if (launchingGame && !activeGame) {
    const meta = GAME_META[launchingGame] || { name: launchingGame, emoji: "🎮", gradient: "bg-gradient-to-br from-gray-500 to-gray-600" };
    return (
      <GameLauncher
        gameType={launchingGame}
        gameName={meta.name}
        gameEmoji={meta.emoji}
        gradient={meta.gradient}
        onStartSolo={() => setActiveGame(launchingGame)}
        onClose={() => { setLaunchingGame(null); navigate("/games"); }}
      />
    );
  }

  if (activeGame === "where-am-i") {
    return <WhereAmI onClose={() => { setActiveGame(null); setLaunchingGame(null); navigate("/games"); }} />;
  }

  if (activeGame === "trivia") {
    return <DisneyTrivia onClose={() => { setActiveGame(null); setLaunchingGame(null); navigate("/games"); }} />;
  }

  if (activeGame === "linemind") {
    return <LineMind onClose={() => { setActiveGame(null); setLaunchingGame(null); navigate("/games"); }} />;
  }

  if (activeGame === "haaaa") {
    return <HaaaaGame onClose={() => { setActiveGame(null); setLaunchingGame(null); navigate("/games"); }} />;
  }

  if (activeGame === "bingo") {
    return <BingoGame onClose={() => { setActiveGame(null); setLaunchingGame(null); navigate("/games"); }} />;
  }

  if (activeGame === "who-did-it") {
    return <WhoDidItGame onClose={() => { setActiveGame(null); setLaunchingGame(null); navigate("/games"); }} />;
  }

  if (activeGame === "would-you-rather") {
    return <WouldYouRatherGame onClose={() => { setActiveGame(null); setLaunchingGame(null); navigate("/games"); }} />;
  }

  if (activeGame === "song-lyric") {
    return <SongLyricGame onClose={() => { setActiveGame(null); setLaunchingGame(null); navigate("/games"); }} />;
  }

  if (activeGame === "geography") {
    return <GeographyGame onClose={() => { setActiveGame(null); setLaunchingGame(null); navigate("/games"); }} />;
  }

  if (activeGame === "spy-word") {
    return <SpyWordGame onClose={() => { setActiveGame(null); setLaunchingGame(null); navigate("/games"); }} />;
  }

  if (activeGame === "picture-perfect") {
    return <PicturePerfectGame onClose={() => { setActiveGame(null); setLaunchingGame(null); navigate("/games"); }} />;
  }

  if (activeGame === "mystery-case") {
    return <MysteryCaseGame onClose={() => { setActiveGame(null); setLaunchingGame(null); navigate("/games"); }} />;
  }

  if (activeGame === "match3") {
    return <Match3Game onClose={() => { setActiveGame(null); setLaunchingGame(null); navigate("/games"); }} playerName="Player" />;
  }

  if (activeGame === "poker") {
    return <PokerGame onClose={() => { setActiveGame(null); setLaunchingGame(null); navigate("/games"); }} playerName="Player" />;
  }

  if (activeGame === "spit") {
    return <SpitGame onClose={() => { setActiveGame(null); setLaunchingGame(null); navigate("/games"); }} playerName="Player" />;
  }

  if (activeGame === "mystery-adventure") {
    return <MysteryGame onClose={() => { setActiveGame(null); setLaunchingGame(null); navigate("/games"); }} playerName="Detective" />;
  }

  return (
    <DashboardLayout title="🎮 Line Games" subtitle="Fun while you wait in line!">
      <div className="space-y-5">
        {/* Header card */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 p-5" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--card)))" }}>
          <div className="flex items-start gap-4">
            <div className="text-5xl">🎮</div>
            <div className="flex-1">
              <h2 className="text-lg font-black text-foreground mb-1">Line Games</h2>
              <p className="text-sm text-muted-foreground">Turn wait time into play time! Pick a game below and challenge your group while waiting for your next ride.</p>
            </div>
          </div>
        </div>

        {/* Game Dev entry point */}
        {isGameDev && (
          <button
            onClick={() => navigate("/game-developer")}
            className="w-full text-left rounded-2xl border border-amber-500/30 p-4 transition-all hover:border-amber-500/50 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, hsl(45 80% 20% / 0.3), hsl(var(--card)))" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/20">
                <Code className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-amber-300">Game Developer Mode</h3>
                <p className="text-xs text-muted-foreground">Submit new game content &amp; manage your submissions</p>
              </div>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
          </button>
        )}


        <div className="space-y-3">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => game.available && setActiveGame(game.id)}
              disabled={!game.available}
              className={`w-full text-left rounded-2xl border p-4 transition-all ${
                game.available
                  ? "border-white/10 hover:border-primary/30 active:scale-[0.98]"
                  : "border-white/5 opacity-60"
              }`}
              style={{ background: "var(--card)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
                  style={{ background: `${game.color}18` }}
                >
                  {game.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-bold text-foreground">{game.title}</h3>
                    {game.tag && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: game.available ? `${game.color}20` : "hsl(var(--muted))",
                          color: game.available ? game.color : "hsl(var(--muted-foreground))",
                        }}
                      >
                        {game.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold mb-1" style={{ color: game.color }}>
                    {game.subtitle}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{game.description}</p>
                </div>
                {game.available && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                    style={{ background: `${game.color}20` }}
                  >
                    <Zap className="w-4 h-4" style={{ color: game.color }} />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Tip */}
        <div className="p-4 rounded-xl border border-white/8 text-center" style={{ background: "var(--card)" }}>
          <p className="text-xs text-muted-foreground">
            💡 <span className="font-semibold text-foreground">Pro tip:</span> Games save your high scores locally. Challenge your family to beat your record!
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
