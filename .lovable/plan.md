

## Restructure Admin Console with Sidebar Navigation

### Problem
The admin area is fragmented across 9+ separate pages connected only by small links at the top of each page. The Command Center alone has 11 horizontal tabs that overflow. As it grows, finding sections is increasingly difficult.

### Solution
Create a unified **Admin Layout** with a persistent sidebar that groups all admin sections into logical categories. Every admin page renders inside this shared layout, replacing the scattered top-bar links.

### Sidebar Navigation Structure

```text
ADMIN CONSOLE
─────────────────────
📊 OVERVIEW
   Dashboard (stats, revenue, plans)

👥 USERS & LEADS
   User Management
   Early Access Leads
   VIP Invites

📝 CONTENT
   Blog Editor
   Park Content CMS
   Curated Hotels
   Trivia Questions
   Line Mind Words
   Haaaa!! Prompts

🎮 GAMES & MEDIA
   Game Analytics
   Photo Review
   Beacon Events

📬 COMMUNICATIONS
   Support Inbox
   User Messages
   Beta Feedback
   Email Templates

⚙️ SYSTEM
   System Health
   Tier Access
   Affiliate Networks
   News Sources
   Third-Party Services
   Admin Notes
```

### Changes

**1. New: `src/components/admin/AdminLayout.tsx`**
- Sidebar + main content area layout using the existing Shadcn Sidebar component
- Collapsible sidebar (icon mode on collapse) with grouped navigation
- Active route highlighting using NavLink
- Badge counts on items like Photo Review, Support Inbox, Beta Feedback
- Mobile: sidebar collapses to icon strip with a trigger button in a sticky header
- The sidebar replaces all the scattered link bars currently at the top of each admin page

**2. Refactor `src/pages/Admin.tsx`**
- Remove the header nav links (sidebar handles navigation now)
- Keep only the dashboard content: revenue overview, subscription breakdown, Stripe reports, operational metrics
- Wrap in AdminLayout

**3. Refactor `src/pages/AdminCommandCenter.tsx`**
- Break into separate route-based pages instead of 11 tabs in one component. Each former tab becomes its own page under `/admin/...`:
  - `/admin/system-health` — existing health tab
  - `/admin/trivia` — existing trivia tab
  - `/admin/photo-review` — existing photos tab
  - `/admin/messages` — existing messages tab
  - `/admin/game-analytics` — existing games tab
  - `/admin/beacon-events` — existing events tab
  - `/admin/news-sources` — existing sources tab
  - `/admin/linemind` — existing line mind tab
  - `/admin/haaaa` — existing haaaa tab
- Each page wraps in AdminLayout and renders its content directly (extract from the monolithic component)
- Support Inbox and Beta Feedback already have their own components — just wrap in AdminLayout

**4. Move VIP Invites + Email Templates from Admin.tsx**
- VIP management moves to `/admin/vip` as its own page
- Email Template Editor moves to `/admin/email-templates`
- Third-Party Services + Admin Notes move to `/admin/system` or stay on dashboard

**5. Update `src/App.tsx`**
- Add new routes for the broken-out pages
- Keep existing routes working (redirect `/admin/command-center` to `/admin`)

**6. Update existing standalone admin pages**
- `BlogEditor.tsx`, `EarlyAccessLeads.tsx`, `CuratedHotels.tsx`, `ParkContent.tsx`, `TierAccess.tsx`, `UserManagerPage.tsx` — remove their individual header/nav bars, wrap content in AdminLayout

**7. Fix build errors**
- `HotelSuggestions.tsx`: Remove Supabase query for `curated_hotels` (table doesn't exist in types) — use the local `CURATED_HOTELS` array instead. Fix property names (`priceRange` → `price_range`, etc.)
- `Blog.tsx`, `BlogPost.tsx`, `BlogEditor.tsx`: Add `as any` casts for `blog_posts` table queries (same pattern used elsewhere for untyped tables)
- `CuratedHotels.tsx`: Same `as any` cast fix
- `PrivacyPolicy.tsx`, `TermsOfService.tsx`: Fix useEffect cleanup return type

### Technical Details
- Uses existing Shadcn `Sidebar`, `SidebarProvider`, `SidebarTrigger` components
- Uses `NavLink` component for active route highlighting with gold left-border style
- AdminLayout handles the admin email gate check centrally — individual pages no longer need their own auth guards
- The sidebar persists across all admin pages (no re-renders/reloads when navigating)
- Badge counts fetch once in the layout and pass via context or re-fetch per page

