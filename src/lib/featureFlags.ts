// Feature flags for staged rollout
// Toggle features on/off before they go live

export const featureFlags = {
  /** Use the v2 deterministic scheduler with path-graph routing */
  useV2Scheduler: true,

  /** Show Lightning Lane Gap Finder in Live Park */
  llGapFinder: true,

  /** Show Game Developer Mode entry point */
  gameDevMode: true,

  /** Use the new multi-step Trip Planner wizard */
  tripPlannerWizardV2: true,
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag] ?? false;
}
