

## Fix My Trips: Summary Dialog, Edit Flow, and Version Access

### What's Being Fixed

1. **View Summary shows raw JSON error** — the itinerary is dumped as raw JSON text
2. **Edit button resets to mode selection** — clicking Edit on a saved trip takes user back to "Vacation or Day Trip?" instead of loading the saved trip
3. **No way to see or compare trip versions** — version count and compare link are missing

---

### Changes

#### 1. Fix Summary Dialog — Human-Readable Itinerary (`src/pages/MyTrips.tsx`)

- Add an `ItinerarySummary` component that parses the itinerary JSON (array of DayPlan objects with `date`, `park`, `parkEmoji`, `items[]`)
- Render each day as a header (date + park) with activity rows (time + name + badge)
- Graceful fallback: if structure doesn't match, show "Itinerary saved" instead of raw JSON
- Replace the `<pre>` block with the new component

#### 2. Fix Edit Flow — Load Saved Trip into Wizard (`src/pages/TripPlanner.tsx`)

- Import `useLocation` from react-router-dom
- In `TripPlannerWizard`, read `location.state?.tripId`
- On mount, if `tripId` is present:
  - Fetch the trip from `saved_trips` via Supabase client
  - Populate draft: `tripName` (from `name`), `startDate`, `endDate`, `budget`, `adults`, `children`, `ages`, `selectedParks` (from `parks`), `llOption` (from `ll_option`), `ridePreference` (from `ride_preference`), `specialNotes` (from `special_notes`)
  - Infer mode: if `start_date === end_date` → `day-trip`, else `vacation`
  - Set `modeSelected = true` to skip mode picker
  - Set `savedTripId` so saves update rather than create
  - Skip the resume banner

#### 3. Add Version Count + Compare Button (`src/pages/MyTrips.tsx`)

- After loading trips, query `trip_versions` table grouped by `trip_id` to get version counts
- Show a small badge on each trip card (e.g., "2 versions")
- Add a "Compare" button linking to `/trip-compare` with `state: { tripId }` when version count >= 2

### Files Changed
- `src/pages/MyTrips.tsx` — formatted itinerary, version badges, compare button
- `src/pages/TripPlanner.tsx` — read `location.state.tripId`, fetch and hydrate draft, skip mode selection

