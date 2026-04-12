import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, RotateCcw, Check, SkipForward, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LineWindProps {
  onClose: () => void;
}

const CATEGORIES = [
  { id: "all", label: "All", emoji: "🎯" },
  { id: "characters", label: "Characters", emoji: "🧚" },
  { id: "rides", label: "Rides", emoji: "🎢" },
  { id: "food", label: "Food", emoji: "🍦" },
  { id: "movies", label: "Movies", emoji: "🎬" },
  { id: "parks", label: "Parks", emoji: "🏰" },
  { id: "star_wars", label: "Star Wars", emoji: "⚔️" },
  { id: "pixar", label: "Pixar", emoji: "🎨" },
  { id: "muppets", label: "Muppets", emoji: "🐸" },
  { id: "villains", label: "Villains", emoji: "😈" },
  { id: "songs", label: "Songs", emoji: "🎵" },
  { id: "history", label: "History", emoji: "📜" },
  { id: "shows", label: "Shows", emoji: "📺" },
  { id: "animals", label: "Animals", emoji: "🐾" },
  { id: "locations", label: "Locations", emoji: "📍" },
  { id: "items", label: "Items", emoji: "✨" },
];

type Phase = "menu" | "countdown" | "playing" | "gameover";

export default function LineMind({ onClose }: LineWindProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("menu");
  const [category, setCategory] = useState("all");
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [countdown, setCountdown] = useState(3);
  const [flash, setFlash] = useState<"green" | "red" | null>(null);
  const [hasGyro, setHasGyro] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const tiltCooldown = useRef(false);
  const startTime = useRef(0);

  // Load words from Supabase
  useEffect(() => {
    const load = async () => {
      let query = (supabase.from("headsup_words" as any).select("word") as any).eq("is_active", true);
      if (category !== "all") query = query.eq("category", category);
      const { data } = await query;
      if (data) {
        const shuffled = (data as any[]).map((d: any) => d.word).sort(() => Math.random() - 0.5);
        setWords(shuffled);
      }
    };
    load();
  }, [category]);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("playing");
      startTime.current = Date.now();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Game timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Device orientation
  useEffect(() => {
    if (phase !== "playing") return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (tiltCooldown.current) return;
      const beta = e.beta ?? 0; // front-back tilt
      if (beta < -30) {
        // Tilted back (phone up) = skip
        handleSkip();
        tiltCooldown.current = true;
        setTimeout(() => (tiltCooldown.current = false), 1200);
      } else if (beta > 60) {
        // Tilted forward (phone down) = correct
        handleCorrect();
        tiltCooldown.current = true;
        setTimeout(() => (tiltCooldown.current = false), 1200);
      }
    };

    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
        try {
          const perm = await (DeviceOrientationEvent as any).requestPermission();
          if (perm === "granted") {
            setHasGyro(true);
            window.addEventListener("deviceorientation", handleOrientation);
          }
        } catch {
          setHasGyro(false);
        }
      } else {
        // Check if device orientation is available
        window.addEventListener("deviceorientation", function test(e) {
          if (e.beta !== null) setHasGyro(true);
          window.removeEventListener("deviceorientation", test);
        });
        window.addEventListener("deviceorientation", handleOrientation);
      }
    };

    requestPermission();
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [phase, currentIndex, words]);

  const handleCorrect = useCallback(() => {
    if (phase !== "playing" || currentIndex >= words.length) return;
    setCorrect(prev => [...prev, words[currentIndex]]);
    setFlash("green");
    setTimeout(() => setFlash(null), 400);
    if (currentIndex + 1 >= words.length) {
      endGame();
    } else {
      setCurrentIndex(i => i + 1);
    }
  }, [phase, currentIndex, words]);

  const handleSkip = useCallback(() => {
    if (phase !== "playing" || currentIndex >= words.length) return;
    setSkipped(prev => [...prev, words[currentIndex]]);
    setFlash("red");
    setTimeout(() => setFlash(null), 400);
    if (currentIndex + 1 >= words.length) {
      endGame();
    } else {
      setCurrentIndex(i => i + 1);
    }
  }, [phase, currentIndex, words]);

  const endGame = useCallback(() => {
    clearInterval(timerRef.current);
    setPhase("gameover");
    // Log session
    if (user) {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      (supabase.from("game_sessions" as any).insert({
        game_id: "linemind",
        game_name: "Line Mind",
        user_id: user.id,
        score: correct.length,
        questions_answered: correct.length + skipped.length,
        duration_seconds: duration,
        completed: true,
      }) as any).then(() => {});
    }
  }, [user, correct, skipped]);

  const startGame = () => {
    setCorrect([]);
    setSkipped([]);
    setCurrentIndex(0);
    setTimeLeft(60);
    setCountdown(3);
    setPhase("countdown");
  };

  const resetGame = () => {
    setPhase("menu");
    setCorrect([]);
    setSkipped([]);
    setCurrentIndex(0);
    setTimeLeft(60);
  };

  // ── MENU ──
  if (phase === "menu") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#070b15" }}>
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-black text-foreground">🤳 Line Mind</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
          <div className="text-6xl mb-4">🧠</div>
          <h2 className="text-2xl font-black text-foreground mb-2">Line Mind</h2>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
            Hold the phone on your forehead. Your friends give clues — tilt down for correct, tilt up to skip!
          </p>

          {/* Category picker */}
          <div className="w-full max-w-sm mb-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 text-center">Pick a Category</p>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`px-3 py-3 rounded-xl text-center transition-all border ${
                    category === c.id
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-white/10 text-muted-foreground hover:border-white/20"
                  }`}
                >
                  <div className="text-xl mb-0.5">{c.emoji}</div>
                  <p className="text-xs font-bold">{c.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div className="w-full max-w-sm rounded-xl border border-white/10 p-4 mb-6" style={{ background: "hsl(var(--card))" }}>
            <p className="text-xs font-bold text-foreground mb-2">How to Play</p>
            <div className="space-y-1.5">
              {[
                "📱 Hold phone to your forehead",
                "👫 Friends describe the word without saying it",
                "⬇️ Tilt phone DOWN = Correct!",
                "⬆️ Tilt phone UP = Skip",
                "⏱️ 60 seconds per round",
              ].map((r, i) => (
                <p key={i} className="text-xs text-muted-foreground">{r}</p>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={words.length === 0}
            className="w-full max-w-sm py-4 rounded-2xl font-black text-lg text-[#070b15] disabled:opacity-50 transition-transform active:scale-[0.97]"
            style={{ background: "#F0B429" }}
          >
            {words.length === 0 ? "Loading..." : `Start (${words.length} words)`}
          </button>
        </div>
      </div>
    );
  }

  // ── COUNTDOWN ──
  if (phase === "countdown") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#070b15" }}>
        <Smartphone className="w-16 h-16 text-primary mb-6 animate-bounce" />
        <div className="text-8xl font-black text-primary mb-4">{countdown || "GO!"}</div>
        <p className="text-lg text-muted-foreground font-semibold animate-pulse">
          Raise the phone to your forehead!
        </p>
      </div>
    );
  }

  // ── PLAYING ──
  if (phase === "playing") {
    const currentWord = words[currentIndex] || "";
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center relative transition-colors duration-200"
        style={{
          background: flash === "green" ? "#166534" : flash === "red" ? "#991b1b" : "#070b15",
        }}
      >
        {/* Timer */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
          <div className={`text-4xl font-black ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-primary"}`}>
            {timeLeft}
          </div>
        </div>

        {/* Score */}
        <div className="absolute top-6 right-6 flex gap-3">
          <div className="text-center">
            <p className="text-2xl font-black text-green-400">{correct.length}</p>
            <p className="text-[10px] text-green-400/70 font-bold">CORRECT</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-red-400">{skipped.length}</p>
            <p className="text-[10px] text-red-400/70 font-bold">SKIPPED</p>
          </div>
        </div>

        {/* Word */}
        <div className="px-8 text-center" style={{ transform: "rotate(0deg)" }}>
          <p className="text-5xl md:text-7xl font-black text-foreground leading-tight">{currentWord}</p>
        </div>

        {/* Fallback buttons */}
        <div className="absolute bottom-12 flex gap-6 w-full max-w-xs px-4">
          <button
            onClick={handleSkip}
            className="flex-1 py-4 rounded-2xl border-2 border-red-500/50 text-red-400 font-bold text-sm flex items-center justify-center gap-2 active:bg-red-500/20"
          >
            <SkipForward className="w-5 h-5" /> Skip
          </button>
          <button
            onClick={handleCorrect}
            className="flex-1 py-4 rounded-2xl border-2 border-green-500/50 text-green-400 font-bold text-sm flex items-center justify-center gap-2 active:bg-green-500/20"
          >
            <Check className="w-5 h-5" /> Correct
          </button>
        </div>

        {!hasGyro && (
          <p className="absolute bottom-4 text-[10px] text-muted-foreground text-center px-4">
            Tilt not detected — use the buttons above
          </p>
        )}
      </div>
    );
  }

  // ── GAME OVER ──
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#070b15" }}>
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-black text-foreground">🤳 Line Mind — Results</h1>
      </div>

      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full">
        {/* Score summary */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-2">🎉</div>
          <p className="text-4xl font-black text-primary mb-1">{correct.length}</p>
          <p className="text-sm text-muted-foreground font-semibold">words guessed correctly</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border border-green-500/20 p-4 text-center" style={{ background: "rgba(22,163,74,0.1)" }}>
            <p className="text-2xl font-black text-green-400">{correct.length}</p>
            <p className="text-xs text-green-400/70 font-bold">Correct</p>
          </div>
          <div className="rounded-xl border border-red-500/20 p-4 text-center" style={{ background: "rgba(220,38,38,0.1)" }}>
            <p className="text-2xl font-black text-red-400">{skipped.length}</p>
            <p className="text-xs text-red-400/70 font-bold">Skipped</p>
          </div>
        </div>

        {/* Word lists */}
        {correct.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">✅ Correct</p>
            <div className="flex flex-wrap gap-1.5">
              {correct.map((w, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 font-medium">{w}</span>
              ))}
            </div>
          </div>
        )}

        {skipped.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">⏭ Skipped</p>
            <div className="flex flex-wrap gap-1.5">
              {skipped.map((w, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 font-medium">{w}</span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={resetGame}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm border border-white/10 text-foreground flex items-center justify-center gap-2 hover:bg-white/5"
          >
            <RotateCcw className="w-4 h-4" /> Play Again
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-[#070b15]"
            style={{ background: "#F0B429" }}
          >
            Back to Games
          </button>
        </div>
      </div>
    </div>
  );
}
