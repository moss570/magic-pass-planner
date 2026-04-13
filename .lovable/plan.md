

## Beta Feedback & Error Reporting System

### Overview
Three components: (1) an in-app feedback widget accessible to all logged-in users, (2) automatic client-side error logging, and (3) an admin dashboard tab to view both.

### Database

**New table: `beta_feedback`**
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users, nullable for anonymous)
- `user_email` (text)
- `type` (text: 'bug', 'feature', 'general')
- `title` (text)
- `description` (text)
- `page_url` (text) — auto-captured current route
- `user_agent` (text) — auto-captured browser info
- `screenshot_url` (text, nullable) — future use
- `status` (text: 'new', 'reviewing', 'resolved', 'wont_fix', default 'new')
- `admin_notes` (text, nullable)
- `created_at` (timestamptz)

**New table: `client_error_log`**
- `id` (uuid, PK)
- `user_id` (uuid, nullable)
- `error_message` (text)
- `error_stack` (text, nullable)
- `component_name` (text, nullable)
- `page_url` (text)
- `user_agent` (text)
- `metadata` (jsonb, nullable)
- `created_at` (timestamptz)

**RLS**: Public insert on both tables (so errors log even without auth). Select/update restricted to admin emails.

### Frontend Components

**1. `src/components/FeedbackWidget.tsx`** — Floating button (bottom-right corner) visible to logged-in users
- Opens a slide-up form: type selector (Bug / Feature Request / General), title, description
- Auto-captures current URL and user agent
- Inserts into `beta_feedback` table
- Shows success toast on submit

**2. `src/lib/errorLogger.ts`** — Global error capture utility
- `window.onerror` and `window.onunhandledrejection` handlers
- Batches errors and inserts into `client_error_log` via Supabase
- Deduplicates rapid-fire identical errors (debounce by message)
- Initialize in `src/main.tsx`

**3. Update `GameErrorBoundary.tsx`** — Log caught errors to `client_error_log` in `componentDidCatch`

**4. Admin tab: `src/components/admin/BetaFeedbackPanel.tsx`** — New tab in AdminCommandCenter
- Two sub-views: **Feedback** and **Errors**
- Feedback view: filterable list by type/status, click to expand, update status, add admin notes
- Errors view: grouped by error message with count + latest occurrence, expandable stack traces
- Stats bar: New feedback count, unresolved bugs, errors today

**5. Wire into `AdminCommandCenter.tsx`** — Add "feedback" tab with Bug icon

### Technical Details
- Feedback widget only renders inside `DashboardLayout` (logged-in users)
- Error logger initializes once in `main.tsx` with a fire-and-forget pattern (no blocking)
- Error deduplication: same message within 10 seconds = skip
- Rate limit: max 50 error logs per session to prevent flood

