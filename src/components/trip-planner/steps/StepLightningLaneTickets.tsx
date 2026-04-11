import { useState, useEffect, useMemo } from "react";
import type { TripDraft } from "@/lib/tripDraft";
import { getAttractionsForPark, toParkId, type AttractionRow } from "@/lib/parkContent";

interface Props {
  draft: TripDraft;
  onChange: (patch: Partial<TripDraft>) => void;
  onContinue: () => void;
  onBack: () => void;
}

const LL_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Multi Pass", value: "multi" },
  { label: "Individual LL", value: "individual" },
  { label: "Both", value: "both" },
];

export default function StepLightningLaneTickets({ draft, onChange, onContinue, onBack }: Props) {
  const [llAttractions, setLlAttractions] = useState<Record<string, AttractionRow[]>>({});

  // Load LL-eligible attractions
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      draft.selectedParks.map(async park => {
        const pid = toParkId(park);
        const all = await getAttractionsForPark(pid);
        return { park, attractions: all.filter(a => a.has_lightning_lane) };
      })
    ).then(results => {
      if (cancelled) return;
      const map: Record<string, AttractionRow[]> = {};
      for (const r of results) map[r.park] = r.attractions;
      setLlAttractions(map);
    });
    return () => { cancelled = true; };
  }, [draft.selectedParks]);

  const showMultiPicker = draft.llOption === 'multi' || draft.llOption === 'both';
  const showIllPicker = draft.llOption === 'individual' || draft.llOption === 'both';

  // Separate multi vs ILL attractions
  const multiAttractions = useMemo(() => {
    const result: AttractionRow[] = [];
    for (const items of Object.values(llAttractions)) {
      result.push(...items.filter(a => a.ll_type === 'multi'));
    }
    return result;
  }, [llAttractions]);

  const illAttractions = useMemo(() => {
    const result: AttractionRow[] = [];
    for (const items of Object.values(llAttractions)) {
      result.push(...items.filter(a => a.ll_type === 'individual'));
    }
    return result;
  }, [llAttractions]);

  const toggleMultiSelection = (id: string) => {
    const next = draft.llMultiPassSelections.includes(id)
      ? draft.llMultiPassSelections.filter(x => x !== id)
      : [...draft.llMultiPassSelections, id];
    onChange({ llMultiPassSelections: next });
  };

  const toggleIllSelection = (id: string) => {
    const next = draft.llIndividualSelections.includes(id)
      ? draft.llIndividualSelections.filter(x => x !== id)
      : [...draft.llIndividualSelections, id];
    onChange({ llIndividualSelections: next });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Lightning Lane Strategy</label>
        <div className="grid grid-cols-2 gap-2">
          {LL_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => onChange({ llOption: opt.value })}
              className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-colors text-center ${draft.llOption === opt.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {showMultiPicker && multiAttractions.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            LL Multi Pass Priorities ({draft.llMultiPassSelections.length} selected)
          </label>
          <p className="text-xs text-muted-foreground mb-2">Which Must-Do rides should we burn Multi Pass on?</p>
          <div className="flex flex-wrap gap-1.5">
            {multiAttractions.map(a => (
              <button key={a.id} onClick={() => toggleMultiSelection(a.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${draft.llMultiPassSelections.includes(a.id) ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "border-border text-muted-foreground hover:border-yellow-500/30"}`}>
                ⚡ {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {showIllPicker && illAttractions.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Individual LL Selections ({draft.llIndividualSelections.length} selected)
          </label>
          <p className="text-xs text-muted-foreground mb-2">These are premium pay-per-ride LL — select which you want</p>
          <div className="flex flex-wrap gap-1.5">
            {illAttractions.map(a => (
              <button key={a.id} onClick={() => toggleIllSelection(a.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${draft.llIndividualSelections.includes(a.id) ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "border-border text-muted-foreground hover:border-yellow-500/30"}`}>
                💰 {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {(draft.llOption !== 'none') && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Drop-Time Strategy</label>
          <div className="flex gap-2">
            <button onClick={() => onChange({ dropTimeStrategy: '7am' })}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${draft.dropTimeStrategy === '7am' ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
              7:00 AM (Resort Guests)
            </button>
            <button onClick={() => onChange({ dropTimeStrategy: 'park-open' })}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${draft.dropTimeStrategy === 'park-open' ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
              Park Open (Everyone)
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Park Hopper</label>
        <div className="flex gap-2">
          <button onClick={() => onChange({ parkHopper: false })}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${!draft.parkHopper ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
            No Park Hopper
          </button>
          <button onClick={() => onChange({ parkHopper: true })}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${draft.parkHopper ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
            ✅ Yes (+$65/person)
          </button>
        </div>
        {draft.parkHopper && (
          <p className="text-xs text-muted-foreground mt-1">Your itinerary may include two parks on the same day where it makes sense.</p>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl font-semibold text-muted-foreground border border-border hover:bg-muted">← Back</button>
        <button onClick={onContinue} className="flex-1 py-3 rounded-xl font-bold text-primary-foreground bg-primary">Continue →</button>
      </div>
    </div>
  );
}
