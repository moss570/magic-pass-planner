import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Zap, MapPin, Clock, Navigation, Trophy, Gamepad2, RefreshCw,
  ChevronDown, ChevronUp, Star, Sparkles, Timer, AlertTriangle,
  CloudRain, Calendar, BarChart3, SortAsc, Filter, Menu, X, Search
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import CompassButton from "@/components/CompassButton";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import WhereAmI from "@/components/WhereAmI";
import PhotoFun from "@/pages/PhotoFun";
import ShowTimes from "@/pages/ShowTimes";
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

// Navigate-To locations by park
const PARK_LOCATIONS: Record<string, Array<{ name: string; type: "ride" | "restaurant" | "shop" | "restroom" | "area"; area: string }>> = {
  "magic-kingdom": [
    // Rides
    { name: "TRON Lightcycle / Run", type: "ride", area: "Tomorrowland" },
    { name: "Space Mountain", type: "ride", area: "Tomorrowland" },
    { name: "Seven Dwarfs Mine Train", type: "ride", area: "Fantasyland" },
    { name: "Big Thunder Mountain Railroad", type: "ride", area: "Frontierland" },
    { name: "Tiana's Bayou Adventure", type: "ride", area: "Frontierland" },
    { name: "Haunted Mansion", type: "ride", area: "Liberty Square" },
    { name: "Pirates of the Caribbean", type: "ride", area: "Adventureland" },
    { name: "Jungle Cruise", type: "ride", area: "Adventureland" },
    { name: "Peter Pan's Flight", type: "ride", area: "Fantasyland" },
    { name: "it's a small world", type: "ride", area: "Fantasyland" },
    { name: "Mad Tea Party", type: "ride", area: "Fantasyland" },
    { name: "Dumbo the Flying Elephant", type: "ride", area: "Fantasyland" },
    { name: "The Barnstormer", type: "ride", area: "Fantasyland" },
    { name: "Buzz Lightyear's Space Ranger Spin", type: "ride", area: "Tomorrowland" },
    { name: "Astro Orbiter", type: "ride", area: "Tomorrowland" },
    { name: "Tomorrowland Speedway", type: "ride", area: "Tomorrowland" },
    // Restaurants
    { name: "Be Our Guest Restaurant", type: "restaurant", area: "Fantasyland" },
    { name: "Cinderella's Royal Table", type: "restaurant", area: "Fantasyland" },
    { name: "Liberty Tree Tavern", type: "restaurant", area: "Liberty Square" },
    { name: "The Skipper Canteen", type: "restaurant", area: "Adventureland" },
    { name: "Tony's Town Square Restaurant", type: "restaurant", area: "Main Street USA" },
    { name: "Columbia Harbour House", type: "restaurant", area: "Liberty Square" },
    { name: "Pecos Bill Tall Tale Inn & Cafe", type: "restaurant", area: "Frontierland" },
    // Areas / Landmarks
    { name: "Cinderella Castle", type: "area", area: "Main Street USA" },
    { name: "Main Street USA", type: "area", area: "Entrance" },
    { name: "Town Square", type: "area", area: "Main Street USA" },
    { name: "Main Street Hub", type: "area", area: "Main Street USA" },
    { name: "Fantasyland", type: "area", area: "Park" },
    { name: "Tomorrowland", type: "area", area: "Park" },
    { name: "Frontierland", type: "area", area: "Park" },
    { name: "Adventureland", type: "area", area: "Park" },
    { name: "Liberty Square", type: "area", area: "Park" },
    { name: "Guest Services", type: "area", area: "Main Street USA" },
    { name: "First Aid", type: "area", area: "Main Street USA" },
    { name: "Stroller Rental", type: "area", area: "Main Street USA" },
  ],
  "epcot": [
    { name: "Guardians of the Galaxy: Cosmic Rewind", type: "ride", area: "World Discovery" },
    { name: "Test Track", type: "ride", area: "World Discovery" },
    { name: "Spaceship Earth", type: "ride", area: "World Celebration" },
    { name: "Remy's Ratatouille Adventure", type: "ride", area: "World Showcase - France" },
    { name: "Frozen Ever After", type: "ride", area: "World Showcase - Norway" },
    { name: "Soarin'", type: "ride", area: "World Nature" },
    { name: "The Seas with Nemo", type: "ride", area: "World Nature" },
    { name: "Space 220 Restaurant", type: "restaurant", area: "World Discovery" },
    { name: "Le Cellier Steakhouse", type: "restaurant", area: "World Showcase - Canada" },
    { name: "Topolino's Terrace", type: "restaurant", area: "World Showcase" },
    { name: "Akershus Royal Banquet Hall", type: "restaurant", area: "World Showcase - Norway" },
    { name: "World Showcase", type: "area", area: "Park" },
    { name: "Future World", type: "area", area: "Park" },
  ],
  "hollywood-studios": [
    { name: "Star Wars: Rise of the Resistance", type: "ride", area: "Galaxy's Edge" },
    { name: "Millennium Falcon: Smugglers Run", type: "ride", area: "Galaxy's Edge" },
    { name: "Slinky Dog Dash", type: "ride", area: "Toy Story Land" },
    { name: "Rockin' Roller Coaster", type: "ride", area: "Sunset Boulevard" },
    { name: "Tower of Terror", type: "ride", area: "Sunset Boulevard" },
    { name: "Mickey & Minnie's Runaway Railway", type: "ride", area: "Hollywood Boulevard" },
    { name: "Sci-Fi Dine-In Theater", type: "restaurant", area: "Hollywood Boulevard" },
    { name: "50's Prime Time Café", type: "restaurant", area: "Hollywood Boulevard" },
    { name: "Galaxy's Edge", type: "area", area: "Park" },
    { name: "Toy Story Land", type: "area", area: "Park" },
    { name: "Sunset Boulevard", type: "area", area: "Park" },
  ],
  "animal-kingdom": [
    { name: "Avatar Flight of Passage", type: "ride", area: "Pandora" },
    { name: "Na'vi River Journey", type: "ride", area: "Pandora" },
    { name: "Expedition Everest", type: "ride", area: "Asia" },
    { name: "Kilimanjaro Safaris", type: "ride", area: "Africa" },
    { name: "Tiffins Restaurant", type: "restaurant", area: "Discovery Island" },
    { name: "Tusker House Restaurant", type: "restaurant", area: "Africa" },
    { name: "Pandora - The World of Avatar", type: "area", area: "Park" },
    { name: "Discovery Island", type: "area", area: "Park" },
    { name: "Tree of Life", type: "area", area: "Discovery Island" },
  ],
  "typhoon-lagoon": [
    { name: "Miss Adventure Falls", type: "ride", area: "Park" },
    { name: "Crush 'n' Gusher", type: "ride", area: "Park" },
    { name: "Typhoon Lagoon Surf Pool", type: "area", area: "Park" },
    { name: "Leaning Palms", type: "restaurant", area: "Park" },
  ],
  "blizzard-beach": [
    { name: "Summit Plummet", type: "ride", area: "Park" },
    { name: "Slush Gusher", type: "ride", area: "Park" },
    { name: "Melt-Away Bay", type: "area", area: "Park" },
    { name: "Lottawatta Lodge", type: "restaurant", area: "Park" },
  ],
};


// LINE GAMES — mini games to play while waiting
// Supabase connection for trivia
// SUPABASE_URL already declared above
const SUPABASE_ANON = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";

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
    id: "scavenger-hunt",
    name: "Queue Scavenger Hunt",
    icon: "🔍",
    description: "Find hidden items in the ride queue!",
    type: "coming-soon",
    comingSoon: true,
    badge: "🚧 Coming Soon",
  },
  {
    id: "word-scramble",
    name: "Word Scramble",
    icon: "🔤",
    description: "Unscramble Disney words!",
    words: [
      { scrambled: "CKYEMI", answer: "MICKEY", answer2: "MICKEY" },
      { scrambled: "NIEMN", answer: "MINNIE", answer2: "MINNIE" },
      { scrambled: "FOOLYG", answer: "GOOFY", answer2: "GOOFY" },
      { scrambled: "DLNADO", answer: "DONALD", answer2: "DONALD" },
      { scrambled: "TULOP", answer: "PLUTO", answer2: "PLUTO" },
    ],
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
  const [triviaQuestions, setTriviaQuestions] = useState(LINE_GAMES[0].questions || []);
  const [triviaLoaded, setTriviaLoaded] = useState(false);
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
    const q = (triviaQuestions[triviaQ] || LINE_GAMES[0].questions[triviaQ]);
    if (idx === (q.answer ?? (q as any).correct_answer ?? 0)) setScore(s => s + 1);
    // No auto-advance - user clicks "Next Question" button
  };

  const handleTriviaNext = () => {
    if (triviaQ + 1 >= triviaQuestions.length) {
      setGameOver(true);
    } else {
      setTriviaQ(q => q + 1);
      setAnswered(null);
    }
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

    // Load trivia from Supabase when game starts
  const loadTrivia = async () => {
    if (triviaLoaded) return;
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/trivia_questions?is_active=eq.true&order=random()&limit=10`,
        { headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` } }
      );
      const data = await resp.json();
      if (data && data.length > 0) {
        setTriviaQuestions(data.map((q: any) => ({
          q: q.question,
          options: q.options,
          answer: q.correct_answer,
        })));
        setTriviaLoaded(true);
      }
    } catch (_) {}
  };

  if (!activeGame) {
    return (
      <div className="rounded-xl p-5 border border-white/10" style={{ background: "var(--card)" }}>
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
              onClick={() => {
                if ((g as any).comingSoon) return;
                if (g.id === "disney-trivia") loadTrivia();
                setScore(0); setTriviaQ(0); setAnswered(null); setGameOver(false); setScrambleIdx(0); setScrambleInput(""); setScrambleCorrect(null);
                if (g.id === "disney-trivia") {
                  // Fetch 10 random questions from Supabase
                  fetch(`${SUPABASE_URL}/rest/v1/trivia_questions?is_active=eq.true&order=id.asc&limit=100`, {
                    headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` }
                  }).then(r => r.json()).then(data => {
                    if (data && data.length > 0) {
                      const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, 10);
                      setTriviaQuestions(shuffled.map((q: any) => ({ q: q.question, options: q.options, answer: q.correct_answer })));
                    }
                  }).catch(() => {});
                }
                setActiveGame(g.id);
              }}
              disabled={(g as any).comingSoon}
              className={`text-left p-3 rounded-lg border transition-colors ${(g as any).comingSoon ? "border-white/5 opacity-60 cursor-not-allowed" : "border-white/10 hover:border-primary/40 hover:bg-primary/5"}`}
            >
              <div className="text-2xl mb-1">{g.icon}</div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-sm font-semibold text-foreground">{g.name}</p>
              </div>
              {(g as any).comingSoon ? (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-semibold">{(g as any).badge}</span>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5 border border-white/10" style={{ background: "var(--card)" }}>
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
            <span>Question {triviaQ + 1} of {triviaQuestions.length}</span>
            <span className="text-primary font-bold">Score: {score}</span>
          </div>
          <p className="text-sm font-semibold text-foreground mb-4">{(triviaQuestions[triviaQ] || LINE_GAMES[0].questions[triviaQ]).q}</p>
          <div className="grid grid-cols-1 gap-2">
            {(triviaQuestions[triviaQ] || LINE_GAMES[0].questions[triviaQ]).options.map((opt, i) => {
              let bg = "bg-muted/20 border-white/10 text-muted-foreground";
              if (answered !== null) {
                if (i === (triviaQuestions[triviaQ] || LINE_GAMES[0].questions[triviaQ]).answer) bg = "bg-green-500/20 border-green-500/40 text-green-400";
                else if (i === answered) bg = "bg-red-500/20 border-red-500/40 text-red-400";
              }
              return (
                <button key={i} onClick={() => handleTriviaAnswer(i)}
                  disabled={answered !== null}
                  className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${bg} disabled:cursor-default`}>
                  {opt}
                </button>
              );
            })}
            {answered !== null && (
              <button
                onClick={handleTriviaNext}
                className="w-full py-3 rounded-xl font-bold text-sm text-[#080E1E] mt-2"
                style={{ background: "#F5C842" }}
              >
                {triviaQ + 1 >= triviaQuestions.length ? "See My Score 🏆" : "Next Question →"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAPPER */}
      {activeGame === "speed-tapper" && (
        <div className="text-center">
          {!tapActive && tapTimeLeft === 10 && (
            <button onClick={startTapper} className="px-8 py-4 rounded-xl font-bold text-lg text-[var(--background)] w-full" style={{ background: "#F5C842" }}>
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
              <button onClick={startTapper} className="mt-4 px-6 py-2 rounded-lg font-bold text-sm text-[var(--background)]" style={{ background: "#F5C842" }}>Try Again</button>
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
            <p className="text-xs text-muted-foreground mt-2">Unscramble the letters!</p>
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
            <button onClick={handleScrambleSubmit} className="px-4 py-2.5 rounded-lg font-bold text-sm text-[var(--background)]" style={{ background: "#F5C842" }}>
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
          <p className="text-muted-foreground text-sm mb-4">Final Score: {score}/{activeGame === "disney-trivia" ? triviaQuestions.length : LINE_GAMES[2].words.length}</p>
          <button onClick={() => { setActiveGame(null); }} className="px-6 py-2 rounded-lg font-bold text-sm text-[var(--background)]" style={{ background: "#F5C842" }}>Play Again</button>
        </div>
      )}
    </div>
  );
}

export default function LivePark() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPark, setSelectedPark] = useState("magic-kingdom");
  const [parkData, setParkData] = useState<ParkData | null>(null);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [inPark, setInPark] = useState<boolean | null>(null);
  const [isGameDev, setIsGameDev] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("wait");
  const [filterArea, setFilterArea] = useState("All");
  const [showOnlyOpen, setShowOnlyOpen] = useState(true);
  const [showFireworksOnly, setShowFireworksOnly] = useState(false);
  const [fireworksTime, setFireworksTime] = useState("21:00");
  const [activeTab, setActiveTab] = useState<"waits" | "show-times" | "info">("waits");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [liveMenuOpen, setLiveMenuOpen] = useState(false);
  const [whereAmIOpen, setWhereAmIOpen] = useState(false);
  const [activeSubPage, setActiveSubPage] = useState<"none" | "photo-fun" | "show-times" | "magic-beacon" | "line-games">("none");
  const [navigateOpen, setNavigateOpen] = useState(false);
  const [navigateSearch, setNavigateSearch] = useState("");
  const [navigateTarget, setNavigateTarget] = useState<{name: string; area: string} | null>(null);

  // GPS detection
  useEffect(() => {
    // Check for mock location (testing mode)
    // Check if user is a game developer
    if (user?.id) {
      supabase.from("vip_accounts").select("is_game_developer").eq("user_id", user.id).single()
        .then(({ data }) => setIsGameDev(data?.is_game_developer || false));
    }

    const checkMockLocation = async () => {
      try {
        const { data: profile } = await supabase
          .from("users_profile")
          .select("mock_lat, mock_lng")
          .eq("id", user?.id || "")
          .single();
        
        if (profile?.mock_lat && profile?.mock_lng) {
          setUserLat(profile.mock_lat);
          setUserLng(profile.mock_lng);
          setInPark(true);
          return true;
        }
      } catch {}
      return false;
    };

    checkMockLocation().then(hasMock => {
      if (hasMock) return;
      
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
    });
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
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${selectedPark === p.slug ? "bg-primary text-[var(--background)]" : "bg-muted/20 text-muted-foreground hover:bg-muted/40"}`}
            >
              <span>{p.icon}</span>{p.name}
            </button>
          ))}
        </div>

        {/* GPS Status Banner + Live Park Menu Button */}
        {inPark === false && gpsError === null && (
          <div className="rounded-xl px-4 py-4 border border-yellow-500/30 bg-yellow-500/10">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="w-4 h-4 text-yellow-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-400">You're not in the park</p>
                <p className="text-xs text-muted-foreground">Live wait times available · Navigation hidden until you're inside</p>
              </div>
            </div>
            <button
              onClick={() => setLiveMenuOpen(true)}
              className="w-full py-2.5 rounded-lg font-bold text-sm text-[var(--background)] flex items-center justify-center gap-2"
              style={{ background: "#F5C842" }}
            >
              <Zap className="w-4 h-4" /> LIVE PARK MENU
            </button>
          </div>
        )}
        {inPark === true && (
          <div className="rounded-xl px-4 py-4 border border-green-500/30 bg-green-500/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400 live-pulse shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-400">You're in {PARKS.find(p => p.slug === selectedPark)?.name}! 🎉</p>
                <p className="text-xs text-muted-foreground">All features active · Have a magical day!</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setLiveMenuOpen(true)}
                className="flex-1 py-2.5 rounded-lg font-bold text-sm text-[var(--background)] flex items-center justify-center gap-2"
                style={{ background: "#F5C842" }}
              >
                <Zap className="w-4 h-4" /> LIVE PARK MENU
              </button>
              <button
                onClick={() => setNavigateOpen(true)}
                className="flex-1 py-2.5 rounded-lg font-bold text-sm text-foreground border border-primary/40 flex items-center justify-center gap-2 bg-primary/10"
              >
                <Navigation className="w-4 h-4 text-primary" /> NAVIGATE TO
              </button>
            </div>
          </div>
        )}
        {gpsError && (
          <div className="rounded-xl px-4 py-4 border border-white/10 bg-muted/10">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">GPS unavailable — {gpsError}</p>
            </div>
            <button
              onClick={() => setLiveMenuOpen(true)}
              className="w-full py-2.5 rounded-lg font-bold text-sm text-[var(--background)] flex items-center justify-center gap-2"
              style={{ background: "#F5C842" }}
            >
              <Zap className="w-4 h-4" /> LIVE PARK MENU
            </button>
          </div>
        )}

        {/* LIVE PARK MENU — slide-up modal */}
        {liveMenuOpen && (
          <>
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setLiveMenuOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-[51] rounded-t-2xl overflow-hidden" style={{ background: "var(--card)" }}>
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: "rgba(245,200,66,0.15)" }}>
                <div>
                  <p className="text-base font-bold text-foreground">⚡ Live Park Menu</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{PARKS.find(p => p.slug === selectedPark)?.icon} {PARKS.find(p => p.slug === selectedPark)?.name}</p>
                </div>
                <button onClick={() => setLiveMenuOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3 pb-8">
                {[
                  { id: "waits", icon: "⚡", label: "Wait Times", sub: "Live ride waits + sort by distance" },
                  { id: "fireworks", icon: "🎆", label: "Fireworks Calculator", sub: "Ride timing for best views" },
                  { id: "games", icon: "🎮", label: "Line Games", sub: "Play while you wait" },
                  { id: "info", icon: "ℹ️", label: "Park Info", sub: "Hours, crowds, Lightning Lane" },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); setLiveMenuOpen(false); }}
                    className={`text-left p-4 rounded-xl border transition-colors ${activeTab === item.id ? "border-primary/60 bg-primary/10" : "border-white/10 bg-[var(--muted)] hover:border-primary/30"}`}
                  >
                    <p className="text-2xl mb-2">{item.icon}</p>
                    <p className="text-sm font-bold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                  </button>
                ))}
                {inPark && (
                  <button
                    onClick={() => { setNavigateOpen(true); setLiveMenuOpen(false); }}
                    className="text-left p-4 rounded-xl border border-white/10 bg-[var(--muted)] hover:border-primary/30 transition-colors"
                  >
                    <p className="text-2xl mb-2">🧭</p>
                    <p className="text-sm font-bold text-foreground">Navigate To</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Compass to any attraction or restaurant</p>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* NAVIGATE TO — full screen destination picker */}
        {navigateOpen && (
          <>
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setNavigateOpen(false)} />
            <div className="fixed inset-x-0 bottom-0 top-16 z-[51] rounded-t-2xl overflow-hidden flex flex-col" style={{ background: "var(--card)" }}>
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b shrink-0" style={{ borderColor: "rgba(245,200,66,0.15)" }}>
                <p className="text-base font-bold text-foreground">🧭 Navigate To</p>
                <button onClick={() => setNavigateOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-4 pt-3 pb-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search attractions, restaurants, areas..."
                    value={navigateSearch}
                    onChange={e => setNavigateSearch(e.target.value)}
                    autoFocus
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[var(--muted)] border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-8">
                {(() => {
                  const locations = PARK_LOCATIONS[selectedPark] || [];
                  const filtered = navigateSearch
                    ? locations.filter(l => l.name.toLowerCase().includes(navigateSearch.toLowerCase()) || l.area.toLowerCase().includes(navigateSearch.toLowerCase()))
                    : locations;
                  
                  const grouped: Record<string, typeof locations> = {};
                  filtered.forEach(loc => {
                    if (!grouped[loc.area]) grouped[loc.area] = [];
                    grouped[loc.area].push(loc);
                  });

                  return Object.entries(grouped).map(([area, locs]) => (
                    <div key={area} className="mb-4">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 mt-3">{area}</p>
                      {locs.map(loc => (
                        <button
                          key={loc.name}
                          onClick={() => {
                            setNavigateTarget({ name: loc.name, area: loc.area });
                            setNavigateOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-primary/10 transition-colors text-left mb-1"
                        >
                          <span className="text-lg">{loc.type === "ride" ? "🎢" : loc.type === "restaurant" ? "🍽️" : loc.type === "shop" ? "🛍️" : "📍"}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{loc.name}</p>
                            <p className="text-xs text-muted-foreground">{loc.area}</p>
                          </div>
                          <Navigation className="w-4 h-4 text-primary ml-auto" />
                        </button>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </>
        )}

        {/* Navigate To — Compass overlay when destination selected */}
        {navigateTarget && (
          <div className="rounded-xl p-4 border border-primary/40 bg-primary/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Navigating to:</p>
              <p className="text-sm font-bold text-foreground">{navigateTarget.name}</p>
              <p className="text-xs text-muted-foreground">{navigateTarget.area}</p>
            </div>
            <div className="flex gap-2">
              <CompassButton destination={navigateTarget.name} context={`${navigateTarget.area} · ${PARKS.find(p => p.slug === selectedPark)?.name}`} size="inline" />
              <button onClick={() => setNavigateTarget(null)} className="text-xs text-muted-foreground hover:text-foreground px-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Row */}
        {parkData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl p-4 border border-white/8" style={{ background: "var(--card)" }}>
              <p className="text-xs text-muted-foreground mb-1">Crowd Level</p>
              <p className={`text-2xl font-bold ${crowdColor(parkData.crowdLevel.level)}`}>{parkData.crowdLevel.level}/10</p>
              <p className={`text-xs font-semibold ${crowdColor(parkData.crowdLevel.level)}`}>{parkData.crowdLevel.label}</p>
            </div>
            <div className="rounded-xl p-4 border border-white/8" style={{ background: "var(--card)" }}>
              <p className="text-xs text-muted-foreground mb-1">Avg Wait</p>
              <p className={`text-2xl font-bold ${waitColor(parkData.averageWait)}`}>{parkData.averageWait} min</p>
              <p className="text-xs text-muted-foreground">park-wide</p>
            </div>
            <div className="rounded-xl p-4 border border-white/8" style={{ background: "var(--card)" }}>
              <p className="text-xs text-muted-foreground mb-1">Park Hours</p>
              <p className="text-lg font-bold text-foreground">{fmtTime(schedule?.today?.openingTime ?? null)}</p>
              <p className="text-xs text-muted-foreground">closes {fmtTime(schedule?.today?.closingTime ?? null)}</p>
            </div>
            <div className="rounded-xl p-4 border border-white/8" style={{ background: "var(--card)" }}>
              <p className="text-xs text-muted-foreground mb-1">Open Rides</p>
              <p className="text-2xl font-bold text-foreground">{parkData.openAttractions}</p>
              <p className="text-xs text-muted-foreground">of {parkData.totalAttractions} attractions</p>
            </div>
          </div>
        )}

        {/* Tab Bar — desktop only, mobile uses Live Park Menu */}
        <div className="hidden md:flex gap-1 border-b border-white/10">
          {[
            { id: "waits", label: "⚡ Wait Times" },
            { id: "show-times", label: "🎭 Show Times" },
            { id: "info", label: "ℹ️ Park Info" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setActiveSubPage("none"); }}
              className={`px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${activeTab === tab.id && activeSubPage === "none" ? "text-primary border-b-2 border-primary -mb-px" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab.label}
            </button>
          ))}
          {["line-games","photo-fun","magic-beacon"].map(sp => (
            <button key={sp} onClick={() => setActiveSubPage(sp as any)}
              className={`px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${activeSubPage === sp ? "text-secondary border-b-2 border-secondary -mb-px" : "text-muted-foreground hover:text-foreground"}`}>
              {sp === "line-games" ? "🎮 Line Games" : sp === "photo-fun" ? "📸 Photo Fun" : "🏰 Magic Beacon"}
            </button>
          ))}
        </div>
        {/* Current view label on mobile */}
        <div className="md:hidden flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing: <span className="text-foreground font-semibold">
              {activeSubPage !== "none" ? 
                (activeSubPage === "line-games" ? "🎮 Line Games" : activeSubPage === "photo-fun" ? "📸 Photo Fun" : "🏰 Magic Beacon") :
                (activeTab === "waits" ? "⚡ Wait Times" : activeTab === "show-times" ? "🎭 Show Times" : "ℹ️ Park Info")
              }
            </span>
          </p>
          <button onClick={() => setLiveMenuOpen(true)} className="text-xs text-primary font-semibold flex items-center gap-1">
            <Menu className="w-3.5 h-3.5" /> Switch View
          </button>
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
                    className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${sortMode === s ? "bg-primary text-[var(--background)]" : "bg-muted/20 text-muted-foreground"}`}>
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
                    className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-medium shrink-0 transition-colors ${filterArea === a ? "bg-primary text-[var(--background)]" : "bg-muted/20 text-muted-foreground"}`}>
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
                  <div key={ride.id} className={`rounded-xl p-4 border transition-colors ${ride.status !== "OPERATING" ? "border-white/5 opacity-60" : "border-white/10"}`} style={{ background: "var(--card)" }}>
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
        {(activeTab as string) === "fireworks" && (
          <div className="space-y-4">
            <div className="rounded-xl p-5 border border-secondary/30" style={{ background: "var(--card)" }}>
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
        {/* SHOW TIMES TAB */}
        {activeTab === "show-times" && activeSubPage === "none" && (
          <ShowTimes selectedPark={PARKS.find(p => p.slug === selectedPark)?.name || "Magic Kingdom"} inPark={inPark || false} />
        )}

        {/* Legacy: keep original games tab hidden, render via sub-page instead */}
        {activeTab === "games_HIDDEN" && (
          <div className="space-y-4">
            <button
              onClick={() => setWhereAmIOpen(true)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
            >
              📸 Where Am I? — Play Now!
            </button>
            <LineGames />
          </div>
        )}
                {whereAmIOpen && <WhereAmI onClose={() => setWhereAmIOpen(false)} />}

        {/* ── PARK INFO TAB ───────────────────────────────────── */}
        {activeTab === "info" && (
          <div className="space-y-4">
            {schedule && (
              <div className="rounded-xl p-5 border border-white/10" style={{ background: "var(--card)" }}>
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
              <div className="rounded-xl p-5 border border-white/10" style={{ background: "var(--card)" }}>
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
// Note: FIREWORKS_RIDE_DATA expanded to 9 locations - sync with edge function
