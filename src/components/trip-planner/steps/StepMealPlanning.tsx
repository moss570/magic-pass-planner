import { useState, useEffect } from "react";
import { UtensilsCrossed, Coffee, Sun, Moon, Waves } from "lucide-react";
import type { TripDraft, MealLocation, DayMealPlan } from "@/lib/tripDraft";

interface Props {
  draft: TripDraft;
  onChange: (patch: Partial<TripDraft>) => void;
  onContinue: () => void;
  onBack: () => void;
}

const BREAKFAST_OPTIONS: { value: MealLocation; label: string; icon: string; costHint: string }[] = [
  { value: "at-hotel", label: "At hotel / resort", icon: "🏨", costHint: "Included or ~$15-25/pp" },
  { value: "making-at-room", label: "Making at accommodation", icon: "🍳", costHint: "~$5-8/pp (groceries)" },
  { value: "on-the-way", label: "On the way to park", icon: "🚗", costHint: "~$8-12/pp" },
  { value: "in-park-qs", label: "In the park (quick service)", icon: "🏰", costHint: "~$12-18/pp" },
  { value: "skip", label: "Skip breakfast", icon: "⏭️", costHint: "Free" },
];

const LUNCH_OPTIONS: { value: MealLocation; label: string; icon: string; costHint: string }[] = [
  { value: "in-park-qs", label: "In the park (quick service)", icon: "🍔", costHint: "~$15-22/pp" },
  { value: "in-park-ts", label: "In the park (table service)", icon: "🍽️", costHint: "~$35-55/pp" },
  { value: "packed", label: "Packed from hotel", icon: "🥪", costHint: "~$5-8/pp (groceries)" },
  { value: "off-property", label: "Leave park for off-site", icon: "🚗", costHint: "~$12-20/pp" },
  { value: "skip", label: "Snack through lunch", icon: "🍿", costHint: "~$8-15/pp" },
];

const DINNER_OPTIONS: { value: MealLocation; label: string; icon: string; costHint: string }[] = [
  { value: "in-park-qs", label: "In the park (quick service)", icon: "🍔", costHint: "~$15-22/pp" },
  { value: "in-park-ts", label: "In the park (table service)", icon: "🍽️", costHint: "~$45-65/pp" },
  { value: "at-hotel", label: "At resort / hotel", icon: "🏨", costHint: "~$25-50/pp" },
  { value: "making-at-room", label: "Making at accommodation", icon: "🍳", costHint: "~$8-12/pp (groceries)" },
  { value: "off-property", label: "Off-property restaurant", icon: "🚗", costHint: "~$15-30/pp" },
];

function MealSelector({
  label,
  icon: Icon,
  options,
  value,
  onChange,
}: {
  label: string;
  icon: React.ElementType;
  options: typeof BREAKFAST_OPTIONS;
  value: MealLocation;
  onChange: (v: MealLocation) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">{label}</span>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors border ${
              value === opt.value
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-muted/30 text-muted-foreground hover:border-primary/30"
            }`}
          >
            <span>{opt.icon}</span>
            <span className="flex-1 font-medium">{opt.label}</span>
            <span className="text-[10px] text-muted-foreground">{opt.costHint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function StepMealPlanning({ draft, onChange, onContinue, onBack }: Props) {
  // Build day meal plans from park assignments
  const parkDays = draft.parkDayAssignments.filter(a => a.parkIds?.length > 0 || a.parkId);

  useEffect(() => {
    // Initialize meal plans for each day if not set
    const existing = draft.mealPlanPreferences.dayMealPlans;
    const dates = parkDays.map(a => a.date);
    const needsInit = dates.some(d => !existing.find(m => m.date === d));
    if (needsInit) {
      const plans: DayMealPlan[] = dates.map(date => {
        const found = existing.find(m => m.date === date);
        return found || { date, breakfast: "at-hotel" as MealLocation, lunch: "in-park-qs" as MealLocation, dinner: "in-park-qs" as MealLocation };
      });
      onChange({
        mealPlanPreferences: { ...draft.mealPlanPreferences, dayMealPlans: plans },
      });
    }
  }, [parkDays.length]);

  const dayPlans = draft.mealPlanPreferences.dayMealPlans;

  const updateDayMeal = (date: string, meal: "breakfast" | "lunch" | "dinner", value: MealLocation) => {
    const updated = dayPlans.map(d =>
      d.date === date ? { ...d, [meal]: value } : d
    );
    onChange({
      mealPlanPreferences: { ...draft.mealPlanPreferences, dayMealPlans: updated },
    });
  };

  const [expandedDay, setExpandedDay] = useState<string | null>(dayPlans[0]?.date || null);

  // Apply same meals to all days
  const applyToAll = () => {
    const first = dayPlans[0];
    if (!first) return;
    const updated = dayPlans.map(d => ({
      ...d,
      breakfast: first.breakfast,
      lunch: first.lunch,
      dinner: first.dinner,
    }));
    onChange({
      mealPlanPreferences: { ...draft.mealPlanPreferences, dayMealPlans: updated },
    });
  };

  // Estimate total meal cost
  const costMap: Record<MealLocation, number> = {
    "in-park-qs": 18,
    "in-park-ts": 50,
    "at-hotel": 20,
    "making-at-room": 8,
    "packed": 6,
    "off-property": 18,
    "on-the-way": 10,
    "skip": 0,
  };

  const totalMealCost = dayPlans.reduce((sum, day) => {
    const pp = (draft.adults + draft.children);
    return sum + (costMap[day.breakfast] + costMap[day.lunch] + costMap[day.dinner]) * pp;
  }, 0);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4" /> Meal Planning
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Tell us how you'd like to handle meals each day. This helps us pick the right restaurants and estimate your dining budget.
        </p>
      </div>

      {/* Pool break option */}
      {draft.mode === 'vacation' && draft.children > 0 && (
        <div className="rounded-lg border border-border p-3 bg-muted/20">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.mealPlanPreferences.wantPoolBreak}
              onChange={e => onChange({
                mealPlanPreferences: { ...draft.mealPlanPreferences, wantPoolBreak: e.target.checked },
              })}
              className="rounded border-border"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-foreground">Midday hotel pool break?</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                We'll schedule ~2.5 hours for transit + swimming + changing. Great for beating the 1-3 PM heat.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Per-day meal plans */}
      <div className="space-y-3">
        {dayPlans.length > 1 && (
          <button
            onClick={applyToAll}
            className="text-[10px] text-primary font-semibold hover:underline"
          >
            Apply Day 1 meals to all days
          </button>
        )}

        {dayPlans.map((day, i) => {
          const assignment = draft.parkDayAssignments.find(a => a.date === day.date);
          const parkLabel = assignment?.parkIds?.join(", ") || assignment?.parkId || "Park Day";
          const dateLabel = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          const isExpanded = expandedDay === day.date;

          return (
            <div key={day.date} className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-foreground">Day {i + 1} — {parkLabel}</p>
                  <p className="text-[10px] text-muted-foreground">{dateLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {day.breakfast === "skip" ? "—" : "🌅"} {day.lunch === "skip" ? "—" : "☀️"} {day.dinner === "skip" ? "—" : "🌙"}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
                  <MealSelector label="Breakfast" icon={Coffee} options={BREAKFAST_OPTIONS} value={day.breakfast} onChange={v => updateDayMeal(day.date, "breakfast", v)} />
                  <MealSelector label="Lunch" icon={Sun} options={LUNCH_OPTIONS} value={day.lunch} onChange={v => updateDayMeal(day.date, "lunch", v)} />
                  <MealSelector label="Dinner" icon={Moon} options={DINNER_OPTIONS} value={day.dinner} onChange={v => updateDayMeal(day.date, "dinner", v)} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Budget estimate */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <p className="text-xs font-bold text-foreground">💰 Estimated Dining Budget</p>
        <p className="text-lg font-bold text-primary">${totalMealCost.toLocaleString()}</p>
        <p className="text-[10px] text-muted-foreground">
          Based on {dayPlans.length} days × {draft.adults + draft.children} people. Grocery-based meals save significantly.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl font-semibold text-muted-foreground border border-border hover:bg-muted">← Back</button>
        <button onClick={onContinue} className="flex-1 py-3 rounded-xl font-bold text-primary-foreground bg-primary">Continue →</button>
      </div>
    </div>
  );
}
