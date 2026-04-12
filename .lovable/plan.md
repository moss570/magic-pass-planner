

## Two Trip Planner Modes + User Defaults + Smart Best-Days Integration

### Summary
Add a **Day Trip Itinerary** mode alongside the existing **Vacation Planner**, create a **Trip Planner Defaults** section in Settings, and upgrade the Best Days to Go widget to support multi-park same-day selections that auto-detect Park Hopper itineraries.

---

### 1. Trip Planner Mode Selection

When a user opens `/trip-planner`, they see a mode picker before the wizard:

```text
┌─────────────────────────────────────┐
│  🏰 Vacation Planner                │
│  Multi-day trips with hotels,       │
│  transportation & full budget       │
├─────────────────────────────────────┤
│  ☀️ Day Trip Itinerary              │
│  Single-day park visit — no hotel,  │
│  no airfare, streamlined budget     │
└─────────────────────────────────────┘
```

**Day Trip mode differences:**
- `endDate` is locked to `startDate` (single day)
- Budget slider: $100–$2,000 (default $500)
- Skips Step 5 (Transport & Lodging) entirely
- Ticket question becomes: "Do you have tickets/AP?" — if AP, skip ticket cost
- No hotel recommendations in results
- No airfare considerations
- Streamlined 5-step wizard: Basics → Party → Park(s) → Must-Dos → Review

**Files:**
- **`src/lib/tripDraft.ts`** — add `mode: 'vacation' | 'day-trip'` and `hasAnnualPass: boolean` to `TripDraft`; adjust `getDefaultDraft()`
- **`src/components/trip-planner/Stepper.tsx`** — accept mode prop, show 5 or 7 steps
- **`src/components/trip-planner/steps/StepBasics.tsx`** — conditionally hide end date and adjust budget range for day-trip mode
- **`src/pages/TripPlanner.tsx`** — add mode picker screen before wizard; conditionally skip transport step; pass mode to `generateItinerary` payload
- **`src/components/trip-planner/steps/StepLightningLaneTickets.tsx`** — show "I have an Annual Pass" toggle; if AP, hide ticket pricing

---

### 2. Trip Planner Defaults in Settings

Add a new card in Settings: **"Trip Planner Defaults"** — saves to `users_profile` so the wizard auto-populates:

- **Default mode**: Vacation / Day Trip
- **Annual Pass holder**: Yes/No (+ tier select if Yes)
- **Home park**: dropdown (already exists in Settings as `homePark`)
- **Default party size**: adults + children
- **Default ride preference**: thrill / family / little / mix
- **Walking speed**: already exists
- **Lightning Lane preference**: multi / individual / none

These defaults pre-fill the wizard draft via `getDefaultDraft()` which will read from the user's profile.

**Files:**
- **`src/pages/Settings.tsx`** — add "Trip Planner Defaults" card with form fields
- **`src/lib/tripDraft.ts`** — `getDefaultDraft()` accepts optional user preferences object to pre-fill
- **Database migration** — add columns to `users_profile`: `default_trip_mode`, `default_party_adults`, `default_party_children`, `default_ride_preference`, `default_ll_option`

---

### 3. Best Days to Go → Day Trip Integration

Currently the widget only allows selecting one park at a time. Upgrade it to:

- Allow selecting **multiple parks per date** (multi-select chips)
- When user selects 2–3 parks on the **same day**, auto-set `parkHopper: true`
- "Send to Trip Planner" opens Day Trip mode with:
  - Date pre-filled
  - Parks pre-filled
  - Park Hopper auto-enabled if multiple parks on same day
  - AP status pre-filled from user defaults
  - Budget auto-set to day-trip default

**Files:**
- **`src/components/ap/BestDaysWidget.tsx`** — change from single park selector to allowing multi-park selection per date; update `handleSendToPlanner` to pass `mode=day-trip`, multiple parks, and park hopper flag
- **`src/components/ap/ParkSelectorChips.tsx`** — support multi-select mode (new `multiSelect` prop)
- **`src/pages/TripPlanner.tsx`** — extend prefill logic to read `mode`, `parkHopper`, and multiple parks from URL params

---

### 4. Edge Function Update

- **`supabase/functions/ai-trip-planner/index.ts`** — accept `mode: 'day-trip' | 'vacation'` and `hasAnnualPass: boolean` in the input; when day-trip mode, skip hotel/airfare budget calculations and set `resortStay: false`

---

### Technical Details

**New `TripDraft` fields:**
```typescript
mode: 'vacation' | 'day-trip';
hasAnnualPass: boolean;
```

**New `users_profile` columns (migration):**
```sql
ALTER TABLE users_profile
  ADD COLUMN IF NOT EXISTS default_trip_mode text DEFAULT 'vacation',
  ADD COLUMN IF NOT EXISTS default_party_adults integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS default_party_children integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_ride_preference text DEFAULT 'mix',
  ADD COLUMN IF NOT EXISTS default_ll_option text DEFAULT 'multi';
```

The existing `ap_pass_tier` column on `users_profile` already tracks whether the user has an AP — if it's not "None", the app knows they have an annual pass and can skip ticket pricing.

**Wizard step mapping:**
- Vacation: Basics → Party → Parks & Dates → Must-Dos → Transport → Lightning Lane → Review (7 steps)
- Day Trip: Basics → Party → Park(s) → Must-Dos → Review (5 steps, skips Transport and merges LL into Review)

