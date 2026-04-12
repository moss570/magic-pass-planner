

## AP Command Center: Live Blockout Calendar + Layout Reorder

### Issues Found

1. **Calendar is NOT live** — it's fully hardcoded (`blockedDates = [24, 25, 26, 27]`, `today = 3`, fixed "May 2026"). The `pass_tier_blockouts` table exists but has **zero rows**.
2. **No month navigation** — user is stuck on one hardcoded month.
3. **Layout order** — Disney Offers section is below the calendar; needs to swap above it.
4. **"Insider Feed" link** — should read "Social Feed" and link to `/social-feed`.

### Plan

#### 1. Make calendar live with month navigation
- Replace the hardcoded calendar grid with a stateful component that tracks `currentMonth` (Date state).
- Add left/right chevron arrows to navigate months forward and backward.
- On month change, query `pass_tier_blockouts` from Supabase for that month's date range, filtered by the user's pass tier (from `users_profile.ap_pass_tier`).
- Color days based on query results: red = blocked, green = available.
- Highlight today's date with a ring.
- Properly calculate the first day offset for each month (not hardcoded to 5 empty cells).

#### 2. Reorder sections
Move the "Current Disney Offers" section (lines 130-161) **above** the Calendar + Best Days grid (lines 69-127). The new order:
1. Pass Overview (stays)
2. Current Disney Offers (moved up)
3. Calendar + Best Days grid (moved down)
4. AP Discounts, Hotel/Merch Alerts, Stacking Calculator (stay)

#### 3. Fix link text
Change `Insider Feed →` to `Social Feed →` and update `to="/feed"` to `to="/social-feed"`.

#### 4. Seed blockout data consideration
Since the table is empty, the calendar will show all days as available until data is populated. The calendar will gracefully handle empty results. If you want, a follow-up task can seed known blockout dates for common pass tiers.

### Files to edit
- **`src/pages/APCommandCenter.tsx`** — replace hardcoded calendar with live month-navigable version, reorder sections, fix link

### Technical details
- Use `useState<Date>` for current month, compute `startOfMonth`, `endOfMonth`, `getDay()` for offset
- Query: `supabase.from("pass_tier_blockouts").select("blockout_date, is_blocked").eq("park_id", selectedPark).eq("pass_tier", userTier).gte("blockout_date", startStr).lte("blockout_date", endStr)`
- Default `pass_tier` to "incredi-pass" if user has no profile setting
- Month nav: `ChevronLeft`/`ChevronRight` buttons flanking the month label

