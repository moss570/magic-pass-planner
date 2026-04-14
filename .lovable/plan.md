

## Invite Funnel Tracking: Sent → Clicked → Signed Up

### What this adds
1. **Link click tracking** — when someone visits `/signup` with an `enroll` token, a `link_clicked_at` timestamp is recorded on their `vip_accounts` row (even if they don't finish signing up).
2. **Funnel stats panel** in the VIP Invites admin page showing conversion: Sent → Clicked → Signed Up, with counts and percentages.

### Changes

**1. Database migration — add `link_clicked_at` column**
```sql
ALTER TABLE vip_accounts ADD COLUMN link_clicked_at timestamptz;
```

**2. Edge Function `vip-invite/index.ts` — new `track-click` action**
Add a lightweight handler for `?action=track-click` that accepts `{ enroll_token }` (no auth required), looks up the `vip_accounts` row by `enroll_token`, and sets `link_clicked_at = now()` if it's currently null. Returns 200 silently. No email, no side effects.

**3. `src/pages/Signup.tsx` — fire click tracker on mount**
In the existing `useEffect` that handles `enrollToken`, add a fire-and-forget fetch to the `track-click` action. This runs once when someone lands on the signup page with an enroll token.

**4. `src/pages/admin/VipInvites.tsx` — add Invite Funnel card**
Above the VIP list table, add a small stats card that computes from the loaded `vips` array:
- **Sent**: count where `invite_sent_at` is set
- **Clicked**: count where `link_clicked_at` is set
- **Signed Up**: count where `invite_accepted_at` is set
- Show conversion percentages (Clicked/Sent, Signed Up/Clicked)

Display as three stat boxes in a row with arrows between them.

### Not included
- Brevo open tracking (unreliable due to email privacy protections — can add later if desired)

