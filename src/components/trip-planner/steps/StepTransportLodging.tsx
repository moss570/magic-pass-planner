import type { TripDraft } from "@/lib/tripDraft";

const TRANSPORT_OPTIONS = [
  { id: "own-car", label: "🚗 Driving own car" },
  { id: "rental-car", label: "🚙 Rental car" },
  { id: "rideshare", label: "📱 Rideshare (Uber/Lyft)" },
  { id: "disney-express", label: "🚌 Magical Express / Mears" },
  { id: "disney-transit", label: "🚝 Disney internal transit only" },
  { id: "walking", label: "🚶 Walking from resort" },
  { id: "flying", label: "✈️ Flying in" },
];

const SPEED_PRESETS = [
  { label: "🐢 Slow", value: 2.0 },
  { label: "🚶 Average", value: 2.5 },
  { label: "🏃 Fast", value: 3.2 },
];

interface Props {
  draft: TripDraft;
  onChange: (patch: Partial<TripDraft>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function StepTransportLodging({ draft, onChange, onContinue, onBack }: Props) {
  const toggleTransport = (id: string) => {
    const next = draft.transportation.includes(id)
      ? draft.transportation.filter(t => t !== id)
      : [...draft.transportation, id];
    onChange({ transportation: next });
  };

  const isCustomSpeed = !SPEED_PRESETS.some(p => p.value === draft.walkingSpeedKmh);
  const canContinue = draft.transportation.length > 0;

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
          Transportation <span className="text-destructive">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-2">Select all that apply</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TRANSPORT_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => toggleTransport(opt.id)}
              className={`px-3 py-2.5 rounded-lg text-xs font-semibold border text-left transition-colors ${draft.transportation.includes(opt.id) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
              {opt.label}
            </button>
          ))}
        </div>
        {draft.transportation.length === 0 && (
          <p className="text-xs text-destructive mt-1">Please select at least one transportation method</p>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Lodging</label>
        <div className="space-y-2">
          {([
            { id: 'disney-resort' as const, label: '🏰 Staying at Disney resort', sub: 'Early Entry access + Disney transit' },
            { id: 'off-property' as const, label: '🏨 Off-property hotel', sub: '' },
            { id: 'not-sure' as const, label: '🤔 Not sure yet', sub: '' },
          ]).map(opt => (
            <button key={opt.id} onClick={() => onChange({ lodging: opt.id })}
              className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold border text-left transition-colors ${draft.lodging === opt.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
              {opt.label}
              {opt.sub && draft.lodging === opt.id && <span className="block text-[10px] mt-0.5 opacity-80">{opt.sub}</span>}
            </button>
          ))}
        </div>

        {draft.lodging === 'disney-resort' && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2">Resort Category</p>
            <div className="flex flex-wrap gap-2">
              {["Value", "Moderate", "Deluxe", "Deluxe Villa", "Cabins"].map(cat => (
                <button key={cat} onClick={() => onChange({ resortCategory: cat })}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${draft.resortCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {(draft.lodging === 'off-property' || draft.lodging === 'not-sure') && (
          <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded-lg">
            💡 We'll suggest off-site hotels and let you set price alerts after you generate your itinerary.
          </p>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
          Walking Speed — <span className="text-primary">{draft.walkingSpeedKmh} km/h</span>
        </label>
        <div className="flex gap-2 mb-2">
          {SPEED_PRESETS.map(p => (
            <button key={p.value} onClick={() => onChange({ walkingSpeedKmh: p.value })}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${draft.walkingSpeedKmh === p.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
              {p.label}
            </button>
          ))}
          <button onClick={() => onChange({ walkingSpeedKmh: isCustomSpeed ? 2.5 : 2.8 })}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${isCustomSpeed ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
            ⚙️ Custom
          </button>
        </div>
        {isCustomSpeed && (
          <input type="number" min={1} max={6} step={0.1} value={draft.walkingSpeedKmh}
            onChange={e => onChange({ walkingSpeedKmh: parseFloat(e.target.value) || 2.5 })}
            className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/40" />
        )}
        <p className="text-xs text-muted-foreground mt-1">Calibration walkthrough ships in a future update</p>
      </div>

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
