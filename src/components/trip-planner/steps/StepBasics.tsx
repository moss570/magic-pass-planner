import type { TripDraft } from "@/lib/tripDraft";

interface Props {
  draft: TripDraft;
  onChange: (patch: Partial<TripDraft>) => void;
  onContinue: () => void;
}

export default function StepBasics({ draft, onChange, onContinue }: Props) {
  const canContinue = !!draft.startDate;

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Trip Name</label>
        <input
          type="text"
          value={draft.tripName}
          onChange={e => onChange({ tripName: e.target.value })}
          placeholder="e.g. Summer Disney 2026"
          className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Travel Dates</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Start</p>
            <input
              type="date"
              value={draft.startDate}
              onChange={e => onChange({ startDate: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/40"
              style={{ minHeight: 44 }}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">End</p>
            <input
              type="date"
              value={draft.endDate}
              onChange={e => onChange({ endDate: e.target.value })}
              min={draft.startDate || new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/40"
              style={{ minHeight: 44 }}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
          Budget — <span className="text-primary">${draft.budget.toLocaleString()}</span>
        </label>
        <input
          type="range"
          min={1000}
          max={15000}
          step={500}
          value={draft.budget}
          onChange={e => onChange({ budget: parseInt(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>$1,000</span><span>$15,000</span>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Special Notes (optional)</label>
        <textarea
          value={draft.specialNotes}
          onChange={e => onChange({ specialNotes: e.target.value })}
          rows={2}
          placeholder="e.g. celebrating a birthday, grandparents joining, must ride Tron, first trip..."
          className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
        />
      </div>

      <button
        onClick={onContinue}
        disabled={!canContinue}
        className="w-full py-3 rounded-xl font-bold text-primary-foreground bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue →
      </button>
    </div>
  );
}
