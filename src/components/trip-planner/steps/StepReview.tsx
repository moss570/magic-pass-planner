import { Sparkles } from "lucide-react";
import type { TripDraft } from "@/lib/tripDraft";
import { toParkId } from "@/lib/parkContent";

interface Props {
  draft: TripDraft;
  onBack: () => void;
  onGenerate: () => void;
  generating: boolean;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export default function StepReview({ draft, onBack, onGenerate, generating }: Props) {
  const numDays = (() => {
    if (!draft.startDate) return 0;
    const s = new Date(draft.startDate);
    const e = draft.endDate ? new Date(draft.endDate) : s;
    return Math.max(1, Math.floor((e.getTime() - s.getTime()) / 86400000) + 1);
  })();

  const mustDoCount = Object.values(draft.mustDoAttractions).reduce((sum, prefs) => {
    return sum + Object.values(prefs).filter(v => v === 'must').length;
  }, 0);

  const speedLabel = draft.walkingSpeedKmh <= 2.0 ? "Slow" : draft.walkingSpeedKmh <= 2.5 ? "Average" : draft.walkingSpeedKmh <= 3.2 ? "Fast" : "Custom";

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">📋 Trip Summary</h3>
        
        <SummaryRow label="Trip Name" value={draft.tripName || `${draft.selectedParks[0] || 'Disney'} Trip`} />
        <SummaryRow label="Dates" value={`${draft.startDate} → ${draft.endDate || draft.startDate} (${numDays} day${numDays !== 1 ? 's' : ''})`} />
        <SummaryRow label="Budget" value={`$${draft.budget.toLocaleString()}`} />
        <SummaryRow label="Party" value={`${draft.adults} adult${draft.adults !== 1 ? 's' : ''}${draft.children > 0 ? `, ${draft.children} child${draft.children !== 1 ? 'ren' : ''}` : ''}`} />
        {draft.ages && <SummaryRow label="Ages" value={draft.ages} />}
        <SummaryRow label="Parks" value={draft.selectedParks.join(", ")} />
        <SummaryRow label="Must-Dos" value={`${mustDoCount} attraction${mustDoCount !== 1 ? 's' : ''}`} />
        <SummaryRow label="Ride Preference" value={draft.ridePreference} />
        <SummaryRow label="Transportation" value={draft.transportation.length > 0 ? draft.transportation.join(", ") : "—"} />
        <SummaryRow label="Lodging" value={draft.lodging === 'disney-resort' ? `Disney Resort (${draft.resortCategory || 'TBD'})` : draft.lodging === 'off-property' ? 'Off-property' : 'Not sure yet'} />
        <SummaryRow label="Walking Speed" value={`${draft.walkingSpeedKmh} km/h (${speedLabel})`} />
        <SummaryRow label="Lightning Lane" value={draft.llOption} />
        <SummaryRow label="Park Hopper" value={draft.parkHopper ? "Yes (+$65/pp)" : "No"} />
        {draft.specialNotes && <SummaryRow label="Notes" value={draft.specialNotes} />}
        {draft.tripMembers.length > 0 && (
          <SummaryRow label="Travel Party" value={draft.tripMembers.map(m => `${m.firstName} ${m.lastName}`).join(", ")} />
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl font-semibold text-muted-foreground border border-border hover:bg-muted">← Back</button>
        <button onClick={onGenerate} disabled={generating}
          className="flex-1 py-3.5 rounded-xl font-bold text-primary-foreground bg-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {generating ? (
            <><span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> ✨ Generate Itinerary</>
          )}
        </button>
      </div>
    </div>
  );
}
