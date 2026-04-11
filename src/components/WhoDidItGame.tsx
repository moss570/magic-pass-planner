import { saveHighScore } from "@/lib/gameScores";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Search } from "lucide-react";
import ConfettiEffect from "@/components/ConfettiEffect";

const SUSPECTS = [
  { name: "Detective Parker", emoji: "🕵️" },
  { name: "Chef Romano", emoji: "👨‍🍳" },
  { name: "Professor Blake", emoji: "👩‍🏫" },
  { name: "Mayor Sullivan", emoji: "🎩" },
  { name: "Artist Luna", emoji: "🎨" },
  { name: "Reporter Quinn", emoji: "📰" },
];
const LOCATIONS = ["Kitchen", "Garden", "Ballroom", "Library", "Dining Hall", "Hallway"];
const TOOLS = ["Rope", "Key", "Hammer", "Lockpick", "Briefcase", "Mask"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

export default function WhoDidItGame({ onClose }: { onClose: () => void }) {
  const [answer] = useState(() => ({
    suspect: SUSPECTS[Math.floor(Math.random()*6)],
    location: LOCATIONS[Math.floor(Math.random()*6)],
    tool: TOOLS[Math.floor(Math.random()*6)],
  }));
  const [clues, setClues] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"clue"|"guess"|"result">("clue");
  const [guess, setGuess] = useState({ suspect: "", location: "", tool: "" });
  const [score, setScore] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const generateClue = () => {
    const cluePool = [
      `The culprit was NOT ${shuffle(SUSPECTS.filter(s => s.name !== answer.suspect.name))[0].name}.`,
      `It did NOT happen in the ${shuffle(LOCATIONS.filter(l => l !== answer.location))[0]}.`,
      `The ${shuffle(TOOLS.filter(t => t !== answer.tool))[0]} was NOT used.`,
      `Someone heard noises from the ${answer.location} area.`,
      `The culprit was seen wearing something ${answer.suspect.emoji === "🎩" ? "formal" : "unusual"}.`,
      `A ${answer.tool.toLowerCase()} was found near the scene.`,
      `Witnesses say the culprit had access to the ${answer.location}.`,
      `The ${answer.suspect.name.split(" ")[1]} family has a history here.`,
    ];
    const unused = cluePool.filter(c => !clues.includes(c));
    if (unused.length > 0) {
      setClues(prev => [...prev, unused[Math.floor(Math.random()*unused.length)]]);
      setRound(r => r + 1);
    }
  };

  const submitGuess = () => {
    let pts = 0;
    if (guess.suspect === answer.suspect.name) pts += 100;
    if (guess.location === answer.location) pts += 100;
    if (guess.tool === answer.tool) pts += 100;
    if (round <= 3 && pts === 300) pts += 50; // Early solve bonus
    setScore(pts);
    saveHighScore("who-did-it", pts, "normal", true);
    setPhase("result");
  };

  return (
    <div className="min-h-screen bg-[#060a14] p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-1/4 w-72 h-72 rounded-full blur-[100px] opacity-20 bg-purple-500" />
        <div className="absolute bottom-10 left-1/3 w-64 h-64 rounded-full blur-[100px] opacity-15 bg-fuchsia-400" />
      </div>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="flex items-center gap-2 text-white/70 hover:text-white">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-violet-400 to-fuchsia-400">🕵️ Who Did It?</h1>
          <p className="text-sm text-white/60">Clue {round}/8</p>
        </div>

        <div className="bg-black/30 rounded-xl p-4 border border-purple-500/20 mb-4">
          <p className="text-sm text-purple-300 mb-2">🔍 The Mystery:</p>
          <p className="text-white font-semibold">Someone stole the golden trophy! Who did it, where, and with what?</p>
        </div>

        {phase === "clue" && (
          <>
            {/* Clues */}
            <div className="space-y-2 mb-4">
              {clues.map((clue, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm text-white/80">
                  <span className="text-purple-400 font-bold">Clue {i+1}:</span> {clue}
                </motion.div>
              ))}
            </div>

            <div className="flex gap-3">
              {round < 8 && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={generateClue}
                  className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-500">
                  <Search className="w-4 h-4 inline mr-2" />Get Clue ({8-round} left)
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPhase("guess")}
                className="flex-1 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400">
                Make Accusation!
              </motion.button>
            </div>
          </>
        )}

        {phase === "guess" && (
          <div className="space-y-4">
            <p className="text-white font-bold text-center text-lg">Make Your Accusation!</p>

            <div>
              <p className="text-xs text-white/60 mb-2">WHO did it?</p>
              <div className="grid grid-cols-2 gap-2">
                {SUSPECTS.map(s => (
                  <button key={s.name} onClick={() => setGuess(g => ({...g, suspect: s.name}))}
                    className={`p-2 rounded-lg text-sm font-semibold transition-all ${guess.suspect === s.name ? "bg-purple-500 text-white" : "bg-white/10 text-white/70"}`}>
                    {s.emoji} {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-white/60 mb-2">WHERE?</p>
              <div className="grid grid-cols-2 gap-2">
                {LOCATIONS.map(l => (
                  <button key={l} onClick={() => setGuess(g => ({...g, location: l}))}
                    className={`p-2 rounded-lg text-sm font-semibold transition-all ${guess.location === l ? "bg-orange-500 text-white" : "bg-white/10 text-white/70"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-white/60 mb-2">WITH WHAT?</p>
              <div className="grid grid-cols-2 gap-2">
                {TOOLS.map(t => (
                  <button key={t} onClick={() => setGuess(g => ({...g, tool: t}))}
                    className={`p-2 rounded-lg text-sm font-semibold transition-all ${guess.tool === t ? "bg-yellow-500 text-black" : "bg-white/10 text-white/70"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <motion.button whileTap={{ scale: 0.95 }} onClick={submitGuess}
              disabled={!guess.suspect || !guess.location || !guess.tool}
              className="w-full py-3 bg-red-500 text-white font-bold rounded-lg disabled:opacity-30 hover:bg-red-400">
              🔒 Submit Accusation
            </motion.button>
          </div>
        )}

        {phase === "result" && (<><ConfettiEffect trigger={score >= 200} />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center p-6 rounded-xl bg-black/40 border border-yellow-500/30">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="text-lg text-white mb-2">The Answer:</p>
            <p className="text-xl font-bold text-yellow-400 mb-1">{answer.suspect.emoji} {answer.suspect.name}</p>
            <p className="text-white/80 mb-1">in the <span className="text-orange-400 font-bold">{answer.location}</span></p>
            <p className="text-white/80 mb-4">with the <span className="text-yellow-400 font-bold">{answer.tool}</span></p>

            <div className="space-y-1 mb-4">
              <p className={`text-sm ${guess.suspect === answer.suspect.name ? "text-green-400" : "text-red-400"}`}>
                {guess.suspect === answer.suspect.name ? "✅" : "❌"} Suspect: {guess.suspect}
              </p>
              <p className={`text-sm ${guess.location === answer.location ? "text-green-400" : "text-red-400"}`}>
                {guess.location === answer.location ? "✅" : "❌"} Location: {guess.location}
              </p>
              <p className={`text-sm ${guess.tool === answer.tool ? "text-green-400" : "text-red-400"}`}>
                {guess.tool === answer.tool ? "✅" : "❌"} Tool: {guess.tool}
              </p>
            </div>

            <p className="text-3xl font-black text-yellow-400 mb-4">{score} points!</p>
            <button onClick={onClose} className="px-6 py-2 bg-purple-500 text-white font-bold rounded-lg">Back to Games</button>
          </motion.div></>
        )}
      </div>
    </div>
  );
}
