

## Fix User Management Tiers, VIP Visibility, and Add Beta Tester Support

### Problems Found

1. **Outdated tier names** in UserManager dropdown — still shows "Pre-Trip Planner", "Magic Pass", "AP Command Center", "AP Command Center PLUS" instead of the current 6-tier model.
2. **Andi Davidoff-Moss IS a VIP** in the `vip_accounts` table (status: "invited"), but her `user_id` is not linked (null), and she has no subscription record. The UserManager doesn't show VIP status at all.
3. **VIP invite function** creates subscriptions with `plan_name: "Magic Pass"` (legacy name) instead of `magic_pass_plus` — which is what VIP Free Forever should map to (full access).
4. **Beta testers need** — you want to grant 1-year free access without requiring a credit card. The VIP system is close but needs a "beta_tester" variant with a 1-year expiration instead of "free forever".

### Plan

#### 1. Update PLAN_OPTIONS in UserManager (lines 21-28)
Replace with current tier names matching `src/lib/stripe.ts`:
- No Plan, Free (7 Day Trial), 90 Day Magic Pass Planner, 90 Day Magic Pass Friend, Magic Pass Planner, Magic Pass Plus, Founders Pass, VIP Free Forever

#### 2. Show VIP badge in UserManager
- In the `admin-user-manage` edge function's `list-users` action, also query `vip_accounts` for matching user IDs and include `is_vip: true/false` and `vip_status` in the response.
- In the UserManager UI, show a gold "VIP" badge next to users who are VIP accounts. If a user is VIP, the tier dropdown should show "VIP Free Forever" and be non-editable (or warn before changing).

#### 3. Fix Andi's VIP record
- Link her `vip_accounts` record to her `users_profile` ID (`ad8a8cd8-3481-40f8-88ac-5de003518b48`)
- Create a subscription record for her: `plan_name: 'magic_pass_plus'`, `status: 'active'`, `stripe_subscription_id: 'vip_ad8a8cd8...'`, `current_period_end: '2099-12-31'`

#### 4. Fix VIP invite function
- Change `plan_name: "Magic Pass"` to `plan_name: "magic_pass_plus"` in the invite flow so VIPs get the correct current tier.

#### 5. Add Beta Tester system
Best approach: extend the existing VIP invite system with a `type` field:
- **VIP Free Forever**: `current_period_end = 2099-12-31` (existing behavior)
- **Beta Tester (1 Year)**: `current_period_end = now + 1 year`

Both types create a subscription record with `stripe_customer_id: 'vip_free_forever'` or `'beta_tester'` — no Stripe checkout needed, no credit card required. The user signs up normally via the invite link and gets a subscription record injected.

Changes:
- Add a `type` column to `vip_accounts` (values: `'vip'`, `'beta_tester'`; default `'vip'`)
- Update `vip-invite` edge function to accept `type` param and set expiration accordingly
- Update the Admin VIP management UI to allow choosing VIP vs Beta Tester when inviting
- In the UserManager, show "Beta Tester" badge for beta accounts

#### 6. Fix existing bad subscription data
- Update Lisa Simpson and Brandon Moss subscriptions from "AP Command Center" to the correct current plan names via data update.

### Files to edit
- **`src/components/admin/UserManager.tsx`** — update PLAN_OPTIONS, add VIP/Beta badges, add VIP column to AdminUser interface
- **`supabase/functions/admin-user-manage/index.ts`** — join `vip_accounts` in list-users response
- **`supabase/functions/vip-invite/index.ts`** — fix plan_name from "Magic Pass" to "magic_pass_plus", add beta_tester type with 1-year expiration
- **Database migration** — add `type` column to `vip_accounts`
- **Data fixes** — update Andi's vip_accounts record, create her subscription, fix Lisa/Brandon plan names

