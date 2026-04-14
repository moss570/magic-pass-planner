

## Fix: Rename "Beta Welcome" to "Beta Invite"

### Problem
The built-in template labeled "🧪 Beta Welcome" is actually the invitation email sent to recruit beta testers. The name is confusing — it sounds like a post-signup welcome email, not an invite.

### Changes

**`src/pages/admin/VipInvites.tsx` — line 15**

Rename the built-in template:
- From: `label: "🧪 Beta Welcome"` / `id: "beta_welcome"` / `storageKey: "beta_welcome_template"`
- To: `label: "🧪 Beta Invite"` / `id: "beta_invite"` / `storageKey: "beta_invite_template"`

Also update the `DEFAULT_HTML` record key from `"beta_welcome_template"` to `"beta_invite_template"` so the default scaffold still loads correctly.

Users who previously saved edits to the old `beta_welcome_template` key in localStorage will need to re-edit under the new key (or we can add a one-time migration that copies the old key's value to the new one).

### Optional addition
If you'd also like a true **Beta Welcome** email (sent automatically after a beta tester signs up and activates), that would be a separate feature — let me know.

