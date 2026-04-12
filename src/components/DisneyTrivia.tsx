import { useState, useEffect, useCallback } from "react";
import { X, Clock, Trophy, ChevronRight, ArrowLeft, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  category: string;
  difficulty: string | null;
  park: string | null;
}

interface DisneyTriviaProps {
  onClose: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#10B981",
  medium: "#F59E0B",
  hard: "#EF4444",
};

export default function DisneyTrivia({ onClose }: DisneyTriviaProps) {
  const [screen, setScreen] = useState<"menu" | "playing" | "gameover">("menu");
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const totalQuestions = 10;

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("trivia_questions")
      .select("*")
      .eq("is_active", true)
      .limit(50);

    if (data && data.length > 0) {
      const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, Math.min(data.length, totalQuestions));
      setQuestions(shuffled as TriviaQuestion[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

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

    const current = questions[currentIdx];
    if (idx === current.correct_answer) {
      const timeBonus = Math.floor(timeLeft / 5);
      const diffMultiplier = current.difficulty === "hard" ? 3 : current.difficulty === "medium" ? 2 : 1;
      setScore(s => s + (100 * diffMultiplier) + timeBonus * 10);
      setStreak(s => s + 1);
      setCorrectCount(c => c + 1);
    } else {
      setStreak(0);
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      setScreen("gameover");
      return;
    }
    setCurrentIdx(i => i + 1);
    setSelected(null);
    setShowResult(false);
    setTimeLeft(20);
  };

  const startGame = () => {
    if (questions.length === 0) return;
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setCorrectCount(0);
    setSelected(null);
    setShowResult(false);
    setTimeLeft(20);
    setScreen("playing");
  };

  const timerColor = timeLeft > 12 ? "bg-green-500" : timeLeft > 6 ? "bg-yellow-500" : "bg-red-500";

  // Menu screen
  if (screen === "menu") return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ background: "#070b15" }}>
      <button onClick={onClose} className="absolute top-4 left-4 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="text-6xl mb-4">🧠</div>
      <h1 className="text-3xl font-black text-foreground mb-2">Disney Trivia</h1>
      <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
        Test your Disney knowledge! Answer questions about rides, history, characters, and park secrets.
      </p>

      {loading ? (
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-6" />
      ) : questions.length === 0 ? (
        <div className="text-center mb-6">
          <p className="text-sm text-muted-foreground">No trivia questions available yet!</p>
          <p className="text-xs text-muted-foreground mt-1">Check back soon — new questions are added regularly.</p>
        </div>
      ) : (
        <div className="text-center mb-6">
          <p className="text-xs text-muted-foreground">{questions.length} question{questions.length !== 1 ? "s" : ""} ready</p>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#10B98120", color: "#10B981" }}>Easy</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#F59E0B20", color: "#F59E0B" }}>Medium</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#EF444420", color: "#EF4444" }}>Hard</span>
          </div>
        </div>
      )}

      <button onClick={startGame} disabled={questions.length === 0}
        className="w-full max-w-xs py-4 rounded-2xl font-black text-xl text-[#070b15] disabled:opacity-40 mb-4"
        style={{ background: "#F0B429" }}>
        🎯 Start Trivia
      </button>
    </div>
  );

  // Playing screen
  if (screen === "playing" && questions.length > 0) {
    const current = questions[currentIdx];
    const diffColor = DIFFICULTY_COLORS[current.difficulty || "medium"] || "#F59E0B";

    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#070b15" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <div>
            <p className="text-xs text-muted-foreground">{currentIdx + 1} / {questions.length}</p>
            <p className="text-xl font-black text-primary">{score.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-3">
            {streak >= 2 && <span className="text-sm font-bold text-yellow-400">🔥 {streak}x Streak!</span>}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${diffColor}20`, color: diffColor }}>
              {current.difficulty || "medium"}
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timer */}
        <div className="px-4 mb-3 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className={`text-sm font-bold ${timeLeft <= 6 ? "text-red-400" : "text-foreground"}`}>{timeLeft}s</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10">
            <div className={`h-2 rounded-full transition-all ${timerColor}`} style={{ width: `${(timeLeft / 20) * 100}%` }} />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col px-4 overflow-auto">
          <div className="rounded-2xl p-5 mb-4 border border-white/10" style={{ background: "#111827" }}>
            {current.category && (
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-wider mb-2 block">{current.category}</span>
            )}
            <p className="text-lg font-bold text-foreground leading-snug">{current.question}</p>
            {current.park && (
              <p className="text-xs text-muted-foreground mt-2">📍 {current.park}</p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2 pb-4">
            {current.options.map((opt, i) => {
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
                  <span className="text-xs text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                </button>
              );
            })}

            {showResult && (
              <button onClick={nextQuestion}
                className="w-full py-3 rounded-xl font-bold text-sm text-[#070b15] flex items-center justify-center gap-2 mt-1"
                style={{ background: "#F0B429" }}>
                {currentIdx + 1 >= questions.length ? "See Results →" : "Next Question →"}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Game over
  const pct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ background: "#070b15" }}>
      <p className="text-5xl mb-4">🏆</p>
      <h2 className="text-3xl font-black text-foreground mb-2">Trivia Complete!</h2>
      <p className="text-4xl font-black text-primary mb-1">{score.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground mb-2">points</p>
      <p className="text-sm text-muted-foreground mb-8">
        {correctCount} / {questions.length} correct ({pct}%)
      </p>
      <div className="flex gap-3">
        <button onClick={() => { setScreen("menu"); loadQuestions(); }}
          className="px-6 py-3 rounded-2xl font-bold text-[#070b15]" style={{ background: "#F0B429" }}>
          Play Again
        </button>
        <button onClick={onClose}
          className="px-6 py-3 rounded-2xl font-bold text-foreground border border-white/20">
          Exit
        </button>
      </div>
    </div>
  );
}
