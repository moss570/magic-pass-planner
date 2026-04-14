

## Fix: Type-Specific Default Email Bodies

### Problem
When sending a beta tester or free month invite without a customized template, the edge function falls back to a single hardcoded default HTML body that always says "VIP Member — Free Forever." The subject line correctly varies by type, but the body does not.

### Solution
Update the default HTML fallback in `supabase/functions/vip-invite/index.ts` to generate type-specific email bodies based on `enrollType`.

### Changes

**1. `supabase/functions/vip-invite/index.ts` — lines 41-68**

Replace the single hardcoded default HTML block with type-aware content:

- **VIP** (default/current): "VIP Member — Free Forever", CTA: "Claim Your Free VIP Account →"
- **Beta Tester**: "Beta Tester — 1 Year Free Access", body mentions early access and helping shape the platform, CTA: "Join the Beta →"
- **Free Month**: "One Free Month of Magic Pass Plus", body mentions 30-day full access trial, CTA: "Claim Your Free Month →"

The structure (branded header, footer, layout) stays identical — only the messaging text, CTA label, and link vary by type. The link will use the appropriate enrollment URL (`betaLink`, `vipLink`, or `freeMonthLink`) instead of always using `signupUrl`.

**2. Redeploy `vip-invite` edge function**

### Technical Details
- The `else` block (no `customHtml`) on line 41 becomes a switch on `params.enrollType` to pick the right copy
- Each variant uses its corresponding tokenized link (e.g., beta uses `betaLink`)
- No frontend changes needed — this is purely a backend fix

