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

  /** Enhanced itinerary cards with passing points, stopping here, add block, nudges */
  itineraryCardEnhancements: true,

  /** Hotel Alerts page and hotel recommendation CTA */
  hotelAlerts: true,

  /** Airfare Tracker page */
  airfareTracker: true,

  /** Reservations Inbox with email forwarding */
  reservationsInbox: true,

  /** Travel Party Invites with 72-hour discount */
  travelPartyInvites: true,

  /** Itinerary Versions (up to 3) + side-by-side compare */
  itineraryVersions: true,

  /** Budget upgrades with auto-expenses, category caps, timeline, CSV export */
  budgetUpgrades: true,

  /** Admin: Affiliate Networks management tab */
  affiliateNetworks: true,

  /** Admin: Park Content CMS tab */
  parkContentCms: true,
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag] ?? false;
}
