

# Enchanting Extras — Isolated Event Alert System

## Overview
Fully isolated event availability monitoring system (Droid Depot, Dessert Parties, etc.) with its own tables, edge functions, and Railway scraper endpoint. Zero changes to existing dining code.

## Plan

### 1. Database Migration — Two New Tables

**`event_alerts`** — mirrors dining_alerts structure:
- id, user_id, event_name, event_url, alert_date, party_size, preferred_time (Any/Morning/Afternoon/Evening)
- alert_email (default true), alert_sms (default false)
- status (watching/found/cancelled/expired)
- priority_launch, window_opens_at (for midnight launch)
- last_checked_at, check_count, availability_found_at, found_times (text[])
- created_at, updated_at
- RLS: `auth.uid() = user_id` for ALL (authenticated)

**`event_notifications`** — mirrors dining_notifications:
- id, alert_id, user_id, event_name, alert_date, party_size, notification_type
- sent_at, delivery_status, delivery_details, retry_count, created_at
- RLS: SELECT only for `auth.uid() = user_id`

### 2. Edge Function: `event-alerts`
CRUD (list/create/cancel) for event alerts. Same auth pattern as `dining-alerts`.

**Midnight Launch Logic**: For alerts 60 days out, `window_opens_at` = **11:59:45 PM ET** the night before (not 6 AM like dining). Sets `priority_launch = true`.

### 3. Edge Function: `event-availability-check`
Isolated poller calling Railway's new `/check-event` endpoint (separate from `/check`).

- **Standard mode**: Checks all watching event alerts (5-min cron)
- **Priority mode**: 1-min cron for midnight launch alerts (11:59:45 PM – 12:15 AM ET window)
- On availability found → insert into `event_notifications` → call `send-notification` with `notification_source: "event"`

The `/check-event` endpoint payload instructs Railway to perform the multi-layer scrape:
```json
{
  "eventUrl": "https://...",
  "date": "2026-06-05",
  "partySize": 2,
  "steps": ["check_available_days", "time_of_day_buttons", "view_more_times", "scrape_pills"]
}
```
The actual Puppeteer implementation of Steps A-D lives on Railway (outside Lovable scope), but this edge function sends the right parameters.

### 4. Modify `send-notification` (minimal, backward-compatible)
Add optional `notification_source` field support:
- When `"event"`: email subject becomes "🎪 Event Alert — [Name] Available!", banner says "EVENT SLOT AVAILABLE!", SMS prefix becomes "🎪 Magic Pass Plus EVENT:"
- When absent or `"dining"`: existing behavior unchanged
- Also support reading from `event_notifications` table when source is event

### 5. Fix Build Errors in `AdminCommandCenter.tsx`
Cast `game_sessions` and `user_messages` queries with `as any` to bypass missing generated types — these tables exist in DB but aren't in the auto-generated types file.

### 6. pg_cron Jobs (via SQL insert)
- `check-event-alerts`: every 5 minutes → `event-availability-check`
- `priority-event-check`: every 1 minute → `event-availability-check` with `{ "priority": true }`

## What is NOT changed
- `dining_alerts` table, `dining-alerts` function, `dining-availability-check` function — all untouched
- Railway `index.js` — untouched (new `/check-event` is a separate Railway-side addition)
- Existing notification delivery logic — preserved, only extended with optional labeling

## Files Created/Modified
- **New migration**: `event_alerts` + `event_notifications` tables with RLS
- **New**: `supabase/functions/event-alerts/index.ts`
- **New**: `supabase/functions/event-availability-check/index.ts`
- **Modified**: `supabase/functions/send-notification/index.ts` (add event labeling)
- **Modified**: `src/pages/AdminCommandCenter.tsx` (fix type errors)

