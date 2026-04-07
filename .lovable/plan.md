

## Plan: Add Diagnostic Mode & Batch Restaurant Testing

### Problem
The poller works for Chef Mickey's but fails silently for other restaurants (like Citricos) because Disney uses different page templates/DOM structures across restaurant categories. We need to identify exactly what differs and make the scraper resilient to all templates.

### Approach

**Step 1: Add `/diagnose` endpoint to Railway poller (`index.js`)**

A new endpoint that visits a restaurant's `/dining/` page and returns a detailed report of what it "sees" — without trying to extract availability. This tells us exactly which selectors match and which don't for each restaurant.

Returns:
- Page title, URL after redirects
- Whether datepicker was found and which selector matched
- Whether meal periods were found and which selector matched  
- Whether calendar month/year headings were found
- Whether day cells exist
- Raw text snippets from relevant page sections
- Any block/login/captcha detection triggered

**Step 2: Add `/batch-test` endpoint to Railway poller**

Accepts an array of restaurant URLs and runs `/diagnose` on each (with delays between). Returns a summary report showing which restaurants' pages have matching selectors vs which don't.

**Step 3: Update edge function with a `diagnose` mode**

Add a `diagnose: true` flag to the edge function's test mode that passes through to the poller's `/diagnose` endpoint, so we can trigger diagnostics from Supabase without needing direct Railway access.

**Step 4: Run batch diagnosis against all 73 restaurants**

Execute the batch test and categorize results:
- **Working**: datepicker + meal periods found (like Chef Mickey's)
- **Partial**: some selectors match but not all
- **Failed**: no selectors match — needs new selectors

**Step 5: Update poller selectors to handle all template variants**

Based on the diagnostic results, add fallback selectors for each template variant so the poller works across all restaurant types.

### Technical Details

**New `/diagnose` endpoint response shape:**
```json
{
  "url": "...",
  "title": "...",
  "blocked": false,
  "datepicker": { "found": true, "selector": "wdpr-datepicker", "state": "visible" },
  "mealPeriods": { "found": true, "count": 3, "texts": ["Breakfast...", "Lunch...", "Dinner..."] },
  "calendar": { "monthTitle": "April 2026", "nextButton": true, "dayCells": 30 },
  "rawSnippets": { "bodyLength": 45000, "first500chars": "..." }
}
```

**Edge function changes** (`dining-availability-check/index.ts`):
- Add handling for `body.diagnose === true` that calls `/diagnose` on Railway instead of `/check`
- Add handling for `body.batch_diagnose` with array of URLs

**Files modified:**
1. Railway `index.js` — add `/diagnose` and `/batch-test` endpoints
2. `supabase/functions/dining-availability-check/index.ts` — add diagnose pass-through

### What You Need To Do
- Update the Railway `index.js` with the new endpoints (I'll provide the exact code)
- I'll update and deploy the edge function
- Then we run the batch test and fix any selector gaps

