import { Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TripVersion } from "./VersionSwitcher";

interface Props {
  versions: TripVersion[];
  onChoose: (versionId: string) => void;
}

function delta(a: number | undefined, b: number | undefined): { text: string; color: string } | null {
  if (a == null || b == null) return null;
  const diff = a - b;
  if (diff === 0) return null;
  const sign = diff > 0 ? "+" : "";
  return { text: `${sign}$${diff.toLocaleString()}`, color: diff < 0 ? "text-green-400" : "text-red-400" };
}

const rows: { label: string; key: string; format?: (v: any) => string; lowerBetter?: boolean }[] = [
  { label: "Total Estimated Cost", key: "estimatedTotal", format: v => `$${(v || 0).toLocaleString()}`, lowerBetter: true },
  { label: "Tickets & Passes", key: "tickets", format: v => `$${(v || 0).toLocaleString()}`, lowerBetter: true },
  { label: "Hotel", key: "hotel", format: v => `$${(v || 0).toLocaleString()}`, lowerBetter: true },
  { label: "Dining", key: "dining", format: v => `$${(v || 0).toLocaleString()}`, lowerBetter: true },
  { label: "Lightning Lane", key: "lightningLane", format: v => `$${(v || 0).toLocaleString()}`, lowerBetter: true },
  { label: "Other", key: "other", format: v => `$${(v || 0).toLocaleString()}`, lowerBetter: true },
  { label: "Number of Days", key: "numDays" },
  { label: "Parks Covered", key: "parks", format: v => Array.isArray(v) ? v.join(", ") : String(v || "-") },
  { label: "Park Hopper", key: "parkHopper", format: v => v ? "Yes" : "No" },
  { label: "Lodging", key: "lodging" },
  { label: "LL Strategy", key: "llOption" },
  { label: "Must-Do Covered", key: "mustDoCovered" },
  { label: "Must-Do Missed", key: "mustDoMissed" },
  { label: "Total Rides", key: "totalRides" },
  { label: "Unique Rides", key: "uniqueRides" },
  { label: "Shows Scheduled", key: "showsScheduled" },
  { label: "Dining Reservations", key: "diningCount" },
  { label: "Warnings", key: "warningCount" },
];

function extractMetrics(v: TripVersion) {
  const plans = v.plans || [];
  const totals = v.totals || {} as any;
  const inputs = v.inputs || {} as any;
  const breakdown = totals.budgetBreakdown || {};

  const allItems = plans.flatMap((p: any) => p.items || []);
  const rides = allItems.filter((i: any) => i.type === "ride");
  const shows = allItems.filter((i: any) => i.type === "show");
  const dining = allItems.filter((i: any) => i.type === "dining");
  const mustDos = inputs.mustDoAttractions || [];
  const scheduledNames = new Set(rides.map((r: any) => r.activity));
  const mustDoCovered = mustDos.filter((m: string) => scheduledNames.has(m)).length;

  return {
    estimatedTotal: totals.estimatedTotal || 0,
    tickets: breakdown.tickets || breakdown.Tickets || 0,
    hotel: breakdown.hotel || breakdown.Hotel || 0,
    dining: breakdown.dining || breakdown.Dining || 0,
    lightningLane: breakdown.lightningLane || breakdown.LightningLane || 0,
    other: breakdown.souvenirs || breakdown.other || 0,
    numDays: plans.length,
    parks: inputs.selectedParks || inputs.parks || [],
    parkHopper: inputs.parkHopper || false,
    lodging: inputs.lodging || inputs.resortStay ? "Disney Resort" : "Off-property",
    llOption: inputs.llOption || "multi",
    mustDoCovered: `${mustDoCovered}/${mustDos.length}`,
    mustDoMissed: `${mustDos.length - mustDoCovered}`,
    totalRides: rides.length,
    uniqueRides: new Set(rides.map((r: any) => r.activity)).size,
    showsScheduled: shows.length,
    diningCount: dining.length,
    warningCount: (v.warnings || []).length,
  } as Record<string, any>;
}

export default function TripVersionCompare({ versions, onChoose }: Props) {
  const metrics = versions.map(extractMetrics);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-muted-foreground font-medium w-48">Metric</th>
            {versions.map(v => (
              <th key={v.id} className="text-center py-3 px-4">
                <span className={`font-bold ${v.is_active ? "text-primary" : "text-foreground"}`}>{v.name}</span>
                {v.is_active && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">Active</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.key} className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-2.5 px-4 text-muted-foreground text-xs font-medium">{row.label}</td>
              {versions.map((v, vi) => {
                const val = metrics[vi][row.key];
                const formatted = row.format ? row.format(val) : String(val ?? "-");
                const d = vi > 0 && row.lowerBetter !== undefined ? delta(
                  typeof metrics[vi][row.key] === "number" ? metrics[vi][row.key] : undefined,
                  typeof metrics[0][row.key] === "number" ? metrics[0][row.key] : undefined
                ) : null;
                return (
                  <td key={v.id} className="py-2.5 px-4 text-center">
                    <span className="text-foreground text-xs font-semibold">{formatted}</span>
                    {d && (
                      <span className={`ml-1.5 text-[10px] font-bold ${row.lowerBetter ? (d.text.startsWith("-") ? "text-green-400" : "text-red-400") : (d.text.startsWith("+") ? "text-green-400" : "text-red-400")}`}>
                        ({d.text} vs V1)
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="py-4 px-4" />
            {versions.map(v => (
              <td key={v.id} className="py-4 px-4 text-center">
                <Button size="sm" variant={v.is_active ? "default" : "outline"} onClick={() => onChoose(v.id)} disabled={v.is_active}>
                  {v.is_active ? <><Check className="w-3.5 h-3.5 mr-1" /> Active</> : "Choose this version"}
                </Button>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
