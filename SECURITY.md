# Magic Pass Plus — Security Rules & Standards

> **Mandatory reading for all code contributors (human and AI).**
> All code — whether written by Clark, Claude Code, Lovable, or any developer —
> MUST comply with these rules before being merged.

---

## ✅ The 10 Security Laws of Magic Pass Plus

### Law 1: No Secrets in Source Code

**NEVER** hardcode secrets in frontend files (`src/`).

❌ Wrong:
```typescript
const STRIPE_KEY = "sk_live_abc123";
const BREVO_KEY = "xkeysib-abc123";
const TWILIO_TOKEN = "ACe265abc123";
```

✅ Right:
```typescript
// In edge functions: use Deno.env.get("SECRET_NAME")
// In React frontend: only use the ANON/PUBLIC keys (safe by design)
// ALL sensitive operations go through Supabase Edge Functions
```

**Allowed in frontend source:**
- `SUPABASE_URL` (public, not a secret)
- `SUPABASE_ANON_KEY` / `sb_publishable_*` (public by design, restricted by RLS)
- Stripe publishable key `pk_*` (safe for frontend)

**Never in frontend source:**
- Stripe secret key `sk_*`
- Brevo API key
- Twilio Account SID / Auth Token
- Supabase service role key
- Any `xkeysib-*`, `xsmtpsib-*`, `ACe265*` values

---

### Law 2: Every Supabase Table Must Have RLS

Every table in `public` schema must have:
1. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
2. At least one `CREATE POLICY` statement

**Before creating any new table, add:**
```sql
ALTER TABLE public.my_new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rows" ON public.my_new_table
  FOR ALL USING (auth.uid() = user_id);
```

Admin-only tables add:
```sql
CREATE POLICY "Admin only" ON public.my_table
  FOR ALL USING (
    auth.jwt() ->> 'email' IN ('moss570@gmail.com', 'brandon@discountmikeblinds.net')
  );
```

---

### Law 3: Edge Function CORS Must Be Restricted

**Never use wildcard CORS on sensitive endpoints:**

❌ Wrong (for admin/auth endpoints):
```typescript
"Access-Control-Allow-Origin": "*"
```

✅ Right:
```typescript
// For public data (park wait times, restaurants):
"Access-Control-Allow-Origin": "*"

// For auth-required endpoints (admin, user data, payments):
"Access-Control-Allow-Origin": "https://magicpassplus.com"
```

**Public endpoints (wildcard OK):**
- `park-live-data` — public wait times
- `dining-alerts` (GET restaurants) — public restaurant list
- `ai-trip-planner` — auth required anyway

**Restricted endpoints (domain only):**
- `stripe-reports` — admin financial data
- `vip-invite` — admin VIP management
- `disney-auth*` — user auth tokens
- `send-notification` — user PII
- `social` — user friend data

---

### Law 4: No User Input Goes Unvalidated

All user-submitted data must be validated before database insert:

```typescript
// ✅ Always validate
if (!email || !email.includes("@")) throw new Error("Invalid email");
if (partySize < 1 || partySize > 20) throw new Error("Invalid party size");
if (!restaurantId || restaurantId.length !== 36) throw new Error("Invalid ID");

// ✅ Use parameterized queries (Supabase does this automatically)
await supabase.from("table").insert({ user_id: userId, data: sanitized });

// ❌ Never build raw SQL with user input
const query = `SELECT * WHERE name = '${userInput}'`; // SQL injection!
```

---

### Law 5: Auth Required for All User Data Operations

Every edge function that reads/writes user data must verify authentication:

```typescript
// Standard auth pattern for all edge functions
const authHeader = req.headers.get("x-client-authorization") ?? req.headers.get("Authorization");
if (!authHeader) throw new Error("Not authenticated");
const token = authHeader.replace(/^Bearer\s+/i, "").trim();
const { data: userData } = await supabase.auth.getUser(token);
if (!userData.user) throw new Error("Invalid session");
const userId = userData.user.id;
```

Admin endpoints additionally check email:
```typescript
const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net"];
if (!ADMIN_EMAILS.includes(userData.user.email || "")) {
  throw new Error("Admin access required");
}
```

---

### Law 6: No `eval()` or `new Function()` with User Data

Never execute user-provided strings as code:

❌ Wrong:
```typescript
eval(userInput);
new Function(userCode)();
```

The one exception — `page.evaluate()` in Playwright — is only used with trusted Disney URLs, never with user input.

---

### Law 7: `dangerouslySetInnerHTML` Only for Trusted Static Content

Only use `dangerouslySetInnerHTML` when:
1. The content is generated server-side or from trusted constants
2. It contains **no user-provided data**

✅ Allowed (chart CSS variables from config — no user data):
```tsx
<style dangerouslySetInnerHTML={{ __html: staticCssFromConfig }} />
```

❌ Never:
```tsx
<div dangerouslySetInnerHTML={{ __html: userComment }} /> // XSS!
```

---

### Law 8: Rate Limiting on Sensitive Operations

All endpoints that can be abused must have rate limits:

- Login attempts: handled by Supabase Auth (built-in)
- Disney API calls: max 20 requests/minute (enforced in poller)
- Email sends: Brevo free tier = 300/day (tracked via pg_cron)
- Stripe report fetches: admin only (by email)
- Photo uploads: 5MB max, image types only

---

### Law 9: PII (Personal Identifiable Information) Rules

**User emails:**
- Never logged to console in production
- Never included in URLs or GET params
- Only accessible by the user themselves and admins

**Disney tokens:**
- Stored in `disney_sessions` table (RLS protected)
- Token is temporary (30 min TTL)
- Never logged, never returned in API responses beyond confirmation

**Payment data:**
- Never stored — Stripe handles all card data
- Only store: subscription status, plan name, Stripe customer ID

**Friends/Social:**
- Friends can see display names only
- Email addresses never shared between users
- QR tokens are random, not linked to personal data

---

### Law 10: All New Code Follows These Patterns

When writing new features:

**Checklist before any PR/commit:**
- [ ] No secrets in `src/` directory
- [ ] New tables have RLS + policies
- [ ] Edge functions check auth before data operations
- [ ] Admin endpoints verify admin email
- [ ] User input is validated
- [ ] CORS is restricted (not wildcard) for sensitive endpoints
- [ ] No `eval()` or `dangerouslySetInnerHTML` with user data
- [ ] PII is not logged or exposed unnecessarily

---

## 📋 Current Security Status (April 7, 2026)

| Check | Status | Notes |
|-------|--------|-------|
| Hardcoded secrets in src/ | ⚠️ Anon key only | Anon key is safe/public by design |
| All 20 tables have RLS | ✅ | Zero tables without RLS |
| Admin endpoints restricted | ✅ | Email-based access control |
| CORS restricted on sensitive endpoints | ✅ | magicpassplus.com only |
| No eval() | ✅ | Clean |
| dangerouslySetInnerHTML | ✅ | Only in chart.tsx with trusted CSS |
| No console.log of tokens | ✅ | Clean |
| npm audit critical vulns | ✅ | 0 critical, 2 moderate |
| Stripe in test mode | ⚠️ | Switch to live before launch |
| Twilio 10DLC | ⚠️ | Pending approval |
| HTTPS | ✅ | magicpassplus.com via Lovable |
| Security headers | ✅ | X-Frame-Options, CSP, etc. in public/_headers |

---

## 🚨 Immediate Actions Before Public Launch

1. **Switch Stripe to LIVE mode** — current test mode allows fake payments
2. **Await Twilio 10DLC approval** — SMS enabled after carrier approval
3. **Rotate any tokens accidentally shared in public channels**
4. **Enable GitHub secret scanning** on the repo (free, built-in)

---

*This document is enforced. Clark updates it after every security audit.*
*Last audit: April 7, 2026 by Clark Kent, Magic Pass Plus GM*
