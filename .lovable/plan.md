

## Beta Tester Bulk Import & Mass Invite

### Current State
You currently have a VIP invite system in the Admin dashboard that sends invites **one at a time** — enter an email, first name, last name, reason, and click "Send VIP Invite." The backend edge function (`vip-invite`) handles creating the record and sending a branded email via Brevo.

### What You Need
A way to import a CSV of names/emails and send beta tester invites to all of them in one action.

### Important Note on Email Sending
Your current invite emails go through **Brevo** (not Lovable's transactional email system). Since these are one-time admin-initiated invites to specific people you have a relationship with, this is fine. The bulk import will use the same `vip-invite` edge function, calling it once per person. Brevo handles the actual delivery.

### Plan

#### 1. Add CSV Import UI to Admin Dashboard (`src/pages/Admin.tsx`)
- Add a "Bulk Import Beta Testers" section below the existing VIP invite form
- File upload input accepting `.csv` files
- Client-side CSV parser (no library needed — simple `split` on lines/commas)
- Expected columns: `email, first_name, last_name` (header row required)
- Preview table showing parsed rows before sending
- "Send All Invites" button with progress indicator
- Type selector: VIP Free Forever vs Beta Tester (1 year)

#### 2. Add Batch Processing Logic (`src/pages/Admin.tsx`)
- On "Send All Invites", loop through rows sequentially (not parallel — avoid rate limiting Brevo)
- Call the existing `vip-invite?action=invite` endpoint for each row with `type: "beta_tester"`
- Show per-row status: pending / sending / sent / failed
- Display summary when complete: "142 sent, 3 failed"
- Allow re-sending failed ones

#### 3. Update Edge Function for Batch Friendliness (`supabase/functions/vip-invite/index.ts`)
- Add a small optimization: skip re-sending email if status is already "active" (idempotent upsert already handles DB side)
- No other changes needed — the existing function handles one invite at a time, which is the correct pattern for deliverability

### CSV Format Expected
```text
email,first_name,last_name
jane@example.com,Jane,Smith
bob@example.com,Bob,Jones
```

### Files Changed
- `src/pages/Admin.tsx` — CSV upload UI, preview table, batch send logic
- `supabase/functions/vip-invite/index.ts` — minor idempotency improvement

### What This Does NOT Do
- It does not use a marketing email service — each invite goes through the existing Brevo transactional send, one at a time
- It does not send all emails simultaneously — sequential processing protects your sender reputation

