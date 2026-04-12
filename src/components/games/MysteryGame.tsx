/**
 * Mystery at Adventure World
 * 3-4 hour cooperative detective game
 * GPT-4 generates unique mystery each session
 * 4 acts, 35+ clues, GPS triggers, interrogation, voting
 * 
 * Tone: Agatha Christie + Inspector Gadget (lighthearted, clever)
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, MapPin, MessageCircle, Vote, Lightbulb, Trophy, Clock, Users, ChevronRight, Star, Eye, BookOpen, AlertTriangle } from "lucide-react";
import ConfettiEffect from "@/components/ConfettiEffect";

// ─── Types ─────────────────────────────────────────────────
interface Suspect {
  id: string;
  name: string;
  role: string;
  description: string;
  motive: string;
  alibi: string;
  isCulprit: boolean;
  isAccomplice: boolean;
  interrogation: {
    about_crime: string;
    about_alibi: string;
    about_others: string;
    contradiction: string;
  };
}

interface Clue {
  id: string;
  text: string;
  category: "witness" | "evidence" | "location" | "motive";
  act: number;
  revealed: boolean;
  isRedHerring: boolean;
  points: number;
  zone: string;
}

interface MysteryData {
  title: string;
  crime: string;
  introStory: string;
  suspects: Suspect[];
  clues: Clue[];
  twist: string;
  secondaryMystery: string;
  resolution: string;
  culpritId: string;
  accompliceId: string;
  motive: string;
  method: string;
  timeline: string;
}

// ─── Shame Messages ────────────────────────────────────────
const SHAME_MESSAGES = [
  "🐑 {name} just used a hint! The Black Sheep of the team strikes again!",
  "🔍 {name} needed help... Looks like SOMEONE skipped detective school!",
  "🤦 {name} used a hint. Sherlock Holmes is rolling in his grave!",
  "💡 {name} couldn't figure it out alone. The team carries another!",
  "🐔 Bawk bawk! {name} chickened out and used a hint!",
  "📖 {name} had to peek at the answer key. Classic rookie move!",
  "🎭 {name} used a hint. Inspector Gadget would be disappointed!",
  "🧠 {name}'s brain took a coffee break — hint activated!",
  "🕵️ Breaking news: {name} is officially the WORST detective on the team!",
  "😂 {name} needed a hint. Don't worry, we won't tell anyone... oh wait!",
];

// ─── Category Icons ────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  witness: { icon: "👁️", color: "#4ECDC4", label: "Witness" },
  evidence: { icon: "🔬", color: "#FF6B6B", label: "Evidence" },
  location: { icon: "📍", color: "#FFD93D", label: "Location" },
  motive: { icon: "💭", color: "#B19CD9", label: "Motive" },
};

// ─── Fallback Mystery ──────────────────────────────────────
const FALLBACK_MYSTERY: MysteryData = {
  title: "The Carousel Caper",
  crime: "The legendary Golden Horse — Adventure World's most prized carousel figure — has vanished overnight. Park security found the carousel locked but the horse gone, with only a trail of golden glitter leading toward the maintenance tunnels.",
  introStory: "It was supposed to be a perfect day at Adventure World. The sun was shining, the cotton candy was flowing, and the new summer season was off to a record-breaking start. But when Head Groundskeeper Martha Wiggins arrived at 6 AM to polish the famous Golden Horse on the Grand Carousel, she found an empty pole where the 200-pound golden stallion should have been.\n\nThe Golden Horse wasn't just any decoration — it was Adventure World's mascot, hand-crafted by the park's founder 40 years ago and worth an estimated $2 million. Its disappearance sent shockwaves through the park staff.\n\nPark Director Theodore 'Teddy' Pemberton III called an emergency meeting. 'Nobody leaves this park until we find that horse,' he declared, adjusting his bow tie nervously. 'And somebody get me a detective!'\n\nThat's where you come in. You and your team of investigators have been called to solve the mystery before the park opens to the public. The clock is ticking, the suspects are sweating, and somewhere in Adventure World, a golden horse is waiting to be found.",
  suspects: [
    { id: "s1", name: "Dizzy Dave Delacroix", role: "Carousel Operator (20 years)", description: "A wiry man in his 50s with paint-stained overalls and a nervous twitch. Known for talking to carousel animals like they're real.", motive: "Recently told his beloved horse was being replaced with a modern replica", alibi: "Claims he was bowling until midnight", isCulprit: false, isAccomplice: false, interrogation: { about_crime: "I would NEVER hurt my babies! That horse is family!", about_alibi: "I bowled a 180 that night! Ask anyone at Sunset Lanes!", about_others: "Widget Wendy's been acting suspicious. She measured the horse last week.", contradiction: "Says he left at midnight but bowling alley closes at 11 PM" } },
    { id: "s2", name: "Widget Wendy Wu", role: "Head of Merchandise", description: "A sharp-dressed businesswoman who's always on her tablet calculating profit margins. Has a collection of miniature carousel horses.", motive: "Was caught researching 'how to sell antiques internationally'", alibi: "Working late on inventory reports", isCulprit: true, isAccomplice: false, interrogation: { about_crime: "A terrible loss for the brand. We'll need to order replacement merchandise immediately.", about_alibi: "I was in my office until 2 AM. The security cameras can confirm.", about_others: "Professor Peculiar has been sneaking around the maintenance tunnels.", contradiction: "Security footage shows her office lights were off after 10 PM" } },
    { id: "s3", name: "Professor Peculiar Pete", role: "Park Engineer & Inventor", description: "A wild-haired eccentric in a lab coat covered in grease stains. Claims to be building a 'revolutionary ride.'", motive: "Needs rare golden alloy for his 'invention'", alibi: "In workshop all night working on secret project", isCulprit: false, isAccomplice: true, interrogation: { about_crime: "Fascinating! The engineering required to remove a 200-pound figure without triggering alarms... purely hypothetically!", about_alibi: "I was calibrating my Whirligig 3000. Science never sleeps!", about_others: "Dizzy Dave has been more emotional than usual.", contradiction: "Workshop log shows he left at 9 PM and returned at 3 AM" } },
    { id: "s4", name: "Jolly Janet Jimenez", role: "Head Chef, Main Street Grill", description: "A boisterous woman who laughs at everything, even when nothing's funny. Makes the best funnel cakes in three counties.", motive: "The carousel area is scheduled to become her new restaurant expansion", alibi: "Prepping tomorrow's special sauce in kitchen", isCulprit: false, isAccomplice: false, interrogation: { about_crime: "HA HA HA! Who would steal a HORSE? That's hilarious! ...wait, it's actually missing?", about_alibi: "My sauce takes 14 hours to simmer! I was stirring ALL night!", about_others: "Teddy the director has been acting weird about the insurance.", contradiction: "Kitchen staff says she left at 8 PM" } },
    { id: "s5", name: "Theodore 'Teddy' Pemberton III", role: "Park Director", description: "A pompous man in a three-piece suit who sweats profusely when nervous. Third generation to run the park.", motive: "Park is in financial trouble — the insurance payout would save the budget", alibi: "At a charity dinner downtown", isCulprit: false, isAccomplice: false, interrogation: { about_crime: "This is a DISASTER! Do you know what this does to our stock price?!", about_alibi: "I was at the Mayor's Gala until 11 PM. 200 witnesses!", about_others: "I trust my staff completely. Well, mostly.", contradiction: "Gala ended at 9 PM, not 11 PM" } },
  ],
  clues: [
    { id: "c1", text: "A trail of golden glitter leads from the carousel to the maintenance tunnels. The glitter appears to be flaking paint, not decorative.", category: "evidence", act: 1, revealed: false, isRedHerring: false, points: 10, zone: "ride_line" },
    { id: "c2", text: "Security camera near the carousel was 'malfunctioning' between 10 PM and 2 AM. Someone manually disabled it.", category: "evidence", act: 1, revealed: false, isRedHerring: false, points: 15, zone: "ride_line" },
    { id: "c3", text: "A large dolly cart is missing from the maintenance shed. It's rated for 300 pounds.", category: "evidence", act: 1, revealed: false, isRedHerring: false, points: 10, zone: "merchandise" },
    { id: "c4", text: "A witness saw someone in a lab coat near the carousel at 11 PM carrying tools.", category: "witness", act: 1, revealed: false, isRedHerring: false, points: 15, zone: "ride_line" },
    { id: "c5", text: "Dizzy Dave's locker has a framed photo of him hugging the Golden Horse with 'Best Friends Forever.'", category: "motive", act: 1, revealed: false, isRedHerring: true, points: 5, zone: "ride_line" },
    { id: "c6", text: "A mysterious van in the employee lot at midnight. License plate: partially obscured.", category: "location", act: 1, revealed: false, isRedHerring: true, points: 5, zone: "restaurant" },
    { id: "c7", text: "The carousel's security bolt was unscrewed professionally — this wasn't a smash-and-grab.", category: "evidence", act: 1, revealed: false, isRedHerring: false, points: 10, zone: "ride_line" },
    { id: "c8", text: "Wendy's tablet shows recent searches for 'international antique shipping' and 'golden horse value estimate.'", category: "motive", act: 1, revealed: false, isRedHerring: false, points: 20, zone: "merchandise" },
    { id: "c9", text: "Bowling alley confirms they close at 11 PM, not midnight. Dave's alibi has a gap.", category: "witness", act: 2, revealed: false, isRedHerring: false, points: 10, zone: "restaurant" },
    { id: "c10", text: "Pete's workshop log shows exit at 9 PM and re-entry at 3 AM. Where was he for 6 hours?", category: "evidence", act: 2, revealed: false, isRedHerring: false, points: 15, zone: "ride_line" },
    { id: "c11", text: "Wendy's office footage shows lights off after 10 PM — she wasn't working late as claimed.", category: "evidence", act: 2, revealed: false, isRedHerring: false, points: 20, zone: "merchandise" },
    { id: "c12", text: "A maintenance worker saw TWO people in the tunnels around midnight.", category: "witness", act: 2, revealed: false, isRedHerring: false, points: 15, zone: "ride_line" },
    { id: "c13", text: "Janet's special sauce recipe was found in the carousel control room. Odd place for a recipe.", category: "evidence", act: 2, revealed: false, isRedHerring: true, points: 5, zone: "restaurant" },
    { id: "c14", text: "Teddy recently increased the Golden Horse's insurance from $500K to $2M.", category: "motive", act: 2, revealed: false, isRedHerring: false, points: 15, zone: "restaurant" },
    { id: "c15", text: "The Golden Horse is found — but it's a REPLICA! The real one was switched weeks ago!", category: "evidence", act: 3, revealed: false, isRedHerring: false, points: 25, zone: "ride_line" },
    { id: "c16", text: "A receipt for custom horse sculpture supplies — ordered 3 weeks ago — found in Wendy's desk drawer.", category: "evidence", act: 3, revealed: false, isRedHerring: false, points: 20, zone: "merchandise" },
    { id: "c17", text: "Pete's 'secret invention' blueprints include a device that looks like a carousel horse removal tool.", category: "evidence", act: 3, revealed: false, isRedHerring: false, points: 20, zone: "ride_line" },
    { id: "c18", text: "A shipping receipt in Wendy's name for a 200-pound package to an overseas address, dated two weeks ago.", category: "evidence", act: 4, revealed: false, isRedHerring: false, points: 30, zone: "merchandise" },
    { id: "c19", text: "Pete's bank account shows a $50,000 deposit from Wendy's personal account last month.", category: "motive", act: 4, revealed: false, isRedHerring: false, points: 25, zone: "restaurant" },
    { id: "c20", text: "Teddy disabled the cameras himself — he was sneaking a midnight snack and didn't want it on camera (he's on a diet!).", category: "evidence", act: 4, revealed: false, isRedHerring: false, points: 10, zone: "restaurant" },
  ],
  twist: "The horse stolen last night was a REPLICA! Wendy had swapped the real Golden Horse with a perfect copy two weeks earlier and shipped the original overseas. Last night's 'theft' of the replica was staged by Pete to create an alibi — making it look like the theft happened recently, not weeks ago.",
  secondaryMystery: "Who disabled the security cameras? It wasn't the thief — it was Teddy, sneaking a midnight snack from the kitchen. He's on a strict diet his wife monitors via the park cameras!",
  resolution: "Widget Wendy Wu's plan was almost perfect — swap the real horse with a replica, ship the original overseas, then stage a dramatic 'theft' to throw off any investigation. With Professor Peculiar Pete's engineering expertise, the swap was flawless.\n\nBut they didn't count on a team of brilliant detectives noticing the timeline inconsistencies. Wendy's search history, Pete's unexplained absence, and the crucial discovery that the stolen horse was a replica — it all added up.\n\nAs park security escorted Wendy and Pete away, Dizzy Dave could be heard sobbing with relief: 'I KNEW my horse didn't run away!' The Golden Horse was recovered from a shipping container in Miami.\n\nAs for Teddy's midnight kitchen raids? His wife found out anyway. Some mysteries solve themselves. 😄",
  culpritId: "s2",
  accompliceId: "s3",
  motive: "Wendy planned to sell the real Golden Horse to a private collector for $2 million. She enlisted Pete to help, promising to fund his inventions.",
  method: "Commission replica → Swap real horse for replica at night → Ship real horse overseas → Stage 'theft' of replica as cover.",
  timeline: "3 weeks ago: Wendy orders replica. 2 weeks ago: Wendy and Pete swap horses at night. 1 week ago: Real horse shipped overseas. Last night: Pete stages theft of replica.",
};

interface Props {
  onClose: () => void;
  duration?: "all_day" | "half_day";
  playerName?: string;
}

export default function MysteryGame({ onClose, duration = "all_day", playerName = "Detective" }: Props) {
  const [mystery, setMystery] = useState<MysteryData | null>(null);
  const [phase, setPhase] = useState<"loading" | "intro" | "act1" | "act2" | "act3" | "act4" | "voting" | "results">("loading");
  const [currentAct, setCurrentAct] = useState(1);
  const [revealedClues, setRevealedClues] = useState<Set<string>>(new Set());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [shameMessage, setShameMessage] = useState("");
  const [showShame, setShowShame] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);
  const [interrogationTopic, setInterrogationTopic] = useState<string | null>(null);
  const [interrogationResponse, setInterrogationResponse] = useState("");
  const [vote, setVote] = useState("");
  const [accompliceVote, setAccompliceVote] = useState("");
  const [showTwist, setShowTwist] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);
  const [tab, setTab] = useState<"clues" | "suspects" | "map">("clues");
  const [startTime] = useState(Date.now());
  const [showConfetti, setShowConfetti] = useState(false);

  // ─── Initialize ──────────────────────────────────────────
  useEffect(() => {
    // Use fallback mystery (GPT-4 generation happens on server in multiplayer mode)
    setMystery(FALLBACK_MYSTERY);
    setPhase("intro");
  }, []);

  // ─── Reveal Clue ─────────────────────────────────────────
  const revealClue = (clueId: string) => {
    setRevealedClues(prev => new Set([...prev, clueId]));
  };

  const currentClues = mystery?.clues.filter(c => c.act <= currentAct) || [];
  const availableClues = currentClues.filter(c => !revealedClues.has(c.id));
  const foundClues = currentClues.filter(c => revealedClues.has(c.id));

  // ─── Search Area (reveal next clue) ──────────────────────
  const searchArea = () => {
    if (availableClues.length > 0) {
      revealClue(availableClues[0].id);
    }
  };

  // ─── Use Hint ────────────────────────────────────────────
  const useHint = () => {
    const importantClue = availableClues.find(c => !c.isRedHerring);
    if (importantClue) {
      revealClue(importantClue.id);
      setHintsUsed(h => h + 1);

      const msg = SHAME_MESSAGES[Math.floor(Math.random() * SHAME_MESSAGES.length)]
        .replace("{name}", playerName);
      setShameMessage(msg);
      setShowShame(true);
      setTimeout(() => setShowShame(false), 4000);
    }
  };

  // ─── Interrogate ─────────────────────────────────────────
  const interrogate = (suspect: Suspect, topic: string) => {
    const response = suspect.interrogation[topic as keyof typeof suspect.interrogation] || "I have nothing more to say.";
    setInterrogationResponse(response);
    setInterrogationTopic(topic);
  };

  // ─── Advance Act ─────────────────────────────────────────
  const advanceAct = () => {
    if (currentAct < 4) {
      const nextAct = currentAct + 1;
      setCurrentAct(nextAct);
      setPhase(`act${nextAct}` as any);

      if (nextAct === 3) {
        setShowTwist(true);
        setShowSecondary(true);
      }
    } else {
      setPhase("voting");
    }
  };

  // ─── Submit Vote ─────────────────────────────────────────
  const submitVote = () => {
    if (!vote || !mystery) return;

    const isCorrect = vote === mystery.culpritId;
    const gotAccomplice = accompliceVote === mystery.accompliceId;

    let accuracyScore = 0;
    if (isCorrect) accuracyScore = 100;
    else if (gotAccomplice) accuracyScore = 50;

    const hintPenalty = Math.min(hintsUsed * 5, 30);
    const noHintBonus = hintsUsed === 0 ? 20 : 0;

    setPhase("results");
    if (isCorrect) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  if (!mystery) return <div className="min-h-screen bg-[#060a14] flex items-center justify-center"><p className="text-white/50">Loading mystery...</p></div>;

  // ─── INTRO SCREEN ────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-[#060a14] p-4 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full blur-[100px] opacity-15 bg-amber-600" />
          <div className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full blur-[100px] opacity-10 bg-red-700" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto">
          <button onClick={onClose} className="flex items-center gap-1 text-white/50 hover:text-white text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <span className="text-6xl block mb-4">🔍</span>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-red-400">
                {mystery.title}
              </h1>
              <p className="text-white/40 text-sm mt-2">{duration === "all_day" ? "All Day Mystery • ~3-4 hours" : "Half Day Mystery • ~1.5-2 hours"}</p>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
              <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> The Crime</h3>
              <p className="text-white/70 leading-relaxed">{mystery.crime}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5" /> The Story</h3>
              {mystery.introStory.split("\n\n").map((para, i) => (
                <p key={i} className="text-white/60 leading-relaxed mb-3">{para}</p>
              ))}
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">🕵️ Suspects</h3>
              <div className="space-y-2">
                {mystery.suspects.map(s => (
                  <div key={s.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="font-bold text-white">{s.name}</p>
                    <p className="text-white/40 text-xs">{s.role}</p>
                    <p className="text-white/50 text-sm mt-1">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => { setPhase("act1"); setCurrentAct(1); }}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-red-500 text-white font-black rounded-xl text-lg shadow-lg shadow-amber-500/20">
              🔍 Begin Investigation
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── VOTING SCREEN ───────────────────────────────────────
  if (phase === "voting") {
    return (
      <div className="min-h-screen bg-[#060a14] p-4 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full blur-[100px] opacity-15 bg-purple-600" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <span className="text-5xl block mb-3">🗳️</span>
              <h2 className="text-2xl font-black text-white">Final Accusation</h2>
              <p className="text-white/40 text-sm">Who committed the crime?</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white/60 mb-2">Primary Culprit *</h3>
              <div className="space-y-2">
                {mystery.suspects.map(s => (
                  <button key={s.id} onClick={() => setVote(s.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      vote === s.id ? "bg-red-500/20 border-red-500/50" : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}>
                    <p className="font-bold text-white">{s.name}</p>
                    <p className="text-white/40 text-xs">{s.role}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white/60 mb-2">Accomplice (optional)</h3>
              <div className="space-y-2">
                {mystery.suspects.filter(s => s.id !== vote).map(s => (
                  <button key={s.id} onClick={() => setAccompliceVote(accompliceVote === s.id ? "" : s.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      accompliceVote === s.id ? "bg-orange-500/20 border-orange-500/50" : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}>
                    <p className="font-bold text-white text-sm">{s.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={submitVote} disabled={!vote}
              className={`w-full py-4 font-black rounded-xl text-lg ${
                vote ? "bg-gradient-to-r from-red-500 to-purple-500 text-white" : "bg-white/10 text-white/30"
              }`}>
              ⚖️ Submit Accusation
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── RESULTS SCREEN ──────────────────────────────────────
  if (phase === "results") {
    const isCorrect = vote === mystery.culpritId;
    const gotAccomplice = accompliceVote === mystery.accompliceId;
    const accuracyScore = isCorrect ? 100 : gotAccomplice ? 50 : 0;
    const hintPenalty = Math.min(hintsUsed * 5, 30);
    const noHintBonus = hintsUsed === 0 ? 20 : 0;
    const finalScore = Math.max(0, accuracyScore - hintPenalty + noHintBonus);
    const elapsedMin = Math.round((Date.now() - startTime) / 60000);

    return (
      <div className="min-h-screen bg-[#060a14] p-4 relative overflow-hidden">
        <ConfettiEffect trigger={showConfetti} />
        <div className="relative z-10 max-w-lg mx-auto space-y-6 py-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            {isCorrect ? <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3" /> : <span className="text-6xl block mb-3">🤔</span>}
            <h2 className="text-3xl font-black text-white">{isCorrect ? "CASE SOLVED!" : "Not Quite..."}</h2>
            <p className="text-white/50">{isCorrect ? "Brilliant detective work!" : "The truth was hiding in plain sight."}</p>
          </motion.div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
            <div className="flex justify-between"><span className="text-white/40">Accuracy</span><span className="text-yellow-400 font-bold">{accuracyScore}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Hint Penalty</span><span className="text-red-400 font-bold">-{hintPenalty}</span></div>
            <div className="flex justify-between"><span className="text-white/40">No Hint Bonus</span><span className="text-green-400 font-bold">+{noHintBonus}</span></div>
            <div className="border-t border-white/10 pt-2 flex justify-between"><span className="text-white font-bold">Final Score</span><span className="text-2xl font-black text-yellow-400">{finalScore}</span></div>
            <p className="text-white/30 text-xs">Solved in {elapsedMin} minutes • {revealedClues.size} clues found • {hintsUsed} hints used</p>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
            <h3 className="text-lg font-bold text-red-400 mb-2">The Truth</h3>
            <p className="text-white/70 text-sm mb-2"><strong>Culprit:</strong> {mystery.suspects.find(s => s.id === mystery.culpritId)?.name}</p>
            {mystery.accompliceId && <p className="text-white/70 text-sm mb-2"><strong>Accomplice:</strong> {mystery.suspects.find(s => s.id === mystery.accompliceId)?.name}</p>}
            <p className="text-white/70 text-sm mb-2"><strong>Motive:</strong> {mystery.motive}</p>
            <p className="text-white/70 text-sm"><strong>Method:</strong> {mystery.method}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-lg font-bold text-white mb-2">📖 Resolution</h3>
            {mystery.resolution.split("\n\n").map((p, i) => (
              <p key={i} className="text-white/60 text-sm leading-relaxed mb-2">{p}</p>
            ))}
          </div>

          {mystery.secondaryMystery && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5">
              <h3 className="text-sm font-bold text-purple-400 mb-1">🔮 Secondary Mystery Solved</h3>
              <p className="text-white/60 text-sm">{mystery.secondaryMystery}</p>
            </div>
          )}

          <button onClick={onClose} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl">
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  // ─── INVESTIGATION SCREEN (Acts 1-4) ────────────────────
  return (
    <div className="min-h-screen bg-[#060a14] p-3 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-1/4 w-72 h-72 rounded-full blur-[100px] opacity-12 bg-amber-600" />
        <div className="absolute bottom-20 left-1/4 w-64 h-64 rounded-full blur-[100px] opacity-8 bg-red-700" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={onClose} className="text-white/50 hover:text-white"><ArrowLeft className="w-4 h-4" /></button>
          <div className="text-center">
            <h1 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-red-400">{mystery.title}</h1>
            <p className="text-[10px] text-white/30">Act {currentAct} of 4</p>
          </div>
          <div className="flex items-center gap-1 text-white/30 text-xs">
            <Clock className="w-3 h-3" /> {Math.round((Date.now() - startTime) / 60000)}m
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1 mb-3">
          {[1, 2, 3, 4].map(act => (
            <div key={act} className={`flex-1 h-1.5 rounded-full ${act <= currentAct ? "bg-gradient-to-r from-amber-500 to-red-500" : "bg-white/10"}`} />
          ))}
        </div>

        {/* Stats */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10 text-center">
            <p className="text-[10px] text-white/30">Clues</p>
            <p className="text-sm font-bold text-amber-400">{revealedClues.size}/{mystery.clues.length}</p>
          </div>
          <div className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10 text-center">
            <p className="text-[10px] text-white/30">Hints</p>
            <p className="text-sm font-bold text-red-400">{hintsUsed}</p>
          </div>
          <div className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10 text-center">
            <p className="text-[10px] text-white/30">Act</p>
            <p className="text-sm font-bold text-white">{currentAct}/4</p>
          </div>
        </div>

        {/* Twist notification */}
        <AnimatePresence>
          {showTwist && currentAct === 3 && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-3 p-4 rounded-xl bg-red-500/20 border border-red-500/30">
              <h3 className="text-sm font-black text-red-400 mb-1">🔄 PLOT TWIST!</h3>
              <p className="text-white/70 text-sm">{mystery.twist}</p>
              <button onClick={() => setShowTwist(false)} className="mt-2 text-xs text-white/40 hover:text-white">Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shame notification */}
        <AnimatePresence>
          {showShame && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="fixed top-20 left-4 right-4 z-50 p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-center">
              <p className="text-yellow-400 font-bold text-sm">{shameMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          {(["clues", "suspects", "map"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === t ? "bg-amber-500/20 border border-amber-500/30 text-amber-400" : "bg-white/5 border border-white/10 text-white/40"
              }`}>
              {t === "clues" ? "🔍 Clues" : t === "suspects" ? "🕵️ Suspects" : "📍 Map"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-2 mb-3 max-h-[40vh] overflow-y-auto">
          {tab === "clues" && (
            <>
              {foundClues.length === 0 && <p className="text-white/30 text-sm text-center py-4">No clues found yet. Search the park!</p>}
              {foundClues.map(clue => {
                const cat = CATEGORY_CONFIG[clue.category];
                return (
                  <motion.div key={clue.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-start gap-2">
                      <span>{cat.icon}</span>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cat.color }}>{cat.label}</span>
                        <p className="text-white/70 text-sm mt-0.5">{clue.text}</p>
                        {clue.isRedHerring && <p className="text-red-400/50 text-[10px] mt-1 italic">⚠️ This may be a red herring...</p>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}

          {tab === "suspects" && (
            <>
              {mystery.suspects.map(s => (
                <div key={s.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-white">{s.name}</p>
                      <p className="text-white/30 text-xs">{s.role}</p>
                    </div>
                    <button onClick={() => { setSelectedSuspect(s); setInterrogationResponse(""); setInterrogationTopic(null); }}
                      className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded text-amber-400 text-xs font-bold">
                      Interrogate
                    </button>
                  </div>
                  <p className="text-white/50 text-sm">{s.description}</p>
                  <p className="text-white/40 text-xs mt-1"><strong>Alibi:</strong> {s.alibi}</p>
                  <p className="text-white/40 text-xs"><strong>Motive:</strong> {s.motive}</p>
                </div>
              ))}
            </>
          )}

          {tab === "map" && (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="text-white/50 text-sm mb-2">Search zones to discover clues!</p>
              <p className="text-white/30 text-xs">🎢 Ride Lines • 🍽️ Restaurants • 🛍️ Shops</p>
            </div>
          )}
        </div>

        {/* Interrogation Modal */}
        <AnimatePresence>
          {selectedSuspect && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setSelectedSuspect(null)}>
              <div className="bg-[#0a0e1a] border border-white/20 rounded-2xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-black text-white mb-1">{selectedSuspect.name}</h3>
                <p className="text-white/40 text-xs mb-4">{selectedSuspect.role}</p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { key: "about_crime", label: "About the Crime" },
                    { key: "about_alibi", label: "Their Alibi" },
                    { key: "about_others", label: "About Others" },
                    { key: "contradiction", label: "Press Harder" },
                  ].map(t => (
                    <button key={t.key} onClick={() => interrogate(selectedSuspect, t.key)}
                      className={`py-2 rounded-lg text-xs font-bold ${
                        interrogationTopic === t.key ? "bg-amber-500/20 border border-amber-500/30 text-amber-400" : "bg-white/5 border border-white/10 text-white/50"
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {interrogationResponse && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-white/5 rounded-lg p-3 mb-4">
                    <p className="text-white/70 text-sm italic">"{interrogationResponse}"</p>
                  </motion.div>
                )}

                <button onClick={() => setSelectedSuspect(null)} className="w-full py-2 bg-white/10 rounded-lg text-white/60 text-sm">Done</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={searchArea}
            disabled={availableClues.length === 0}
            className={`py-3 rounded-xl font-bold text-sm flex flex-col items-center gap-1 ${
              availableClues.length > 0 ? "bg-green-500/15 border border-green-500/25 text-green-400" : "bg-white/5 border border-white/10 text-white/20"
            }`}>
            <Search className="w-5 h-5" />
            Search
          </motion.button>

          <motion.button whileTap={{ scale: 0.95 }} onClick={useHint}
            disabled={availableClues.filter(c => !c.isRedHerring).length === 0}
            className="py-3 rounded-xl bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 font-bold text-sm flex flex-col items-center gap-1">
            <Lightbulb className="w-5 h-5" />
            Hint 💀
          </motion.button>

          <motion.button whileTap={{ scale: 0.95 }} onClick={advanceAct}
            className="py-3 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 font-bold text-sm flex flex-col items-center gap-1">
            <ChevronRight className="w-5 h-5" />
            {currentAct < 4 ? `Act ${currentAct + 1}` : "Vote!"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
