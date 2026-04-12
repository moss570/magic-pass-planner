

## Add "Pause" Functionality to All Alert Types

### Problem
The FAQ promises users can pause alerts, but no pause button or status exists anywhere in the alert system.

### What needs to happen

1. **Add `paused` status** to all alert types (Dining, Event, Hotel, Airfare) — update the status union type in each alert page and the edge functions that process them.

2. **Add Pause/Resume button** to each alert card on:
   - `src/pages/DiningAlerts.tsx`
   - `src/pages/EventAlerts.tsx`
   - `src/pages/HotelAlerts.tsx`
   - `src/pages/AirfareTracker.tsx`

3. **Edge function updates** — each alert's polling/check edge function must skip alerts with `status = 'paused'`:
   - `supabase/functions/dining-availability-check/index.ts`
   - `supabase/functions/event-availability-check/index.ts`
   - `supabase/functions/hotel-price-check/index.ts`
   - `supabase/functions/airfare-price-check/index.ts`

4. **Exclude paused from active count** — update `useAlertLimitGuard` and the counting logic in each page so `paused` alerts don't count toward the limit (matching what the FAQ promises).

5. **Database migration** — if alert status is stored as an enum, add `paused` to it. If stored as text, no migration needed.

6. **UI behavior**: Pause button (⏸) on watching/found alerts. Resume button (▶) on paused alerts. Paused cards get a muted/dimmed visual treatment.

### Files to create/edit
- **Edit**: `src/pages/DiningAlerts.tsx` — add pause/resume button, add `paused` to status type, exclude from active count
- **Edit**: `src/pages/EventAlerts.tsx` — same
- **Edit**: `src/pages/HotelAlerts.tsx` — same
- **Edit**: `src/pages/AirfareTracker.tsx` — same
- **Edit**: `supabase/functions/dining-availability-check/index.ts` — skip paused
- **Edit**: `supabase/functions/event-availability-check/index.ts` — skip paused
- **Edit**: `supabase/functions/hotel-price-check/index.ts` — skip paused
- **Edit**: `supabase/functions/airfare-price-check/index.ts` — skip paused
- **Migration** (if needed): Add `paused` to any status enum columns

### Technical notes
- Pause/resume is a simple PATCH to the existing alert edge function, setting `status = 'paused'` or `status = 'watching'`
- Active count filters: `alerts.filter(a => a.status === 'watching').length` (already excludes paused)
- Paused alerts appear in a "Paused" tab or grouped under the existing tabs with a visual indicator

