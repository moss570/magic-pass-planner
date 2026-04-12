/**
 * Mystery at Adventure World — V2
 * Award-winning detective game
 * Time-gated, investigation board, deduction challenges
 * GPT-4 unique stories, GPS triggers, 3-4 hour gameplay
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, MapPin, MessageCircle, Lightbulb, Trophy,
  Clock, ChevronRight, Eye, BookOpen, AlertTriangle, Pin, Link2,
  Lock, Unlock, Brain, CheckCircle, XCircle, RotateCcw, Pause, Play
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ConfettiEffect from "@/components/ConfettiEffect";

// ─── Types ─────────────────────────────────────────────────
interface Suspect {
  id: string; name: string; role: string; description: string;
  motive: string; alibi: string; isCulprit: boolean; isAccomplice: boolean;
  interrogation: { about_crime: string; about_alibi: string; about_others: string; contradiction: string };
}

interface Clue {
  id: string; text: string; category: "witness" | "evidence" | "location" | "motive";
  act: number; revealed: boolean; isRedHerring: boolean; points: number; zone: string;
}

interface BoardNote {
  id: string; clueId?: string; suspectId?: string; text: string; pinned: boolean;
  connectedTo: string[]; // IDs of connected notes
}

interface DeductionQuestion {
  question: string; options: string[]; correctIndex: number; explanation: string;
}

interface MysteryData {
  title: string; crime: string; introStory: string; suspects: Suspect[];
  clues: Clue[]; twist: string; secondaryMystery: string; resolution: string;
  culpritId: string; accompliceId: string; motive: string; method: string; timeline: string;
}

// ─── Constants ─────────────────────────────────────────────
const CLUE_COOLDOWN_MS = 5 * 60 * 1000; // 5 min between clues
const INTERROGATION_COOLDOWN_MS = 10 * 60 * 1000; // 10 min between interrogations
const ACT_UNLOCK_THRESHOLD = 0.6; // Must find 60% of act clues to advance

const SHAME_MESSAGES = [
  "🐑 {name} just used a hint! The Black Sheep strikes again!",
  "🔍 {name} needed help... SOMEONE skipped detective school!",
  "🤦 {name} used a hint. Sherlock is rolling in his grave!",
  "🐔 Bawk bawk! {name} chickened out and used a hint!",
  "🧠 {name}'s brain took a coffee break — hint activated!",
  "🕵️ BREAKING: {name} is officially the WORST detective!",
  "📖 {name} peeked at the answer key. Classic rookie!",
  "😂 {name} needed a hint. We won't tell... oh wait!",
];

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  witness: { icon: "👁️", color: "#4ECDC4", label: "Witness" },
  evidence: { icon: "🔬", color: "#FF6B6B", label: "Evidence" },
  location: { icon: "📍", color: "#FFD93D", label: "Location" },
  motive: { icon: "💭", color: "#B19CD9", label: "Motive" },
};

const DEDUCTION_CHALLENGES: Record<number, DeductionQuestion[]> = {
  1: [
    { question: "Based on the clues so far, which type of crime does this appear to be?", options: ["Crime of passion", "Premeditated scheme", "Accident covered up", "Inside job"], correctIndex: 1, explanation: "The professional execution and planning suggests premeditation." },
    { question: "How many suspects have alibi inconsistencies?", options: ["None yet", "One", "Two", "Three or more"], correctIndex: 1, explanation: "At least one suspect's story doesn't add up with the evidence." },
  ],
  2: [
    { question: "Which suspect's alibi has the biggest gap?", options: ["The one who was 'working late'", "The one at the 'bowling alley'", "The one in the 'workshop'", "The one at the 'charity dinner'"], correctIndex: 0, explanation: "Security footage contradicts their claim of being at work." },
    { question: "The evidence suggests how many people were involved?", options: ["One person alone", "Two people working together", "Three conspirators", "The whole staff"], correctIndex: 1, explanation: "A witness saw TWO people, and the method required technical expertise plus planning." },
  ],
  3: [
    { question: "After the twist, what should you re-examine first?", options: ["The original timeline", "Everyone's financial records", "Physical evidence dates", "Witness reliability"], correctIndex: 2, explanation: "The twist changes WHEN the crime happened — physical evidence dates are now critical." },
  ],
};

// ─── Fallback Mystery (same as before but abbreviated for space) ───
const FALLBACK_MYSTERY: MysteryData = {
  title: "The Carousel Caper",
  crime: "The legendary Golden Horse — Adventure World's most prized carousel figure — has vanished overnight.",
  introStory: "It was supposed to be a perfect day at Adventure World. The sun was shining, the cotton candy was flowing, and the new summer season was off to a record-breaking start. But when Head Groundskeeper Martha Wiggins arrived at 6 AM to polish the famous Golden Horse on the Grand Carousel, she found an empty pole where the 200-pound golden stallion should have been.\n\nThe Golden Horse wasn't just any decoration — it was Adventure World's mascot, hand-crafted by the park's founder 40 years ago and worth an estimated $2 million. Its disappearance sent shockwaves through the park staff.\n\nPark Director Theodore 'Teddy' Pemberton III called an emergency meeting. 'Nobody leaves this park until we find that horse,' he declared, adjusting his bow tie nervously. 'And somebody get me a detective!'\n\nThat's where you come in. You and your team of investigators have been called to solve the mystery before the park opens to the public. The clock is ticking, the suspects are sweating, and somewhere in Adventure World, a golden horse is waiting to be found.",
  suspects: [
    { id: "s1", name: "Dizzy Dave Delacroix", role: "Carousel Operator (20 years)", description: "A wiry man in his 50s with paint-stained overalls and a nervous twitch.", motive: "His beloved horse was being replaced", alibi: "Bowling until midnight", isCulprit: false, isAccomplice: false, interrogation: { about_crime: "I would NEVER hurt my babies! That horse is family!", about_alibi: "I bowled a 180 that night! Ask anyone at Sunset Lanes!", about_others: "Widget Wendy's been acting suspicious. She measured the horse last week.", contradiction: "Says he left at midnight but bowling alley closes at 11 PM." } },
    { id: "s2", name: "Widget Wendy Wu", role: "Head of Merchandise", description: "A sharp-dressed businesswoman always on her tablet calculating profit margins.", motive: "Researching 'how to sell antiques internationally'", alibi: "Working late on inventory", isCulprit: true, isAccomplice: false, interrogation: { about_crime: "A terrible loss for the brand. We'll need replacement merchandise immediately.", about_alibi: "I was in my office until 2 AM. Security cameras can confirm.", about_others: "Professor Peculiar has been sneaking around the maintenance tunnels.", contradiction: "Security footage shows her office lights off after 10 PM." } },
    { id: "s3", name: "Professor Peculiar Pete", role: "Park Engineer & Inventor", description: "Wild-haired eccentric in a grease-stained lab coat.", motive: "Needs rare golden alloy for his 'invention'", alibi: "In workshop working on secret project", isCulprit: false, isAccomplice: true, interrogation: { about_crime: "Fascinating! The engineering required to remove a 200-pound figure... purely hypothetically!", about_alibi: "I was calibrating my Whirligig 3000. Science never sleeps!", about_others: "Dizzy Dave has been more emotional than usual. Maybe he snapped.", contradiction: "Workshop log shows he left at 9 PM and returned at 3 AM." } },
    { id: "s4", name: "Jolly Janet Jimenez", role: "Head Chef, Main Street Grill", description: "A boisterous woman who laughs at everything, even when nothing's funny.", motive: "Carousel area is scheduled for her restaurant expansion", alibi: "Prepping special sauce all night", isCulprit: false, isAccomplice: false, interrogation: { about_crime: "HA HA HA! Who would steal a HORSE? ...wait, it's actually missing?", about_alibi: "My sauce takes 14 hours! I was stirring ALL night!", about_others: "Teddy's been acting weird about the insurance lately.", contradiction: "Kitchen staff says she left at 8 PM." } },
    { id: "s5", name: "Theodore 'Teddy' Pemberton III", role: "Park Director", description: "A pompous man in a three-piece suit who sweats when nervous.", motive: "Park in financial trouble — insurance payout saves budget", alibi: "At a charity dinner downtown", isCulprit: false, isAccomplice: false, interrogation: { about_crime: "This is a DISASTER! Do you know what this does to our stock price?!", about_alibi: "I was at the Mayor's Gala until 11 PM. 200 witnesses!", about_others: "I trust my staff completely. Well, mostly.", contradiction: "Gala ended at 9 PM, not 11 PM." } },
  ],
  clues: [
    { id: "c1", text: "A trail of golden glitter leads from the carousel to the maintenance tunnels. The glitter is flaking paint, not decorative.", category: "evidence", act: 1, revealed: false, isRedHerring: false, points: 10, zone: "ride_line" },
    { id: "c2", text: "Security camera near the carousel was 'malfunctioning' between 10 PM and 2 AM. Someone manually disabled it.", category: "evidence", act: 1, revealed: false, isRedHerring: false, points: 15, zone: "ride_line" },
    { id: "c3", text: "A large dolly cart rated for 300 pounds is missing from the maintenance shed.", category: "evidence", act: 1, revealed: false, isRedHerring: false, points: 10, zone: "merchandise" },
    { id: "c4", text: "A witness saw someone in a lab coat near the carousel at 11 PM carrying tools.", category: "witness", act: 1, revealed: false, isRedHerring: false, points: 15, zone: "ride_line" },
    { id: "c5", text: "Dizzy Dave's locker has a framed photo: him hugging the Golden Horse — 'Best Friends Forever.'", category: "motive", act: 1, revealed: false, isRedHerring: true, points: 5, zone: "ride_line" },
    { id: "c6", text: "A mysterious van in the employee lot at midnight. License plate: partially obscured.", category: "location", act: 1, revealed: false, isRedHerring: true, points: 5, zone: "restaurant" },
    { id: "c7", text: "The carousel's security bolt was unscrewed professionally — this wasn't smash-and-grab.", category: "evidence", act: 1, revealed: false, isRedHerring: false, points: 10, zone: "ride_line" },
    { id: "c8", text: "Wendy's tablet shows recent searches for 'international antique shipping' and 'golden horse value estimate.'", category: "motive", act: 1, revealed: false, isRedHerring: false, points: 20, zone: "merchandise" },
    { id: "c9", text: "Bowling alley confirms they close at 11 PM, not midnight. Dave's alibi has a 1-hour gap.", category: "witness", act: 2, revealed: false, isRedHerring: false, points: 10, zone: "restaurant" },
    { id: "c10", text: "Pete's workshop log: exit at 9 PM, re-entry at 3 AM. Where was he for 6 hours?", category: "evidence", act: 2, revealed: false, isRedHerring: false, points: 15, zone: "ride_line" },
    { id: "c11", text: "Wendy's office security footage: lights off after 10 PM. She wasn't working late.", category: "evidence", act: 2, revealed: false, isRedHerring: false, points: 20, zone: "merchandise" },
    { id: "c12", text: "A maintenance worker saw TWO people in the tunnels around midnight.", category: "witness", act: 2, revealed: false, isRedHerring: false, points: 15, zone: "ride_line" },
    { id: "c13", text: "Janet's special sauce recipe was found in the carousel control room. Odd place for a recipe.", category: "evidence", act: 2, revealed: false, isRedHerring: true, points: 5, zone: "restaurant" },
    { id: "c14", text: "Teddy recently increased the Golden Horse's insurance from $500K to $2M.", category: "motive", act: 2, revealed: false, isRedHerring: false, points: 15, zone: "restaurant" },
    { id: "c15", text: "TWIST: The Golden Horse is found — but it's a REPLICA! The real one was switched WEEKS ago!", category: "evidence", act: 3, revealed: false, isRedHerring: false, points: 25, zone: "ride_line" },
    { id: "c16", text: "A receipt for custom horse sculpture supplies — ordered 3 weeks ago — in Wendy's desk.", category: "evidence", act: 3, revealed: false, isRedHerring: false, points: 20, zone: "merchandise" },
    { id: "c17", text: "Pete's 'invention' blueprints include a device that looks like a carousel horse removal tool.", category: "evidence", act: 3, revealed: false, isRedHerring: false, points: 20, zone: "ride_line" },
    { id: "c18", text: "A shipping receipt in Wendy's name: 200-pound package to an overseas address, dated two weeks ago.", category: "evidence", act: 4, revealed: false, isRedHerring: false, points: 30, zone: "merchandise" },
    { id: "c19", text: "Pete's bank: $50,000 deposit from Wendy's personal account last month.", category: "motive", act: 4, revealed: false, isRedHerring: false, points: 25, zone: "restaurant" },
    { id: "c20", text: "Teddy disabled the cameras himself — he was sneaking midnight kitchen snacks (he's on a diet his wife monitors!).", category: "evidence", act: 4, revealed: false, isRedHerring: false, points: 10, zone: "restaurant" },
  ],
  twist: "The horse stolen last night was a REPLICA! Wendy swapped the real Golden Horse with a perfect copy two weeks earlier and shipped the original overseas. Last night's 'theft' was staged by Pete to create a false timeline.",
  secondaryMystery: "Who disabled the security cameras? Teddy — sneaking midnight snacks on his wife-monitored diet! 😄",
  resolution: "Widget Wendy Wu's plan was almost perfect — swap the real horse with a replica, ship the original overseas, then stage a dramatic 'theft' to throw off any investigation.\n\nBut they didn't count on a team of brilliant detectives. Wendy's search history, Pete's unexplained absence, and the crucial discovery that the stolen horse was a replica — it all added up.\n\nAs park security escorted Wendy and Pete away, Dizzy Dave sobbed with relief: 'I KNEW my horse didn't run away!' The Golden Horse was recovered from a shipping container in Miami.\n\nAs for Teddy's midnight kitchen raids? His wife found out anyway. Some mysteries solve themselves. 😄",
  culpritId: "s2", accompliceId: "s3",
  motive: "Wendy planned to sell the real Golden Horse to a private collector for $2 million. She enlisted Pete, promising to fund his inventions.",
  method: "Commission replica → Swap real horse at night → Ship overseas → Stage 'theft' of replica as cover.",
  timeline: "3 weeks ago: Replica ordered. 2 weeks ago: Swap executed. 1 week ago: Real horse shipped. Last night: Fake theft staged.",
};

interface Props {
  onClose: () => void;
  duration?: "all_day" | "half_day";
  playerName?: string;
}

export default function MysteryGame({ onClose, duration: initialDuration = "all_day", playerName = "Detective" }: Props) {
  // ─── State ───────────────────────────────────────────────
  const [duration] = useState(initialDuration);
  const [mystery, setMystery] = useState<MysteryData | null>(null);
  const [phase, setPhase] = useState<"loading" | "intro" | "investigating" | "deduction" | "voting" | "results">("loading");
  const [currentAct, setCurrentAct] = useState(1);
  const [revealedClues, setRevealedClues] = useState<Set<string>>(new Set());
  const [boardNotes, setBoardNotes] = useState<BoardNote[]>([]);
  const [interrogatedSuspects, setInterrogatedSuspects] = useState<Map<string, Set<string>>>(new Map());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [generating, setGenerating] = useState(false);

  // Cooldowns
  const [lastClueTime, setLastClueTime] = useState(0);
  const [lastInterrogationTime, setLastInterrogationTime] = useState(0);
  const [clueCooldownLeft, setClueCooldownLeft] = useState(0);
  const [interrogationCooldownLeft, setInterrogationCooldownLeft] = useState(0);

  // UI state
  const [shameMessage, setShameMessage] = useState("");
  const [showShame, setShowShame] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);
  const [interrogationTopic, setInterrogationTopic] = useState<string | null>(null);
  const [interrogationResponse, setInterrogationResponse] = useState("");
  const [vote, setVote] = useState("");
  const [accompliceVote, setAccompliceVote] = useState("");
  const [showTwist, setShowTwist] = useState(false);
  const [tab, setTab] = useState<"clues" | "suspects" | "board">("clues");
  const [startTime] = useState(Date.now());
  const [showConfetti, setShowConfetti] = useState(false);
  const [paused, setPaused] = useState(false);
  const [deductionAnswers, setDeductionAnswers] = useState<Map<number, boolean>>(new Map());
  const [showDeduction, setShowDeduction] = useState(false);
  const [currentDeductionQ, setCurrentDeductionQ] = useState(0);

  // ─── Cooldown Timer ──────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const clueRemaining = Math.max(0, CLUE_COOLDOWN_MS - (now - lastClueTime));
      const intRemaining = Math.max(0, INTERROGATION_COOLDOWN_MS - (now - lastInterrogationTime));
      setClueCooldownLeft(Math.ceil(clueRemaining / 1000));
      setInterrogationCooldownLeft(Math.ceil(intRemaining / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastClueTime, lastInterrogationTime]);

  // ─── Initialize ──────────────────────────────────────────
  useEffect(() => {
    const generate = async () => {
      setGenerating(true);
      try {
        const { data, error } = await supabase.functions.invoke("generate-mystery", { body: { duration } });
        if (!error && data?.mystery) { setMystery(data.mystery); setPhase("intro"); return; }
      } catch {}
      setMystery(FALLBACK_MYSTERY);
      setPhase("intro");
      setGenerating(false);
    };
    generate();
  }, [duration]);

  // ─── Helpers ─────────────────────────────────────────────
  const actClues = (act: number) => mystery?.clues.filter(c => c.act === act) || [];
  const revealedInAct = (act: number) => actClues(act).filter(c => revealedClues.has(c.id));
  const actProgress = (act: number) => {
    const total = actClues(act).length;
    return total > 0 ? revealedInAct(act).length / total : 0;
  };
  const canAdvanceAct = () => actProgress(currentAct) >= ACT_UNLOCK_THRESHOLD;
  const allFoundClues = mystery?.clues.filter(c => revealedClues.has(c.id)) || [];
  const elapsedMin = Math.round((Date.now() - startTime) / 60000);
  const formatCooldown = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ─── Search (time-gated) ─────────────────────────────────
  const searchForClue = () => {
    if (!mystery || clueCooldownLeft > 0 || paused) return;
    const available = actClues(currentAct).filter(c => !revealedClues.has(c.id));
    if (available.length === 0) return;

    const clue = available[Math.floor(Math.random() * available.length)];
    setRevealedClues(prev => new Set([...prev, clue.id]));
    setLastClueTime(Date.now());

    // Auto-add to board
    setBoardNotes(prev => [...prev, {
      id: `note-${clue.id}`,
      clueId: clue.id,
      text: clue.text,
      pinned: false,
      connectedTo: [],
    }]);
  };

  // ─── Use Hint (with shame) ──────────────────────────────
  const useHint = () => {
    if (!mystery) return;
    const available = actClues(currentAct).filter(c => !revealedClues.has(c.id) && !c.isRedHerring);
    if (available.length === 0) return;

    const clue = available[0];
    setRevealedClues(prev => new Set([...prev, clue.id]));
    setHintsUsed(h => h + 1);
    // NO cooldown for hints (penalty is shame + score reduction)

    setBoardNotes(prev => [...prev, { id: `note-${clue.id}`, clueId: clue.id, text: clue.text, pinned: false, connectedTo: [] }]);

    const msg = SHAME_MESSAGES[Math.floor(Math.random() * SHAME_MESSAGES.length)].replace("{name}", playerName);
    setShameMessage(msg);
    setShowShame(true);
    setTimeout(() => setShowShame(false), 4000);
  };

  // ─── Interrogate (time-gated) ────────────────────────────
  const interrogate = (suspect: Suspect, topic: string) => {
    if (interrogationCooldownLeft > 0) return;
    const response = suspect.interrogation[topic as keyof typeof suspect.interrogation] || "No comment.";
    setInterrogationResponse(response);
    setInterrogationTopic(topic);
    setLastInterrogationTime(Date.now());

    // Track
    setInterrogatedSuspects(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(suspect.id) || new Set();
      existing.add(topic);
      newMap.set(suspect.id, existing);
      return newMap;
    });
  };

  // ─── Pin/Connect Notes ───────────────────────────────────
  const togglePin = (noteId: string) => {
    setBoardNotes(prev => prev.map(n => n.id === noteId ? { ...n, pinned: !n.pinned } : n));
  };

  const connectNotes = (noteId1: string, noteId2: string) => {
    setBoardNotes(prev => prev.map(n => {
      if (n.id === noteId1 && !n.connectedTo.includes(noteId2)) return { ...n, connectedTo: [...n.connectedTo, noteId2] };
      if (n.id === noteId2 && !n.connectedTo.includes(noteId1)) return { ...n, connectedTo: [...n.connectedTo, noteId1] };
      return n;
    }));
  };

  // ─── Advance Act ─────────────────────────────────────────
  const advanceAct = () => {
    if (!canAdvanceAct()) return;

    // Show deduction challenge first
    const questions = DEDUCTION_CHALLENGES[currentAct];
    if (questions && questions.length > 0 && !deductionAnswers.has(currentAct)) {
      setShowDeduction(true);
      setCurrentDeductionQ(0);
      return;
    }

    if (currentAct < 4) {
      setCurrentAct(a => a + 1);
      if (currentAct + 1 === 3) setShowTwist(true);
    } else {
      setPhase("voting");
    }
  };

  const handleDeductionAnswer = (answerIdx: number) => {
    const questions = DEDUCTION_CHALLENGES[currentAct];
    if (!questions) return;
    const q = questions[currentDeductionQ];
    const correct = answerIdx === q.correctIndex;

    if (currentDeductionQ < questions.length - 1) {
      setCurrentDeductionQ(i => i + 1);
    } else {
      // Done with deduction
      setDeductionAnswers(prev => new Map(prev).set(currentAct, correct));
      setShowDeduction(false);

      if (currentAct < 4) {
        setCurrentAct(a => a + 1);
        if (currentAct + 1 === 3) setShowTwist(true);
      } else {
        setPhase("voting");
      }
    }
  };

  // ─── Submit Vote ─────────────────────────────────────────
  const submitVote = () => {
    if (!vote || !mystery) return;
    setPhase("results");
    if (vote === mystery.culpritId) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  if (!mystery || generating) return (
    <div className="min-h-screen bg-[#060a14] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-sm">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="text-6xl mb-6 inline-block">🔮</motion.div>
        <h2 className="text-2xl font-black text-white mb-2">Generating Your Mystery...</h2>
        <p className="text-white/40 text-sm mb-4">AI is crafting a unique case. 15-30 seconds.</p>
        <div className="w-48 h-1.5 bg-white/10 rounded-full mx-auto overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full" animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} />
        </div>
        <button onClick={onClose} className="mt-6 text-white/30 text-sm hover:text-white">← Cancel</button>
      </motion.div>
    </div>
  );

  // ═══════ INTRO ═══════
  if (phase === "intro") return (
    <div className="min-h-screen bg-[#060a14] p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full blur-[100px] opacity-15 bg-amber-600" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full blur-[100px] opacity-10 bg-red-700" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto">
        <button onClick={onClose} className="flex items-center gap-1 text-white/50 hover:text-white text-sm mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="text-center">
            <span className="text-6xl block mb-3">🔍</span>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-red-400">{mystery.title}</h1>
            <p className="text-white/40 text-sm mt-2">{duration === "all_day" ? "All Day Mystery • ~3-4 hours" : "Half Day Mystery • ~1.5-2 hours"}</p>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <h3 className="text-base font-bold text-red-400 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> The Crime</h3>
            <p className="text-white/70 text-sm leading-relaxed">{mystery.crime}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-h-[40vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4" /> The Story</h3>
            {mystery.introStory.split("\n\n").map((p, i) => <p key={i} className="text-white/60 text-sm leading-relaxed mb-3">{p}</p>)}
          </div>

          <div>
            <h3 className="text-base font-bold text-white mb-2">🕵️ Suspects</h3>
            <div className="space-y-2 max-h-[30vh] overflow-y-auto">
              {mystery.suspects.map(s => (
                <div key={s.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="font-bold text-white text-sm">{s.name}</p>
                  <p className="text-white/30 text-xs">{s.role}</p>
                  <p className="text-white/50 text-xs mt-1">{s.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <h3 className="text-sm font-bold text-amber-400 mb-1">⏱️ How This Works</h3>
            <ul className="text-white/50 text-xs space-y-1">
              <li>• Search for clues every 5 minutes (time-gated)</li>
              <li>• Interrogate suspects every 10 minutes</li>
              <li>• Find 60% of clues in each act to advance</li>
              <li>• Answer deduction challenges between acts</li>
              <li>• Build your investigation board to track connections</li>
              <li>• Using hints shames you in front of your team! 😂</li>
              <li>• Pause anytime — pick up where you left off</li>
            </ul>
          </div>

          <button onClick={() => setPhase("investigating")}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-red-500 text-white font-black rounded-xl text-lg shadow-lg shadow-amber-500/20">
            🔍 Begin Investigation
          </button>
        </motion.div>
      </div>
    </div>
  );

  // ═══════ VOTING ═══════
  if (phase === "voting") return (
    <div className="min-h-screen bg-[#060a14] p-4 relative overflow-hidden">
      <div className="relative z-10 max-w-lg mx-auto space-y-5 py-4">
        <div className="text-center">
          <span className="text-5xl block mb-3">🗳️</span>
          <h2 className="text-2xl font-black text-white">Final Accusation</h2>
          <p className="text-white/40 text-sm">Who committed the crime? Choose wisely.</p>
          <p className="text-white/30 text-xs mt-1">Clues found: {revealedClues.size}/{mystery.clues.length} • Hints used: {hintsUsed} • Time: {elapsedMin}m</p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-red-400 mb-2">Primary Culprit *</h3>
          {mystery.suspects.map(s => {
            const questioned = interrogatedSuspects.get(s.id)?.size || 0;
            return (
              <button key={s.id} onClick={() => setVote(s.id)}
                className={`w-full text-left p-3 rounded-xl border mb-2 transition-all ${vote === s.id ? "bg-red-500/20 border-red-500/50" : "bg-white/5 border-white/10"}`}>
                <div className="flex justify-between">
                  <p className="font-bold text-white text-sm">{s.name}</p>
                  <span className="text-white/20 text-xs">{questioned}/4 questioned</span>
                </div>
                <p className="text-white/40 text-xs">{s.role}</p>
              </button>
            );
          })}
        </div>
        <div>
          <h3 className="text-sm font-bold text-orange-400 mb-2">Accomplice (optional)</h3>
          {mystery.suspects.filter(s => s.id !== vote).map(s => (
            <button key={s.id} onClick={() => setAccompliceVote(accompliceVote === s.id ? "" : s.id)}
              className={`w-full text-left p-2.5 rounded-xl border mb-1.5 transition-all ${accompliceVote === s.id ? "bg-orange-500/20 border-orange-500/50" : "bg-white/5 border-white/10"}`}>
              <p className="font-bold text-white text-xs">{s.name}</p>
            </button>
          ))}
        </div>
        <button onClick={submitVote} disabled={!vote}
          className={`w-full py-4 font-black rounded-xl text-lg ${vote ? "bg-gradient-to-r from-red-500 to-purple-500 text-white" : "bg-white/10 text-white/30"}`}>
          ⚖️ Submit Accusation
        </button>
      </div>
    </div>
  );

  // ═══════ RESULTS ═══════
  if (phase === "results") {
    const correct = vote === mystery.culpritId;
    const gotAccomplice = accompliceVote === mystery.accompliceId;
    const accuracy = correct ? 100 : gotAccomplice ? 50 : 0;
    const hintPenalty = Math.min(hintsUsed * 5, 30);
    const noHintBonus = hintsUsed === 0 ? 20 : 0;
    const deductionBonus = Array.from(deductionAnswers.values()).filter(Boolean).length * 10;
    const final = Math.max(0, accuracy - hintPenalty + noHintBonus + deductionBonus);

    return (
      <div className="min-h-screen bg-[#060a14] p-4 relative overflow-hidden">
        <ConfettiEffect trigger={showConfetti} />
        <div className="relative z-10 max-w-lg mx-auto space-y-5 py-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            {correct ? <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3" /> : <span className="text-6xl block mb-3">🤔</span>}
            <h2 className="text-3xl font-black text-white">{correct ? "CASE SOLVED!" : "Not Quite..."}</h2>
          </motion.div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-white/40">Accuracy</span><span className="text-yellow-400 font-bold">{accuracy}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Hint Penalty</span><span className="text-red-400">-{hintPenalty}</span></div>
            <div className="flex justify-between"><span className="text-white/40">No Hint Bonus</span><span className="text-green-400">+{noHintBonus}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Deduction Bonus</span><span className="text-blue-400">+{deductionBonus}</span></div>
            <div className="border-t border-white/10 pt-2 flex justify-between"><span className="font-bold text-white">Final Score</span><span className="text-2xl font-black text-yellow-400">{final}</span></div>
            <p className="text-white/20 text-xs">{elapsedMin}m • {revealedClues.size} clues • {hintsUsed} hints</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <h3 className="font-bold text-red-400 mb-2 text-sm">The Truth</h3>
            <p className="text-white/70 text-xs"><strong>Culprit:</strong> {mystery.suspects.find(s => s.id === mystery.culpritId)?.name}</p>
            {mystery.accompliceId && <p className="text-white/70 text-xs"><strong>Accomplice:</strong> {mystery.suspects.find(s => s.id === mystery.accompliceId)?.name}</p>}
            <p className="text-white/70 text-xs"><strong>Motive:</strong> {mystery.motive}</p>
            <p className="text-white/70 text-xs"><strong>Method:</strong> {mystery.method}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="font-bold text-white mb-2 text-sm">📖 Resolution</h3>
            {mystery.resolution.split("\n\n").map((p, i) => <p key={i} className="text-white/60 text-xs leading-relaxed mb-2">{p}</p>)}
          </div>
          <button onClick={onClose} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl">Back to Games</button>
        </div>
      </div>
    );
  }

  // ═══════ INVESTIGATING (Main Game Loop) ═══════
  const actClueCount = actClues(currentAct).length;
  const actFoundCount = revealedInAct(currentAct).length;
  const progress = actProgress(currentAct);
  const canAdvance = canAdvanceAct();

  return (
    <div className="min-h-screen bg-[#060a14] p-3 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-1/4 w-72 h-72 rounded-full blur-[100px] opacity-12 bg-amber-600" />
        <div className="absolute bottom-20 left-1/4 w-64 h-64 rounded-full blur-[100px] opacity-8 bg-red-700" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={onClose} className="text-white/40"><ArrowLeft className="w-4 h-4" /></button>
          <div className="text-center">
            <h1 className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-red-400">{mystery.title}</h1>
            <p className="text-[9px] text-white/25">Act {currentAct}/4 • {elapsedMin}m elapsed</p>
          </div>
          <button onClick={() => setPaused(!paused)} className={`text-xs px-2 py-1 rounded ${paused ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/30"}`}>
            {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>
        </div>

        {/* Pause overlay */}
        {paused && (
          <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center">
            <div className="text-center">
              <Pause className="w-12 h-12 text-white/40 mx-auto mb-3" />
              <p className="text-white text-lg font-bold">Investigation Paused</p>
              <p className="text-white/40 text-sm mb-4">Resume when you're back in line!</p>
              <button onClick={() => setPaused(false)} className="px-6 py-2 bg-amber-500 text-black font-bold rounded-lg">Resume</button>
            </div>
          </div>
        )}

        {/* Act Progress */}
        <div className="flex gap-1 mb-2">
          {[1, 2, 3, 4].map(act => (
            <div key={act} className={`flex-1 h-1.5 rounded-full ${act < currentAct ? "bg-green-500" : act === currentAct ? "bg-gradient-to-r from-amber-500 to-red-500" : "bg-white/10"}`} />
          ))}
        </div>

        {/* Act clue progress */}
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div className={`h-full rounded-full ${canAdvance ? "bg-green-500" : "bg-amber-500"}`}
              animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.5 }} />
          </div>
          <span className="text-[10px] text-white/30">{actFoundCount}/{actClueCount} clues ({Math.round(progress * 100)}%)</span>
          {canAdvance && <Unlock className="w-3 h-3 text-green-400" />}
          {!canAdvance && <Lock className="w-3 h-3 text-white/20" />}
        </div>

        {/* Cooldown indicators */}
        <div className="flex gap-2 mb-2">
          {clueCooldownLeft > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Search className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] text-amber-400 font-mono">{formatCooldown(clueCooldownLeft)}</span>
            </div>
          )}
          {interrogationCooldownLeft > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              <MessageCircle className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] text-blue-400 font-mono">{formatCooldown(interrogationCooldownLeft)}</span>
            </div>
          )}
        </div>

        {/* Twist notification */}
        <AnimatePresence>
          {showTwist && currentAct >= 3 && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-2 p-3 rounded-xl bg-red-500/20 border border-red-500/30">
              <h3 className="text-xs font-black text-red-400 mb-1">🔄 PLOT TWIST!</h3>
              <p className="text-white/70 text-xs">{mystery.twist}</p>
              <button onClick={() => setShowTwist(false)} className="mt-1 text-[10px] text-white/30">Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shame notification */}
        <AnimatePresence>
          {showShame && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="fixed top-16 left-3 right-3 z-50 p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-center">
              <p className="text-yellow-400 font-bold text-sm">{shameMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deduction Challenge Modal */}
        <AnimatePresence>
          {showDeduction && DEDUCTION_CHALLENGES[currentAct] && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="bg-[#0a0e1a] border border-amber-500/30 rounded-2xl p-5 max-w-sm w-full">
                <Brain className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <h3 className="text-lg font-black text-white text-center mb-1">Deduction Challenge</h3>
                <p className="text-white/40 text-xs text-center mb-4">Answer correctly for bonus points!</p>
                <p className="text-white/80 text-sm mb-4">{DEDUCTION_CHALLENGES[currentAct][currentDeductionQ].question}</p>
                <div className="space-y-2">
                  {DEDUCTION_CHALLENGES[currentAct][currentDeductionQ].options.map((opt, i) => (
                    <button key={i} onClick={() => handleDeductionAnswer(i)}
                      className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-amber-500/10 hover:border-amber-500/30 transition-all">
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 mb-2">
          {(["clues", "suspects", "board"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === t ? "bg-amber-500/20 border border-amber-500/30 text-amber-400" : "bg-white/5 border border-white/10 text-white/30"
              }`}>
              {t === "clues" ? `🔍 Clues (${allFoundClues.length})` : t === "suspects" ? `🕵️ Suspects` : `📋 Board (${boardNotes.filter(n => n.pinned).length})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-1.5 mb-2 max-h-[35vh] overflow-y-auto">
          {tab === "clues" && (
            <>
              {allFoundClues.length === 0 && <p className="text-white/30 text-sm text-center py-6">No clues yet. Hit Search! 🔍</p>}
              {allFoundClues.map(clue => {
                const cat = CATEGORY_CONFIG[clue.category];
                return (
                  <motion.div key={clue.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-start gap-2">
                      <span className="text-sm">{cat.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="text-[10px] font-bold uppercase" style={{ color: cat.color }}>{cat.label} • Act {clue.act}</span>
                          <button onClick={() => togglePin(`note-${clue.id}`)}
                            className={`${boardNotes.find(n => n.clueId === clue.id)?.pinned ? "text-amber-400" : "text-white/20"}`}>
                            <Pin className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-white/70 text-xs mt-0.5 leading-relaxed">{clue.text}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}

          {tab === "suspects" && mystery.suspects.map(s => {
            const topics = interrogatedSuspects.get(s.id) || new Set();
            return (
              <div key={s.id} className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-bold text-white text-sm">{s.name}</p>
                    <p className="text-white/25 text-[10px]">{s.role} • {topics.size}/4 questioned</p>
                  </div>
                  <button onClick={() => { setSelectedSuspect(s); setInterrogationResponse(""); setInterrogationTopic(null); }}
                    disabled={interrogationCooldownLeft > 0}
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      interrogationCooldownLeft > 0 ? "bg-white/5 text-white/20" : "bg-amber-500/20 border border-amber-500/30 text-amber-400"
                    }`}>
                    {interrogationCooldownLeft > 0 ? formatCooldown(interrogationCooldownLeft) : "Interrogate"}
                  </button>
                </div>
                <p className="text-white/40 text-xs">{s.description}</p>
                <div className="flex gap-2 mt-1">
                  {["about_crime", "about_alibi", "about_others", "contradiction"].map(t => (
                    <div key={t} className={`w-2 h-2 rounded-full ${topics.has(t) ? "bg-green-500" : "bg-white/10"}`}
                      title={topics.has(t) ? `✅ ${t}` : `❌ ${t}`} />
                  ))}
                </div>
              </div>
            );
          })}

          {tab === "board" && (
            <>
              {boardNotes.length === 0 && <p className="text-white/30 text-sm text-center py-6">Board is empty. Find clues to populate it!</p>}
              <div className="grid grid-cols-2 gap-1.5">
                {boardNotes.filter(n => n.pinned).map(note => (
                  <motion.div key={note.id} layout className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 relative">
                    <Pin className="w-2.5 h-2.5 text-amber-400 absolute top-1 right-1" />
                    <p className="text-white/70 text-[10px] leading-tight pr-4">{note.text.slice(0, 80)}...</p>
                    {note.connectedTo.length > 0 && (
                      <div className="flex items-center gap-1 mt-1"><Link2 className="w-2.5 h-2.5 text-blue-400" /><span className="text-blue-400 text-[9px]">{note.connectedTo.length} linked</span></div>
                    )}
                  </motion.div>
                ))}
              </div>
              {boardNotes.filter(n => !n.pinned).length > 0 && (
                <>
                  <p className="text-white/20 text-[10px] mt-2">Unpinned:</p>
                  {boardNotes.filter(n => !n.pinned).map(note => (
                    <div key={note.id} className="p-2 rounded-lg bg-white/5 border border-white/5 flex justify-between items-start">
                      <p className="text-white/40 text-[10px] leading-tight flex-1">{note.text.slice(0, 60)}...</p>
                      <button onClick={() => togglePin(note.id)} className="text-white/20 hover:text-amber-400 ml-1"><Pin className="w-3 h-3" /></button>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Interrogation Modal */}
        <AnimatePresence>
          {selectedSuspect && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setSelectedSuspect(null)}>
              <div className="bg-[#0a0e1a] border border-white/20 rounded-2xl p-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-base font-black text-white mb-0.5">{selectedSuspect.name}</h3>
                <p className="text-white/30 text-xs mb-3">{selectedSuspect.role}</p>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {[
                    { key: "about_crime", label: "🔪 The Crime" },
                    { key: "about_alibi", label: "🕐 Their Alibi" },
                    { key: "about_others", label: "👥 Others" },
                    { key: "contradiction", label: "⚡ Press Harder" },
                  ].map(t => {
                    const asked = interrogatedSuspects.get(selectedSuspect.id)?.has(t.key);
                    return (
                      <button key={t.key}
                        onClick={() => !asked && interrogationCooldownLeft === 0 && interrogate(selectedSuspect, t.key)}
                        disabled={!!asked || interrogationCooldownLeft > 0}
                        className={`py-2 rounded-lg text-[11px] font-bold ${
                          asked ? "bg-green-500/10 border border-green-500/20 text-green-400" :
                          interrogationCooldownLeft > 0 ? "bg-white/5 border border-white/10 text-white/20" :
                          interrogationTopic === t.key ? "bg-amber-500/20 border border-amber-500/30 text-amber-400" :
                          "bg-white/5 border border-white/10 text-white/50 hover:bg-amber-500/10"
                        }`}>
                        {asked ? `✅ ${t.label}` : t.label}
                      </button>
                    );
                  })}
                </div>
                {interrogationResponse && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 rounded-lg p-3 mb-3">
                    <p className="text-white/70 text-sm italic leading-relaxed">"{interrogationResponse}"</p>
                  </motion.div>
                )}
                <button onClick={() => setSelectedSuspect(null)} className="w-full py-2 bg-white/10 rounded-lg text-white/50 text-xs">Done</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          <motion.button whileTap={{ scale: 0.95 }} onClick={searchForClue}
            disabled={clueCooldownLeft > 0 || paused || actClues(currentAct).filter(c => !revealedClues.has(c.id)).length === 0}
            className={`py-2.5 rounded-xl font-bold text-[11px] flex flex-col items-center gap-0.5 ${
              clueCooldownLeft > 0 || paused ? "bg-white/5 border border-white/10 text-white/20" : "bg-green-500/15 border border-green-500/25 text-green-400"
            }`}>
            <Search className="w-4 h-4" />
            {clueCooldownLeft > 0 ? formatCooldown(clueCooldownLeft) : "Search"}
          </motion.button>

          <motion.button whileTap={{ scale: 0.95 }} onClick={useHint}
            disabled={paused || actClues(currentAct).filter(c => !revealedClues.has(c.id) && !c.isRedHerring).length === 0}
            className="py-2.5 rounded-xl bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 font-bold text-[11px] flex flex-col items-center gap-0.5">
            <Lightbulb className="w-4 h-4" />
            Hint 💀
          </motion.button>

          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPaused(!paused)}
            className={`py-2.5 rounded-xl font-bold text-[11px] flex flex-col items-center gap-0.5 ${
              paused ? "bg-green-500/15 border border-green-500/25 text-green-400" : "bg-white/5 border border-white/10 text-white/30"
            }`}>
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {paused ? "Resume" : "Pause"}
          </motion.button>

          <motion.button whileTap={{ scale: 0.95 }} onClick={advanceAct}
            disabled={!canAdvance || paused}
            className={`py-2.5 rounded-xl font-bold text-[11px] flex flex-col items-center gap-0.5 ${
              canAdvance && !paused ? "bg-amber-500/15 border border-amber-500/25 text-amber-400" : "bg-white/5 border border-white/10 text-white/20"
            }`}>
            <ChevronRight className="w-4 h-4" />
            {currentAct < 4 ? `Act ${currentAct + 1}` : "Vote"}
          </motion.button>
        </div>

        {!canAdvance && <p className="text-center text-white/15 text-[9px] mt-1">Find {Math.ceil(ACT_UNLOCK_THRESHOLD * actClueCount)} of {actClueCount} clues to unlock Act {currentAct < 4 ? currentAct + 1 : "Vote"}</p>}
      </div>
    </div>
  );
}
