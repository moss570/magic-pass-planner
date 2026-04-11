import { useMemo } from "react";
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

  // Compute trip days
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

  // Ensure assignments match trip days
  const assignments = useMemo(() => {
    const map = new Map(draft.parkDayAssignments.map(a => [a.date, a.parkId]));
    return tripDays.map(date => ({
      date,
      parkId: map.get(date) ?? (draft.selectedParks[0] || null),
    }));
  }, [tripDays, draft.parkDayAssignments, draft.selectedParks]);

  const setDayPark = (date: string, parkId: string | null) => {
    const next = assignments.map(a => a.date === date ? { ...a, parkId } : a);
    onChange({ parkDayAssignments: next });
  };

  const nonParkDayCount = assignments.filter(a => a.parkId === null).length;
  const canContinue = draft.selectedParks.length > 0 && tripDays.length > 0;

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
          </label>
          <div className="space-y-2">
            {assignments.map((a, i) => {
              const dayLabel = new Date(a.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              return (
                <div key={a.date} className="rounded-lg bg-muted border border-border p-3">
                  <p className="text-xs font-semibold text-foreground mb-2">Day {i + 1} — {dayLabel}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {draft.selectedParks.map(park => (
                      <button key={park} onClick={() => setDayPark(a.date, park)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${a.parkId === park ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                        {park}
                      </button>
                    ))}
                    <button onClick={() => setDayPark(a.date, null)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${a.parkId === null ? "bg-secondary text-secondary-foreground border-secondary" : "border-border text-muted-foreground hover:border-secondary/40"}`}>
                      🏖️ Non-Park
                    </button>
                  </div>
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
