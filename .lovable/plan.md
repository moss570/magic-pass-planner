

## Trip Planner Step 3: Default Empty, Validation Flag, Evening-Only Toggle, and Scheduler Hints

### Changes

#### 1. Default day assignments to empty (no pre-selection)
Currently when assignments are created for new days, the first selected park is auto-assigned. Change this so new days default to `parkIds: []` — no selection. Show a warning banner **"Select at least one activity"** that disappears once any day has a selection.

#### 2. Add "Evening Only" toggle per park per day
For each selected park chip on a given day, add a small toggle (🌙 icon or "PM" badge) indicating "Dinner / Fireworks only." This stores metadata in the draft so the scheduler knows to route that park visit to late afternoon/evening.

**Data model change** in `tripDraft.ts`:
```typescript
export interface ParkDayAssignment {
  date: string;
  parkId: string | null;
  parkIds: string[];
  eveningOnly: string[]; // park names marked as evening-only for this day
}
```

#### 3. Update `canContinue` validation
Change from `selectedParks.length > 0 && tripDays.length > 0` to also require that every trip day has at least one park or is explicitly marked Non-Park.

#### 4. Transit-aware scheduler hints (data only)
The `eveningOnly` array will be passed through the draft into the saved trip and used by the `ai-trip-planner` edge function. On park hopper days with an evening-only park, the scheduler should:
- Schedule that park last in the day
- Account for transit time from the transit matrix
- Route users toward park exit/transportation hub before departure time

This is a **data-model and UI change only** — the scheduler logic in the edge function will consume these hints in a follow-up task.

### Files to edit

- **`src/lib/tripDraft.ts`** — Add `eveningOnly: string[]` to `ParkDayAssignment`, default to `[]` in `getDefaultDraft`
- **`src/components/trip-planner/steps/StepParksDates.tsx`** — 
  - Default new days to empty `parkIds: []` (remove auto-assignment of first park)
  - Add validation banner "Select at least one activity" when any day has no selection and isn't Non-Park
  - Add evening-only toggle button (🌙) next to each selected park chip
  - Update `canContinue` to require all days have at least one park or Non-Park
  - Add `toggleEveningOnly(date, park)` handler

### UI detail
Each day card will show park chips as before. When a park is selected, a small 🌙 moon icon appears next to it — clicking it toggles that park as "evening only" (highlighted in amber). A tooltip or label says "Just for Dinner / Fireworks." The Non-Park button works as before, clearing all selections for that day.

