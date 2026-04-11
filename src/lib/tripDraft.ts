// localStorage persistence helper for trip wizard drafts

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
}

export interface TripDraft {
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

export function getDefaultDraft(): TripDraft {
  return {
    tripName: '',
    startDate: '',
    endDate: '',
    budget: 6500,
    specialNotes: '',
    adults: 2,
    children: 0,
    ages: '',
    tripMembers: [],
    selectedParks: [],
    parkDayAssignments: [],
    mustDoAttractions: {},
    transportation: [],
    lodging: '',
    resortCategory: '',
    walkingSpeedKmh: 2.5,
    llOption: 'multi',
    llMultiPassSelections: [],
    llIndividualSelections: [],
    dropTimeStrategy: 'park-open',
    parkHopper: false,
    ridePreference: 'mix',
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
