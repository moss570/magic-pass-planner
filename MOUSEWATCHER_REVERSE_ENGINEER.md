# MouseWatcher Reverse Engineering — Network Analysis

**Date:** April 8, 2026, 5:55 PM EDT  
**Analyzed:** 7 Network tab screenshots from MouseWatcher alert creation  
**Status:** CRITICAL FINDINGS

---

## Key Discovery: MouseWatcher Uses a Proprietary Backend

**URL Pattern:** `mousewatcher.com/order-confirmation?id=0008phd9`

**Flow:**
1. User fills form (The Plaza Restaurant, May 31 Dinner for 2)
2. User clicks "Checkout →" button
3. Payment processed ($15 for 64-day alert)
4. **Transaction ID generated:** `0008phd9`
5. User lands on `/order-confirmation` page
6. Page shows: "Thanks for your order! You'll receive instant notifications..."

---

## Network Calls Analysis

Looking at the Network tab screenshots, I see:

**Outbound Requests (left sidebar shows 118 requests, 12.5 MB transferred):**

1. **POST to `/order-confirmation?id=0008phd9`** (302 Redirect)
   - Status: 302 (redirect)
   - Type: Document/Redirect
   - This is the checkout submission

2. **GET `/order-confirmation?id=0008phd9`** (200 OK)
   - Status: 200
   - Type: Document
   - Size: 1.2 MB
   - Time: ~142 ms
   - **This loads the confirmation page**

3. **Multiple fetch() calls** (all 200 OK):
   - `collect?utm_utm...` (Facebook pixel)
   - `facebook_ads_events` 
   - Various tracking pixels

---

## Critical Finding: No Direct Disney API Calls Visible

**Important observation:**
MouseWatcher's frontend does NOT make direct calls to Disney's API from the browser.

Instead:
- ✅ User pays MouseWatcher ($15)
- ✅ Alert stored in MouseWatcher's database
- ✅ MouseWatcher's **backend service** checks Disney availability (not shown in browser Network tab)
- ✅ When availability found, MouseWatcher sends SMS/email notification

---

## How MouseWatcher Actually Works (Inferred)

### Backend Flow (Hidden from Browser):

```
1. Alert stored: mousewatcher.com/alerts/{id}
   - Restaurant: "The Plaza Restaurant" 
   - Date: "2026-05-31"
   - MealPeriod: "Dinner"
   - PartySize: 2
   - UserId: {user_id}
   - Email: moss570@gmail.com
   - Phone: (407) 375-2921

2. MouseWatcher's cron job (probably every 5-15 minutes):
   - Query all active alerts from DB
   - For each alert:
     - Call Disney dining availability API
     - Parse response
     - If available: send SMS + email to user
     - Update alert status: "FOUND" or "NOTIFIED"

3. Key question: How do they call Disney's API?
   - Option A: They have a partnership/whitelist with Disney
   - Option B: They use a shared Disney guest token
   - Option C: They have a clever workaround we haven't discovered
   - Option D: They scrape the webpage with Puppeteer (like us)
```

---

## What MouseWatcher Frontend Does NOT Show

The Network tab shows NO:
- ❌ Authorization bearer tokens (no Disney auth)
- ❌ Calls to `api.disneyworld.com` 
- ❌ Calls to `/api/v1/dining-availabilities`
- ❌ Any Disney API endpoints
- ❌ WebSocket connections to real-time data

All of that happens on their **backend**, not in the browser.

---

## What We CAN Deduce

**MouseWatcher's architecture:**
```
┌─────────────────────────────────────────────────────┐
│                    MouseWatcher                      │
├─────────────────────────────────────────────────────┤
│ Frontend (mousewatcher.com)                          │
│  - Form submission → /order-confirmation endpoint    │
│  - User sees confirmation page                       │
│  - No Disney API calls visible                       │
├─────────────────────────────────────────────────────┤
│ Backend (hidden from browser)                        │
│  - Cron job checks Disney API every 5-15 min        │
│  - Uses some method to bypass guest token scope      │
│  - Sends SMS/email when availability found          │
│  - Updates alert status in database                  │
├─────────────────────────────────────────────────────┤
│ Database                                             │
│  - Alerts table (one row per user alert)            │
│  - Transactions table (payment history)             │
│  - Notifications table (SMS/email sent log)         │
└─────────────────────────────────────────────────────┘
```

---

## Next Steps to Discover Their Secret

To reverse-engineer how MouseWatcher actually hits Disney's API, we need:

### Option 1: Intercept Their Backend Requests
- Set up a proxy (like Burp Suite) on your phone/computer
- Log into MouseWatcher app (if they have one)
- Trigger an alert check manually
- Capture what API calls their backend makes to Disney
- **Problem:** They might be SSL-pinned (hard to intercept)

### Option 2: Check Their Server Headers / CORS
- Look at the API response headers
- See if there's a `X-Powered-By` or version info
- Check if they proxy requests through their own domain

### Option 3: Look at Public Documentation
- MouseWatcher might have a public API
- Check their GitHub or API docs

### Option 4: Contact MouseWatcher Directly
- Email: support@mousewatcher.com
- Ask: "How do you access Disney's API without requiring user login?"
- They might be open about their approach

---

## What This Means for Magic Pass

**Bad news:** We can't tell from the browser Network tab alone.

**Good news:** The answer is almost certainly one of these:
1. **Paid Disney API access** (cost: unknown, probably $$$)
2. **Partnership/whitelist** (cost: relationship with Disney)
3. **Token refresh loop** (clever JavaScript trick we're missing)
4. **Puppeteer-based scraping** (exactly like us, but they hide it on backend)

**Most likely:** They're doing exactly what we're doing (Railway Puppeteer) but on their backend servers, not exposing it to the browser.

---

## Recommendation for Brandon

### Path 1: Call MouseWatcher (Fastest)
Email them: "How do you get dining availability without user Disney login?"
- If they say "partnership": We need our own partnership
- If they say "API": We need to find it
- If they say "Puppeteer": We're doing it right, just need to debug our Railway poller

### Path 2: Implement Solution A (User Auth)
Still the most reliable:
- User connects Disney account (1 click)
- We use their token
- No mystery dependencies
- We control the experience

### Path 3: Keep Digging
- Set up Burp Suite proxy
- Try to intercept MouseWatcher backend requests
- Reverse-engineer their exact method

---

## Summary

MouseWatcher's frontend doesn't reveal how they access Disney's API because **they handle it server-side**. The answer is hidden from the browser Network tab.

Next step: Contact them or set up a proxy to see their backend calls.

