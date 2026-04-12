

## Trip Planner Results: Header, Item Actions, and Aloha Isle Fix

### What's Being Fixed

1. **No trip name or version on results screen** — the top-left just says "Your 1-Day Adventure" with no trip identity
2. **No way to remove or replace items** — each itinerary card item has no action buttons
3. **Aloha Isle showing as lunch** — the main scheduler map in `index.ts` is missing `diningType:"snack"` and `servesMeals:[]` on Aloha Isle, so the snack filter doesn't exclude it from meal slots

### Changes

#### 1. Add Trip Name + Version to Results Header (`src/pages/TripPlanner.tsx`)
- Pass `tripName` (from `draft.tripName`) and `activeVersionName` into `ResultsView`
- Display them in the summary header: e.g., **"Spring Break 2026 — v1"** above "Your 1-Day Adventure"

#### 2. Add Remove & Replace Buttons to Each Item (`src/components/trip-planner/ItineraryCard.tsx`)
- Add a small **X** (remove) button and a **↻** (replace) button on each itinerary item card
- **Remove**: Filters out the item from `plan.items`, calls `onDayUpdated` with the updated plan, then triggers `recalculate` to re-solve timing
- **Replace**: Opens a small dropdown/modal showing 2-3 alternatives from the same category (rides → nearby rides, dining → nearby dining) sourced from the park map data, then swaps the item and recalculates

#### 3. Fix Aloha Isle Snack Classification (`supabase/functions/ai-trip-planner/index.ts`)
- Add `diningType:"snack"` and `servesMeals:[]` to the Aloha Isle entry in the inline park map (line 65)
- This matches the already-correct entry in `park-maps.ts` and ensures the existing filter at line 435 (`if (mealType && i.diningType === "snack") return false`) properly excludes it from lunch/dinner slots

### Files Changed
- `src/pages/TripPlanner.tsx` — pass trip name/version to ResultsView, display in header
- `src/components/trip-planner/ItineraryCard.tsx` — add remove and replace action buttons per item
- `supabase/functions/ai-trip-planner/index.ts` — add missing diningType/servesMeals to Aloha Isle (redeploy)

