import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Users, Shuffle, Trophy, Crown, Sparkles, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  onClose: () => void;
}

interface Player {
  name: string;
  score: number;
}

interface Prompt {
  id: string;
  prompt: string;
  real_answer: string;
  category: string;
}

type Phase = "setup" | "show-prompt" | "fake-answer" | "voting" | "results" | "game-over";

const CATEGORIES = [
  { id: "all", label: "All", emoji: "🎯" },
  { id: "characters", label: "Characters", emoji: "🧚" },
  { id: "rides", label: "Rides", emoji: "🎢" },
  { id: "parks", label: "Parks", emoji: "🏰" },
  { id: "history", label: "History", emoji: "📜" },
  { id: "movies", label: "Movies", emoji: "🎬" },
  { id: "star_wars", label: "Star Wars", emoji: "⚔️" },
  { id: "pixar", label: "Pixar", emoji: "🎨" },
  { id: "food", label: "Food", emoji: "🍦" },
  { id: "general", label: "General", emoji: "✨" },
];

const ROUND_COUNT = 5;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HaaaaGame({ onClose }: Props) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("setup");
  const [category, setCategory] = useState("all");
  const [playerCount, setPlayerCount] = useState(3);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerNames, setPlayerNames] = useState<string[]>(["", "", ""]);

  // Game state
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [fakeAnswers, setFakeAnswers] = useState<Record<number, string>>({});
  const [currentInput, setCurrentInput] = useState("");
  const [shuffledAnswers, setShuffledAnswers] = useState<{ text: string; isReal: boolean; playerIdx?: number }[]>([]);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [roundScores, setRoundScores] = useState<Record<number, { correct: boolean; fooled: number }>>({});
  const [startTime] = useState(Date.now());

  const currentPrompt = prompts[currentRound];

  // Load prompts
  const loadPrompts = async () => {
    let query = supabase.from("haaaa_prompts" as any).select("id, prompt, real_answer, category").eq("is_active", true);
    if (category !== "all") query = query.eq("category", category);
    const { data } = await (query as any);
    if (data && data.length > 0) {
      setPrompts(shuffleArray(data).slice(0, ROUND_COUNT));
    }
  };

  const startGame = async () => {
    const names = playerNames.slice(0, playerCount).map((n, i) => n.trim() || `Player ${i + 1}`);
    setPlayers(names.map(name => ({ name, score: 0 })));
    await loadPrompts();
  };

  useEffect(() => {
    if (players.length > 0 && prompts.length > 0 && phase === "setup") {
      setPhase("show-prompt");
    }
  }, [players, prompts]);

  const handleStartRound = () => {
    setFakeAnswers({});
    setVotes({});
    setCurrentPlayerIdx(0);
    setCurrentInput("");
    setPhase("fake-answer");
  };

  const lockInFake = () => {
    const answer = currentInput.trim() || "???";
    setFakeAnswers(prev => ({ ...prev, [currentPlayerIdx]: answer }));
    setCurrentInput("");
    if (currentPlayerIdx + 1 < players.length) {
      setCurrentPlayerIdx(prev => prev + 1);
    } else {
      // All fakes submitted — build shuffled answers
      const allAnswers: { text: string; isReal: boolean; playerIdx?: number }[] = [
        { text: currentPrompt.real_answer, isReal: true },
      ];
      const updatedFakes = { ...fakeAnswers, [currentPlayerIdx]: answer };
      for (let i = 0; i < players.length; i++) {
        allAnswers.push({ text: updatedFakes[i] || "???", isReal: false, playerIdx: i });
      }
      setShuffledAnswers(shuffleArray(allAnswers));
      setCurrentPlayerIdx(0);
      setPhase("voting");
    }
  };

  const castVote = (answerIdx: number) => {
    setVotes(prev => ({ ...prev, [currentPlayerIdx]: answerIdx }));
    if (currentPlayerIdx + 1 < players.length) {
      setCurrentPlayerIdx(prev => prev + 1);
    } else {
      // Score the round
      const updatedVotes = { ...votes, [currentPlayerIdx]: answerIdx };
      const scores: Record<number, { correct: boolean; fooled: number }> = {};
      const updatedPlayers = [...players];

      for (let i = 0; i < players.length; i++) {
        const votedAnswer = shuffledAnswers[updatedVotes[i]];
        const guessedCorrectly = votedAnswer?.isReal || false;
        scores[i] = { correct: guessedCorrectly, fooled: 0 };
        if (guessedCorrectly) {
          updatedPlayers[i].score += 1000;
        }
      }

      // Count who was fooled by each fake
      for (let i = 0; i < players.length; i++) {
        const votedAnswer = shuffledAnswers[updatedVotes[i]];
        if (!votedAnswer?.isReal && votedAnswer?.playerIdx !== undefined && votedAnswer.playerIdx !== i) {
          scores[votedAnswer.playerIdx].fooled++;
          updatedPlayers[votedAnswer.playerIdx].score += 500;
        }
      }

      setRoundScores(scores);
      setPlayers(updatedPlayers);
      setPhase("results");
    }
  };

  const nextRound = () => {
    if (currentRound + 1 < prompts.length) {
      setCurrentRound(prev => prev + 1);
      setPhase("show-prompt");
    } else {
      // Log session
      if (user) {
        const winner = [...players].sort((a, b) => b.score - a.score)[0];
        supabase.from("game_sessions" as any).insert({
          game_id: "haaaa",
          game_name: "Haaaa!!",
          user_id: user.id,
          score: winner.score,
          questions_answered: prompts.length,
          duration_seconds: Math.round((Date.now() - startTime) / 1000),
          completed: true,
        } as any).then(() => {});
      }
      setPhase("game-over");
    }
  };

  const resetGame = () => {
    setPhase("setup");
    setCurrentRound(0);
    setCurrentPlayerIdx(0);
    setFakeAnswers({});
    setVotes({});
    setRoundScores({});
    setPrompts([]);
    setPlayers([]);
  };

  // ── Setup Screen ──
  if (phase === "setup") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #1a0a2e, #0f0a1a, #1a0520)" }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black text-white">🤪 Haaaa!!</h1>
        </div>

        <div className="flex-1 px-4 pb-6 space-y-5 overflow-y-auto">
          {/* Rules */}
          <div className="rounded-2xl p-5 border border-pink-500/20" style={{ background: "rgba(236,72,153,0.08)" }}>
            <p className="text-sm font-bold text-pink-300 mb-2">How to Play</p>
            <ol className="text-xs text-pink-200/80 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>A Disney trivia prompt appears on screen</li>
              <li>Each player takes the phone and privately types a <strong>fake answer</strong></li>
              <li>All answers (fakes + the real one) are shuffled together</li>
              <li>Each player picks which answer they think is real</li>
              <li><strong>+1000 pts</strong> for guessing correctly · <strong>+500 pts</strong> for each player your fake fooled!</li>
            </ol>
          </div>

          {/* Player count */}
          <div>
            <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Players</p>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6, 7, 8].map(n => (
                <button key={n} onClick={() => {
                  setPlayerCount(n);
                  setPlayerNames(prev => {
                    const arr = [...prev];
                    while (arr.length < n) arr.push("");
                    return arr.slice(0, n);
                  });
                }}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${playerCount === n ? "bg-pink-500 text-white scale-110" : "bg-white/10 text-white/60"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Player names */}
          <div>
            <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Player Names</p>
            <div className="space-y-2">
              {Array.from({ length: playerCount }).map((_, i) => (
                <input key={i}
                  value={playerNames[i] || ""}
                  onChange={e => {
                    const arr = [...playerNames];
                    arr[i] = e.target.value;
                    setPlayerNames(arr);
                  }}
                  placeholder={`Player ${i + 1}`}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-pink-500/50"
                />
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${category === c.id ? "bg-pink-500 text-white" : "bg-white/10 text-white/60"}`}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start */}
          <button onClick={startGame}
            className="w-full py-4 rounded-2xl font-black text-lg text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6)" }}>
            <Sparkles className="w-5 h-5" /> Start Game
          </button>
        </div>
      </div>
    );
  }

  // ── Show Prompt (between rounds) ──
  if (phase === "show-prompt" && currentPrompt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "linear-gradient(135deg, #1a0a2e, #0f0a1a, #1a0520)" }}>
        <p className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-2">Round {currentRound + 1} of {prompts.length}</p>
        <div className="rounded-3xl p-8 border border-pink-500/30 text-center max-w-sm w-full" style={{ background: "rgba(236,72,153,0.08)" }}>
          <p className="text-xs text-pink-300/60 uppercase tracking-wider mb-3">The Prompt</p>
          <p className="text-xl font-black text-white leading-snug mb-6">{currentPrompt.prompt}</p>
          <p className="text-xs text-pink-200/60 mb-6">Everyone will make up a fake answer. Pass the phone to <strong className="text-pink-300">{players[0]?.name}</strong> first!</p>
          <button onClick={handleStartRound}
            className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6)" }}>
            Ready! <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Fake Answer Phase ──
  if (phase === "fake-answer" && currentPrompt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "linear-gradient(135deg, #1a0a2e, #0f0a1a, #1a0520)" }}>
        <p className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-1">
          {players[currentPlayerIdx]?.name}'s Turn
        </p>
        <p className="text-[10px] text-white/40 mb-4">Don't let anyone see your answer!</p>

        <div className="rounded-3xl p-6 border border-pink-500/20 max-w-sm w-full" style={{ background: "rgba(236,72,153,0.06)" }}>
          <p className="text-xs text-pink-300/60 uppercase tracking-wider mb-2">Prompt</p>
          <p className="text-base font-bold text-white leading-snug mb-5">{currentPrompt.prompt}</p>

          <p className="text-xs text-pink-300/60 uppercase tracking-wider mb-2">Your Fake Answer</p>
          <input
            value={currentInput}
            onChange={e => setCurrentInput(e.target.value)}
            placeholder="Type something believable..."
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-pink-500/50 mb-4"
            autoFocus
            onKeyDown={e => e.key === "Enter" && currentInput.trim() && lockInFake()}
          />
          <button onClick={lockInFake} disabled={!currentInput.trim()}
            className="w-full py-3 rounded-2xl font-bold text-white disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6)" }}>
            🔒 Lock In
          </button>
        </div>

        <p className="text-xs text-white/30 mt-4">Player {currentPlayerIdx + 1} of {players.length}</p>
      </div>
    );
  }

  // ── Voting Phase ──
  if (phase === "voting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "linear-gradient(135deg, #1a0a2e, #0f0a1a, #1a0520)" }}>
        <p className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-1">
          {players[currentPlayerIdx]?.name} — Pick the REAL answer!
        </p>
        <p className="text-[10px] text-white/40 mb-4">Which one is actually true?</p>

        <div className="max-w-sm w-full space-y-3">
          <div className="rounded-2xl p-4 border border-white/10 mb-2" style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="text-xs text-white/50 mb-1">Prompt:</p>
            <p className="text-sm font-bold text-white">{currentPrompt?.prompt}</p>
          </div>

          {shuffledAnswers.map((ans, idx) => {
            // Don't let player vote for their own fake
            const isOwnFake = !ans.isReal && ans.playerIdx === currentPlayerIdx;
            return (
              <button key={idx} onClick={() => !isOwnFake && castVote(idx)}
                disabled={isOwnFake}
                className={`w-full text-left px-5 py-4 rounded-2xl border transition-all ${
                  isOwnFake ? "opacity-30 border-white/5" : "border-white/15 hover:border-pink-500/40 active:scale-[0.98]"
                }`}
                style={{ background: isOwnFake ? "rgba(255,255,255,0.02)" : "rgba(236,72,153,0.06)" }}>
                <p className="text-sm font-semibold text-white">{ans.text}</p>
                {isOwnFake && <p className="text-[10px] text-white/30 mt-0.5">Your answer</p>}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-white/30 mt-4">Player {currentPlayerIdx + 1} of {players.length}</p>
      </div>
    );
  }

  // ── Round Results ──
  if (phase === "results" && currentPrompt) {
    return (
      <div className="min-h-screen flex flex-col px-6 py-8 overflow-y-auto" style={{ background: "linear-gradient(135deg, #1a0a2e, #0f0a1a, #1a0520)" }}>
        <div className="max-w-sm w-full mx-auto space-y-4">
          <p className="text-xs font-bold text-pink-400 uppercase tracking-widest text-center">Round {currentRound + 1} Results</p>

          {/* Real answer */}
          <div className="rounded-2xl p-5 border border-green-500/30 text-center" style={{ background: "rgba(34,197,94,0.08)" }}>
            <p className="text-xs text-green-400/70 uppercase tracking-wider mb-1">The Real Answer</p>
            <p className="text-lg font-black text-green-300">{currentPrompt.real_answer}</p>
          </div>

          {/* Player results */}
          <div className="space-y-2">
            {players.map((p, i) => (
              <div key={i} className="rounded-xl p-4 border border-white/10 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div>
                  <p className="text-sm font-bold text-white">{p.name}</p>
                  <div className="flex gap-2 mt-0.5">
                    {roundScores[i]?.correct && <span className="text-xs text-green-400 font-semibold">✅ +1000</span>}
                    {(roundScores[i]?.fooled || 0) > 0 && <span className="text-xs text-pink-400 font-semibold">🎭 +{roundScores[i].fooled * 500} ({roundScores[i].fooled} fooled)</span>}
                    {!roundScores[i]?.correct && !roundScores[i]?.fooled && <span className="text-xs text-white/30">No points</span>}
                  </div>
                </div>
                <p className="text-lg font-black text-white">{p.score.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <button onClick={nextRound}
            className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6)" }}>
            {currentRound + 1 < prompts.length ? "Next Round" : "🏆 Final Scores"} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Game Over ──
  if (phase === "game-over") {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "linear-gradient(135deg, #1a0a2e, #0f0a1a, #1a0520)" }}>
        <Crown className="w-12 h-12 text-yellow-400 mb-2" />
        <p className="text-2xl font-black text-white mb-1">{sorted[0]?.name} Wins!</p>
        <p className="text-xs text-white/50 mb-6">{sorted[0]?.score.toLocaleString()} points</p>

        <div className="max-w-sm w-full space-y-2 mb-6">
          {sorted.map((p, i) => (
            <div key={i} className={`rounded-xl p-4 border flex items-center justify-between ${
              i === 0 ? "border-yellow-500/30 bg-yellow-500/10" : "border-white/10 bg-white/4"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-lg font-black text-white/60 w-6 text-center">{i + 1}</span>
                <p className="text-sm font-bold text-white">{p.name}</p>
              </div>
              <p className="text-lg font-black text-white">{p.score.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 max-w-sm w-full">
          <button onClick={resetGame}
            className="flex-1 py-3 rounded-2xl font-bold text-white"
            style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6)" }}>
            Play Again
          </button>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl font-bold text-white/60 border border-white/15">
            Exit
          </button>
        </div>
      </div>
    );
  }

  return null;
}
