import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PLAN_ACCESS, type PlanAccess, type AlertLimit } from "@/lib/planFeatures";
import type { PlanId } from "@/lib/stripe";
import { RefreshCw, RotateCcw, Save } from "lucide-react";

const PLAN_IDS: PlanId[] = ["free", "ninety_day_planner", "ninety_day_friend", "magic_pass_planner", "magic_pass_plus", "founders_pass"];
const PLAN_LABELS: Record<PlanId, string> = {
  free: "Free",
  ninety_day_planner: "90-Day Planner",
  ninety_day_friend: "90-Day Friend",
  magic_pass_planner: "Magic Pass Planner",
  magic_pass_plus: "Magic Pass Plus",
  founders_pass: "Founders Pass",
};

type OverrideValue = boolean | number | string;

interface Override {
  feature_key: string;
  plan_id: string;
  value: OverrideValue;
}

const FEATURE_GROUPS: Record<string, (keyof PlanAccess)[]> = {
  "Trip Planning": ["aiTripPlanner", "smartItineraryOptimizer", "budgetManager", "tripVersions", "giftCardTracker", "reservationFolder"],
  "Alerts": ["airfareAlerts", "hotelAlerts", "diningAlerts", "eventAlerts", "hotelSuggestions"],
  "Priorities": ["attractionPriorities", "characterMeetsPriorities", "showFireworksPriorities"],
  "Group Features": ["groupExpenseTracking", "groupCoordinator", "groupPolls", "groupGames"],
  "In-Park Tools": ["liveWaitTimes", "lightningLaneGapFinder", "gpsCompass", "gpsCalibration", "nearbySnacksMerch", "rainRadar", "rideClosureAlerts", "fireworksRideCalculator", "goldenHourPlanner", "photoPassAlerts"],
  "AP Features": ["apBlockoutCalendar", "apDiscountDatabase", "apRenewalAlerts", "apHotelAlerts", "apMerchAlerts"],
  "Social": ["socialFeed", "magicBeaconCreation", "magicBeaconEvents", "orlandoInsidersGuide"],
};

function parseValue(val: any): OverrideValue {
  if (typeof val === "boolean" || typeof val === "number" || typeof val === "string") return val;
  return val;
}

function renderValue(val: OverrideValue): string {
  if (val === true) return "✅";
  if (val === false) return "❌";
  if (val === "unlimited") return "∞";
  if (val === "none") return "—";
  if (val === "links_only") return "🔗";
  if (val === "read_only") return "👁️";
  return String(val);
}

function getDefaultValue(feature: keyof PlanAccess, planId: PlanId): OverrideValue {
  return PLAN_ACCESS[planId][feature] as OverrideValue;
}

export default function TierAccessManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [pendingChanges, setPendingChanges] = useState<Map<string, OverrideValue>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadOverrides = async () => {
    setLoading(true);
    const { data } = await supabase.from("tier_access_overrides").select("*");
    if (data) {
      setOverrides(data.map((d: any) => ({ feature_key: d.feature_key, plan_id: d.plan_id, value: parseValue(d.value) })));
    }
    setLoading(false);
  };

  useEffect(() => { loadOverrides(); }, []);

  const key = (feature: string, plan: string) => `${feature}::${plan}`;

  const getEffectiveValue = (feature: keyof PlanAccess, planId: PlanId): OverrideValue => {
    const k = key(feature, planId);
    if (pendingChanges.has(k)) return pendingChanges.get(k)!;
    const override = overrides.find(o => o.feature_key === feature && o.plan_id === planId);
    if (override) return override.value;
    return getDefaultValue(feature, planId);
  };

  const isOverridden = (feature: keyof PlanAccess, planId: PlanId): boolean => {
    const k = key(feature, planId);
    if (pendingChanges.has(k)) return true;
    return overrides.some(o => o.feature_key === feature && o.plan_id === planId);
  };

  const cycleValue = (feature: keyof PlanAccess, planId: PlanId) => {
    const current = getEffectiveValue(feature, planId);
    const defaultVal = getDefaultValue(feature, planId);
    let next: OverrideValue;

    if (typeof defaultVal === "string" && (defaultVal === "unlimited" || defaultVal === "none" || defaultVal === "links_only") || typeof defaultVal === "number") {
      const cycle: OverrideValue[] = ["none", 1, 3, 7, 10, 20, "unlimited", "links_only"];
      const idx = cycle.findIndex(v => v === current);
      next = cycle[(idx + 1) % cycle.length];
    } else if (typeof defaultVal === "string" && defaultVal === "read_only" || typeof defaultVal === "boolean") {
      const cycle: OverrideValue[] = [false, true, "read_only"];
      const idx = cycle.findIndex(v => v === current);
      next = cycle[(idx + 1) % cycle.length];
    } else {
      next = !current;
    }

    setPendingChanges(prev => new Map(prev).set(key(feature, planId), next));
  };

  const resetCell = (feature: keyof PlanAccess, planId: PlanId) => {
    const k = key(feature, planId);
    setPendingChanges(prev => {
      const n = new Map(prev);
      n.delete(k);
      return n;
    });
    // Mark for deletion if there was a DB override
    const existing = overrides.find(o => o.feature_key === feature && o.plan_id === planId);
    if (existing) {
      setOverrides(prev => prev.filter(o => !(o.feature_key === feature && o.plan_id === planId)));
      // Delete from DB
      supabase.from("tier_access_overrides").delete().eq("feature_key", feature).eq("plan_id", planId).then(() => {});
    }
  };

  const saveAll = async () => {
    if (pendingChanges.size === 0) return;
    setSaving(true);
    try {
      const upserts = Array.from(pendingChanges.entries()).map(([k, value]) => {
        const [feature_key, plan_id] = k.split("::");
        return { feature_key, plan_id, value: JSON.stringify(value) !== undefined ? value : value, updated_by: user?.id, updated_at: new Date().toISOString() };
      });

      for (const item of upserts) {
        await supabase.from("tier_access_overrides").upsert(
          { feature_key: item.feature_key, plan_id: item.plan_id, value: item.value as any, updated_by: item.updated_by, updated_at: item.updated_at },
          { onConflict: "feature_key,plan_id" }
        );
      }

      toast({ title: `✅ Saved ${upserts.length} override(s)` });
      setPendingChanges(new Map());
      await loadOverrides();
      // Refresh the override cache
      const { refreshTierOverrides } = await import("@/lib/planFeatures");
      refreshTierOverrides();
    } catch (err) {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Tier Access Manager</h2>
          <p className="text-xs text-muted-foreground">Click cells to cycle values. Highlighted cells have overrides.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadOverrides} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/10 text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Reload
          </button>
          <button
            onClick={saveAll}
            disabled={pendingChanges.size === 0 || saving}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" /> Save {pendingChanges.size > 0 ? `(${pendingChanges.size})` : ""}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/8 overflow-auto" style={{ background: "var(--card)" }}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-3 py-2.5 font-semibold text-primary sticky left-0 bg-card z-10 min-w-[200px]">Feature</th>
              {PLAN_IDS.map(p => (
                <th key={p} className="text-center px-2 py-2.5 font-semibold text-primary min-w-[90px]">{PLAN_LABELS[p]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(FEATURE_GROUPS).map(([group, features]) => (
              <>
                <tr key={`group-${group}`}>
                  <td colSpan={PLAN_IDS.length + 1} className="px-3 py-2 bg-muted/30 font-bold text-foreground text-[11px] uppercase tracking-wider">{group}</td>
                </tr>
                {features.map(feature => (
                  <tr key={feature} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-3 py-2 font-medium text-foreground sticky left-0 bg-card">{feature}</td>
                    {PLAN_IDS.map(planId => {
                      const val = getEffectiveValue(feature, planId);
                      const overridden = isOverridden(feature, planId);
                      const hasPending = pendingChanges.has(key(feature, planId));
                      return (
                        <td key={planId} className="text-center px-1 py-1">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              onClick={() => cycleValue(feature, planId)}
                              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                                hasPending ? "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/40" :
                                overridden ? "bg-primary/20 text-primary ring-1 ring-primary/40" :
                                "text-muted-foreground hover:bg-white/5"
                              }`}
                            >
                              {renderValue(val)}
                            </button>
                            {overridden && (
                              <button onClick={() => resetCell(feature, planId)} className="text-muted-foreground hover:text-red-400 p-0.5" title="Reset to default">
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
