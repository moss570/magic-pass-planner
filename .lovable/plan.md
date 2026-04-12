

## Fix Hotel Alert Creation from Trip Planner + Improve Create Modal

### Problem
1. "Track Price" navigates to `/hotel-alerts` but doesn't pass the hotel name, dates, or party size — the alert isn't auto-created.
2. The "New Alert" modal has a plain text input with no search functionality.
3. Price checks use a stub function with random data — not real hotel pricing APIs.

### Plan

#### 1. Pass hotel context via URL params (HotelSuggestions.tsx)
- Change the "Track Price" button to navigate with query params: `/hotel-alerts?hotel=Rosen+Inn&checkIn=2026-07-01&checkOut=2026-07-05&adults=2&children=1`
- Pass `startDate`, `endDate`, `adults`, `children` from the trip planner props plus the hotel name.

#### 2. Auto-open create form with pre-filled data (HotelAlerts.tsx)
- On mount, read URL search params (`hotel`, `checkIn`, `checkOut`, `adults`, `children`)
- If `hotel` param exists, pre-fill the create form fields and auto-open the modal (`setShowCreate(true)`)
- Parse a reasonable default target price from the hotel's price range (e.g. low end of "$80-110" = $80), passed as an additional param

#### 3. Add curated hotel suggestions to the create modal
- Add a small suggestions list below the hotel name input showing the 9 curated hotels (same `CURATED_HOTELS` data, extracted to a shared file)
- Typing filters the list; clicking a suggestion fills the name
- This replaces a "search API" with a practical curated list — no external hotel search API is needed at this stage

#### 4. Note on pricing reality
- The `hotel-price-check` edge function currently returns **simulated prices** (random ±15% variance). No real hotel pricing API is connected yet. This is by design per the project constraints — real pricing integration is a future milestone requiring third-party API keys (e.g., hotel booking aggregators). The alerts infrastructure (DB, notifications, sparklines) is fully functional and will work seamlessly once a real price source is wired in.

### Files Changed
- `src/components/trip-planner/HotelSuggestions.tsx` — pass query params on "Track Price" click
- `src/pages/HotelAlerts.tsx` — read URL params on mount, auto-open pre-filled create modal, add hotel suggestion filtering
- `src/lib/curatedHotels.ts` (new) — extract shared hotel data for reuse

