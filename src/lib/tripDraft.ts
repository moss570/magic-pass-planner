// localStorage persistence helper for trip wizard drafts

export type TripMode = 'vacation' | 'day-trip';

export interface TripMember {
  firstName: string;
  lastName: string;
  email: string;
  isAdult: boolean;
  isSplitting: boolean;
}

export interface MustDoPreference {
  [attractionId: string]: 'must' | 'want' | 'skip';
}

export interface ParkDayAssignment {
  date: string;
  parkId: string | null; // null = non-park day
  parkIds: string[]; // up to 3 parks per day
}

export interface TripDraft {
  // Mode
  mode: TripMode;
  hasAnnualPass: boolean;
  // Step 1 — Basics
  tripName: string;
  startDate: string;
  endDate: string;
  budget: number;
  specialNotes: string;
  // Step 2 — Party
  adults: number;
  children: number;
  ages: string;
  tripMembers: TripMember[];
  // Step 3 — Parks & Dates
  selectedParks: string[];
  parkDayAssignments: ParkDayAssignment[];
  // Step 4 — Must-Dos
  mustDoAttractions: { [parkId: string]: MustDoPreference };
  // Step 5 — Transportation & Lodging
  transportation: string[];
  lodging: 'disney-resort' | 'off-property' | 'not-sure' | '';
  resortCategory: string;
  walkingSpeedKmh: number;
  // Step 6 — Lightning Lane & Tickets
  llOption: string;
  llMultiPassSelections: string[];
  llIndividualSelections: string[];
  dropTimeStrategy: '7am' | 'park-open';
  parkHopper: boolean;
  // Step 7 — Review (no additional state)
  ridePreference: string;
  // Meta
  currentStep: number;
  updatedAt: number;
}

const DRAFT_PREFIX = 'mpp:trip-draft:';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface TripPlannerDefaults {
  default_trip_mode?: string;
  default_party_adults?: number;
  default_party_children?: number;
  default_ride_preference?: string;
  default_ll_option?: string;
  ap_pass_tier?: string;
}

export function getDefaultDraft(defaults?: TripPlannerDefaults): TripDraft {
  const hasAP = defaults?.ap_pass_tier ? defaults.ap_pass_tier !== 'None' : false;
  const mode = (defaults?.default_trip_mode === 'day-trip' ? 'day-trip' : 'vacation') as TripMode;

  return {
    mode,
    hasAnnualPass: hasAP,
    tripName: '',
    startDate: '',
    endDate: '',
    budget: mode === 'day-trip' ? 500 : 6500,
    specialNotes: '',
    adults: defaults?.default_party_adults ?? 2,
    children: defaults?.default_party_children ?? 0,
    ages: '',
    tripMembers: [],
    selectedParks: [],
    parkDayAssignments: [],
    mustDoAttractions: {},
    transportation: [],
    lodging: '',
    resortCategory: '',
    walkingSpeedKmh: 2.5,
    llOption: defaults?.default_ll_option ?? 'multi',
    llMultiPassSelections: [],
    llIndividualSelections: [],
    dropTimeStrategy: 'park-open',
    parkHopper: false,
    ridePreference: defaults?.default_ride_preference ?? 'mix',
    currentStep: 0,
    updatedAt: Date.now(),
  };
}

function getDraftKey(userId: string): string {
  return `${DRAFT_PREFIX}${userId}`;
}

export function loadDraft(userId: string): TripDraft | null {
  try {
    const raw = localStorage.getItem(getDraftKey(userId));
    if (!raw) return null;
    const draft = JSON.parse(raw) as TripDraft;
    if (Date.now() - draft.updatedAt > MAX_AGE_MS) {
      localStorage.removeItem(getDraftKey(userId));
      return null;
    }
    // Ensure mode field exists for legacy drafts
    if (!draft.mode) draft.mode = 'vacation';
    if (draft.hasAnnualPass === undefined) draft.hasAnnualPass = false;
    return draft;
  } catch {
    return null;
  }
}

export function saveDraft(userId: string, draft: TripDraft): void {
  try {
    localStorage.setItem(getDraftKey(userId), JSON.stringify({ ...draft, updatedAt: Date.now() }));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function clearDraft(userId: string): void {
  try {
    localStorage.removeItem(getDraftKey(userId));
  } catch {}
}
