import { useState } from "react";
import type { TripDraft, TripMember } from "@/lib/tripDraft";

interface Props {
  draft: TripDraft;
  onChange: (patch: Partial<TripDraft>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function StepParty({ draft, onChange, onContinue, onBack }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isSplitting, setIsSplitting] = useState(true);

  const addMember = () => {
    if (!firstName || !lastName || !email) return;
    const member: TripMember = { firstName, lastName, email, isAdult: true, isSplitting };
    onChange({ tripMembers: [...draft.tripMembers, member] });
    setFirstName(""); setLastName(""); setEmail(""); setIsSplitting(true); setShowAdd(false);
  };

  const removeMember = (idx: number) => {
    onChange({ tripMembers: draft.tripMembers.filter((_, i) => i !== idx) });
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
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Travel Party Members</label>
          <button onClick={() => setShowAdd(s => !s)} className="text-xs text-primary hover:underline">+ Add Person</button>
        </div>
        <p className="text-xs text-muted-foreground mb-2">Travel party members must be adults with their own account. Add children in the party size count above.</p>
        {draft.tripMembers.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {draft.tripMembers.map((m, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/30 border border-border">
                <div>
                  <span className="text-xs font-medium text-foreground">{m.firstName} {m.lastName}</span>
                  <span className="text-xs text-muted-foreground ml-2">{m.email}{m.isSplitting ? " · splitting" : ""}</span>
                </div>
                <button onClick={() => removeMember(i)} className="text-muted-foreground hover:text-destructive text-xs">✕</button>
              </div>
            ))}
          </div>
        )}
        {showAdd && (
          <div className="rounded-xl border border-border p-4 space-y-3 bg-muted">
            <div className="grid grid-cols-2 gap-2">
              <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name *"
                className="px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary/40" />
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name *"
                className="px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary/40" />
            </div>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (required)" type="email"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary/40" />
            <button onClick={() => setIsSplitting(s => !s)}
              className={`w-full py-1.5 rounded-lg text-xs font-semibold border transition-all ${isSplitting ? "bg-green-500/20 text-green-400 border-green-500/30" : "border-border text-muted-foreground"}`}>
              {isSplitting ? "✅ Splitting expenses" : "❌ Not splitting expenses"}
            </button>
            <button onClick={addMember} disabled={!firstName || !lastName || !email}
              className="w-full py-2 rounded-lg text-xs font-bold text-primary-foreground bg-primary disabled:opacity-50">
              Add to Trip
            </button>
          </div>
        )}
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
