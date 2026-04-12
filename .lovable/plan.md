

## Make Trip Name Required + Dedicated "My Trips" Page

### 1. Trip Name — Required Field with Tooltip

**File**: `src/components/trip-planner/steps/StepBasics.tsx`

- Update `canContinue` to require `draft.tripName.trim()` in addition to `draft.startDate`
- Add an info icon (lucide `Info`) next to the "Trip Name" label wrapped in a Tooltip explaining: *"Give your trip a unique name — you can save up to 3 versions under each name (e.g. 'Budget Version', 'Splurge Version'). This helps you find and compare trips later."*
- Show a subtle validation hint below the input when empty and user has interacted

### 2. New "My Trips" Page

**New file**: `src/pages/MyTrips.tsx`

- Extract the `TripProfilesSection` component from `src/pages/Settings.tsx` into this new dedicated page
- Full-page layout using `DashboardLayout` with the trip cards grid, summary dialog, delete, edit, and "Create New Trip" button — same functionality, just standalone
- Add upcoming vs. past trip grouping with section headers

### 3. Wire Into Navigation

**Files**: `src/App.tsx`, `src/components/DashboardLayout.tsx`

- Add route `/my-trips` → `MyTrips` page (protected)
- Add sidebar nav entry with `FolderOpen` icon labeled "My Trips" (placed after "Trip Planner")

### 4. Clean Up Settings

**File**: `src/pages/Settings.tsx`

- Remove the `TripProfilesSection` component and its rendering
- Add a simple link card: "🎒 My Saved Trips → View and manage your trips" that navigates to `/my-trips`

