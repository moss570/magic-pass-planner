// ═══════════════════════════════════════════════════════════════════════════════
// Shared scheduler helpers — used by ai-trip-planner and ai-trip-planner-recalculate
// ═══════════════════════════════════════════════════════════════════════════════

export interface SchedulerItem {
  startTime: number;       // minutes since midnight
  duration: number;
  walkMinutes: number;
  waitMinutes: number;
  rideMinutes?: number;
  activity: string;
  type: string;
  badge?: string;
  tip: string;
  location?: string;
  land?: string;
  priority: string;
  alternativeDining?: string[];
  passingPoints?: PassingPoint[];
  locked?: boolean;
  dropped?: boolean;
}

export interface PassingPoint {
  type: string;
  label: string;
  nodeId?: string;
  detourSeconds?: number;
  image_url?: string;
  description?: string;
  is_magic_shot?: boolean;
  is_limited?: boolean;
  family_restroom?: boolean;
  nursing_room?: boolean;
  price?: number;
  dietary_flags?: string[];
}

export interface Nudge {
  id: string;
  type: 'restroom' | 'meal' | 'special_event';
  message: string;
  afterItemIndex: number;
  suggestion?: string;
  bookingUrl?: string;
}

export interface MealWindows {
  breakfast: [number, number];
  lunch: [number, number];
  dinner: [number, number];
}

const DEFAULT_MEAL_WINDOWS: MealWindows = {
  breakfast: [420, 540],   // 7-9 AM
  lunch: [720, 780],       // 12-1 PM
  dinner: [1080, 1170],    // 6-7:30 PM
};

// ─── Nudge Generation ────────────────────────────────────────────────────────

export function generateNudges(
  items: SchedulerItem[],
  mealWindows: MealWindows = DEFAULT_MEAL_WINDOWS,
  specialEvents?: Array<{ name: string; category: string; bookingUrl?: string }>,
): Nudge[] {
  const nudges: Nudge[] = [];
  let lastRestroomTime = items.length > 0 ? items[0].startTime : 480;
  let specialEventNudged = false;

  // Track which meal windows have dining scheduled
  const mealsCovered = { breakfast: false, lunch: false, dinner: false };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemEnd = item.startTime + item.duration + (item.walkMinutes || 0);

    // Mark if dining falls in a meal window
    if (item.type === 'dining' || item.badge === 'Dining' || item.badge === 'Quick Service') {
      if (item.startTime >= mealWindows.breakfast[0] && item.startTime <= mealWindows.breakfast[1]) mealsCovered.breakfast = true;
      if (item.startTime >= mealWindows.lunch[0] && item.startTime <= mealWindows.lunch[1]) mealsCovered.lunch = true;
      if (item.startTime >= mealWindows.dinner[0] && item.startTime <= mealWindows.dinner[1]) mealsCovered.dinner = true;
    }

    // Restroom nudge: every ~2 hours of activity or long walks
    if (itemEnd - lastRestroomTime >= 120 || (item.walkMinutes && item.walkMinutes >= 12)) {
      nudges.push({
        id: `restroom-${i}`,
        type: 'restroom',
        message: `🚻 It's been ${Math.round((itemEnd - lastRestroomTime) / 60)} hours — consider a restroom stop nearby.`,
        afterItemIndex: i,
      });
      lastRestroomTime = itemEnd;
    }

    // Meal nudge — check if we've passed a meal window without dining
    if (!mealsCovered.lunch && item.startTime > mealWindows.lunch[1]) {
      nudges.push({
        id: `meal-lunch-${i}`,
        type: 'meal',
        message: '🍽️ You haven\'t scheduled lunch yet — it\'s past 1 PM! Consider grabbing a quick bite.',
        afterItemIndex: i,
      });
      mealsCovered.lunch = true; // Don't repeat
    }
    if (!mealsCovered.dinner && item.startTime > mealWindows.dinner[1]) {
      nudges.push({
        id: `meal-dinner-${i}`,
        type: 'meal',
        message: '🍽️ No dinner scheduled yet — it\'s past 7:30 PM! Don\'t forget to eat.',
        afterItemIndex: i,
      });
      mealsCovered.dinner = true;
    }

    // Special event nudge — once per day max
    if (!specialEventNudged && specialEvents && specialEvents.length > 0 && i >= Math.floor(items.length / 3)) {
      const evt = specialEvents[0];
      nudges.push({
        id: `special-event-${i}`,
        type: 'special_event',
        message: `✨ "${evt.name}" is available at this park today! ${evt.category === 'dessert_party' ? 'Great fireworks views included.' : 'A unique experience worth considering.'}`,
        afterItemIndex: i,
        suggestion: evt.name,
        bookingUrl: evt.bookingUrl,
      });
      specialEventNudged = true;
    }
  }

  return nudges;
}

// ─── Re-solve Day Around Locked Blocks ───────────────────────────────────────

export interface LockedBlock {
  itemIndex: number;
  startTime: string;       // "HH:MM"
  durationMinutes: number;
  label: string;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${min.toString().padStart(2, '0')} ${period}`;
}

export function resolveAroundLocked(
  items: SchedulerItem[],
  lockedBlocks: LockedBlock[],
  parkCloseMinutes: number = 22 * 60, // 10 PM default
  walkingSpeedKmh: number = 2.5,
): { items: SchedulerItem[]; warnings: string[] } {
  const warnings: string[] = [];

  // Build locked set by injecting locked items
  const locked: Array<SchedulerItem & { _lockStart: number; _lockEnd: number }> = lockedBlocks.map(lb => ({
    startTime: timeToMinutes(lb.startTime),
    duration: lb.durationMinutes,
    walkMinutes: 0,
    waitMinutes: 0,
    activity: lb.label,
    type: 'stop',
    tip: 'User-scheduled stop',
    priority: 'must-do',
    locked: true,
    passingPoints: [],
    _lockStart: timeToMinutes(lb.startTime),
    _lockEnd: timeToMinutes(lb.startTime) + lb.durationMinutes,
  }));

  // Separate unlocked items
  const unlocked = items.filter(it => !it.locked);

  // Merge locked and unlocked, re-timing unlocked around locked
  const result: SchedulerItem[] = [];
  const allLocked = locked.sort((a, b) => a._lockStart - b._lockStart);

  // Create time windows between locked blocks
  let cursor = items.length > 0 ? items[0].startTime : 480; // start of day
  const windows: Array<{ start: number; end: number }> = [];

  for (const lb of allLocked) {
    if (lb._lockStart > cursor) {
      windows.push({ start: cursor, end: lb._lockStart });
    }
    result.push({ ...lb, startTime: lb._lockStart });
    cursor = lb._lockEnd;
  }
  // Final window after last locked block
  windows.push({ start: cursor, end: parkCloseMinutes });

  // Fill unlocked items into windows
  let windowIdx = 0;
  let windowCursor = windows.length > 0 ? windows[0].start : cursor;

  for (const item of unlocked) {
    if (windowIdx >= windows.length) {
      // No more windows — item is dropped
      warnings.push(`"${item.activity}" was dropped — no time remaining before park close.`);
      result.push({ ...item, dropped: true });
      continue;
    }

    const totalItemTime = (item.walkMinutes || 0) + (item.waitMinutes || 0) + item.duration;

    // Skip to next window if current doesn't fit
    while (windowIdx < windows.length && windowCursor + totalItemTime > windows[windowIdx].end) {
      windowIdx++;
      if (windowIdx < windows.length) {
        windowCursor = windows[windowIdx].start;
      }
    }

    if (windowIdx >= windows.length) {
      warnings.push(`"${item.activity}" was dropped — no time remaining before park close.`);
      result.push({ ...item, dropped: true });
      continue;
    }

    result.push({
      ...item,
      startTime: windowCursor,
      locked: false,
    });
    windowCursor += totalItemTime;
  }

  // Sort by startTime
  result.sort((a, b) => a.startTime - b.startTime);

  // Format times
  for (const item of result) {
    (item as any).time = minutesToTime(item.startTime);
  }

  return { items: result, warnings };
}
