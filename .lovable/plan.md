

## Combined Implementation: Dynamic Email Templates + Enrollment Links + Free Month + Build Fixes

### Overview
Implement all three approved email features in one pass, plus fix the 21 build errors. The result: a dynamic template system where you can create/duplicate/delete templates, invite types for VIP/Beta/Free Month, and one-click enrollment links via `{{beta_link}}`, `{{vip_link}}`, and `{{free_month_link}}` placeholders.

### Changes

**1. Fix build errors across edge functions**

- `blog-publish/index.ts`: Fix `user` reference — store user in a variable when using token auth, or set a fallback `author_email`
- 13 edge functions with `err.message` on unknown type: Add `(err instanceof Error ? err.message : String(err))` pattern
- `ai-trip-planner/index.ts`: Remove `diningType` from object literal
- `send-alert-confirmation/index.ts`: Replace bad `corsHeaders` import with inline definition
- `social/index.ts`: Fix `user_id_1`/`user_id_2` property access by selecting those columns

**2. Dynamic Template Registry (`src/pages/admin/VipInvites.tsx`)**

Replace the hardcoded 3-template `TEMPLATE_REGISTRY` with a dynamic system stored in localStorage (`email_template_registry`):

- **Data structure**: Array of `{ id, label, storageKey, placeholders, isBuiltin, createdAt }`
- **3 built-in templates** auto-seed on first load (VIP Invite, Beta Welcome, Beta Update) + a new **"One Month Free"** built-in template
- **"+ New Template" button**: Creates a blank template with the branded shell (header/footer/CTA), prompts for a name
- **"Duplicate" button**: Copies the active template's HTML into a new entry with "(Copy)" suffix
- **"Rename"**: Inline rename for custom templates (built-ins locked)
- **"Delete"**: Remove custom templates with confirmation (built-ins cannot be deleted)
- **Placeholder reference** updated to show all available: `{{first_name}}`, `{{signup_url}}`, `{{app_url}}`, `{{beta_link}}`, `{{vip_link}}`, `{{free_month_link}}`

**3. Invite type selector on single invite form**

Add a dropdown to the single invite form: VIP Free Forever / Beta Tester (1yr) / One Month Free. Currently hardcoded to VIP only.

**4. Update bulk import type selector**

Add `free_month` option alongside existing `beta_tester` and `vip`.

**5. Edge function: `supabase/functions/vip-invite/index.ts`**

- **New invite type `free_month`**: Sets `periodEnd` to 30 days from now, `stripeCustomerId` to `"free_month_trial"`
- **Enrollment token generation**: For each invite, generate `enroll_token` = `crypto.randomUUID()` and store `enroll_type` on the `vip_accounts` record
- **Placeholder substitution**: Replace `{{beta_link}}`, `{{vip_link}}`, `{{free_month_link}}` in email HTML with tokenized signup URLs (e.g., `https://magicpassplus.com/signup?enroll=TOKEN&type=beta_tester`)
- **New `action=accept-token` endpoint**: Validates enroll token, looks up email, creates subscription with appropriate period end, marks VIP record as active. Single-use: clears token after acceptance.

**6. Database migration**

Add two columns to `vip_accounts`:
- `enroll_token` (text, nullable) — the one-time enrollment token
- `enroll_type` (text, nullable) — `vip`, `beta_tester`, or `free_month`

**7. Signup page: `src/pages/Signup.tsx`**

- Read `enroll` and `type` query params
- Show contextual banner: "You've been invited as a Beta Tester!" / "VIP Member" / "Free month of Magic Pass Plus!"
- After signup, call `vip-invite?action=accept-token` with the enroll token to auto-activate

**8. Remove duplicate template code from `src/pages/Admin.tsx`**

The Admin dashboard currently has a full copy of the VIP invite form and template editor (lines 118-310+). Remove this duplication — VIP management now lives entirely on `/admin/vip`. Keep only the dashboard stats, Stripe reports, third-party services, and admin notes on the Admin page.

**9. Update `src/pages/admin/EarlyAccessLeads.tsx`**

Template picker dropdown reads from the dynamic localStorage registry instead of hardcoded options.

### Technical Details

- Template registry stored in `localStorage` key `email_template_registry` as JSON array
- Built-in templates have `isBuiltin: true` — editable but not deletable/renamable
- Custom template IDs use `crypto.randomUUID()`
- Enrollment tokens are single-use UUIDs stored on `vip_accounts`
- `accept-token` endpoint configured with `verify_jwt = false` (unauthenticated — user hasn't signed up yet) but validates the token exists in the database
- Free month period: `Date.now() + 30 * 24 * 60 * 60 * 1000`

