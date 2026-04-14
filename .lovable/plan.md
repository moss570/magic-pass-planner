

## Redesign Hotel & Airfare Pages as Search-First Experiences

### Overview
Transform the Hotel Alerts and Airfare Tracker pages from "create alert first" flows into **search-first experiences**. Users enter dates, budget, and traveler count — the system returns matching options with affiliate booking links. Users can then optionally create a price alert on any result they want to watch. A dedicated "My Alerts" section stays accessible on each page. The Trip Planner integrates search widgets inline.

### Current State
- **Hotel Alerts** (`/hotel-alerts`): Alert-centric — users click "New Alert", type a hotel name, set a target price. No search results or booking links shown upfront.
- **Airfare Tracker** (`/airfare`): Same pattern — requires origin airport, target price. No search results.
- **Trip Planner**: `HotelSuggestions.tsx` shows curated hotels with "Track Price" deep-links. No airfare equivalent.
- **Navigation**: Both pages are accessible via the sidebar nav. Users can already see their alerts via tabs (Watching/Paused/Found/Booked/History).

### Changes

**1. Redesign `src/pages/HotelAlerts.tsx` — Search-first hotel finder**

- Replace the current layout with two sections: **Search** (top) and **My Alerts** (bottom/tab)
- **Search form** (always visible, no modal): Check-in, Check-out, Adults, Children, Max Price per Night — no hotel name required
- On "Search", display curated hotel results filtered by the max price and sorted by value. Each result card shows:
  - Hotel name, price range, distance, amenities, bestFor
  - **"Book Now"** button → affiliate link via `buildBookingUrl()` with context params
  - **"🔔 Watch Price"** button → creates an alert for that hotel with the search criteria pre-filled
- Keep the existing tabs (Watching/Paused/Found/Booked/History) below the search results as a collapsible "My Alerts" section
- Remove the "New Alert" modal — alert creation now happens inline from search results

**2. Redesign `src/pages/AirfareTracker.tsx` — Search-first flight finder**

- Same two-section layout: **Search** (top) and **My Alerts** (bottom)
- **Search form**: Origin airport (optional — user may not know yet), Depart date, Return date, Adults, Children, Cabin class, Max budget — destination is locked to Orlando area airports (MCO, SFB, MLB)
- On "Search", show simulated flight options (since we use stub pricing) with:
  - Route, price estimate, cabin, stops
  - **"Book Now"** → affiliate link for flights
  - **"🔔 Watch Price"** → creates an airfare alert with search params
- Keep My Alerts tabs below

**3. Update `src/components/trip-planner/HotelSuggestions.tsx` — Inline search**

- Add a mini search form (dates + max price) that filters the curated hotels in real-time
- Change "Track Price" to two buttons: "Book" (affiliate link) and "Watch Price" (creates alert)
- Add an "Airfare Search" companion widget when `transportation` includes "flying"

**4. New component: `src/components/trip-planner/AirfareSuggestions.tsx`**

- Shown in Trip Planner results when user selected "Flying in"
- Mini search: origin, budget — destination locked to MCO
- Shows flight options with Book + Watch Price buttons
- Links to full `/airfare` page for more options

**5. Update `src/lib/curatedHotels.ts`** — Add a `bookingSearchUrl` field to each hotel for direct affiliate linking

### Technical Details

- **No new database tables** — uses existing `hotel_alerts` and `airfare_alerts` tables
- **No new edge functions** — uses existing `hotel-alerts` and `airfare-alerts` endpoints
- **Affiliate integration**: All "Book Now" buttons call `buildBookingUrl()` from `src/lib/affiliate.ts` with category `hotels` or `flights`, passing check-in/out dates and traveler counts as context
- **Simulated search results**: Since real pricing APIs aren't connected yet, hotel results come from `CURATED_HOTELS` filtered by max price. Airfare results are generated with randomized pricing within ±15% of the target (matching existing stub pattern). Results clearly state "estimated pricing"
- **Alert creation from search**: Instead of opening a modal, clicking "Watch Price" on a result calls the existing edge function directly with pre-filled params and shows a success toast
- **My Alerts section**: The existing alert tabs and cards remain unchanged — just moved below the search area with a collapsible header showing alert count badge

