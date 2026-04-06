

## Plan: Update Scraper Flow + Match Disney's Reservation UI Filters

### What the Screenshots Revealed

Disney's `/dine-res/restaurant/{slug}` page is a multi-step SPA:

```text
1. Page loads with Party Size selector + Calendar
2. User picks a date on the calendar (green dots = availability)
3. User clicks "Next" button
4. Time slots render as pills grouped by meal period (e.g. "07:40 AM")
```

The page ignores URL query parameters entirely -- all interaction is JavaScript-driven. Our current scraper just loads the URL and scans for text, which is why it always returns 0 results.

Additionally, the user wants the app's alert form to mirror Disney's own filter options (party size, date, meal period) so the scraper searches for exactly what the user specified.

### Changes

#### 1. Edge Function: Stop appending query params to URL

**File**: `supabase/functions/dining-availability-check/index.ts`

- Simplify `transformToReservationUrl` to return the bare `/dine-res/restaurant/{slug}` URL without query params
- The `date`, `partySize`, and `mealPeriod` are already sent as separate JSON fields to the Railway poller -- no change needed there

#### 2. Edge Function: Pass `mealPeriods` array instead of single period

**File**: `supabase/functions/dining-availability-check/index.ts`

- Change the body sent to Railway from `{ mealPeriod: "Dinner" }` to `{ mealPeriods: ["Dinner", "Lunch"] }` to match whatever the user selected
- This lets the scraper filter results to only the meal periods the user cares about

#### 3. Railway Poller v3 (provided as pasteable code)

Complete rewrite of the `/check` endpoint interaction flow:

- **Navigate** to bare `/dine-res/restaurant/{slug}` (no query params)
- **Set party size**: Find the party size control and adjust if different from default (2)
- **Navigate calendar**: Click forward/back arrows to reach the correct month, then click the target date cell
- **Click "Next"**: Find and click the "Next" button to trigger time slot loading
- **Filter by meal period**: Only collect times that appear under the user's selected meal period headers (Breakfast/Lunch/Dinner)
- **Poll for results**: Check for time-slot pills matching `/\d{1,2}:\d{2}\s*(AM|PM)/` up to 20 seconds
- **Diagnostics**: If no results found, capture page text snippet to distinguish "no availability" from "scraper error"

#### 4. UI: Add preferred time input to match Disney's filters

**File**: `src/pages/DiningAlerts.tsx`

The current form already has: Restaurant search, Date picker, Party Size (1-12), Meal Time pills (Breakfast/Lunch/Dinner/Any), and notification toggles. This closely matches Disney's own filters. One addition:

- Add an optional **"Preferred Time"** text hint (e.g. "around 6 PM") that gets saved to the existing `preferred_time` column. This won't affect the scraper search (it checks all times for the meal period) but helps the notification say "We found 5:45 PM -- close to your preferred 6 PM!"

No database changes needed -- `preferred_time` column already exists.

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/dining-availability-check/index.ts` | Remove query params from URL transform; pass `mealPeriods` array to poller |
| `src/pages/DiningAlerts.tsx` | Add optional "Preferred Time" input field; wire to existing `preferred_time` column |
| Railway `index.js` (provided as pasteable code) | Full rewrite: calendar navigation, date click, "Next" button, meal period filtering |

