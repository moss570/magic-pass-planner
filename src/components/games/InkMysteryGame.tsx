/**
 * Ink Mystery Game — React component that runs inkle's Ink stories
 * Powers "Mystery at Adventure World"
 * Uses inkjs to run compiled Ink stories natively in React
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Volume2, MapPin, Navigation, Wifi, WifiOff } from "lucide-react";
import { Story } from "inkjs";
import { GPSWatcher, ParkZone, PARK_ZONES } from "@/lib/gpsTracker";

// Load compiled Ink JSON story

const LOCATION_BACKGROUNDS: Record<string, { emoji: string; color: string }> = {
  main_plaza: { emoji: "🏰", color: "#F59E0B" },
  park_map: { emoji: "🗺️", color: "#3B82F6" },
  carousel: { emoji: "🎠", color: "#EC4899" },
  tunnels: { emoji: "🔧", color: "#6B7280" },
  office: { emoji: "🏢", color: "#EF4444" },
  workshop: { emoji: "⚙️", color: "#8B5CF6" },
  kitchen: { emoji: "🍳", color: "#F59E0B" },
  security: { emoji: "🎪", color: "#10B981" },
  dock: { emoji: "📦", color: "#6366F1" },
  interrogation: { emoji: "🕵️", color: "#DC2626" },
  evidence_board: { emoji: "📋", color: "#F97316" },
  reveal: { emoji: "⚖️", color: "#7C3AED" },
};

interface Props {
  onClose: () => void;
}

export default function InkMysteryGame({ onClose }: Props) {
  const [story, setStory] = useState<Story | null>(null);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [choices, setChoices] = useState<{ text: string; index: number }[]>([]);
  const [currentLocation, setCurrentLocation] = useState("main_plaza");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  
  // GPS State
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"off" | "searching" | "in_zone" | "error">("off");
  const [currentZone, setCurrentZone] = useState<ParkZone | null>(null);
  const [gpsClues, setGpsClues] = useState<{ zone: string; clue: string }[]>([]);
  const [showGpsPanel, setShowGpsPanel] = useState(false);
  const gpsWatcher = useRef<GPSWatcher | null>(null);

  // Initialize story from compiled JSON
  useEffect(() => {
    const loadStory = async () => {
      try {
        const response = await fetch("/stories/carousel-caper.ink.json");
        const storyJson = await response.text();
        const s = new Story(storyJson);
        setStory(s);
        setLoading(false);
        continueStory(s);
      } catch (err: any) {
        console.error("Ink story load error:", err);
        setError(`Failed to load story: ${err.message}`);
        setLoading(false);
      }
    };
    loadStory();
  }, []);

  // GPS Watcher
  const toggleGps = () => {
    if (gpsEnabled) {
      gpsWatcher.current?.stop();
      setGpsEnabled(false);
      setGpsStatus("off");
      setCurrentZone(null);
    } else {
      const watcher = new GPSWatcher(
        (zone) => {
          setGpsStatus("in_zone");
          setCurrentZone(zone);
          // Add GPS bonus clue
          setGpsClues(prev => {
            if (prev.find(c => c.zone === zone.id)) return prev;
            return [...prev, { zone: zone.id, clue: zone.clueBonus }];
          });
          // Add to story paragraphs
          setParagraphs(prev => [
            ...prev,
            `📍 <b>GPS CLUE UNLOCKED!</b> You're near <b>${zone.name}</b>!`,
            `🔎 ${zone.clueBonus}`
          ]);
        },
        () => {
          setGpsStatus("searching");
          setCurrentZone(null);
        },
        (msg) => {
          setGpsStatus("error");
          console.error("GPS:", msg);
        }
      );
      watcher.start();
      gpsWatcher.current = watcher;
      setGpsEnabled(true);
      setGpsStatus("searching");
    }
  };

  // Cleanup GPS on unmount
  useEffect(() => {
    return () => { gpsWatcher.current?.stop(); };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [paragraphs, choices, autoScroll]);

  // Continue story and collect text + choices
  const continueStory = useCallback((s: Story) => {
    const newParagraphs: string[] = [];

    while (s.canContinue) {
      const text = s.Continue() || "";
      if (text.trim()) {
        // Parse tags
        const tags = s.currentTags || [];
        tags.forEach(tag => {
          if (tag.startsWith("LOCATION:")) {
            setCurrentLocation(tag.replace("LOCATION:", "").trim());
          }
        });

        newParagraphs.push(text.trim());
      }
    }

    setParagraphs(prev => [...prev, ...newParagraphs]);
    setHistory(prev => [...prev, ...newParagraphs]);

    // Get choices
    if (s.currentChoices.length > 0) {
      setChoices(s.currentChoices.map((c, i) => ({ text: c.text, index: i })));
    } else {
      setChoices([]);
    }
  }, []);

  // Handle choice selection
  const makeChoice = (index: number) => {
    if (!story) return;

    const choiceText = choices[index]?.text || "";
    setParagraphs(prev => [...prev, `▸ ${choiceText}`]);
    setHistory(prev => [...prev, `▸ ${choiceText}`]);

    story.ChooseChoiceIndex(index);
    setChoices([]);

    // Small delay for dramatic effect
    setTimeout(() => continueStory(story), 150);
  };

  const loc = LOCATION_BACKGROUNDS[currentLocation] || { emoji: "🏰", color: "#F59E0B" };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a14] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
          <span className="text-5xl">🔍</span>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#060a14] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <span className="text-5xl block mb-4">⚠️</span>
          <p className="text-white/70 text-sm mb-4">{error}</p>
          <p className="text-white/40 text-xs mb-4">The Ink story (.ink file) needs to be compiled to JSON format using the Inky editor or inklecate compiler.</p>
          <button onClick={onClose} className="px-6 py-2 bg-white/10 text-white rounded-lg">Back to Games</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a14] flex flex-col relative overflow-hidden">
      {/* Location-based ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-1/4 w-72 h-72 rounded-full blur-[100px] opacity-15" style={{ background: loc.color }} />
        <div className="absolute bottom-20 left-1/4 w-64 h-64 rounded-full blur-[100px] opacity-8" style={{ background: loc.color }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-3 border-b border-white/10">
        <button onClick={onClose} className="text-white/40 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <span className="text-lg">{loc.emoji}</span>
            <h1 className="text-sm font-black text-white capitalize">{currentLocation.replace(/_/g, " ")}</h1>
          </div>
          <p className="text-[9px] text-white/25">Mystery at Adventure World</p>
        </div>
        {/* GPS Toggle */}
        <button onClick={toggleGps} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${
          gpsStatus === "in_zone" ? "bg-green-500/20 border-green-500/30 text-green-400" :
          gpsStatus === "searching" ? "bg-blue-500/20 border-blue-500/30 text-blue-400" :
          gpsStatus === "error" ? "bg-red-500/20 border-red-500/30 text-red-400" :
          "bg-white/5 border-white/10 text-white/30"
        }`}>
          {gpsEnabled ? <Navigation className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
          {gpsStatus === "in_zone" ? "📍" : gpsStatus === "searching" ? "🔍" : "GPS"}
        </button>
      </div>

      {/* GPS Zone Alert */}
      <AnimatePresence>
        {currentZone && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="relative z-10 mx-3 mt-2 p-2.5 rounded-lg bg-green-500/15 border border-green-500/25">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-green-400 text-xs font-bold">You're near {currentZone.name}!</p>
                <p className="text-white/50 text-[10px]">{currentZone.type === "ride_line" ? "🎢 Ride Queue" : currentZone.type === "restaurant" ? "🍽️ Restaurant" : "🛍️ Shop"} — Bonus clue available</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GPS Clues Collected */}
      {gpsClues.length > 0 && (
        <div className="relative z-10 mx-3 mt-1">
          <button onClick={() => setShowGpsPanel(!showGpsPanel)}
            className="text-[10px] text-green-400/60 hover:text-green-400">
            📍 {gpsClues.length} GPS clue{gpsClues.length > 1 ? "s" : ""} found {showGpsPanel ? "▲" : "▼"}
          </button>
          {showGpsPanel && (
            <div className="mt-1 space-y-1">
              {gpsClues.map((gc, i) => (
                <div key={i} className="p-2 rounded-lg bg-green-500/10 border border-green-500/15 text-white/60 text-[10px]">
                  📍 {gc.clue}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Story Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 relative z-10">
        <div className="max-w-lg mx-auto space-y-3">
          {paragraphs.map((para, i) => {
            const isChoice = para.startsWith("▸");
            const isEvidence = para.includes("EVIDENCE FOUND") || para.includes("CRITICAL EVIDENCE");
            const isWitness = para.includes("WITNESS STATEMENT");
            const isMotive = para.includes("MOTIVE FOUND");
            const isTwist = para.includes("PLOT TWIST");

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className={`text-sm leading-relaxed ${
                  isChoice ? "text-amber-400/70 font-semibold pl-4 border-l-2 border-amber-500/30" :
                  isEvidence ? "bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-white/80" :
                  isWitness ? "bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-white/80" :
                  isMotive ? "bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-white/80" :
                  isTwist ? "bg-red-500/20 border-2 border-red-500/40 rounded-lg p-4 text-white font-bold" :
                  "text-white/70"
                }`}
                dangerouslySetInnerHTML={{ __html: para }}
              />
            );
          })}
        </div>
      </div>

      {/* Choices */}
      <AnimatePresence>
        {choices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 border-t border-white/10 bg-[#060a14]/95 backdrop-blur-sm p-3"
          >
            <div className="max-w-lg mx-auto space-y-1.5 max-h-[40vh] overflow-y-auto">
              {choices.map((choice, i) => {
                const isConfront = choice.text.includes("🔥");
                const isBack = choice.text.includes("←");
                const isAccuse = choice.text.includes("🗳️") || choice.text.includes("⚖️");

                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => makeChoice(choice.index)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${
                      isConfront ? "bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 font-bold" :
                      isAccuse ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-bold" :
                      isBack ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10" :
                      "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    {choice.text}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* End of story */}
      {choices.length === 0 && !loading && paragraphs.length > 0 && (
        <div className="relative z-10 p-4 border-t border-white/10 text-center">
          <button onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl">
            🔍 Case Complete — Back to Games
          </button>
        </div>
      )}
    </div>
  );
}
