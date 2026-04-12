import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { TripDraft, MustDoPreference } from "@/lib/tripDraft";
import { getAttractionsForPark, getShowsForPark, toParkId, type AttractionRow, type ShowRow } from "@/lib/parkContent";

interface Props {
  draft: TripDraft;
  onChange: (patch: Partial<TripDraft>) => void;
  onContinue: () => void;
  onBack: () => void;
}

type TriState = 'must' | 'want' | 'skip';

const TRI_STYLES: Record<TriState, string> = {
  must: "bg-primary text-primary-foreground border-primary",
  want: "bg-muted text-foreground border-border",
  skip: "bg-destructive/15 text-destructive border-destructive/30 line-through",
};

const TRI_LABELS: Record<TriState, string> = {
  must: "⭐ Must-Do",
  want: "👍 Want",
  skip: "⏭️ Skip",
};

function cycleState(current: TriState): TriState {
  if (current === 'want') return 'must';
  if (current === 'must') return 'skip';
  return 'want';
}

function ParkMustDoPicker({
  parkDisplayName,
  attractions,
  shows,
  selections,
  onSelect,
}: {
  parkDisplayName: string;
  attractions: AttractionRow[];
  shows: ShowRow[];
  selections: MustDoPreference;
  onSelect: (id: string, state: TriState) => void;
}) {
  const [expandedLands, setExpandedLands] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  // Group attractions by land
  const landGroups = useMemo(() => {
    const map = new Map<string, AttractionRow[]>();
    for (const a of attractions) {
      const list = map.get(a.land) || [];
      list.push(a);
      map.set(a.land, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [attractions]);

  useEffect(() => {
    if (allExpanded) {
      setExpandedLands(new Set(landGroups.map(([land]) => land).concat(['__shows__'])));
    } else {
      setExpandedLands(new Set());
    }
  }, [allExpanded, landGroups]);

  const toggleLand = (land: string) => {
    setExpandedLands(prev => {
      const next = new Set(prev);
      if (next.has(land)) next.delete(land); else next.add(land);
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">{parkDisplayName}</h3>
        <button onClick={() => setAllExpanded(v => !v)} className="text-xs text-primary hover:underline">
          {allExpanded ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {landGroups.map(([land, items]) => (
        <div key={land}>
          <button onClick={() => toggleLand(land)}
            className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground sticky top-0 bg-card z-10">
            <span>{land} ({items.length})</span>
            {expandedLands.has(land) ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {expandedLands.has(land) && (
            <div className="flex flex-wrap gap-1.5 pb-2">
              {items.map(a => {
                const state: TriState = selections[a.id] || 'want';
                return (
                  <button key={a.id} onClick={() => onSelect(a.id, cycleState(state))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${TRI_STYLES[state]}`}
                    title={`${a.name} — ${a.avg_duration_min} min${a.has_lightning_lane ? ' · LL' : ''}${a.height_req_in ? ` · ${a.height_req_in}"` : ''}`}>
                    {a.name}
                    {a.has_lightning_lane && <span className="ml-1 text-yellow-400">⚡</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {shows.length > 0 && (
        <div>
          <button onClick={() => toggleLand('__shows__')}
            className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground sticky top-0 bg-card z-10">
            <span>Shows & Entertainment ({shows.length})</span>
            {expandedLands.has('__shows__') ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {expandedLands.has('__shows__') && (
            <div className="flex flex-wrap gap-1.5 pb-2">
              {shows.map(s => {
                const state: TriState = selections[s.id] || 'want';
                return (
                  <button key={s.id} onClick={() => onSelect(s.id, cycleState(state))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${TRI_STYLES[state]}`}
                    title={`${s.name} — ${s.duration_min} min${s.is_nighttime ? ' · Nighttime show' : ''}`}>
                    {s.is_nighttime ? '🌙' : '🎭'} {s.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StepMustDos({ draft, onChange, onContinue, onBack }: Props) {
  const [parkData, setParkData] = useState<Record<string, { attractions: AttractionRow[]; shows: ShowRow[] }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all(
      draft.selectedParks.map(async (park) => {
        const pid = toParkId(park);
        const [attractions, shows] = await Promise.all([
          getAttractionsForPark(pid),
          getShowsForPark(pid),
        ]);
        return { park, pid, attractions, shows };
      })
    ).then(results => {
      if (cancelled) return;
      const map: Record<string, { attractions: AttractionRow[]; shows: ShowRow[] }> = {};
      for (const r of results) map[r.park] = { attractions: r.attractions, shows: r.shows };
      setParkData(map);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [draft.selectedParks]);

  const handleSelect = (park: string, id: string, state: TriState) => {
    const pid = toParkId(park);
    const current = draft.mustDoAttractions[pid] || {};
    onChange({
      mustDoAttractions: {
        ...draft.mustDoAttractions,
        [pid]: { ...current, [id]: state },
      },
    });
  };

  // Compute stats
  const stats = useMemo(() => {
    let mustCount = 0;
    let estimatedMinutes = 0;
    let parkCount = 0;
    const parksWithMusts = new Set<string>();

    for (const park of draft.selectedParks) {
      const pid = toParkId(park);
      const sel = draft.mustDoAttractions[pid] || {};
      const data = parkData[park];
      if (!data) continue;

      for (const [id, state] of Object.entries(sel)) {
        if (state === 'must') {
          mustCount++;
          parksWithMusts.add(pid);
          const attr = data.attractions.find(a => a.id === id);
          const show = data.shows.find(s => s.id === id);
          estimatedMinutes += attr?.avg_duration_min || show?.duration_min || 10;
        }
      }
    }
    parkCount = parksWithMusts.size;
    return { mustCount, estimatedMinutes, parkCount };
  }, [draft.mustDoAttractions, draft.selectedParks, parkData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-muted" />)}
        </div>
        <div className="flex gap-3">
          <button onClick={onBack} className="flex-1 py-3 rounded-xl font-semibold text-muted-foreground border border-border hover:bg-muted">← Back</button>
          <button disabled className="flex-1 py-3 rounded-xl font-bold text-primary-foreground bg-primary opacity-50">Loading...</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Counter */}
      <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
        <p className="text-sm font-bold text-foreground">
          You've marked <span className="text-primary">{stats.mustCount} Must-Do{stats.mustCount !== 1 ? 's' : ''}</span> across {stats.parkCount} park{stats.parkCount !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Estimated {Math.round(stats.estimatedMinutes / 60 * 10) / 10} hours of ride time + waits
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Tap each attraction to cycle: <span className="font-semibold text-primary">⭐ Must-Do</span> → <span className="font-semibold text-destructive">⏭️ Skip</span> → <span className="font-semibold">👍 Want</span>
      </p>

      {draft.selectedParks.map(park => {
        const data = parkData[park];
        if (!data) return null;
        const pid = toParkId(park);
        return (
          <ParkMustDoPicker
            key={park}
            parkDisplayName={park}
            attractions={data.attractions}
            shows={data.shows}
            selections={draft.mustDoAttractions[pid] || {}}
            onSelect={(id, state) => handleSelect(park, id, state)}
          />
        );
      })}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl font-semibold text-muted-foreground border border-border hover:bg-muted">← Back</button>
        <button onClick={onContinue} className="flex-1 py-3 rounded-xl font-bold text-primary-foreground bg-primary">Continue →</button>
      </div>
    </div>
  );
}
