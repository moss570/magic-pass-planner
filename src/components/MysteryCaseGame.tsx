import { saveHighScore } from "@/lib/gameScores";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Pause, Play, Search, Lock, Unlock, Clock } from "lucide-react";

// ─── Procedural Mystery Generation ───────────────────────
const CASE_NAMES = [
  "The Stolen Painting", "The Missing Diamond", "The Vanishing Guest", "The Secret Letter",
  "The Broken Clock", "The Hidden Passage", "The Mysterious Footprints", "The Locked Room",
  "The Forged Document", "The Silent Witness", "The Midnight Intruder", "The Coded Message",
  "The Missing Heirloom", "The Poisoned Cup", "The Double Identity", "The Phantom Caller",
];

const SUSPECTS = [
  { name: "Detective Parker", trait: "analytical", emoji: "🕵️" },
  { name: "Chef Romano", trait: "temperamental", emoji: "👨‍🍳" },
  { name: "Professor Blake", trait: "secretive", emoji: "👩‍🏫" },
  { name: "Mayor Sullivan", trait: "ambitious", emoji: "🎩" },
  { name: "Artist Luna", trait: "eccentric", emoji: "🎨" },
  { name: "Reporter Quinn", trait: "nosy", emoji: "📰" },
  { name: "Doctor Chen", trait: "meticulous", emoji: "🩺" },
  { name: "Captain Rivers", trait: "disciplined", emoji: "⚓" },
  { name: "Librarian Frost", trait: "quiet", emoji: "📚" },
  { name: "Musician Jazz", trait: "charismatic", emoji: "🎸" },
];

const LOCATIONS = [
  "Kitchen", "Garden", "Ballroom", "Library", "Dining Hall", "Hallway",
  "Rooftop", "Basement", "Study", "Gallery", "Courtyard", "Wine Cellar",
];

const MOTIVES = [
  "revenge", "greed", "jealousy", "blackmail", "desperation", "power",
  "love", "fear", "ambition", "betrayal",
];

const EVIDENCE_TYPES = [
  "fingerprints", "a torn letter", "muddy footprints", "a broken watch",
  "a dropped key", "a stained napkin", "security footage", "a voice recording",
  "a hidden note", "a suspicious receipt",
];

interface CaseData {
  caseName: string;
  culprit: typeof SUSPECTS[0];
  location: string;
  motive: string;
  suspects: typeof SUSPECTS;
  clueLines: ClueLine[];
}

interface ClueLine {
  id: number;
  text: string;
  challengeType: "multiple_choice" | "true_false" | "deduction";
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  unlocked: boolean;
  solved: boolean;
}

function generateCase(): CaseData {
  const shuffled = [...SUSPECTS].sort(() => Math.random() - 0.5);
  const caseSuspects = shuffled.slice(0, 5);
  const culprit = caseSuspects[Math.floor(Math.random() * caseSuspects.length)];
  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const motive = MOTIVES[Math.floor(Math.random() * MOTIVES.length)];
  const caseName = CASE_NAMES[Math.floor(Math.random() * CASE_NAMES.length)];
  const evidence = EVIDENCE_TYPES[Math.floor(Math.random() * EVIDENCE_TYPES.length)];

  const innocents = caseSuspects.filter(s => s.name !== culprit.name);

  const clueLines: ClueLine[] = [
    {
      id: 1, text: `The incident occurred somewhere in the building. Witnesses heard something from the ${location} area.`,
      challengeType: "multiple_choice",
      question: "Based on this clue, which area should we investigate first?",
      options: [location, ...LOCATIONS.filter(l => l !== location).slice(0, 3)],
      correctAnswer: location, points: 50, unlocked: true, solved: false,
    },
    {
      id: 2, text: `${innocents[0].name} has a solid alibi — they were seen in the ${LOCATIONS[Math.floor(Math.random()*LOCATIONS.length)]} at the time.`,
      challengeType: "true_false",
      question: `Can we rule out ${innocents[0].name} as a suspect?`,
      options: ["Yes, they have an alibi", "No, alibis can be faked"],
      correctAnswer: "Yes, they have an alibi", points: 30, unlocked: false, solved: false,
    },
    {
      id: 3, text: `Evidence found: ${evidence} near the scene. This narrows down our suspects.`,
      challengeType: "multiple_choice",
      question: `${evidence.charAt(0).toUpperCase() + evidence.slice(1)} were found. Who is most likely connected?`,
      options: [culprit.name, ...innocents.slice(0, 3).map(s => s.name)].sort(() => Math.random() - 0.5),
      correctAnswer: culprit.name, points: 75, unlocked: false, solved: false,
    },
    {
      id: 4, text: `Investigation reveals the motive was likely ${motive}. One suspect had a clear reason.`,
      challengeType: "multiple_choice",
      question: `Which suspect had a motive of ${motive}?`,
      options: [culprit.name, ...innocents.slice(0, 3).map(s => s.name)].sort(() => Math.random() - 0.5),
      correctAnswer: culprit.name, points: 75, unlocked: false, solved: false,
    },
    {
      id: 5, text: `${innocents[1]?.name || innocents[0].name} was questioned and revealed key information about the ${location}.`,
      challengeType: "true_false",
      question: "Does this testimony point toward the culprit being familiar with the location?",
      options: ["Yes, they knew the layout", "No, it was random"],
      correctAnswer: "Yes, they knew the layout", points: 30, unlocked: false, solved: false,
    },
    {
      id: 6, text: `Security records show ${culprit.name} was near the ${location} during the incident. They claim it was coincidental.`,
      challengeType: "deduction",
      question: "Given all evidence so far, who is the prime suspect?",
      options: caseSuspects.map(s => s.name).sort(() => Math.random() - 0.5),
      correctAnswer: culprit.name, points: 100, unlocked: false, solved: false,
    },
  ];

  return { caseName, culprit, location, motive, suspects: caseSuspects, clueLines };
}

export default function MysteryCaseGame({ onClose }: { onClose: () => void }) {
  const [caseData] = useState(generateCase);
  const [clues, setClues] = useState(caseData.clueLines);
  const [currentClue, setCurrentClue] = useState(0);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);

  // Timer
  useEffect(() => {
    if (paused || gameOver) return;
    const t = setInterval(() => setTimeSpent(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [paused, gameOver]);

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  const submitAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    const clue = clues[currentClue];
    const correct = answer === clue.correctAnswer;
    setAnswerResult(correct);

    if (correct) setScore(s => s + clue.points);

    setTimeout(() => {
      const newClues = [...clues];
      newClues[currentClue].solved = true;
      if (currentClue + 1 < newClues.length) {
        newClues[currentClue + 1].unlocked = true;
        setCurrentClue(c => c + 1);
      } else {
        setGameOver(true);
        saveHighScore("mystery-case", score + (correct ? clue.points : 0), "normal", true);
      }
      setClues(newClues);
      setSelectedAnswer(null);
      setAnswerResult(null);
    }, 1500);
  };

  if (paused) {
    return (
      <div className="min-h-screen bg-[#060a14] p-4 flex items-center justify-center relative overflow-hidden"><div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full blur-[100px] opacity-20 bg-amber-500" /></div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center p-8 rounded-2xl bg-black/50 border border-yellow-500/20 max-w-md w-full">
          <Pause className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Case Paused</h2>
          <p className="text-white/60 mb-2">"{caseData.caseName}"</p>
          <p className="text-sm text-white/40 mb-6">Clue {currentClue + 1}/{clues.length} • {formatTime(timeSpent)} elapsed</p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPaused(false)}
            className="w-full py-3 bg-yellow-500 text-black font-bold rounded-xl mb-3">
            <Play className="w-5 h-5 inline mr-2" /> Resume Investigation
          </motion.button>
          <button onClick={onClose} className="w-full py-2 text-white/40 hover:text-white text-sm">Abandon Case</button>
        </motion.div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a1a2e] to-[#0a0a1a] p-4 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 rounded-2xl bg-black/50 border border-yellow-500/20 max-w-md w-full">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Case Solved!</h2>
          <p className="text-white/60 mb-1">"{caseData.caseName}"</p>
          <p className="text-lg text-yellow-400 mb-1">It was {caseData.culprit.emoji} {caseData.culprit.name}</p>
          <p className="text-sm text-white/40 mb-1">in the {caseData.location} • motive: {caseData.motive}</p>
          <p className="text-sm text-white/40 mb-4">Time: {formatTime(timeSpent)}</p>
          <p className="text-4xl font-black text-yellow-400 mb-6">{score} points</p>
          <button onClick={onClose} className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl">Back to Games</button>
        </motion.div>
      </div>
    );
  }

  const clue = clues[currentClue];

  return (
    <div className="min-h-screen bg-[#060a14] p-4 relative overflow-hidden"><div className="fixed inset-0 pointer-events-none"><div className="absolute top-20 right-1/4 w-72 h-72 rounded-full blur-[100px] opacity-20 bg-amber-500" /><div className="absolute bottom-20 left-1/3 w-64 h-64 rounded-full blur-[100px] opacity-15 bg-yellow-400" /></div>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="text-white/60 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <div className="text-center">
            <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400">🔍 {caseData.caseName}</h1>
            <p className="text-xs text-white/40">Clue {currentClue + 1}/{clues.length}</p>
          </div>
          <button onClick={() => setPaused(true)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
            <Pause className="w-5 h-5 text-yellow-400" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex justify-between mb-4 text-sm">
          <span className="text-yellow-400 font-bold">Score: {score}</span>
          <span className="flex items-center gap-1 text-white/40"><Clock className="w-4 h-4" /> {formatTime(timeSpent)}</span>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {clues.map((c, i) => (
            <div key={i} className={`flex-1 h-2 rounded-full ${
              c.solved ? "bg-green-500" : c.unlocked ? "bg-yellow-500/50" : "bg-white/10"}`} />
          ))}
        </div>

        {/* Suspects */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {caseData.suspects.map(s => (
            <div key={s.name} className="flex-shrink-0 text-center px-2 py-1 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xl">{s.emoji}</p>
              <p className="text-xs text-white/60 whitespace-nowrap">{s.name.split(" ")[1]}</p>
            </div>
          ))}
        </div>

        {/* Current Clue */}
        <motion.div key={currentClue} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-black/30 rounded-xl p-5 border border-yellow-500/20 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-5 h-5 text-yellow-400" />
            <span className="text-xs text-yellow-400 font-semibold">CLUE #{currentClue + 1}</span>
            <span className="text-xs text-white/30 ml-auto">+{clue.points} pts</span>
          </div>
          <p className="text-white/90 text-sm leading-relaxed mb-4">{clue.text}</p>
          <p className="text-white font-semibold text-sm mb-3">{clue.question}</p>

          <div className="space-y-2">
            {clue.options.map(opt => (
              <motion.button key={opt} whileTap={{ scale: 0.98 }} onClick={() => submitAnswer(opt)}
                className={`w-full p-3 rounded-lg text-left text-sm font-semibold transition-all border
                  ${selectedAnswer === opt
                    ? (opt === clue.correctAnswer ? "bg-green-500/20 border-green-500 text-green-300" : "bg-red-500/20 border-red-500 text-red-300")
                    : selectedAnswer && opt === clue.correctAnswer
                      ? "bg-green-500/20 border-green-500 text-green-300"
                      : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"}`}>
                {opt}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
