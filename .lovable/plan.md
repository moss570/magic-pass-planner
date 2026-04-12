

## Master User Management Screen for Admin Console

### Summary
Add a new "Users" tab/page to the Admin Console that provides a searchable, sortable table of all users with key metrics, plus actions to manage their accounts.

### What the Admin Will See

A full-width data table with these columns:
- **User** (email, name, avatar)
- **Membership Tier** (plan_name from subscriptions)
- **Status** (active, trialing, canceled, none)
- **Billing Interval** (monthly/annual/one_time)
- **Lifetime Revenue** (computed from Stripe invoices paid, or estimated from subscription history)
- **Last Active** (updated_at from users_profile or last subscription activity)
- **Active Alerts** (count of dining + event + hotel + airfare alerts in "watching" status)
- **Actions**: Upgrade/Downgrade dropdown, Delete Account button, View Errors button

**Search**: Filter by email, name, or plan name
**Sort**: Click column headers to sort by any column
**Filters**: Dropdown chips for tier and status

### Actions per User

1. **Upgrade/Downgrade** -- A select dropdown showing all plan tiers. On change, calls an edge function that updates the `subscriptions` table directly (admin override, not Stripe-driven). For Stripe-managed subs, updates the Stripe subscription via the existing `update_subscription` tool pattern.

2. **Delete All Data** -- Calls an edge function (`admin-user-manage`) that cascades deletes across: `dining_alerts`, `event_alerts`, `hotel_alerts`, `airfare_alerts`, `ap_hotel_alerts`, `ap_merch_alerts`, `saved_trips`, `trip_versions`, `social_posts`, `messages`, `game_sessions`, `reservations_inbox`, `gift_card_alerts`, `users_profile`, and `subscriptions`. Requires confirmation dialog.

3. **View Errors** -- Opens a drawer/modal that queries `dining_notifications` and `event_notifications` for that user where `delivery_status = 'failed'`, plus any edge function logs if available.

### Files

1. **New edge function**: `supabase/functions/admin-user-manage/index.ts`
   - Actions: `list-users`, `delete-user-data`, `update-tier`, `user-errors`
   - `list-users`: Joins `users_profile` with `subscriptions` and counts alerts across all alert tables
   - `delete-user-data`: Cascading delete from all user-owned tables
   - `update-tier`: Upserts `subscriptions` row with new plan_name/status
   - `user-errors`: Queries failed notifications for the user
   - Admin-only auth check (same email list)

2. **New component**: `src/components/admin/UserManager.tsx`
   - Renders the searchable/sortable table
   - Upgrade/downgrade select per row
   - Delete confirmation dialog (AlertDialog)
   - Error viewer drawer

3. **New page**: `src/pages/admin/UserManager.tsx`
   - Wrapper with admin auth guard, renders `UserManager` component

4. **Edit**: `src/App.tsx` -- Add route `/admin/users`
5. **Edit**: `src/pages/Admin.tsx` -- Add "👥 Users" nav link in header

### Technical Details

- The edge function uses `SUPABASE_SERVICE_ROLE_KEY` to query across all users (bypassing RLS)
- Alert counts use `COUNT(*)` with `status = 'watching'` across dining_alerts, event_alerts, hotel_alerts, airfare_alerts
- Lifetime revenue is estimated from subscription duration and plan price (exact Stripe revenue would require API calls per user which is too slow for a list view)
- Last active date uses `users_profile.created_at` as baseline, with `subscriptions.updated_at` as a proxy for recent activity
- Delete action does NOT delete the auth.users row (that requires Supabase dashboard); it only purges application data
- Pagination: initial load of 100 users, with "Load More" button

