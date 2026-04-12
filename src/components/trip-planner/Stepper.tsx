import { Check } from "lucide-react";
import type { TripMode } from "@/lib/tripDraft";

const VACATION_STEPS = [
  "Basics",
  "Party",
  "Parks & Dates",
  "Must-Dos",
  "Meals",
  "Transport",
  "Lightning Lane",
  "Review",
];

const DAY_TRIP_STEPS = [
  "Basics",
  "Party",
  "Park(s)",
  "Must-Dos",
  "Review",
];

interface StepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  mode?: TripMode;
}

export default function Stepper({ currentStep, onStepClick, mode = 'vacation' }: StepperProps) {
  const labels = mode === 'day-trip' ? DAY_TRIP_STEPS : VACATION_STEPS;

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 px-1">
      {labels.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <button
            key={i}
            onClick={() => done && onStepClick?.(i)}
            disabled={!done}
            className={`flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : done
                ? "bg-primary/15 text-primary cursor-pointer hover:bg-primary/25"
                : "bg-muted text-muted-foreground cursor-default"
            }`}
          >
            {done ? (
              <Check className="w-3 h-3" />
            ) : (
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">
                {i + 1}
              </span>
            )}
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
