

## Alert Confirmation Email + Keyword Alert Audit

### Summary
Add a branded confirmation email sent via Brevo when users create any alert (dining, event, hotel, airfare). The email includes a thank-you, remaining alert count, upgrade CTA, and a rotating feature spotlight. Also audit the Keyword Alert system in the AP Command Center.

### Keyword Alert Audit Findings
The keyword alert in `MerchDropAlertsSection.tsx` creates records in `ap_merch_alerts` with a `keywords` array. The polling function `ap-merch-alert-check` correctly matches new drops against those keywords and sends notifications via `send-notification`. **However**, the edge function has no logs — meaning either no active keyword alerts exist, or the cron job that calls it is not scheduled. This needs verification and potentially a pg_cron job to be created.

### Plan

#### 1. Create `send-alert-confirmation` edge function
A new edge function that sends a branded Brevo email when called. It accepts:
- `user_id`, `alert_type` (dining/event/hotel/airfare), `alert_details` (name, date, etc.)
- Looks up user email, current plan, and active alert counts
- Computes remaining alerts based on plan limits from the PLAN_ACCESS matrix
- Selects a rotating feature spotlight (cycle through top-tier features like Lightning Lane Gap Finder, Golden Hour Planner, AP Discount Database, etc.)
- Sends a branded HTML email via Brevo with:
  - Thank-you header with plan name
  - Alert details (what they're watching)
  - "You have X of Y alerts remaining" or "Unlimited alerts" for Plus/Founders
  - Upgrade section showing next tier's limits (hidden for unlimited plans)
  - Feature Spotlight section promoting a different top-tier feature each time

#### 2. Add client-side calls after alert creation
After each successful alert creation (without modifying the edge functions that handle dining/event alerts), add a fire-and-forget call to `send-alert-confirmation` in:
- `src/pages/DiningAlerts.tsx` — after `handleCreateAlert` succeeds
- `src/pages/EventAlerts.tsx` — after `handleCreateAlert` succeeds  
- `src/pages/HotelAlerts.tsx` — after `createAlert` succeeds
- `src/pages/AirfareTracker.tsx` — after alert creation succeeds

These calls are fire-and-forget (no error handling needed — the alert was already created successfully).

#### 3. Verify Keyword Alert cron job
Check whether `ap-merch-alert-check` has a pg_cron schedule. If not, create one (e.g., every 15 minutes). This is independent of the dining/event alert systems per the isolation constraint.

### Files to create/edit
- **Create** `supabase/functions/send-alert-confirmation/index.ts` — new edge function using Brevo API
- **Edit** `src/pages/DiningAlerts.tsx` — add confirmation email call after line 172
- **Edit** `src/pages/EventAlerts.tsx` — add confirmation email call after alert creation
- **Edit** `src/pages/HotelAlerts.tsx` — add confirmation email call after alert creation
- **Edit** `src/pages/AirfareTracker.tsx` — add confirmation email call after alert creation
- **Possibly** database migration for pg_cron job for keyword alerts

### Email Template Design
Dark theme matching existing notification emails:
- Header: "🏰 Magic Pass Plus" gold banner
- "Alert Created!" green confirmation banner
- Alert details card (type, name, date, etc.)
- "Alerts Remaining" section with usage bar
- Upgrade CTA (if not on unlimited plan): "Upgrade to Magic Pass Plus for unlimited alerts →" linking to `/pricing`
- Feature Spotlight: rotating highlight of a premium feature with description and link

### Technical Notes
- Uses existing `BREVO_API_KEY` secret (already configured)
- Plan limits sourced by querying `subscriptions` table and hardcoding the same PLAN_ACCESS limits
- Feature spotlight rotates based on `day of year % feature_count` for variety
- No changes to dining-alerts, event-alerts, or hotel-alerts edge functions (per constraint)

