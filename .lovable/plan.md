

## Trip Planner Enhancements — Multi-Phase Plan

You've raised about 8 distinct features. Here's a structured plan organized by priority and dependency.

---

### Phase 1: Dining Classification + Meal Planning Tab (New Step 5)

**Problem**: Aloha Isle (a snack stand) was selected for lunch. The system has no concept of snack vs. meal locations.

**Solution**:

1. **Database migration**: Add columns to distinguish dining types
   - Add `dining_type` enum to the hardcoded park location data in the edge function: `"snack"`, `"quick-service"`, `"table-service"`
   - Add `serves_meals` array: `["breakfast", "lunch", "dinner"]` per location
   - Update every dining entry in `MK_LOCATIONS` and all park location maps with correct classification (e.g., Aloha Isle = `snack`, Columbia Harbour House = `quick-service` with `["lunch", "dinner"]`)

2. **New wizard step: "Meal Planning" (Step 5, shifts Transport to Step 6)**
   - For each meal (breakfast, lunch, dinner) per trip day, ask:
     - **Breakfast**: "At hotel/resort", "On the way to park", "Making at accommodation", "In the park"
     - **Lunch**: "In the park (quick service)", "In the park (table service)", "Packed from hotel", "Leave park for off-site"
     - **Dinner**: "In the park", "At resort/hotel", "Off-property restaurant", "Making at accommodation"
   - Store as `mealPreferences` in `TripDraft`
   - If user selects "Making at accommodation" or "Packed from hotel", flag this for the budget tool as grocery-based (lower cost estimate)

3. **Edge function update**: When scheduling lunch/dinner, filter dining locations by `dining_type` and `serves_meals` — never pick a snack stand for a meal slot

4. **Budget impact**: Meals marked as "making at accommodation" use a grocery cost estimate (~$8-12/person/meal) vs. QS (~$18-22) vs. table service (~$45-65)

**Files**:
- `src/lib/tripDraft.ts` — add `mealPreferences` interface and field
- New file: `src/components/trip-planner/steps/StepMealPlanning.tsx`
- `src/components/trip-planner/Stepper.tsx` — add "Meals" step
- `src/pages/TripPlanner.tsx` — wire new step into wizard flow
- `supabase/functions/ai-trip-planner/index.ts` — add `dining_type` and `serves_meals` to all park dining entries, update meal scheduling logic

---

### Phase 2: "You Will Pass These" Section on Itinerary Cards

**Problem**: PassingPointsAccordion exists but needs to be more prominent with the label "You will pass these on your way to next location. Do you want to stop?"

**Solution**:
- Rename the "On the way" accordion label to **"You'll pass these on the way — want to stop?"**
- Ensure every itinerary card shows this section (currently it only shows when `passingPoints` data exists)
- When user clicks "I'm stopping here," add an average time per type: PhotoPass = 8 min, Merch = 15 min, Snack = 10 min, Guest Services = 10 min
- The existing recalculate flow already handles locked blocks and time shifts

**Files**:
- `src/components/trip-planner/PassingPointsAccordion.tsx` — update label text, add default stop durations per type

---

### Phase 3: Fix Break Time Realism (Hotel Pool Break)

**Problem**: The "Rest break / hotel pool time" block is scheduled for ~60 minutes. In reality: walk to park exit (10 min) + transit to hotel (15-25 min) + change into swimsuit (10 min) + swim (30-45 min) + dry off and change (15 min) + transit back (15-25 min) + walk into park (10 min) = **2.5-3 hours minimum**.

**Solution**:
- Update the break block duration logic in the edge function:
  - If lodging = `disney-resort`: break duration = 150 min (2.5 hours)
  - If lodging = `off-property`: break duration = 180 min (3 hours)
  - If no hotel transit (stay in park): break duration = 45 min (find a shaded spot/show)
- Add a pool break option in the Meal Planning step: "Do you want a midday hotel pool break?" (Yes/No)
- When "No," use in-park rest alternatives (A/C show, relaxed dining)

**Files**:
- `supabase/functions/ai-trip-planner/index.ts` — update break duration calculations

---

### Phase 4: Hotel Recommendations (Off-Site/Non-Disney)

**Status**: The affiliate network system exists (`affiliate_networks` table, `affiliate-reveal-credential` function) but has no active networks configured. The trip planner doesn't query for hotel suggestions.

**Solution (data-ready, no affiliates required)**:
- Add a "Recommended Hotels" section to the itinerary review screen
- Show curated categories: "Budget-Friendly", "Family Suites", "Close to Parks"
- When affiliate accounts are configured, deep-link through affiliate tracking
- For now, show helpful info with "Coming soon" badges on booking links

**Files**:
- New component: `src/components/trip-planner/HotelSuggestions.tsx`
- `src/pages/TripPlanner.tsx` — render after itinerary when lodging = `off-property` or `not-sure`

---

### Phase 5: Live Day GPS Tracking + Adaptive Schedule (Future Foundation)

This is the most ambitious feature. The plan covers the **data model and foundation** — full GPS tracking is a follow-up.

1. **Pre-trip editing**: Users can already modify itineraries via AddBlockModal and StoppingHereModal. Ensure the "lock in" flow is clear: add an "Activate Day" button that transitions from planning to live mode.

2. **Live mode concept** (foundation only):
   - Add `trip_day_status` field: `planning` | `active` | `completed`
   - When `active`, the app uses GPS to detect proximity to scheduled locations
   - Log actual arrival/departure times to a new `trip_activity_log` table
   - Compare planned vs. actual to auto-adjust remaining schedule

3. **Data collection for optimization**:
   - `trip_activity_log` table: `user_id`, `trip_id`, `day_index`, `location`, `arrived_at`, `departed_at`, `actual_wait_minutes`, `actual_ride_minutes`
   - Over time, aggregate this data to improve wait time estimates and walk time calculations
   - This replaces the static `avgWait` values with crowd-sourced real data

**Files**:
- New migration: `trip_activity_log` table
- `src/lib/tripDraft.ts` — add `dayStatus` tracking
- Future: GPS hook integration with `useGeolocation.ts` (already exists)

---

### Summary of Step Order After Changes

```text
Current:  Basics → Party → Parks & Dates → Must-Dos → Transport → Lightning Lane → Review
Proposed: Basics → Party → Parks & Dates → Must-Dos → Meals → Transport → Lightning Lane → Review
```

### Implementation Order

I recommend implementing Phases 1-3 first (meal planning, passing points, break realism) as they directly fix the issues you observed. Phases 4-5 are additive features that can follow.

