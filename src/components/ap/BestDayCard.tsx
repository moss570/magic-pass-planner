import type { BestDayPrediction } from "@/lib/bestDays";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Cloud, Sun, CloudRain, Thermometer } from "lucide-react";

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-400 bg-green-500/15 border-green-500/30",
  B: "text-blue-400 bg-blue-500/15 border-blue-500/30",
  C: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30",
  D: "text-orange-400 bg-orange-500/15 border-orange-500/30",
  F: "text-red-400 bg-red-500/15 border-red-500/30",
};

function WeatherIcon({ precip, summary }: { precip: number; summary: string }) {
  if (precip >= 50) return <CloudRain className="w-4 h-4 text-blue-400" />;
  if (summary?.toLowerCase().includes("cloud")) return <Cloud className="w-4 h-4 text-muted-foreground" />;
  return <Sun className="w-4 h-4 text-yellow-400" />;
}

function formatDate(dateStr: string): { dayOfWeek: string; shortDate: string } {
  const d = new Date(dateStr + "T12:00:00");
  const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "short" });
  const shortDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { dayOfWeek, shortDate };
}

interface Props {
  prediction: BestDayPrediction;
  isSelected: boolean;
  onToggle: (date: string) => void;
}

export default function BestDayCard({ prediction, isSelected, onToggle }: Props) {
  const { dayOfWeek, shortDate } = formatDate(prediction.date);
  const gradeStyle = GRADE_COLORS[prediction.grade] || GRADE_COLORS.C;

  return (
    <div className={cn(
      "relative rounded-xl p-3 border transition-all",
      isSelected ? "border-primary bg-primary/5" : "border-primary/10 bg-muted/20",
      prediction.passTierBlocked && "opacity-80"
    )}>
      {/* Checkbox */}
      <div className="absolute top-2.5 right-2.5">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggle(prediction.date)}
        />
      </div>

      {/* Date + Grade */}
      <div className="flex items-center gap-3 mb-2">
        <div className={cn("w-10 h-10 rounded-lg border flex items-center justify-center text-lg font-black", gradeStyle)}>
          {prediction.grade}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{dayOfWeek}, {shortDate}</p>
          <p className="text-xs text-muted-foreground">Score: {prediction.score}/100</p>
        </div>
      </div>

      {/* Crowd chip */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className={cn(
          "text-[10px] font-semibold px-2 py-0.5 rounded-full",
          prediction.crowdLevel <= 3 ? "bg-green-500/15 text-green-400" :
          prediction.crowdLevel <= 6 ? "bg-yellow-500/15 text-yellow-400" :
          "bg-red-500/15 text-red-400"
        )}>
          Crowds: {prediction.crowdLevel}/10
        </span>

        {prediction.passTierBlocked ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
            🚫 Blocked
          </span>
        ) : (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
            ✓ Open
          </span>
        )}
      </div>

      {/* Weather row */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <WeatherIcon precip={prediction.precipChance} summary={prediction.weatherSummary} />
        <span>{prediction.weatherHighF}°/{prediction.weatherLowF}°F</span>
        <span>·</span>
        <span>{prediction.precipChance}% rain</span>
      </div>

      {/* Reasons */}
      <div className="space-y-0.5">
        {prediction.reasons.slice(0, 4).map((r, i) => (
          <p key={i} className="text-[11px] text-muted-foreground">• {r}</p>
        ))}
      </div>
    </div>
  );
}
