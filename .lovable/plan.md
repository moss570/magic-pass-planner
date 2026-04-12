

## Settings Page Audit and Updates

### Issues Found

1. **My Subscription section** — outdated tier names ("Magic Pass", "AP Command Center+"), non-functional buttons (Upgrade, Manage Billing, Cancel Subscription are all dead buttons with no onClick handlers), feature comparison table uses old 2-tier model instead of current 6-tier model.

2. **SMS "Upgrade to enable"** — hardcoded to show when SMS is off, regardless of plan. Not tied to any tier check. Should be removed since SMS is available to all tiers (it just requires a phone number).

3. **Walking Speed Calibrator** — gated behind `isFeatureEnabled("budgetUpgrades")` feature flag. Need to verify if that flag is enabled.

4. **Refer a Friend** — entirely static/mockup. Referral link is hardcoded ("brandon-moss-x7k2"), sharing buttons have no onClick handlers, stats are hardcoded to 0. No referral backend exists. Free months via Stripe would require modifying the subscription's `billing_cycle_anchor` or adding trial days via the Stripe API.

5. **Disney Account section** — needs to be removed entirely per your request.

6. **Data & Privacy** — "Request Export" and "Delete Account" buttons have no onClick handlers. Privacy Policy and Terms of Service links are `<button>` elements with no routing.

7. **Cancel Subscription** — button has no handler. Needs a downgrade prompt before full cancellation.

### Plan

#### 1. Rebuild "My Subscription" section
- Show the user's actual plan name from `useSubscription()` (already available)
- Replace the 2-column feature table with a contextual upgrade prompt showing the next tier up and its key benefits
- **Upgrade button**: Link to `/pricing` page (where checkout already works)
- **Manage Billing button**: Call the existing `customer-portal` edge function (if it exists) or Stripe Customer Portal via a new edge function
- **Cancel Subscription button**: Open a confirmation dialog that first offers a downgrade (shows cheaper plan options), and only on second confirmation calls Stripe to cancel

#### 2. Remove SMS "Upgrade to enable" badge
- Remove the conditional badge on the SMS toggle — SMS availability is not tier-gated

#### 3. Check Walking Speed feature flag
- Verify `budgetUpgrades` flag state; if disabled, enable it or remove the gate

#### 4. Refer a Friend — mark as "Coming Soon" or remove
- Since there's no referral backend, no referral tracking table, and no Stripe integration for free months, this section should either be hidden or show a "Coming Soon" state. Building the full referral system (unique codes, tracking table, Stripe subscription modification) is a separate project.

#### 5. Remove Disney Account section
- Delete the `DisneyConnectSection` component and the card that renders it

#### 6. Wire up Data & Privacy
- **Request Export**: Trigger a toast confirming the request has been submitted (or generate a JSON export of the user's profile data)
- **Delete Account**: Open a confirmation dialog, then call `supabase.auth.admin.deleteUser()` via an edge function, sign out, and redirect to the home page. Explain the difference from Cancel Subscription (cancel keeps the account but stops billing; delete removes all data permanently).
- **Privacy Policy / Terms links**: Change from `<button>` to `<Link to="/privacy-policy">` and `<Link to="/terms">`

#### 7. Cancel vs Delete distinction
- Cancel Subscription: Stops billing at period end, keeps account and data
- Delete Account: Permanently removes all user data and auth record

### Files to edit
- **`src/pages/Settings.tsx`** — all changes above (rebuild subscription section, remove Disney Account, wire up buttons, fix links, add cancel/downgrade dialog)
- **`src/lib/featureFlags.ts`** — verify/enable `budgetUpgrades` flag
- Possibly **create edge function** `customer-portal` if it doesn't exist, for Manage Billing
- Possibly **create edge function** for account deletion

### Technical notes
- Stripe cancellation: use `stripe.subscriptions.update(subId, { cancel_at_period_end: true })` via edge function
- Stripe downgrade: redirect to `/pricing` where checkout handles plan changes
- Account deletion edge function: uses service role to delete from `users_profile`, `saved_trips`, alerts tables, then `supabase.auth.admin.deleteUser()`
- Referral system deferred — no backend exists and building one (unique codes, tracking, Stripe billing date modification) is out of scope for this update

