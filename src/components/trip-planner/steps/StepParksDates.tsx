import { useMemo } from "react";
import { Moon } from "lucide-react";
import type { TripDraft, ParkDayAssignment } from "@/lib/tripDraft";

const PARKS = [
  "Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom",
  "🌊 Typhoon Lagoon", "❄️ Blizzard Beach"
];

interface Props {
  draft: TripDraft;
  onChange: (patch: Partial<TripDraft>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function StepParksDates({ draft, onChange, onContinue, onBack }: Props) {
  const togglePark = (park: string) => {
    const next = draft.selectedParks.includes(park)
      ? draft.selectedParks.filter(p => p !== park)
      : [...draft.selectedParks, park];
    onChange({ selectedParks: next });
  };

  const tripDays = useMemo(() => {
    if (!draft.startDate) return [];
    const start = new Date(draft.startDate + "T12:00:00");
    const end = draft.endDate ? new Date(draft.endDate + "T12:00:00") : start;
    const days: string[] = [];
    const d = new Date(start);
    while (d <= end) {
      days.push(d.toISOString().split("T")[0]);
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [draft.startDate, draft.endDate]);

  // Migrate from old formats & ensure assignments match trip days — default to EMPTY
  const assignments: ParkDayAssignment[] = useMemo(() => {
    const map = new Map(draft.parkDayAssignments.map(a => [a.date, a]));
    return tripDays.map(date => {
      const existing = map.get(date);
      if (existing) {
        const parkIds = existing.parkIds?.length
          ? existing.parkIds
          : existing.parkId
            ? [existing.parkId]
            : [];
        const eveningOnly = existing.eveningOnly ?? [];
        return { date, parkId: parkIds[0] ?? null, parkIds, eveningOnly };
      }
      // Default to empty — no auto-assignment
      return { date, parkId: null, parkIds: [], eveningOnly: [] };
    });
  }, [tripDays, draft.parkDayAssignments]);

  const toggleDayPark = (date: string, park: string) => {
    const next = assignments.map(a => {
      if (a.date !== date) return a;
      const currentParks = [...a.parkIds];
      let eveningOnly = [...a.eveningOnly];
      const idx = currentParks.indexOf(park);
      if (idx >= 0) {
        currentParks.splice(idx, 1);
        eveningOnly = eveningOnly.filter(p => p !== park);
      } else if (currentParks.length < 3) {
        currentParks.push(park);
      }
      return { date, parkId: currentParks[0] ?? null, parkIds: currentParks, eveningOnly };
    });
    onChange({ parkDayAssignments: next });
  };

  const toggleEveningOnly = (date: string, park: string) => {
    const next = assignments.map(a => {
      if (a.date !== date) return a;
      const eveningOnly = a.eveningOnly.includes(park)
        ? a.eveningOnly.filter(p => p !== park)
        : [...a.eveningOnly, park];
      return { ...a, eveningOnly };
    });
    onChange({ parkDayAssignments: next });
  };

  const setNonParkDay = (date: string) => {
    const next = assignments.map(a =>
      a.date === date ? { date, parkId: null, parkIds: [], eveningOnly: [] } : a
    );
    onChange({ parkDayAssignments: next });
  };

  const nonParkDayCount = assignments.filter(a => a.parkIds.length === 0).length;
  const hasEmptyDays = assignments.some(a => a.parkIds.length === 0);
  // Every day must have at least one park OR be explicitly a non-park day (user must actively choose)
  const allDaysAssigned = assignments.length > 0 && assignments.every(a => a.parkIds.length > 0);
  // Allow continue if parks selected, days exist, and all days have assignments (or all are non-park which is fine too)
  const canContinue = draft.selectedParks.length > 0 && tripDays.length > 0 && (allDaysAssigned || !hasEmptyDays);

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Which park(s)?</label>
        <div className="flex flex-wrap gap-2">
          {PARKS.map(park => (
            <button key={park} onClick={() => togglePark(park)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${draft.selectedParks.includes(park) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
              {park}
            </button>
          ))}
        </div>
      </div>

      {tripDays.length > 0 && draft.selectedParks.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Day-by-Day Park Assignment
            <span className="ml-2 text-muted-foreground font-normal normal-case">(up to 3 parks per day)</span>
          </label>

          {hasEmptyDays && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold">
              ⚠️ Select at least one activity for each day
            </div>
          )}

          <div className="space-y-2">
            {assignments.map((a, i) => {
              const dayLabel = new Date(a.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              const isNonPark = a.parkIds.length === 0;
              const isEmpty = a.parkIds.length === 0;
              return (
                <div key={a.date} className={`rounded-lg bg-muted border p-3 ${isEmpty ? "border-destructive/30" : "border-border"}`}>
                  <p className="text-xs font-semibold text-foreground mb-2">Day {i + 1} — {dayLabel}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {draft.selectedParks.map(park => {
                      const selected = a.parkIds.includes(park);
                      const isEvening = a.eveningOnly.includes(park);
                      const atLimit = !selected && a.parkIds.length >= 3;
                      return (
                        <div key={park} className="flex items-center gap-0.5">
                          <button onClick={() => toggleDayPark(a.date, park)}
                            disabled={atLimit}
                            className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                              selected
                                ? isEvening
                                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/50"
                                  : "bg-primary text-primary-foreground border-primary"
                                : atLimit
                                  ? "border-border text-muted-foreground/40 cursor-not-allowed"
                                  : "border-border text-muted-foreground hover:border-primary/40"
                            }`}>
                            {park}
                          </button>
                          {selected && (
                            <button
                              onClick={() => toggleEveningOnly(a.date, park)}
                              title={isEvening ? "Remove evening-only" : "Just for Dinner / Fireworks"}
                              className={`p-1 rounded transition-colors ${
                                isEvening
                                  ? "text-amber-500 bg-amber-500/20"
                                  : "text-muted-foreground/50 hover:text-amber-500 hover:bg-amber-500/10"
                              }`}>
                              <Moon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <button onClick={() => setNonParkDay(a.date)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${isNonPark ? "bg-secondary text-secondary-foreground border-secondary" : "border-border text-muted-foreground hover:border-secondary/40"}`}>
                      🏖️ Non-Park
                    </button>
                  </div>
                  {a.eveningOnly.length > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                      🌙 {a.eveningOnly.join(", ")} — evening only (dinner/fireworks)
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {nonParkDayCount > 0 && (
            <p className="text-xs text-muted-foreground mt-2">📌 {nonParkDayCount} non-park day{nonParkDayCount > 1 ? "s" : ""} — we'll suggest activities!</p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl font-semibold text-muted-foreground border border-border hover:bg-muted">← Back</button>
        <button onClick={onContinue} disabled={!canContinue}
          className="flex-1 py-3 rounded-xl font-bold text-primary-foreground bg-primary disabled:opacity-50 disabled:cursor-not-allowed">
          Continue →
        </button>
      </div>
    </div>
  );
}
