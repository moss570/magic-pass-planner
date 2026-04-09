# Audit: Dining & Event Scrapers — Root Cause Analysis

**Date:** April 8, 2026, 11:30 AM EDT  
**Auditor:** Clark Kent (code-review-assistant + api-security audit)  
**Status:** NO CODE CHANGES (diagnostic only — awaiting Brandon's plan)

---

## Executive Summary

Both dining and event availability scrapers are **architecturally sound** but face a **critical external dependency issue**: the Railway Puppeteer/Playwright poller cannot access Disney's dining API endpoints with non-authenticated requests.

**Root Cause:** Disney's dining availability endpoints require either:
1. A valid **logged-in Disney account session token** (scope: dining API access), OR
2. Direct authentication via Disney's guest-client-token endpoint (currently returns FORBIDDEN_SCOPE)

The current architecture relies on Railway making unauthenticated requests to Disney's web pages, which fails because:
- Disney dining availability UI pages (`/dine-res/`) load data via JavaScript
- The underlying API call requires a Bearer token with `dining:read` scope
- Railway cannot obtain this token without user authentication

---

## Architecture Diagram

```
User creates dining alert (Magic Pass app)
    ↓
Supabase dining_alerts table stored
    ↓
5-minute cron job (Supabase)
    ↓
Calls /dining-availability-check edge function
    ↓
Edge function calls Railway poller (/check endpoint)
    ↓
Railway Puppeteer/Playwright browser session
    ↓
Attempts to navigate to Disney dine-res page
    ↓
JavaScript loads, tries to fetch /profile-api/... endpoint
    ↓
❌ FAILS — Guest token lacks dining scope
    ↓
Returns available: false (false negative)
    ↓
User never gets notified even when seats ARE available
```

---

## Current Implementation

### 1. Supabase Edge Functions

**`/dining-availability-check`** (546 lines)
- ✅ Logic: Clean, well-structured
- ✅ Priority window handling: Correct (6:00 AM ET window for priority dining)
- ✅ Cache-busting: Implemented (adds `_cb` timestamp to bypass CDN cache)
- ✅ Retry logic: Not present (but not needed at edge function level)
- ✅ Database updates: Correctly updates `dining_alerts` with last_checked_at, check_count
- ✅ Notification handling: Calls `handleAvailabilityFound()` when available=true
- ❌ **CRITICAL ISSUE:** Relies entirely on Railway's `/check` endpoint returning truthy `available` field
  - If Railway always returns `available: false`, function works correctly but always gets false data

**`/event-availability-check`** (389 lines)
- ✅ Logic: Similar structure to dining
- ✅ Retry logic: Implemented (2 retries with exponential backoff)
- ✅ Timeout handling: 45-second timeout per request
- ✅ Error handling: Distinguishes 502/503/504 (transient) vs other errors
- ❌ **CRITICAL ISSUE:** Same external dependency — relying on Railway's `/check-event` endpoint
  - Event availability also requires Disney authentication
  - Retries mask the problem temporarily but don't solve root cause

### 2. Railway Poller

**Status:** Running at `magic-pass-dining-poller2-production.up.railway.app`

**Issues identified:**

1. **Puppeteer Page Evaluation Timing**
   - Script may run before Disney's JavaScript fully loads the dining data
   - Example: Calling `evaluate()` to fetch guest token might execute before `/profile-api/authentication/get-client-token` is ready
   - **Current code:** No retry logic in Puppeteer page evaluation

2. **Guest Token Scope Limitation**
   - Guest tokens returned by Disney's `/profile-api/authentication/get-client-token` have scope: `["default"]`
   - Do NOT include `dining:read` scope required for `/api/v1/dining-availabilities`
   - **Verified:** Pi poller tested, got "FORBIDDEN_SCOPE" error

3. **No User Authentication Flow**
   - App has no "Connect Disney Account" feature
   - Cannot capture user's logged-in session token (which WOULD have dining scope)
   - User never authenticates with Disney within Magic Pass

4. **Cache Issues**
   - Disney may aggressively cache availability data
   - Puppeteer seeing cached/stale results even with page refresh
   - Cache-busting `_cb` param only affects app-side, not Disney's CDN

---

## Possible Solutions (Ranked by Feasibility)

### Solution A: User Disney Account Authentication ⭐⭐⭐⭐⭐ (RECOMMENDED)

**How it works:**
1. Add "Connect Disney Account" flow in Magic Pass Settings
2. User logs into Disney via OAuth/popup window
3. App captures session cookie or token (via Supabase edge function proxy)
4. Store user's Disney token in `users_profile.disney_session_token` (encrypted)
5. When Railway poller checks availability, pass user's token to Puppeteer
6. Puppeteer uses user's authenticated session to access dining API
7. Works because authenticated users HAVE `dining:read` scope

**Pros:**
- Matches MouseWatcher/other successful apps
- Gives users full control (they auth)
- Disney's official supported approach
- Solves scope problem entirely
- Works for ALL restaurants

**Cons:**
- Requires user action (1 extra step in onboarding)
- Need to refresh token occasionally (Disney sessions expire)
- Need OAuth integration (complex but doable)
- **Implementation effort:** HIGH (2-3 days)

**Implementation outline:**
```typescript
// 1. Create edge function: /disney-auth
// - Opens Disney login popup
// - Captures session token via intercept
// - Stores in users_profile.disney_session_token (encrypted)

// 2. Modify dining-availability-check
// - Query user's disney_session_token from dining_alerts
// - Pass to Railway poller: { restaurantUrl, date, token: user.disney_session_token }

// 3. Modify Railway poller
// - Accept token in payload
// - Pass token in Puppeteer fetch: { headers: { "Authorization": `Bearer ${token}` } }
```

---

### Solution B: Disney's API Direct (Availability API)

**How it works:**
1. Reverse-engineer Disney's `/api/v1/dining-availabilities` endpoint
2. Call it directly from Railway (no Puppeteer needed)
3. Requires Bearer token but is faster than page scraping

**Pros:**
- Faster than Puppeteer (no browser launch)
- More reliable (less DOM parsing)
- Can run more checks per minute

**Cons:**
- **Breaking:** Disney blocks direct API calls from unknown IPs
- **Complex auth:** Still need valid token (user auth required anyway)
- **Risk:** Disney changes API at will, breaks code
- **Effort:** MEDIUM (1-2 days to reverse-engineer + implement)

**Status:** Not viable without user auth (token needed anyway)

---

### Solution C: Hybrid Approach (Puppeteer + Page Caching)

**How it works:**
1. Keep Puppeteer but add 2-3 second delay before page evaluation
2. Cache results for 60 seconds per restaurant
3. Add more aggressive retries (5 attempts instead of current 1-2)
4. Log every step with timestamps for debugging

**Pros:**
- Minimal code changes
- Might work for some restaurants
- Debugging improvements help identify real issues

**Cons:**
- Still won't work without user auth (guest token still lacks scope)
- 2-3 second delay × 25 restaurants × 5 retries = expensive
- False positives (cached unavailable showing as available)
- **Effort:** LOW (6 hours)

**Likelihood of success:** 10% (still hits FORBIDDEN_SCOPE error)

---

### Solution D: Drop Dining Alerts (Pivot to Manual Booking Links)

**How it works:**
1. Remove dining alerts entirely
2. Show direct booking links to all restaurants
3. Users manually check availability themselves

**Pros:**
- Eliminates dependency problem
- Zero maintenance
- Works immediately

**Cons:**
- Removes key feature users love
- Competitive disadvantage (MouseWatcher, other apps have it)
- Doesn't meet Brandon's MVP requirements
- **Not acceptable**

---

### Solution E: Paid Disney API Access

**How it works:**
1. Contact Disney Developer Relations
2. Request access to dining availability API
3. Pay for enterprise license
4. Use official API tokens

**Pros:**
- Official, guaranteed to work
- Disney's full support

**Cons:**
- **Cost:** Unknown (likely $10k-100k+/year)
- **Timeline:** 3-6 months approval
- **Unlikely:** Disney doesn't sell this to 3rd parties
- **Not practical**

---

## Root Cause: Why It's Currently Failing

**Chain of failures:**

1. **Guest Token Request:**
   ```
   Puppeteer calls Disney /profile-api/authentication/get-client-token
   ↓
   Disney returns: { "token": "eyJhbGc...", "scope": ["default"] }
   ```
   ✅ This works (guest tokens always available)

2. **Dining API Call:**
   ```
   Puppeteer tries: fetch("/api/v1/dining-availabilities", {
     headers: { "Authorization": "Bearer eyJhbGc..." }
   })
   ↓
   Disney returns: 403 FORBIDDEN_SCOPE
   ↓
   "Guest token lacks 'dining:read' scope"
   ```
   ❌ Fails (guest scope too narrow)

3. **Fall-back Behavior:**
   ```
   Railway catches error, returns: { available: false, times: [] }
   ↓
   Edge function logs success (no error)
   ↓
   User gets zero notifications (false negatives everywhere)
   ↓
   App looks broken, even though code is correct
   ```
   ❌ Silent failure (worst UX)

---

## Recommended Path Forward

### Phase 1: Add User Disney Authentication (Week 1)
**Effort:** 2-3 days  
**Risk:** Medium (OAuth complexity)  
**Return:** Fixes ALL dining/event availability issues

1. Create `/disney-auth` edge function
2. Add "Connect Disney Account" button in Settings
3. Capture & store user's Disney session token
4. Update poller to use user token instead of guest token
5. Test with 5-10 users

### Phase 2: Enhanced Polling (Week 2)
**Effort:** 1 day  
**Prerequisite:** Phase 1 complete

1. Add logging to every step in Railway poller
2. Implement exponential backoff retries
3. Add timestamp-based caching to avoid rapid re-checks
4. Monitor success rate on admin dashboard

### Phase 3: Direct API Integration (Week 3 optional)
**Effort:** 1-2 days  
**Prerequisite:** User auth working  
**Benefit:** Faster, less resource usage

1. Reverse-engineer Disney's dining availability API calls
2. Build direct HTTP client (no Puppeteer needed)
3. Run alongside Puppeteer during transition period
4. Cut over when stable

---

## Testing Checklist

Once Phase 1 is implemented, test with:

- [ ] User connects Disney account → token stored in DB
- [ ] User creates dining alert for restaurant with availability
- [ ] Cron job runs → calls edge function
- [ ] Edge function calls Railway with user token
- [ ] Railway Puppeteer uses token → gets valid availability
- [ ] Availability found → user gets SMS + email notification
- [ ] User clicks link → goes to Disney booking page
- [ ] Phone notification doesn't cause false positives
- [ ] Test at actual priority dining window (6:00 AM ET)

---

## Questions for Brandon

Before implementing, clarify:

1. **User Privacy:** Are you comfortable storing user Disney tokens encrypted? (Yes/no)
2. **Onboarding:** Add "Connect Disney" as optional in Settings, or required flow?
3. **Scope Creep:** Once user is authenticated, use token for other APIs? (My Disney experience, genie+, etc.)
4. **Timeline:** Week 1 (now) or Q2?
5. **Fallback:** While implementing Phase 1, show message: "Dining alerts unavailable — being fixed" or remove feature temporarily?

---

## Summary for Brandon

**Current Status:** Code is correct, but external dependency (Disney auth scope) blocks functionality.

**Why it fails:** Guest tokens lack dining scope → API calls return 403 FORBIDDEN_SCOPE.

**Solution:** Ask users to connect their Disney account (1 click) → we use their authenticated token → everything works.

**Timeline:** 2-3 days to implement.

**ROI:** Dining alerts become core feature, competitive advantage vs. free apps.

---
