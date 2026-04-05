import { useState, useEffect, useRef, useCallback } from "react";
import { X, Trophy, Users, Zap, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── THEME DEFINITIONS ──────────────────────────────────────────────────────
const THEMES: Record<string, {
  name: string; bg: string; floor: string; accent: string;
  obstacles: string[]; artifacts: string[]; emoji: string;
}> = {
  adventure: {
    name: "Silly Archaeology Adventure",
    bg: "from-amber-950 via-stone-900 to-amber-950",
    floor: "border-yellow-600 bg-yellow-950/50",
    accent: "#F5C842",
    obstacles: ["🐍", "🦂", "💀", "🪨", "🌵"],
    artifacts: ["🏺", "💎", "🗝️", "📜", "🪙"],
    emoji: "🏛️",
  },
  space: {
    name: "Galactic Escape",
    bg: "from-indigo-950 via-purple-950 to-indigo-950",
    floor: "border-indigo-500 bg-indigo-950/50",
    accent: "#7C3AED",
    obstacles: ["👾", "☄️", "🛸", "⚡", "🌀"],
    artifacts: ["⭐", "🌟", "💫", "🔭", "🚀"],
    emoji: "🌌",
  },
  pirate: {
    name: "Pirate's Plunder",
    bg: "from-blue-950 via-slate-900 to-blue-950",
    floor: "border-blue-400 bg-blue-950/50",
    accent: "#3B82F6",
    obstacles: ["🦈", "⚓", "💣", "🌊", "🦜"],
    artifacts: ["💰", "⚔️", "🗺️", "🏴‍☠️", "💎"],
    emoji: "🏴‍☠️",
  },
};

// ─── GAME TYPES ──────────────────────────────────────────────────────────────
interface Obstacle {
  id: string; emoji: string; x: number; y: number;
  vx: number; vy: number; size: number; type: "bug" | "dodge" | "artifact";
}

interface Player {
  id: string; name: string; score: number; color: string;
}

// ─── PROCEDURAL SEED GENERATOR ───────────────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export default function RideLineQuest({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<{
    running: boolean; obstacles: Obstacle[]; score: number;
    lives: number; combo: number; seed: number; rng: () => number;
  }>({ running: false, obstacles: [], score: 0, lives: 3, combo: 0, seed: 0, rng: () => 0 });

  const [screen, setScreen] = useState<"menu" | "playing" | "gameover">("menu");
  const [selectedTheme, setSelectedTheme] = useState("adventure");
  const [mode, setMode] = useState<"solo" | "party">("solo");
  const [partyCode, setPartyCode] = useState("");
  const [partyInput, setPartyInput] = useState("");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem("rlq-highscore") || "0"));
  const animFrameRef = useRef<number>(0);

  const theme = THEMES[selectedTheme];

  // ─── SPAWN OBSTACLE ────────────────────────────────────────────────────────
  const spawnObstacle = useCallback((canvas: HTMLCanvasElement, rng: () => number, score: number) => {
    const t = THEMES[selectedTheme];
    const speed = 2 + score / 500;
    const type = rng() < 0.4 ? "bug" : rng() < 0.7 ? "dodge" : "artifact";
    const edge = Math.floor(rng() * 4);
    let x = 0, y = 0, vx = 0, vy = 0;

    if (edge === 0) { x = rng() * canvas.width; y = -50; vx = (rng() - 0.5) * speed; vy = speed + rng() * speed; }
    else if (edge === 1) { x = canvas.width + 50; y = rng() * canvas.height; vx = -(speed + rng() * speed); vy = (rng() - 0.5) * speed; }
    else if (edge === 2) { x = rng() * canvas.width; y = canvas.height + 50; vx = (rng() - 0.5) * speed; vy = -(speed + rng() * speed); }
    else { x = -50; y = rng() * canvas.height; vx = speed + rng() * speed; vy = (rng() - 0.5) * speed; }

    const emojis = type === "artifact" ? t.artifacts : t.obstacles;
    return {
      id: crypto.randomUUID(), emoji: emojis[Math.floor(rng() * emojis.length)],
      x, y, vx, vy, size: type === "dodge" ? 60 : 44, type: type as Obstacle["type"],
    };
  }, [selectedTheme]);

  // ─── GAME LOOP ─────────────────────────────────────────────────────────────
  const gameLoop = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const g = gameRef.current;
    if (!g.running) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background grid (dungeon floor effect)
    ctx.strokeStyle = "rgba(255,200,0,0.06)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < canvas.width; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, canvas.height); ctx.stroke();
    }
    for (let gy = 0; gy < canvas.height; gy += 40) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(canvas.width, gy); ctx.stroke();
    }

    // Spawn new obstacles
    if (g.rng() < 0.03 + g.score / 10000) {
      g.obstacles.push(spawnObstacle(canvas, g.rng, g.score));
    }

    // Update & draw obstacles
    ctx.font = "36px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    g.obstacles = g.obstacles.filter(obs => {
      obs.x += obs.vx;
      obs.y += obs.vy;
      // Remove if off screen
      if (obs.x < -100 || obs.x > canvas.width + 100 || obs.y < -100 || obs.y > canvas.height + 100) return false;
      ctx.font = `${obs.size}px serif`;
      ctx.globalAlpha = obs.type === "artifact" ? 0.9 : 0.8;
      ctx.fillText(obs.emoji, obs.x, obs.y);
      ctx.globalAlpha = 1;
      return true;
    });

    // Score ticker
    g.score += 1;
    setScore(g.score);

    animFrameRef.current = requestAnimationFrame(() => gameLoop(canvas, ctx));
  }, [spawnObstacle]);

  // ─── START GAME ─────────────────────────────────────────────────────────────
  const startGame = () => {
    const seed = Date.now() % 999999;
    const rng = seededRandom(seed);
    gameRef.current = { running: true, obstacles: [], score: 0, lives: 3, combo: 0, seed, rng };
    setScore(0); setLives(3); setCombo(0);
    setScreen("playing");

    if (mode === "party") {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setPartyCode(code);
      setPlayers([
        { id: "1", name: "You", score: 0, color: "#F5C842" },
        { id: "2", name: "Player 2", score: 0, color: "#10B981" },
        { id: "3", name: "Player 3", score: 0, color: "#F43F5E" },
      ]);
      // Simulate other players scoring
      const interval = setInterval(() => {
        if (!gameRef.current.running) { clearInterval(interval); return; }
        setPlayers(prev => prev.map(p => p.id === "1"
          ? { ...p, score: gameRef.current.score }
          : { ...p, score: p.score + Math.floor(Math.random() * 15) }
        ));
      }, 1000);
    }
  };

  // ─── CANVAS SETUP & TOUCH ────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.55;

    gameRef.current.running = true;
    animFrameRef.current = requestAnimationFrame(() => gameLoop(canvas, ctx));

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      const g = gameRef.current;
      const rect = canvas.getBoundingClientRect();
      Array.from(e.changedTouches).forEach(touch => {
        const tx = touch.clientX - rect.left;
        const ty = touch.clientY - rect.top;
        const hit = g.obstacles.findIndex(obs => {
          const dx = obs.x - tx, dy = obs.y - ty;
          return Math.sqrt(dx * dx + dy * dy) < obs.size;
        });
        if (hit !== -1) {
          const obs = g.obstacles[hit];
          if (obs.type === "artifact") {
            g.score += 100 * (g.combo + 1);
            g.combo++;
            setCombo(g.combo);
          } else if (obs.type === "bug") {
            g.score += 25;
          } else {
            // dodge — this should have been dodged, penalty
            g.lives = Math.max(0, g.lives - 1);
            setLives(g.lives);
            if (g.lives === 0) { endGame(); return; }
          }
          g.obstacles.splice(hit, 1);
        } else {
          // missed tap — lose combo
          g.combo = 0;
          setCombo(0);
        }
      });
    };

    canvas.addEventListener("touchstart", handleTouch, { passive: false });
    canvas.addEventListener("click", (e) => {
      const g = gameRef.current;
      const rect = canvas.getBoundingClientRect();
      const tx = e.clientX - rect.left, ty = e.clientY - rect.top;
      const hit = g.obstacles.findIndex(obs => {
        const dx = obs.x - tx, dy = obs.y - ty;
        return Math.sqrt(dx * dx + dy * dy) < obs.size;
      });
      if (hit !== -1) {
        const obs = g.obstacles[hit];
        g.score += obs.type === "artifact" ? 100 : 25;
        g.obstacles.splice(hit, 1);
      }
    });

    return () => {
      gameRef.current.running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [screen, gameLoop]);

  const endGame = () => {
    gameRef.current.running = false;
    cancelAnimationFrame(animFrameRef.current);
    const final = gameRef.current.score;
    if (final > highScore) {
      setHighScore(final);
      localStorage.setItem("rlq-highscore", String(final));
    }
    setScreen("gameover");
  };

  // ─── MENU ────────────────────────────────────────────────────────────────────
  if (screen === "menu") return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto" style={{ background: "#080E1E" }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-xs text-primary font-bold">🏛️ MAGIC PASS LINE GAMES</p>
        </div>
        <div className="w-5" />
      </div>

      <div className="flex-1 px-4 pb-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🪃</div>
          <h1 className="text-2xl font-black text-foreground">Ride Line Quest</h1>
          <p className="text-sm text-muted-foreground mt-1">Dodge, swat & grab while you wait!</p>
          {highScore > 0 && <p className="text-xs text-primary font-semibold mt-1">🏆 Best: {highScore.toLocaleString()}</p>}
        </div>

        {/* Theme Selection */}
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Choose Your Adventure</p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {Object.entries(THEMES).map(([key, t]) => (
            <button key={key} onClick={() => setSelectedTheme(key)}
              className={`p-3 rounded-xl border text-center transition-all ${selectedTheme === key ? "border-primary bg-primary/15" : "border-white/10 bg-white/4"}`}>
              <p className="text-2xl mb-1">{t.emoji}</p>
              <p className="text-xs font-semibold text-foreground leading-tight">{t.name.split(' ').slice(0, 2).join(' ')}</p>
            </button>
          ))}
        </div>

        {/* Mode Selection */}
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Game Mode</p>
        <div className="flex gap-2 mb-5">
          {(["solo", "party"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === m ? "border-primary bg-primary/15 text-primary" : "border-white/10 text-muted-foreground"}`}>
              {m === "solo" ? <><Zap className="w-4 h-4" /> Solo</> : <><Users className="w-4 h-4" /> Party</>}
            </button>
          ))}
        </div>

        {mode === "party" && (
          <div className="mb-4 p-4 rounded-xl border border-white/10" style={{ background: "#111827" }}>
            <p className="text-xs text-muted-foreground mb-2">Have a party code from a friend?</p>
            <div className="flex gap-2">
              <input value={partyInput} onChange={e => setPartyInput(e.target.value.toUpperCase())}
                placeholder="Enter code..." maxLength={6}
                className="flex-1 px-3 py-2 rounded-lg bg-[#0D1230] border border-white/10 text-sm text-foreground uppercase tracking-widest focus:outline-none focus:border-primary/40" />
              <button className="px-4 py-2 rounded-lg text-xs font-bold border border-primary text-primary">Join</button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Or start a new party and share the code!</p>
          </div>
        )}

        {/* How to Play */}
        <div className="p-4 rounded-xl border border-white/8 mb-5" style={{ background: "#111827" }}>
          <p className="text-xs font-bold text-foreground mb-2">How to Play</p>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p>🏺 Tap <span className="text-primary">artifacts</span> for bonus points + combo</p>
            <p>🐛 Swat <span className="text-yellow-400">bugs</span> flying at you</p>
            <p>☄️ Avoid <span className="text-red-400">dodge obstacles</span> — lose a life!</p>
            <p>🔥 Build combos by tapping artifacts in a row</p>
          </div>
        </div>

        <button onClick={startGame}
          className="w-full py-4 rounded-2xl font-black text-lg text-[#080E1E] flex items-center justify-center gap-2"
          style={{ background: "#F5C842" }}>
          🚀 START QUEST
        </button>
      </div>
    </div>
  );

  // ─── PLAYING ────────────────────────────────────────────────────────────────
  if (screen === "playing") return (
    <div className={`fixed inset-0 z-50 flex flex-col bg-gradient-to-b ${theme.bg}`}>
      {/* HUD */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-1">
          {[1, 2, 3].map(i => <span key={i} className="text-xl">{i <= lives ? "❤️" : "🖤"}</span>)}
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-white">{score.toLocaleString()}</p>
          {combo > 1 && <p className="text-xs font-bold" style={{ color: theme.accent }}>🔥 {combo}x COMBO!</p>}
        </div>
        <button onClick={endGame} className="text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Theme Label */}
      <p className="text-center text-xs font-semibold text-white/50 mb-1">{theme.emoji} {theme.name}</p>

      {/* Canvas */}
      <div className="relative flex-1 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full touch-none cursor-crosshair" style={{ touchAction: "none" }} />
        <div className="absolute inset-0 pointer-events-none border-2 rounded-xl" style={{ borderColor: `${theme.accent}40` }} />
        <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/30">Tap to swat bugs · Grab artifacts · Dodge obstacles!</p>
      </div>

      {/* Party Leaderboard */}
      {mode === "party" && players.length > 0 && (
        <div className="shrink-0 px-4 py-3 border-t border-white/10">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs font-bold text-white/70">Party Code: <span className="text-primary tracking-widest">{partyCode}</span></p>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
              <div key={p.id} className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-lg bg-white/10">
                <span className="text-sm">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                <div>
                  <p className="text-xs font-bold text-white">{p.name}</p>
                  <p className="text-xs" style={{ color: p.color }}>{p.score.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ─── GAME OVER ───────────────────────────────────────────────────────────────
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b ${theme.bg} px-6`}>
      <div className="text-center">
        <p className="text-6xl mb-4">{score > highScore ? "🏆" : "💀"}</p>
        <h2 className="text-3xl font-black text-white mb-1">{score > highScore ? "NEW RECORD!" : "QUEST OVER"}</h2>
        <p className="text-muted-foreground text-sm mb-6">Your score</p>
        <p className="text-6xl font-black mb-2" style={{ color: theme.accent }}>{score.toLocaleString()}</p>
        {highScore > 0 && score <= highScore && (
          <p className="text-sm text-muted-foreground mb-6">🏆 Best: {highScore.toLocaleString()}</p>
        )}

        {mode === "party" && players.length > 0 && (
          <div className="w-full max-w-xs mx-auto mb-6 rounded-xl overflow-hidden border border-white/10">
            <p className="text-xs font-bold text-white/70 px-4 py-2 border-b border-white/10">Party Results</p>
            {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                  <span className="text-sm font-semibold text-white">{p.name}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: p.color }}>{p.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button onClick={startGame}
            className="px-8 py-3 rounded-2xl font-black text-[#080E1E]"
            style={{ background: theme.accent }}>
            🔄 PLAY AGAIN
          </button>
          <button onClick={() => setScreen("menu")}
            className="px-6 py-3 rounded-2xl font-bold text-white border border-white/20">
            Menu
          </button>
        </div>
        <button onClick={onClose} className="mt-4 text-xs text-white/40 hover:text-white/70">Back to Magic Pass</button>
      </div>
    </div>
  );
}
