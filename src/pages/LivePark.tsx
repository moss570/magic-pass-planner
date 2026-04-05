import { useState, useEffect, useCallback, useRef } from "react";
import {
  Zap, MapPin, Clock, Navigation, Trophy, Gamepad2, RefreshCw,
  ChevronDown, ChevronUp, Star, Sparkles, Timer, AlertTriangle,
  CloudRain, Calendar, BarChart3, SortAsc, Filter
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import CompassButton from "@/components/CompassButton";
import { useToast } from "@/hooks/use-toast";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";

const PARKS = [
  { slug: "magic-kingdom", name: "Magic Kingdom", icon: "🏰" },
  { slug: "epcot", name: "EPCOT", icon: "🌍" },
  { slug: "hollywood-studios", name: "Hollywood Studios", icon: "🎬" },
  { slug: "animal-kingdom", name: "Animal Kingdom", icon: "🦁" },
  { slug: "typhoon-lagoon", name: "Typhoon Lagoon", icon: "🌊" },
  { slug: "blizzard-beach", name: "Blizzard Beach", icon: "❄️" },
];

// Magic Kingdom GPS boundaries (rough bounding box)
const PARK_BOUNDS: Record<string, { lat: [number, number]; lng: [number, number] }> = {
  "magic-kingdom": { lat: [28.414, 28.426], lng: [-81.590, -81.574] },
  "epcot": { lat: [28.368, 28.377], lng: [-81.551, -81.538] },
  "hollywood-studios": { lat: [28.355, 28.363], lng: [-81.563, -81.554] },
  "animal-kingdom": { lat: [28.355, 28.365], lng: [-81.594, -81.582] },
  "typhoon-lagoon": { lat: [28.369, 28.376], lng: [-81.530, -81.523] },
  "blizzard-beach": { lat: [28.354, 28.360], lng: [-81.577, -81.568] },
};

// LINE GAMES — mini games to play while waiting
const LINE_GAMES = [
  {
    id: "disney-trivia",
    name: "Disney Trivia",
    icon: "🎯",
    description: "Test your Disney knowledge!",
    questions: [
      { q: "What year did Magic Kingdom open?", options: ["1969", "1971", "1973", "1975"], answer: 1 },
      { q: "Which princess lives in Cinderella Castle?", options: ["Aurora", "Belle", "Cinderella", "Ariel"], answer: 2 },
      { q: "What is the name of Elsa's kingdom?", options: ["Arendelle", "Agrabah", "Corona", "Motunui"], answer: 0 },
      { q: "How many original Walt Disney World parks were there at opening?", options: ["1", "2", "3", "4"], answer: 0 },
      { q: "Which ride was added to Magic Kingdom in 2023?", options: ["TRON", "Guardians", "Tiana's Bayou", "Remy's"], answer: 0 },
      { q: "What is Mickey Mouse's full name?", options: ["Michael Mouse", "Mickey Michael Mouse", "Michael Theodore Mouse", "Mickey Theodore Mouse"], answer: 2 },
      { q: "Which park is home to EPCOT's Guardians of the Galaxy?", options: ["Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom"], answer: 1 },
      { q: "What does EPCOT stand for?", options: ["Every Person Comes Out Tired", "Experimental Prototype Community of Tomorrow", "Epic Park of Creative Operations Today", "Enormous Park Creating Outstanding Times"], answer: 1 },
    ],
  },
  {
    id: "wait-time-guesser",
    name: "Wait Time Guesser",
    icon: "⏱️",
    description: "Guess the current wait time for rides!",
    type: "guesser",
  },
  {
    id: "disney-word-scramble",
    name: "Word Scramble",
    icon: "🔤",
    description: "Unscramble Disney character names!",
    words: [
      { scrambled: "LEUNEDRIAC", answer: "CINDERELLA", hint: "She lost a glass slipper" },
      { scrambled: "AYMIKCLSUO", answer: "MICKEY MOUSE", hint: "The main mouse" },
      { scrambled: "OTYZW", answer: "WOOTY", answer2: "WOODY", hint: "Cowboy toy" },
      { scrambled: "INAMROE", answer: "MOANA", hint: "Polynesian princess" },
      { scrambled: "ZIAMGALN", answer: "AMAZING", hint: "Rearrange to find a Disney motto word" },
      { scrambled: "ZABLZE", answer: "ELZA", answer2: "ELSA", hint: "Queen of ice powers" },
    ],
  },
  {
    id: "speed-tapper",
    name: "Castle Tapper",
    icon: "🏰",
    description: "Tap the castle as fast as you can in 10 seconds!",
    type: "tapper",
  },
];

interface RideData {
  id: string;
  name: string;
  status: string;
  area: string;
  standbyWait: number | null;
  singleRiderWait: number | null;
  llState: string | null;
  lastUpdated: string;
  rideTime: number | null;
  distanceMeters: number | null;
  distanceFeet: number | null;
  walkTimes: Record<string, number> | null;
  totalTimeToRide: Record<string, number> | null;
  fireworksTiming: any;
  hasFireworksView: boolean;
  fireworksViewQuality: string | null;
}

interface ParkData {
  rides: RideData[];
  crowdLevel: { level: number; label: string; color: string };
  averageWait: number;
  totalAttractions: number;
  openAttractions: number;
  hasUserLocation: boolean;
  fetchedAt: string;
}

interface ScheduleData {
  today: {
    openingTime: string | null;
    closingTime: string | null;
    earlyEntry: { open: string; close: string } | null;
    lightningLane: any;
  };
}

type SortMode = "distance" | "wait" | "area" | "name";

// LINE GAMES COMPONENT
function LineGames() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [triviaQ, setTriviaQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [tapActive, setTapActive] = useState(false);
  const [tapTimeLeft, setTapTimeLeft] = useState(10);
  const [scrambleInput, setScrambleInput] = useState("");
  const [scrambleIdx, setScrambleIdx] = useState(0);
  const [scrambleCorrect, setScrambleCorrect] = useState<boolean | null>(null);
  const tapInterval = useRef<any>(null);

  const game = LINE_GAMES.find(g => g.id === activeGame);

  const handleTriviaAnswer = (idx: number) => {
    if (answered !== null) return;
    setAnswered(idx);
    const q = LINE_GAMES[0].questions[triviaQ];
    if (idx === q.answer) setScore(s => s + 1);
    setTimeout(() => {
      if (triviaQ + 1 >= LINE_GAMES[0].questions.length) {
        setGameOver(true);
      } else {
        setTriviaQ(q => q + 1);
        setAnswered(null);
      }
    }, 1200);
  };

  const startTapper = () => {
    setTapCount(0);
    setTapActive(true);
    setTapTimeLeft(10);
    tapInterval.current = setInterval(() => {
      setTapTimeLeft(t => {
        if (t <= 1) {
          clearInterval(tapInterval.current);
          setTapActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleScrambleSubmit = () => {
    const w = LINE_GAMES[2];
    const current = w.words[scrambleIdx];
    const correct = scrambleInput.toUpperCase().trim() === current.answer ||
      scrambleInput.toUpperCase().trim() === (current as any).answer2;
    setScrambleCorrect(correct);
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (scrambleIdx + 1 >= w.words.length) {
        setGameOver(true);
      } else {
        setScrambleIdx(i => i + 1);
        setScrambleInput("");
        setScrambleCorrect(null);
      }
    }, 1200);
  };

  if (!activeGame) {
    return (
      <div className="rounded-xl p-5 border border-white/10" style={{ background: "#111827" }}>
        <div className="flex items-center gap-2 mb-4">
          <Gamepad2 className="w-5 h-5 text-secondary" />
          <h2 className="text-base font-bold text-foreground">Line Games</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-semibold">Beta</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Pass the time while you wait — quick games you can play with one hand!</p>
        <div className="grid grid-cols-2 gap-3">
          {LINE_GAMES.map(g => (
            <button
              key={g.id}
              onClick={() => { setActiveGame(g.id); setScore(0); setTriviaQ(0); setAnswered(null); setGameOver(false); setScrambleIdx(0); setScrambleInput(""); setScrambleCorrect(null); }}
              className="text-left p-3 rounded-lg border border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <div className="text-2xl mb-1">{g.icon}</div>
              <p className="text-sm font-semibold text-foreground">{g.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5 border border-white/10" style={{ background: "#111827" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{game?.icon}</span>
          <h2 className="text-base font-bold text-foreground">{game?.name}</h2>
        </div>
        <button onClick={() => setActiveGame(null)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-white/10">← Back</button>
      </div>

      {/* TRIVIA */}
      {activeGame === "disney-trivia" && !gameOver && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-3">
            <span>Question {triviaQ + 1} of {LINE_GAMES[0].questions.length}</span>
            <span className="text-primary font-bold">Score: {score}</span>
          </div>
          <p className="text-sm font-semibold text-foreground mb-4">{LINE_GAMES[0].questions[triviaQ].q}</p>
          <div className="grid grid-cols-1 gap-2">
            {LINE_GAMES[0].questions[triviaQ].options.map((opt, i) => {
              let bg = "bg-muted/20 border-white/10 text-muted-foreground";
              if (answered !== null) {
                if (i === LINE_GAMES[0].questions[triviaQ].answer) bg = "bg-green-500/20 border-green-500/40 text-green-400";
                else if (i === answered) bg = "bg-red-500/20 border-red-500/40 text-red-400";
              }
              return (
                <button key={i} onClick={() => handleTriviaAnswer(i)}
                  className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${bg}`}>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAPPER */}
      {activeGame === "speed-tapper" && (
        <div className="text-center">
          {!tapActive && tapTimeLeft === 10 && (
            <button onClick={startTapper} className="px-8 py-4 rounded-xl font-bold text-lg text-[#080E1E] w-full" style={{ background: "#F5C842" }}>
              Start Tapping!
            </button>
          )}
          {tapActive && (
            <>
              <p className="text-3xl font-bold text-primary mb-2">{tapTimeLeft}s</p>
              <button
                onClick={() => setTapCount(c => c + 1)}
                className="w-40 h-40 rounded-full text-6xl border-4 border-primary bg-primary/10 hover:bg-primary/20 active:scale-95 transition-all mx-auto flex items-center justify-center"
              >🏰</button>
              <p className="text-2xl font-bold text-foreground mt-3">{tapCount} taps</p>
            </>
          )}
          {!tapActive && tapTimeLeft === 0 && (
            <div>
              <p className="text-4xl font-bold text-primary mb-2">{tapCount}</p>
              <p className="text-muted-foreground mb-4">taps in 10 seconds!</p>
              <p className="text-sm text-muted-foreground">
                {tapCount >= 80 ? "🏆 You're a tapping legend!" : tapCount >= 50 ? "🔥 Great speed!" : tapCount >= 30 ? "👍 Nice work!" : "Keep practicing!"}
              </p>
              <button onClick={startTapper} className="mt-4 px-6 py-2 rounded-lg font-bold text-sm text-[#080E1E]" style={{ background: "#F5C842" }}>Try Again</button>
            </div>
          )}
        </div>
      )}

      {/* WORD SCRAMBLE */}
      {activeGame === "disney-word-scramble" && !gameOver && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-3">
            <span>Word {scrambleIdx + 1} of {LINE_GAMES[2].words.length}</span>
            <span className="text-primary font-bold">Score: {score}</span>
          </div>
          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-primary tracking-[0.3em]">{LINE_GAMES[2].words[scrambleIdx].scrambled}</p>
            <p className="text-xs text-muted-foreground mt-2">Hint: {LINE_GAMES[2].words[scrambleIdx].hint}</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={scrambleInput}
              onChange={e => setScrambleInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleScrambleSubmit()}
              placeholder="Your answer..."
              className={`flex-1 px-4 py-2.5 rounded-lg bg-[#1a2235] border text-sm text-foreground focus:outline-none transition-colors ${scrambleCorrect === true ? "border-green-500" : scrambleCorrect === false ? "border-red-500" : "border-white/10 focus:border-primary/50"}`}
              style={{ minHeight: 44 }}
            />
            <button onClick={handleScrambleSubmit} className="px-4 py-2.5 rounded-lg font-bold text-sm text-[#080E1E]" style={{ background: "#F5C842" }}>
              Check
            </button>
          </div>
          {scrambleCorrect !== null && (
            <p className={`text-sm font-semibold mt-2 text-center ${scrambleCorrect ? "text-green-400" : "text-red-400"}`}>
              {scrambleCorrect ? "✅ Correct!" : `❌ The answer was: ${LINE_GAMES[2].words[scrambleIdx].answer}`}
            </p>
          )}
        </div>
      )}

      {/* GAME OVER */}
      {gameOver && (
        <div className="text-center py-4">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-xl font-bold text-primary mb-1">Game Over!</p>
          <p className="text-muted-foreground text-sm mb-4">Final Score: {score}/{activeGame === "disney-trivia" ? LINE_GAMES[0].questions.length : LINE_GAMES[2].words.length}</p>
          <button onClick={() => { setActiveGame(null); }} className="px-6 py-2 rounded-lg font-bold text-sm text-[#080E1E]" style={{ background: "#F5C842" }}>Play Again</button>
        </div>
      )}
    </div>
  );
}

export default function LivePark() {
  const { toast } = useToast();
  const [selectedPark, setSelectedPark] = useState("magic-kingdom");
  const [parkData, setParkData] = useState<ParkData | null>(null);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [inPark, setInPark] = useState<boolean | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("wait");
  const [filterArea, setFilterArea] = useState("All");
  const [showOnlyOpen, setShowOnlyOpen] = useState(true);
  const [showFireworksOnly, setShowFireworksOnly] = useState(false);
  const [fireworksTime, setFireworksTime] = useState("21:00");
  const [activeTab, setActiveTab] = useState<"waits" | "fireworks" | "games" | "info">("waits");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // GPS detection
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS not supported on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setUserLat(latitude);
        setUserLng(longitude);

        // Check if in park
        const bounds = PARK_BOUNDS[selectedPark];
        if (bounds) {
          const inside = latitude >= bounds.lat[0] && latitude <= bounds.lat[1] &&
            longitude >= bounds.lng[0] && longitude <= bounds.lng[1];
          setInPark(inside);
        }
      },
      err => {
        setGpsError(err.code === 1 ? "Location permission denied" : "Could not get location");
        setInPark(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [selectedPark]);

  const fetchParkData = useCallback(async () => {
    setLoading(true);
    try {
      const latParam = userLat ? `&lat=${userLat}&lng=${userLng}` : "";
      const [liveRes, schedRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/functions/v1/park-live-data?action=wait-times&park=${selectedPark}${latParam}`),
        fetch(`${SUPABASE_URL}/functions/v1/park-live-data?action=schedule&park=${selectedPark}`),
      ]);

      if (liveRes.ok) {
        const data = await liveRes.json();
        setParkData(data);
      }
      if (schedRes.ok) {
        const data = await schedRes.json();
        setSchedule(data);
      }
      setLastRefresh(new Date());
    } catch (err) {
      toast({ title: "Failed to load park data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedPark, userLat, userLng, toast]);

  useEffect(() => {
    fetchParkData();
    const interval = setInterval(fetchParkData, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [fetchParkData]);

  // Filter and sort rides
  const areas = parkData ? ["All", ...Array.from(new Set(parkData.rides.map(r => r.area).filter(a => a !== "Unknown")))] : ["All"];

  const filteredRides = (parkData?.rides || [])
    .filter(r => showOnlyOpen ? r.status === "OPERATING" : true)
    .filter(r => filterArea === "All" || r.area === filterArea)
    .filter(r => showFireworksOnly ? r.hasFireworksView : true)
    .sort((a, b) => {
      if (sortMode === "distance") {
        if (a.distanceMeters !== null && b.distanceMeters !== null) return a.distanceMeters - b.distanceMeters;
        return 0;
      }
      if (sortMode === "wait") {
        const wa = a.standbyWait ?? 999;
        const wb = b.standbyWait ?? 999;
        return wa - wb;
      }
      if (sortMode === "area") return a.area.localeCompare(b.area);
      return a.name.localeCompare(b.name);
    });

  const waitColor = (wait: number | null) => {
    if (wait === null) return "text-muted-foreground";
    if (wait <= 15) return "text-green-400";
    if (wait <= 30) return "text-yellow-400";
    if (wait <= 45) return "text-orange-400";
    return "text-red-400";
  };

  const crowdColor = (level: number) => {
    if (level <= 3) return "text-green-400";
    if (level <= 5) return "text-yellow-400";
    if (level <= 7) return "text-orange-400";
    return "text-red-400";
  };

  // Format schedule time
  const fmtTime = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <DashboardLayout title="⚡ Live Park Mode" subtitle="Real-time intelligence for every minute you're in the park">
      <div className="space-y-4">

        {/* Park Selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {PARKS.map(p => (
            <button
              key={p.slug}
              onClick={() => setSelectedPark(p.slug)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${selectedPark === p.slug ? "bg-primary text-[#080E1E]" : "bg-muted/20 text-muted-foreground hover:bg-muted/40"}`}
            >
              <span>{p.icon}</span>{p.name}
            </button>
          ))}
        </div>

        {/* GPS Status / In-Park Banner */}
        {inPark === false && gpsError === null && (
          <div className="rounded-xl px-4 py-3 border border-yellow-500/30 bg-yellow-500/10 flex items-center gap-3">
            <MapPin className="w-4 h-4 text-yellow-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-400">You're not in the park</p>
              <p className="text-xs text-muted-foreground">Navigate buttons hidden · Wait times and fireworks calculator still available</p>
            </div>
          </div>
        )}
        {inPark === true && (
          <div className="rounded-xl px-4 py-3 border border-green-500/30 bg-green-500/10 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 live-pulse shrink-0" />
            <p className="text-sm font-semibold text-green-400">You're in {PARKS.find(p => p.slug === selectedPark)?.name}! All features active.</p>
          </div>
        )}
        {gpsError && (
          <div className="rounded-xl px-4 py-3 border border-white/10 bg-muted/10 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">GPS unavailable — {gpsError}. Navigation features disabled.</p>
          </div>
        )}

        {/* Stats Row */}
        {parkData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl p-4 border border-white/8" style={{ background: "#111827" }}>
              <p className="text-xs text-muted-foreground mb-1">Crowd Level</p>
              <p className={`text-2xl font-bold ${crowdColor(parkData.crowdLevel.level)}`}>{parkData.crowdLevel.level}/10</p>
              <p className={`text-xs font-semibold ${crowdColor(parkData.crowdLevel.level)}`}>{parkData.crowdLevel.label}</p>
            </div>
            <div className="rounded-xl p-4 border border-white/8" style={{ background: "#111827" }}>
              <p className="text-xs text-muted-foreground mb-1">Avg Wait</p>
              <p className={`text-2xl font-bold ${waitColor(parkData.averageWait)}`}>{parkData.averageWait} min</p>
              <p className="text-xs text-muted-foreground">park-wide</p>
            </div>
            <div className="rounded-xl p-4 border border-white/8" style={{ background: "#111827" }}>
              <p className="text-xs text-muted-foreground mb-1">Park Hours</p>
              <p className="text-lg font-bold text-foreground">{fmtTime(schedule?.today?.openingTime ?? null)}</p>
              <p className="text-xs text-muted-foreground">closes {fmtTime(schedule?.today?.closingTime ?? null)}</p>
            </div>
            <div className="rounded-xl p-4 border border-white/8" style={{ background: "#111827" }}>
              <p className="text-xs text-muted-foreground mb-1">Open Rides</p>
              <p className="text-2xl font-bold text-foreground">{parkData.openAttractions}</p>
              <p className="text-xs text-muted-foreground">of {parkData.totalAttractions} attractions</p>
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex gap-1 border-b border-white/10">
          {[
            { id: "waits", label: "⚡ Wait Times", icon: Clock },
            { id: "fireworks", label: "🎆 Fireworks", icon: Sparkles },
            { id: "games", label: "🎮 Line Games", icon: Gamepad2 },
            { id: "info", label: "ℹ️ Park Info", icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${activeTab === tab.id ? "text-primary border-b-2 border-primary -mb-px" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── WAIT TIMES TAB ─────────────────────────────────── */}
        {activeTab === "waits" && (
          <div>
            {/* Controls */}
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-1.5">
                <SortAsc className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Sort:</span>
                {(["wait", "distance", "area", "name"] as SortMode[]).map(s => (
                  <button key={s} onClick={() => setSortMode(s)}
                    className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${sortMode === s ? "bg-primary text-[#080E1E]" : "bg-muted/20 text-muted-foreground"}`}>
                    {s === "wait" ? "Wait" : s === "distance" ? "Distance" : s === "area" ? "Area" : "Name"}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <button onClick={() => setShowOnlyOpen(o => !o)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${showOnlyOpen ? "bg-green-500/20 text-green-400" : "bg-muted/20 text-muted-foreground"}`}>
                  Open only
                </button>
                <button onClick={() => setShowFireworksOnly(f => !f)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${showFireworksOnly ? "bg-primary/20 text-primary" : "bg-muted/20 text-muted-foreground"}`}>
                  🎆 Views
                </button>
              </div>
            </div>

            {/* Area filter */}
            {areas.length > 2 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3">
                {areas.map(a => (
                  <button key={a} onClick={() => setFilterArea(a)}
                    className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-medium shrink-0 transition-colors ${filterArea === a ? "bg-primary text-[#080E1E]" : "bg-muted/20 text-muted-foreground"}`}>
                    {a}
                  </button>
                ))}
              </div>
            )}

            {/* Refresh bar */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Updated {lastRefresh.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })} · Auto-refreshes every 60s</p>
              <button onClick={fetchParkData} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading live wait times...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredRides.map(ride => (
                  <div key={ride.id} className={`rounded-xl p-4 border transition-colors ${ride.status !== "OPERATING" ? "border-white/5 opacity-60" : "border-white/10"}`} style={{ background: "#111827" }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-tight">{ride.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ride.area}</p>
                      </div>
                      {ride.hasFireworksView && (
                        <span className="text-xs" title="Has fireworks view">🎆</span>
                      )}
                    </div>

                    {ride.status === "OPERATING" ? (
                      <>
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className={`text-3xl font-bold ${waitColor(ride.standbyWait)}`}>{ride.standbyWait ?? "—"}</span>
                          <span className="text-xs text-muted-foreground">min wait</span>
                        </div>

                        {ride.singleRiderWait !== null && (
                          <p className="text-xs text-muted-foreground mb-1">Single rider: {ride.singleRiderWait} min</p>
                        )}

                        {/* Walk times */}
                        {ride.walkTimes && (
                          <div className="mt-2 pt-2 border-t border-white/8">
                            <p className="text-xs text-muted-foreground mb-1">Walk from your location:</p>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                              <span className="text-muted-foreground">🚶 Stroll</span><span className="text-foreground font-medium">{ride.walkTimes.slowStroll} min</span>
                              <span className="text-muted-foreground">🚶 Walk</span><span className="text-foreground font-medium">{ride.walkTimes.standard} min</span>
                              <span className="text-muted-foreground">🏃 Speed</span><span className="text-foreground font-medium">{ride.walkTimes.speedWalk} min</span>
                              <span className="text-muted-foreground">🏃 Jog</span><span className="text-foreground font-medium">{ride.walkTimes.jog} min</span>
                            </div>
                            {ride.distanceFeet && (
                              <p className="text-xs text-muted-foreground mt-1">{(ride.distanceMeters! / 1000).toFixed(2)} km · {Math.round(ride.distanceFeet / 100) * 100} ft away</p>
                            )}
                          </div>
                        )}

                        {/* Navigate button — only shown if in park */}
                        {inPark && (
                          <div className="mt-2">
                            <CompassButton destination={ride.name} context={`${ride.area} · ${PARKS.find(p => p.slug === selectedPark)?.name}`} size="inline" />
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-muted-foreground">
                        {ride.status === "CLOSED" ? "Closed" : ride.status === "REFURBISHMENT" ? "Under Refurbishment" : ride.status}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FIREWORKS TAB ───────────────────────────────────── */}
        {activeTab === "fireworks" && (
          <div className="space-y-4">
            <div className="rounded-xl p-5 border border-secondary/30" style={{ background: "#111827" }}>
              <h3 className="text-sm font-bold text-foreground mb-3">🎆 Fireworks Ride Timing Calculator</h3>
              <p className="text-xs text-muted-foreground mb-4">Get on a ride AND see the fireworks — perfectly timed. Enter tonight's show time to calculate get-in-line times for every ride with a fireworks view.</p>

              <div className="flex items-center gap-3 mb-4">
                <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Fireworks Time:</label>
                <input
                  type="time"
                  value={fireworksTime}
                  onChange={e => setFireworksTime(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#1a2235] border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                />
                <span className="text-xs text-muted-foreground">(tonight)</span>
              </div>

              {parkData && (() => {
                const fireworksIso = new Date();
                const [hours, mins] = fireworksTime.split(":").map(Number);
                fireworksIso.setHours(hours, mins, 0, 0);
                const minutesUntil = (fireworksIso.getTime() - Date.now()) / 60000;

                const fireworksRides = parkData.rides.filter(r => r.hasFireworksView && r.status === "OPERATING");

                return (
                  <div>
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Timer className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {minutesUntil > 0 ? `${Math.round(minutesUntil)} min until fireworks` : "Show time has passed"}
                      </span>
                    </div>

                    {fireworksRides.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No rides with fireworks views found for this park</p>
                    ) : (
                      <div className="space-y-3">
                        {fireworksRides.map(ride => {
                          const wait = ride.standbyWait ?? 0;
                          const rideTime = ride.rideTime ?? 5;
                          const getInLineIn = minutesUntil - wait - rideTime - 2;
                          const getInLineAt = new Date(Date.now() + getInLineIn * 60000);
                          const quality = ride.fireworksViewQuality;

                          return (
                            <div key={ride.id} className="rounded-xl p-4 border border-white/10">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${quality === "excellent" ? "bg-green-500/20 text-green-400" : quality === "great" ? "bg-blue-500/20 text-blue-400" : quality === "good" ? "bg-yellow-500/20 text-yellow-400" : "bg-muted/20 text-muted-foreground"}`}>
                                      {quality === "excellent" ? "⭐ Excellent View" : quality === "great" ? "✨ Great View" : quality === "good" ? "👍 Good View" : "🌓 Partial View"}
                                    </span>
                                  </div>
                                  <p className="text-sm font-bold text-foreground mt-1">{ride.name}</p>
                                  <p className="text-xs text-muted-foreground">{ride.area} · Current wait: {wait} min · Ride: {rideTime} min</p>
                                </div>
                              </div>

                              {getInLineIn > -5 ? (
                                <div className={`px-3 py-2 rounded-lg mt-2 ${getInLineIn <= 0 ? "bg-red-500/15 border border-red-500/20" : getInLineIn <= 15 ? "bg-yellow-500/15 border border-yellow-500/20" : "bg-green-500/15 border border-green-500/20"}`}>
                                  <p className={`text-sm font-bold ${getInLineIn <= 0 ? "text-red-400" : getInLineIn <= 15 ? "text-yellow-400" : "text-green-400"}`}>
                                    {getInLineIn <= 0 ? "Get in line NOW!" : `Get in line at ${getInLineAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {getInLineIn > 0 ? `In ${Math.round(getInLineIn)} minutes` : `${Math.abs(Math.round(getInLineIn))} min ago — hurry!`}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground mt-2 italic">Not enough time for this ride before fireworks tonight</p>
                              )}

                              {inPark && (
                                <div className="mt-2">
                                  <CompassButton destination={ride.name} context={`${ride.area} · Magic Kingdom`} size="inline" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── LINE GAMES TAB ──────────────────────────────────── */}
        {activeTab === "games" && <LineGames />}

        {/* ── PARK INFO TAB ───────────────────────────────────── */}
        {activeTab === "info" && (
          <div className="space-y-4">
            {schedule && (
              <div className="rounded-xl p-5 border border-white/10" style={{ background: "#111827" }}>
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> Today's Schedule</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Park Open</span>
                    <span className="text-sm font-semibold text-foreground">{fmtTime(schedule.today.openingTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Park Close</span>
                    <span className="text-sm font-semibold text-foreground">{fmtTime(schedule.today.closingTime)}</span>
                  </div>
                  {schedule.today.earlyEntry && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Early Entry</span>
                      <span className="text-sm font-semibold text-primary">{fmtTime(schedule.today.earlyEntry.open)} – {fmtTime(schedule.today.earlyEntry.close)}</span>
                    </div>
                  )}
                  {schedule.today.lightningLane && (
                    <div className="flex justify-between items-center pt-2 border-t border-white/8">
                      <span className="text-sm text-muted-foreground">Lightning Lane Multi Pass</span>
                      <span className="text-sm font-semibold text-yellow-400">{schedule.today.lightningLane.price?.formatted || "Available"}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {parkData && (
              <div className="rounded-xl p-5 border border-white/10" style={{ background: "#111827" }}>
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Park Stats Right Now</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Crowd Level</span>
                    <span className={`text-sm font-semibold ${crowdColor(parkData.crowdLevel.level)}`}>{parkData.crowdLevel.level}/10 — {parkData.crowdLevel.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg. Standby Wait</span>
                    <span className="text-sm font-semibold text-foreground">{parkData.averageWait} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Attractions Open</span>
                    <span className="text-sm font-semibold text-green-400">{parkData.openAttractions} of {parkData.totalAttractions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Your Location</span>
                    <span className="text-sm font-semibold text-foreground">{inPark === true ? "✅ In the park" : inPark === false ? "🏠 Remote viewing" : "📍 Detecting..."}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Data Updated</span>
                    <span className="text-sm font-semibold text-foreground">{lastRefresh.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">Live data via ThemeParks.wiki · Updates every 60 seconds</p>
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
