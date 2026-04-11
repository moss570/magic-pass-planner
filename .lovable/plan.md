

# Build Lightning Lane Gap Finder

## What It Does
Monitors Lightning Lane return times across all rides in the selected park and highlights when return times drop significantly or gaps open up — helping users snag shorter LL waits in real-time.

## How It Works
The existing `park-live-data` edge function already fetches Lightning Lane state (`llState`) for every ride from ThemeParks.wiki. The Gap Finder will use this existing data stream (no new edge function needed) and add a dedicated UI tab in Live Park Mode.

## Implementation

### 1. Add "LL Gap Finder" tab to Live Park Menu (`src/pages/LivePark.tsx`)
- Add a new menu item: `{ id: "ll-gaps", icon: "⚡", label: "LL Gap Finder", sub: "Find Lightning Lane drops" }`
- Add `"ll-gaps"` to the `activeTab` type union

### 2. Build the LL Gap Finder UI section (`src/pages/LivePark.tsx`)
When `activeTab === "ll-gaps"`, render:
- **Header**: "Lightning Lane Gap Finder" with explanation text
- **Ride cards** filtered to only rides that have LL data (`llState` is not null), sorted by shortest LL return time first
- Each card shows:
  - Ride name + area
  - Current LL return time or "Available Now"
  - Current standby wait for comparison (so user sees the time savings)
  - A color-coded badge: green = short wait/available, yellow = moderate, red = long
- **"No LL data" fallback** if the park has no LL info (e.g. water parks)

### 3. Track LL history for gap detection (client-side)
- Store previous LL snapshots in a `useRef` (last 5 refreshes)
- Compare current vs previous: if a ride's LL return time dropped by 15+ minutes, show a "⬇️ DROP" badge on that ride card
- This requires no database or new API — just comparing successive polling results already happening every 60 seconds

### Files Changed
- **`src/pages/LivePark.tsx`** — Add the new tab option, LL tracking ref, and render the Gap Finder UI section (~100-120 lines of new code)

### No New Files or Edge Functions Needed
The `park-live-data` function already returns `llState` per ride. The Gap Finder is purely a new UI view over existing data.

