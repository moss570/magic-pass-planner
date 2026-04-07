

# Enchanting Extras Scraping Strategy

## The Core Problem

The event URLs in the database span **6+ different Disney page templates**:

```text
/experiences/...    (Droid Depot, Savi's Workshop)
/events-tours/...   (Bibbidi Bobbidi, Starlight Safari)
/dining/...         (Savor the Savanna, Dessert Cruises)
/recreation/...     (Fishing, Pirate Cruises, Surf)
/entertainment/...  (Campfire Sing-A-Long, Drawn to Life)
/shops/...          (Harmony Barber Shop)
/attractions/...    (NBA Experience)
```

Each template may have a completely different DOM structure for availability -- or no availability check at all (some are walk-up only). The `/check-event` endpoint we added to your Railway poller was written speculatively and has never been tested against real Disney pages.

## Recommendation: Keep One Railway Instance, But Diagnose First

A separate Railway instance is **not needed**. The existing poller already isolates event logic into `/check-event` (separate from `/check`). The isolation requirement is met. What we actually need is:

### Phase 1 -- Diagnose Real Event Pages

Add a `/diagnose-event` endpoint to the existing Railway poller (similar to the existing `/diagnose` for dining). This would visit each event URL and report back what DOM elements exist: datepickers, "Check Availability" buttons, time slots, booking CTAs, etc.

Then run it against all 20+ event URLs to categorize them into scraping "profiles":
- **Profile A**: Has a `wdpr-datepicker` + time pills (like dining) -- reuse calendar navigation logic
- **Profile B**: Has a "Check Availability" button that opens a modal/widget
- **Profile C**: Has a "Book Now" link that goes to an external booking page
- **Profile D**: No online booking -- walk-up or phone only (skip these)

### Phase 2 -- Build Profile-Specific Scrapers in `/check-event`

Update `/check-event` with branching logic based on what DOM elements are found on the page. The multi-step flow (check_available_days -> time_of_day_buttons -> view_more_times -> scrape_pills) would be one profile. Other profiles might just need to detect a "Sold Out" vs "Book Now" state.

### Phase 3 -- Flag Non-Scrapable Events in the DB

Add a `scrapable` boolean to the `events` table. After diagnosis, mark events that have no online booking flow as `scrapable = false` so the UI can show "Walk-up only" and hide the alert button.

## Files Changed

- **Railway `index.js`**: Add `/diagnose-event` endpoint, refine `/check-event` with profile branching
- **Migration**: Add `scrapable` column to `events` table
- **`src/pages/EventAlerts.tsx`**: Hide alert creation for non-scrapable events
- **`event-availability-check/index.ts`**: Skip non-scrapable events

## What Stays Untouched
- All dining code (`/check`, `/diagnose`, `dining-alerts`, `dining-availability-check`)
- Existing Railway `/batch-test` endpoint

