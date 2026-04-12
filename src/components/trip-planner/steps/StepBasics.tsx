import type { TripDraft } from "@/lib/tripDraft";

interface Props {
  draft: TripDraft;
  onChange: (patch: Partial<TripDraft>) => void;
  onContinue: () => void;
}

export default function StepBasics({ draft, onChange, onContinue }: Props) {
  const isDayTrip = draft.mode === 'day-trip';
  const canContinue = !!draft.startDate;

  const budgetMin = isDayTrip ? 100 : 1000;
  const budgetMax = isDayTrip ? 2000 : 15000;
  const budgetStep = isDayTrip ? 50 : 500;

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
          {isDayTrip ? 'Day Trip Name' : 'Trip Name'}
        </label>
        <input
          type="text"
          value={draft.tripName}
          onChange={e => onChange({ tripName: e.target.value })}
          placeholder={isDayTrip ? "e.g. Saturday at EPCOT" : "e.g. Summer Disney 2026"}
          className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
          {isDayTrip ? 'Date' : 'Travel Dates'}
        </label>
        {isDayTrip ? (
          <input
            type="date"
            value={draft.startDate}
            onChange={e => onChange({ startDate: e.target.value, endDate: e.target.value })}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/40"
            style={{ minHeight: 44 }}
          />
        ) : (
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
        )}
      </div>

      {/* Annual Pass toggle for day trip mode */}
      {isDayTrip && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <button
            onClick={() => onChange({ hasAnnualPass: !draft.hasAnnualPass })}
            className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${
              draft.hasAnnualPass ? 'bg-primary justify-end' : 'bg-muted justify-start'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white shadow-sm block" />
          </button>
          <div>
            <p className="text-sm font-semibold text-foreground">I have an Annual Pass</p>
            <p className="text-xs text-muted-foreground">
              {draft.hasAnnualPass ? 'Ticket costs will be excluded from your budget' : 'Ticket pricing will be included in budget calculations'}
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
          Budget — <span className="text-primary">${draft.budget.toLocaleString()}</span>
        </label>
        <input
          type="range"
          min={budgetMin}
          max={budgetMax}
          step={budgetStep}
          value={Math.min(Math.max(draft.budget, budgetMin), budgetMax)}
          onChange={e => onChange({ budget: parseInt(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>${budgetMin.toLocaleString()}</span><span>${budgetMax.toLocaleString()}</span>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Special Notes (optional)</label>
        <textarea
          value={draft.specialNotes}
          onChange={e => onChange({ specialNotes: e.target.value })}
          rows={2}
          placeholder={isDayTrip
            ? "e.g. celebrating a birthday, want to hit every coaster, staying late for fireworks..."
            : "e.g. celebrating a birthday, grandparents joining, must ride Tron, first trip..."
          }
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
