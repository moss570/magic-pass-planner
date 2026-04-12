import { useState } from "react";
import type { TripDraft, TripMember } from "@/lib/tripDraft";
import AddMemberForm from "@/components/trip-planner/AddMemberForm";

interface Props {
  draft: TripDraft;
  onChange: (patch: Partial<TripDraft>) => void;
  onContinue: () => void;
  onBack: () => void;
  tripId?: string | null;
}

export default function StepParty({ draft, onChange, onContinue, onBack, tripId }: Props) {
  const removeMember = (idx: number) => {
    onChange({ tripMembers: draft.tripMembers.filter((_, i) => i !== idx) });
  };

  const handleMemberAdded = (member: { firstName: string; lastName: string; email: string; isAdult: boolean; isSplitting: boolean }) => {
    onChange({ tripMembers: [...draft.tripMembers, member] });
  };

  const canContinue = draft.adults >= 1;

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Party Size</label>
        <div className="grid grid-cols-2 gap-3">
          {([
            { label: "Adults", key: "adults" as const, value: draft.adults, min: 1 },
            { label: "Children", key: "children" as const, value: draft.children, min: 0 },
          ]).map(row => (
            <div key={row.key} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 border border-border">
              <span className="text-sm text-foreground">{row.label}</span>
              <div className="flex items-center gap-3">
                <button onClick={() => onChange({ [row.key]: Math.max(row.min, row.value - 1) })} className="w-7 h-7 rounded-md bg-background/50 flex items-center justify-center text-foreground hover:bg-background text-lg leading-none">−</button>
                <span className="text-sm font-bold text-primary w-4 text-center">{row.value}</span>
                <button onClick={() => onChange({ [row.key]: row.value + 1 })} className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-lg leading-none font-bold">+</button>
              </div>
            </div>
          ))}
        </div>
        {draft.children > 0 && (
          <input
            type="text"
            placeholder="Children's ages (e.g. 8, 6, 3)"
            value={draft.ages}
            onChange={e => onChange({ ages: e.target.value })}
            className="mt-2 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
          />
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Ride Preference</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "🎢 Thrill Seeker", value: "thrill" },
            { label: "🎠 Family Friendly", value: "family" },
            { label: "👶 Little Ones First", value: "little" },
            { label: "⚖️ Mix of Everything", value: "mix" },
          ].map(p => (
            <button key={p.value} onClick={() => onChange({ ridePreference: p.value })}
              className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors text-center border ${draft.ridePreference === p.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Travel Party Members</label>
        {draft.tripMembers.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {draft.tripMembers.map((m, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/30 border border-border">
                <div>
                  <span className="text-xs font-medium text-foreground">{m.firstName} {m.lastName}</span>
                  <span className="text-xs text-muted-foreground ml-2">{m.email}</span>
                  <span className="text-xs ml-2 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">Invite sent</span>
                  {m.isSplitting && <span className="text-xs text-muted-foreground ml-1">· splitting</span>}
                </div>
                <button onClick={() => removeMember(i)} className="text-muted-foreground hover:text-destructive text-xs">✕</button>
              </div>
            ))}
          </div>
        )}
        <AddMemberForm tripId={tripId || null} onMemberAdded={handleMemberAdded} />
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
