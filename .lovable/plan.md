

## What Changed and When

### Timeline of Changes

**1:46 AM** — Chef Mickey's found availability successfully. The poller received the original `/dining/contemporary-resort/chef-mickeys/` URL and returned `available: true` with 4 time slots. Everything was working.

**1:46 AM (message #342)** — You asked to fix notifications + add instant checks. I edited three files:
- `dining-alerts/index.ts` — added instant first check on alert creation
- `send-notification/index.ts` — added email/SMS preference checks
- `dining-availability-check/index.ts` — added instant check handler (`instant_alert_id` support)

**1:52 AM (message #344)** — You reported SMS not delivering and booking URL not deep-linking. I edited:
- `send-notification/index.ts` — added phone normalization to E.164
- `dining-availability-check/index.ts` — added `buildBookingUrl()` that constructs `/dine-res/restaurant/{slug}/` URLs **for notification links only** (not for scraping)

**2:03 AM (message #346)** — You reported the date URL didn't work. I edited:
- `dining-availability-check/index.ts` — simplified `buildBookingUrl()` to drop query params. Still only affected notification links.

**9:07 AM** — Chef Mickey's was checked again and STILL found availability using the original `/dining/` URL. **The scraper was still working at this point.**

**9:05 AM** — Tiffins checked 221 times, all returning `available: false`. The poller was receiving `/dining/animal-kingdom/tiffins-restaurant/` — the original URL.

**9:16 AM (message #360)** — **THE BREAKING CHANGE.** I added `buildScrapingUrl()` which transforms ALL URLs sent to the poller from `/dining/` to `/dine-res/restaurant/{slug}/`. This broke scraping because `/dine-res/` requires Disney login.

### Root Cause

The `/dining/` info pages were NOT all broken. Chef Mickey's `/dining/` page was working fine at 9:07 AM. I incorrectly concluded all `/dining/` pages were 404 and deployed a change that redirected the poller to `/dine-res/` pages (which require login).

The Tiffins issue was likely a **different problem** — either the specific `/dining/animal-kingdom/tiffins-restaurant/` page has different DOM structure, or the datepicker selectors don't work on that particular page. The poller wasn't returning errors (no "blocked" or "no-dialog") — it was returning `available: false`, meaning it loaded the page but found no availability slots. This could be a selector issue specific to that page, not a global URL problem.

### The Fix

1. **Revert `buildScrapingUrl`** — Remove the URL transformation that sends `/dine-res/` URLs to the poller. Go back to sending the original `/dining/` URLs from the database, which is what was working for Chef Mickey's.

2. **Keep `buildBookingUrl`** — The notification "Book Now" links should still point to `/dine-res/restaurant/{slug}/` since that's the actual reservation flow for users (who are logged in).

3. **Investigate Tiffins specifically** — After reverting, test both Chef Mickey's and Tiffins to see if Chef Mickey's works again and whether Tiffins has a page-specific issue vs. a genuine "no availability" result.

### Technical Details

**File**: `supabase/functions/dining-availability-check/index.ts`

- Remove `buildScrapingUrl()` function (lines 31-39)
- In `checkAvailability()`, stop calling `buildScrapingUrl()` and pass the original `restaurantUrl` directly to the poller
- Keep `buildBookingUrl()` for notification links
- Redeploy the edge function

