import { useState } from "react";
import { Gamepad2, Camera, Search, Zap, Trophy } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import WhereAmI from "@/components/WhereAmI";
import DisneyTrivia from "@/components/DisneyTrivia";
import LineMind from "@/components/LineMind";
import HaaaaGame from "@/components/HaaaaGame";

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
    id: "where-am-i",
    emoji: "📸",
    title: "Where Am I?",
    subtitle: "Guess the Disney location",
    description: "A close-up photo appears — you have 25 seconds to guess the Disney location from 4 choices. Build streaks for bonus points!",
    color: "#3B82F6",
    available: true,
    tag: "Photo Quiz",
  },
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

export default function LineGames() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  if (activeGame === "where-am-i") {
    return <WhereAmI onClose={() => setActiveGame(null)} />;
  }

  if (activeGame === "trivia") {
    return <DisneyTrivia onClose={() => setActiveGame(null)} />;
  }

  if (activeGame === "linemind") {
    return <LineMind onClose={() => setActiveGame(null)} />;
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

        {/* Game cards */}
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
