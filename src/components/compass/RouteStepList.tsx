import { ChevronDown, ChevronUp, Footprints, Navigation } from "lucide-react";
import { useState } from "react";
import ShortcutBadge from "./ShortcutBadge";
import type { RouteStep } from "@/lib/parkGraph";

interface RouteStepListProps {
  steps: RouteStep[];
  currentStepIndex: number;
  walkingSpeedKmh: number;
}

function formatDist(m: number): string {
  if (m < 300) return `${Math.round(m)} m`;
  return `${(m / 1609.34).toFixed(2)} mi`;
}

const RouteStepList = ({ steps, currentStepIndex, walkingSpeedKmh }: RouteStepListProps) => {
  const [expanded, setExpanded] = useState(false);

  if (!steps.length) return null;

  return (
    <div className="w-full max-w-sm mx-auto">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Footprints className="w-3.5 h-3.5" />
          {steps.length} step{steps.length !== 1 ? "s" : ""} in route
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="space-y-1 px-4 pb-3">
          {steps.map((step, i) => {
            const isCurrent = i === currentStepIndex;
            const isPast = i < currentStepIndex;
            return (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                  isCurrent
                    ? "bg-primary/10 border border-primary/30"
                    : isPast
                    ? "opacity-40"
                    : "bg-muted/30"
                }`}
              >
                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                    Walk toward {step.toLabel}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {formatDist(step.distanceM)}
                    {" · "}
                    {Math.max(1, Math.round(step.distanceM / ((walkingSpeedKmh * 1000) / 60)))} min
                  </p>
                  {step.shortcut && (
                    <div className="mt-1">
                      <ShortcutBadge throughBuilding={step.throughBuilding} compact />
                    </div>
                  )}
                </div>
                {isCurrent && <Navigation className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RouteStepList;
