import { useState, useEffect, useCallback } from "react";
import { X, Clock, Trophy, ChevronRight, ArrowLeft, Users, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface GamePhoto {
  id: string; title: string; image_url: string; location_name: string;
  park: string; multiple_choice: string[]; correct_answer: number; clue_description?: string;
}

interface WhereAmIProps { onClose: () => void; }

export default function WhereAmI({ onClose }: WhereAmIProps) {
  const { session } = useAuth();
  const [screen, setScreen] = useState<"menu" | "playing" | "gameover">("menu");
  const [photos, setPhotos] = useState<GamePhoto[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalQuestions] = useState(10);
  const [loading, setLoading] = useState(true);

  const loadPhotos = useCallback(async () => {
    const { data } = await supabase.from("game_content")
      .select("*")
      .eq("game_type", "where_am_i")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (data && data.length > 0) {
      // Shuffle and take 10
      const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, Math.min(data.length, totalQuestions));
      setPhotos(shuffled as GamePhoto[]);
    }
    setLoading(false);
  }, [totalQuestions]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  // Timer
  useEffect(() => {
    if (screen !== "playing" || showResult) return;
    if (timeLeft <= 0) {
      setShowResult(true);
      setStreak(0);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [screen, timeLeft, showResult]);

  const handleAnswer = (idx: number) => {
    if (showResult || selected !== null) return;
    setSelected(idx);
    setShowResult(true);
    
    const current = photos[currentIdx];
    if (idx === current.correct_answer) {
      const timeBonus = Math.floor(timeLeft / 5);
      setScore(s => s + 100 + timeBonus * 10);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= photos.length) {
      setScreen("gameover");
      return;
    }
    setCurrentIdx(i => i + 1);
    setSelected(null);
    setShowResult(false);
    setTimeLeft(25);
  };

  const timerColor = timeLeft > 15 ? "bg-green-500" : timeLeft > 7 ? "bg-yellow-500" : "bg-red-500";

  // Menu
  if (screen === "menu") return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ background: "#070b15" }}>
      <button onClick={onClose} className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
      <div className="text-6xl mb-4">📸</div>
      <h1 className="text-3xl font-black text-foreground mb-2">Where Am I?</h1>
      <p className="text-sm text-muted-foreground text-center mb-8">A close-up photo appears. You have 25 seconds to guess the Disney location!</p>
      
      {loading ? (
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-6" />
      ) : photos.length === 0 ? (
        <div className="text-center mb-6">
          <p className="text-sm text-muted-foreground">No game photos yet!</p>
          <p className="text-xs text-muted-foreground mt-1">Game Developers are adding content. Check back soon!</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-6">{photos.length} location{photos.length !== 1 ? "s" : ""} ready to guess</p>
      )}
      
      <button onClick={() => { if (photos.length > 0) { setCurrentIdx(0); setScore(0); setStreak(0); setSelected(null); setShowResult(false); setTimeLeft(25); setScreen("playing"); } }}
        disabled={photos.length === 0}
        className="w-full max-w-xs py-4 rounded-2xl font-black text-xl text-[#070b15] disabled:opacity-40 mb-4"
        style={{ background: "#F0B429" }}>
        🏰 Start Game
      </button>
    </div>
  );

  if (screen === "playing" && photos.length > 0) {
    const current = photos[currentIdx];
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#070b15" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <div>
            <p className="text-xs text-muted-foreground">{currentIdx + 1} / {photos.length}</p>
            <p className="text-xl font-black text-primary">{score.toLocaleString()}</p>
          </div>
          {streak >= 2 && <span className="text-sm font-bold text-yellow-400">🔥 {streak}x Streak!</span>}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {/* Timer */}
        <div className="px-4 mb-2 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className={`text-sm font-bold ${timeLeft <= 7 ? "text-red-400" : "text-foreground"}`}>{timeLeft}s</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10">
            <div className={`h-2 rounded-full transition-all ${timerColor}`} style={{ width: `${(timeLeft / 25) * 100}%` }} />
          </div>
        </div>

        {/* Photo */}
        <div className="flex-1 relative overflow-hidden mx-4 rounded-2xl mb-3">
          <img src={current.image_url} className="w-full h-full object-cover" alt="Where am I?" />
          {current.clue_description && !showResult && (
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-xs text-white/80 italic">{current.clue_description}</p>
            </div>
          )}
          {showResult && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center">
                {selected === current.correct_answer ? (
                  <div><p className="text-4xl mb-2">🎉</p><p className="text-xl font-black text-green-400">Correct!</p></div>
                ) : (
                  <div><p className="text-4xl mb-2">❌</p><p className="text-xl font-black text-red-400">Wrong!</p><p className="text-sm text-white mt-1">{current.multiple_choice[current.correct_answer]}</p></div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="px-4 pb-4 space-y-2 shrink-0">
          {current.multiple_choice.map((opt, i) => {
            let btnClass = "w-full px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all border ";
            if (showResult) {
              if (i === current.correct_answer) btnClass += "border-green-500 bg-green-500/20 text-green-400";
              else if (i === selected) btnClass += "border-red-500 bg-red-500/20 text-red-400";
              else btnClass += "border-white/10 text-muted-foreground opacity-50";
            } else {
              btnClass += selected === i ? "border-primary bg-primary/20 text-primary" : "border-white/10 text-foreground hover:border-primary/40";
            }
            return (
              <button key={i} onClick={() => handleAnswer(i)} disabled={showResult} className={btnClass}>
                <span className="text-xs text-muted-foreground mr-2">{String.fromCharCode(65+i)}.</span>{opt}
              </button>
            );
          })}
          
          {showResult && (
            <button onClick={nextQuestion}
              className="w-full py-3 rounded-xl font-bold text-sm text-[#070b15] flex items-center justify-center gap-2 mt-1"
              style={{ background: "#F0B429" }}>
              {currentIdx + 1 >= photos.length ? "See Results →" : "Next Question →"}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Game over
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ background: "#070b15" }}>
      <p className="text-5xl mb-4">🏆</p>
      <h2 className="text-3xl font-black text-foreground mb-2">Game Over!</h2>
      <p className="text-4xl font-black text-primary mb-1">{score.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground mb-8">points</p>
      <div className="flex gap-3">
        <button onClick={() => { setScreen("menu"); loadPhotos(); }} className="px-6 py-3 rounded-2xl font-bold text-[#070b15]" style={{ background: "#F0B429" }}>Play Again</button>
        <button onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-foreground border border-white/20">Exit</button>
      </div>
    </div>
  );
}
