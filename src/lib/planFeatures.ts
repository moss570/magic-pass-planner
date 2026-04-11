import type { PlanId } from './stripe';

export type AlertLimit = number | 'unlimited' | 'links_only' | 'none';

export interface PlanAccess {
  aiTripPlanner: boolean;
  smartItineraryOptimizer: boolean;
  budgetManager: boolean;
  tripVersions: boolean;
  giftCardTracker: boolean;
  airfareAlerts: AlertLimit;
  hotelSuggestions: boolean;
  hotelAlerts: AlertLimit;
  diningAlerts: AlertLimit;
  eventAlerts: AlertLimit;
  reservationFolder: boolean;
  attractionPriorities: boolean;
  characterMeetsPriorities: boolean;
  showFireworksPriorities: boolean;
  groupExpenseTracking: boolean | 'read_only';
  groupCoordinator: boolean | 'read_only';
  groupPolls: boolean;
  groupGames: boolean;
  liveWaitTimes: boolean;
  lightningLaneGapFinder: boolean;
  gpsCompass: boolean;
  gpsCalibration: boolean;
  nearbySnacksMerch: boolean;
  rainRadar: boolean;
  rideClosureAlerts: boolean;
  fireworksRideCalculator: boolean;
  goldenHourPlanner: boolean;
  photoPassAlerts: boolean;
  apBlockoutCalendar: boolean;
  apDiscountDatabase: boolean;
  apRenewalAlerts: boolean;
  socialFeed: boolean;
  magicBeaconCreation: boolean;
  magicBeaconEvents: boolean;
  apHotelAlerts: boolean;
  apMerchAlerts: boolean;
  orlandoInsidersGuide: boolean;
}

export const PLAN_ACCESS: Record<PlanId, PlanAccess> = {
  free: {
    aiTripPlanner: true,
    smartItineraryOptimizer: true,
    budgetManager: true,
    tripVersions: false,
    giftCardTracker: true,
    airfareAlerts: 'none',
    hotelSuggestions: true,
    hotelAlerts: 1,
    diningAlerts: 1,
    eventAlerts: 'none',
    reservationFolder: false,
    attractionPriorities: false,
    characterMeetsPriorities: false,
    showFireworksPriorities: false,
    groupExpenseTracking: false,
    groupCoordinator: false,
    groupPolls: false,
    groupGames: true,
    liveWaitTimes: true,
    lightningLaneGapFinder: false,
    gpsCompass: false,
    gpsCalibration: false,
    nearbySnacksMerch: false,
    rainRadar: true,
    rideClosureAlerts: true,
    fireworksRideCalculator: false,
    goldenHourPlanner: false,
    photoPassAlerts: false,
    apBlockoutCalendar: false,
    apDiscountDatabase: false,
    apRenewalAlerts: false,
    socialFeed: false,
    magicBeaconCreation: false,
    magicBeaconEvents: true,
    apHotelAlerts: false,
    apMerchAlerts: false,
    orlandoInsidersGuide: true,
  },
  ninety_day_planner: {
    aiTripPlanner: true,
    smartItineraryOptimizer: true,
    budgetManager: true,
    tripVersions: false,
    giftCardTracker: true,
    airfareAlerts: 1,
    hotelSuggestions: true,
    hotelAlerts: 7,
    diningAlerts: 7,
    eventAlerts: 3,
    reservationFolder: true,
    attractionPriorities: true,
    characterMeetsPriorities: true,
    showFireworksPriorities: true,
    groupExpenseTracking: true,
    groupCoordinator: true,
    groupPolls: true,
    groupGames: true,
    liveWaitTimes: true,
    lightningLaneGapFinder: true,
    gpsCompass: true,
    gpsCalibration: true,
    nearbySnacksMerch: true,
    rainRadar: true,
    rideClosureAlerts: true,
    fireworksRideCalculator: true,
    goldenHourPlanner: true,
    photoPassAlerts: true,
    apBlockoutCalendar: false,
    apDiscountDatabase: false,
    apRenewalAlerts: false,
    socialFeed: true,
    magicBeaconCreation: false,
    magicBeaconEvents: false,
    apHotelAlerts: false,
    apMerchAlerts: false,
    orlandoInsidersGuide: true,
  },
  ninety_day_friend: {
    aiTripPlanner: false,
    smartItineraryOptimizer: false,
    budgetManager: false,
    tripVersions: false,
    giftCardTracker: false,
    airfareAlerts: 'none',
    hotelSuggestions: false,
    hotelAlerts: 'links_only',
    diningAlerts: 'links_only',
    eventAlerts: 'links_only',
    reservationFolder: false,
    attractionPriorities: false,
    characterMeetsPriorities: false,
    showFireworksPriorities: false,
    groupExpenseTracking: 'read_only',
    groupCoordinator: 'read_only',
    groupPolls: true,
    groupGames: true,
    liveWaitTimes: true,
    lightningLaneGapFinder: false,
    gpsCompass: true,
    gpsCalibration: true,
    nearbySnacksMerch: false,
    rainRadar: true,
    rideClosureAlerts: false,
    fireworksRideCalculator: false,
    goldenHourPlanner: false,
    photoPassAlerts: false,
    apBlockoutCalendar: false,
    apDiscountDatabase: false,
    apRenewalAlerts: false,
    socialFeed: false,
    magicBeaconCreation: false,
    magicBeaconEvents: false,
    apHotelAlerts: false,
    apMerchAlerts: false,
    orlandoInsidersGuide: true,
  },
  magic_pass_planner: {
    aiTripPlanner: true,
    smartItineraryOptimizer: true,
    budgetManager: true,
    tripVersions: true,
    giftCardTracker: true,
    airfareAlerts: 20,
    hotelSuggestions: true,
    hotelAlerts: 20,
    diningAlerts: 20,
    eventAlerts: 10,
    reservationFolder: true,
    attractionPriorities: true,
    characterMeetsPriorities: true,
    showFireworksPriorities: true,
    groupExpenseTracking: true,
    groupCoordinator: true,
    groupPolls: true,
    groupGames: true,
    liveWaitTimes: true,
    lightningLaneGapFinder: true,
    gpsCompass: true,
    gpsCalibration: true,
    nearbySnacksMerch: true,
    rainRadar: true,
    rideClosureAlerts: true,
    fireworksRideCalculator: true,
    goldenHourPlanner: true,
    photoPassAlerts: true,
    apBlockoutCalendar: true,
    apDiscountDatabase: false,
    apRenewalAlerts: true,
    socialFeed: true,
    magicBeaconCreation: true,
    magicBeaconEvents: true,
    apHotelAlerts: true,
    apMerchAlerts: true,
    orlandoInsidersGuide: true,
  },
  magic_pass_plus: {
    aiTripPlanner: true,
    smartItineraryOptimizer: true,
    budgetManager: true,
    tripVersions: true,
    giftCardTracker: true,
    airfareAlerts: 'unlimited',
    hotelSuggestions: true,
    hotelAlerts: 'unlimited',
    diningAlerts: 'unlimited',
    eventAlerts: 'unlimited',
    reservationFolder: true,
    attractionPriorities: true,
    characterMeetsPriorities: true,
    showFireworksPriorities: true,
    groupExpenseTracking: true,
    groupCoordinator: true,
    groupPolls: true,
    groupGames: true,
    liveWaitTimes: true,
    lightningLaneGapFinder: true,
    gpsCompass: true,
    gpsCalibration: true,
    nearbySnacksMerch: true,
    rainRadar: true,
    rideClosureAlerts: true,
    fireworksRideCalculator: true,
    goldenHourPlanner: true,
    photoPassAlerts: true,
    apBlockoutCalendar: true,
    apDiscountDatabase: true,
    apRenewalAlerts: true,
    socialFeed: true,
    magicBeaconCreation: true,
    magicBeaconEvents: true,
    apHotelAlerts: true,
    apMerchAlerts: true,
    orlandoInsidersGuide: true,
  },
  founders_pass: {
    aiTripPlanner: true,
    smartItineraryOptimizer: true,
    budgetManager: true,
    tripVersions: true,
    giftCardTracker: true,
    airfareAlerts: 'unlimited',
    hotelSuggestions: true,
    hotelAlerts: 'unlimited',
    diningAlerts: 'unlimited',
    eventAlerts: 'unlimited',
    reservationFolder: true,
    attractionPriorities: true,
    characterMeetsPriorities: true,
    showFireworksPriorities: true,
    groupExpenseTracking: true,
    groupCoordinator: true,
    groupPolls: true,
    groupGames: true,
    liveWaitTimes: true,
    lightningLaneGapFinder: true,
    gpsCompass: true,
    gpsCalibration: true,
    nearbySnacksMerch: true,
    rainRadar: true,
    rideClosureAlerts: true,
    fireworksRideCalculator: true,
    goldenHourPlanner: true,
    photoPassAlerts: true,
    apBlockoutCalendar: true,
    apDiscountDatabase: true,
    apRenewalAlerts: true,
    socialFeed: true,
    magicBeaconCreation: true,
    magicBeaconEvents: true,
    apHotelAlerts: true,
    apMerchAlerts: true,
    orlandoInsidersGuide: true,
  },
};

export function getFeatureAccess<K extends keyof PlanAccess>(
  planId: PlanId | null | undefined,
  feature: K
): PlanAccess[K] {
  const plan = planId ?? 'free';
  return PLAN_ACCESS[plan][feature];
}

export function isAlertLimitReached(
  limit: AlertLimit,
  currentCount: number
): boolean {
  if (limit === 'unlimited') return false;
  if (limit === 'none' || limit === 'links_only') return true;
  return currentCount >= limit;
}

export function alertLimitLabel(limit: AlertLimit): string {
  if (limit === 'unlimited') return 'Unlimited';
  if (limit === 'none') return 'Not included';
  if (limit === 'links_only') return 'Shared links only';
  return `Up to ${limit} active`;
}
