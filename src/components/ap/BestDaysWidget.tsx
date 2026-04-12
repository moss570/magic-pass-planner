import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Send, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ParkSelectorChips from "./ParkSelectorChips";
import BestDayCard from "./BestDayCard";
import { fetchBestDays, type BestDayPrediction } from "@/lib/bestDays";
import { buildIcsForBestDays, downloadIcs } from "@/lib/icsExport";
import { useToast } from "@/hooks/use-toast";

const PARK_NAMES: Record<string, string> = {
  "magic-kingdom": "Magic Kingdom",
  "epcot": "EPCOT",
  "hollywood-studios": "Hollywood Studios",
  "animal-kingdom": "Animal Kingdom",
};

const GRADE_LEGEND = [
  { grade: "A", label: "85+", color: "text-green-400" },
  { grade: "B", label: "70–84", color: "text-blue-400" },
  { grade: "C", label: "55–69", color: "text-yellow-400" },
  { grade: "D", label: "40–54", color: "text-orange-400" },
  { grade: "F", label: "<40", color: "text-red-400" },
];

interface Props {
  userPassTier?: string | null;
}

export default function BestDaysWidget({ userPassTier = null }: Props) {
  const [selectedParks, setSelectedParks] = useState<string[]>(["magic-kingdom"]);
  const [sortBy, setSortBy] = useState<"score" | "date">("score");
  const [predictions, setPredictions] = useState<BestDayPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch predictions for the first selected park (primary view)
  const primaryParkId = selectedParks[0] || "magic-kingdom";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSelectedDates(new Set());

    fetchBestDays(primaryParkId, userPassTier, sortBy)
      .then((data) => {
        if (!cancelled) {
          setPredictions(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Best days fetch error:", err);
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [primaryParkId, userPassTier, sortBy]);

  const toggleDate = (date: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const handleSendToPlanner = () => {
    const dates = Array.from(selectedDates).sort();
    if (dates.length === 0) return;

    const parkHopper = selectedParks.length > 1;
    const parkNames = selectedParks.map(id => PARK_NAMES[id] || id);

    const params = new URLSearchParams({
      prefillDates: dates.join(","),
      prefillParks: selectedParks.join(","),
      mode: "day-trip",
    });
    if (parkHopper) {
      params.set("parkHopper", "true");
    }

    navigate(`/trip-planner?${params}`);
  };

  const handleDownloadIcs = () => {
    const selected = predictions.filter((p) => selectedDates.has(p.date));
    if (selected.length === 0) return;

    const selections = selected.map((p) => ({
      parkName: PARK_NAMES[p.parkId] || p.parkId,
      date: p.date,
      score: p.score,
      grade: p.grade,
      reasons: p.reasons,
    }));

    const ics = buildIcsForBestDays(selections);
    downloadIcs("best-days-to-go.ics", ics);
    toast({ title: "Calendar file downloaded", description: `${selected.length} day(s) exported` });
  };

  const hasSelection = selectedDates.size > 0;

  return (
    <div className="rounded-xl bg-card gold-border p-4 md:p-6">
      <h2 className="text-sm md:text-base font-bold text-foreground mb-1">🧠 Best Days to Go</h2>
      <p className="text-xs text-muted-foreground mb-4">Rolling 10-day forecast — scored by crowds, weather & your pass tier</p>

      {/* Park chips — multi-select */}
      <div className="mb-3">
        <ParkSelectorChips
          multiSelect
          selectedMulti={selectedParks}
          onSelectMulti={setSelectedParks}
        />
      </div>

      {/* Sort toggle + legend */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setSortBy(sortBy === "score" ? "date" : "score")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowUpDown className="w-3 h-3" />
          {sortBy === "score" ? "Best score" : "By date"}
        </button>
        <div className="flex gap-2">
          {GRADE_LEGEND.map((g) => (
            <span key={g.grade} className={`text-[10px] font-bold ${g.color}`}>
              {g.grade}={g.label}
            </span>
          ))}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : predictions.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">No predictions available yet. Check back soon!</p>
      ) : (
        <div className="space-y-3 mb-4 max-h-[500px] overflow-y-auto pr-1">
          {predictions.map((p) => (
            <BestDayCard
              key={p.date}
              prediction={p}
              isSelected={selectedDates.has(p.date)}
              onToggle={toggleDate}
            />
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex gap-2 mt-3">
        <Button
          onClick={handleSendToPlanner}
          disabled={!hasSelection}
          className="flex-1"
        >
          <Send className="w-4 h-4 mr-1" />
          Send to Day Trip Planner
        </Button>
        <Button
          variant="outline"
          onClick={handleDownloadIcs}
          disabled={!hasSelection}
        >
          <Download className="w-4 h-4 mr-1" />
          .ics
        </Button>
      </div>
    </div>
  );
}
