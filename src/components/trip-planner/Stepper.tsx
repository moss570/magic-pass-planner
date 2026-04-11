import { Check } from "lucide-react";

const STEP_LABELS = [
  "Basics",
  "Party",
  "Parks & Dates",
  "Must-Dos",
  "Transport",
  "Lightning Lane",
  "Review",
];

interface StepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export default function Stepper({ currentStep, onStepClick }: StepperProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 px-1">
      {STEP_LABELS.map((label, i) => {
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
