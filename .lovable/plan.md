

## Rewrite Dining Availability Check to Use Railway Puppeteer Poller

### Overview
Replace the current direct-fetch approach (blocked by Akamai) with a two-part architecture: a **Railway-hosted Puppeteer service** that scrapes Disney's dining pages, and the existing **Supabase Edge Function** that calls it.

### Architecture

```text
pg_cron (every 5 min)
  └─► dining-availability-check (Edge Function)
        └─► POST https://your-railway-app.up.railway.app/check
              └─► Puppeteer on Railway
                    └─► Loads disneyworld.disney.go.com/dine-res/availability/
                    └─► Fills in date, party size, restaurant
                    └─► Extracts available time slots
                    └─► Returns JSON { available, times, bookingUrls }
```

### What Gets Built

**1. Railway Puppeteer Service** (`/mnt/documents/railway-dining-poller/`)
- A standalone Node.js + Puppeteer project deployable to Railway
- Single `POST /check` endpoint accepting `{ restaurantUrl, date, partySize, mealPeriod }`
- Uses `puppeteer-core` with Chromium (Railway supports this via their Docker buildpack)
- Navigates to the restaurant's Disney booking page, fills the form, waits for results, scrapes available times
- Returns `{ available: boolean, times: string[], bookingUrls: string[] }`
- Includes `GET /health` for uptime monitoring
- Secured with a shared `API_KEY` header so only your Edge Function can call it

**2. Update `dining-availability-check` Edge Function**
- Remove all Akamai PoW code and direct Disney fetch logic
- Replace `checkAvailability()` with a single `fetch()` call to the Railway service
- Pass the restaurant's `disney_url`, date, party size, and meal period
- Parse the response and continue with existing notification logic (unchanged)
- Add a new secret `RAILWAY_POLLER_URL` and `RAILWAY_POLLER_API_KEY`

### Files Changed
1. `supabase/functions/dining-availability-check/index.ts` — Rewrite `checkAvailability()` and remove `getDisneySession()`/`solvePoWChallenge()`
2. `/mnt/documents/railway-dining-poller/` — New standalone project (package.json, index.js, Dockerfile) for the user to deploy to Railway

### Secrets Needed
- `RAILWAY_POLLER_URL` — The Railway service URL (e.g., `https://dining-poller-production.up.railway.app`)
- `RAILWAY_POLLER_API_KEY` — Shared secret for authenticating requests

### Deployment Steps (User)
1. Push the Railway poller project to a GitHub repo
2. Connect it to Railway, set `API_KEY` env var
3. Copy the Railway URL and set it as `RAILWAY_POLLER_URL` in Supabase Edge Function secrets
4. Set `RAILWAY_POLLER_API_KEY` to match the Railway `API_KEY`
5. Edge function auto-deploys; pg_cron picks up the new logic automatically

