

## Add Tier Access Manager to Admin Console

### Summary
Add a new "Tier Access" tab to the Admin Dashboard that displays a matrix of all features vs. all plans, letting you toggle feature access per tier directly from the UI. Changes persist to a new `tier_access_overrides` database table and are read by the existing `getFeatureAccess` function.

### How it works

1. **New database table: `tier_access_overrides`**
   - Columns: `id`, `feature_key` (text), `plan_id` (text), `value` (jsonb — stores boolean, number, or string like "unlimited"), `updated_by` (uuid), `updated_at`
   - RLS: admin-only read/write (same email check pattern used elsewhere)
   - When an override row exists, it takes precedence over the hardcoded `PLAN_ACCESS` matrix

2. **Update `src/lib/planFeatures.ts`**
   - Add a new function `loadTierOverrides()` that fetches all rows from `tier_access_overrides` once (cached in memory)
   - Modify `getFeatureAccess()` to check overrides first, falling back to the hardcoded matrix
   - The override cache refreshes on page load or when the admin saves changes

3. **New component: `src/components/admin/TierAccessManager.tsx`**
   - Renders a table: rows = feature keys (grouped by category), columns = plan tiers
   - Each cell shows the current value (checkmark, number, "unlimited", etc.) with a click-to-edit control
   - Toggle switches for boolean features, number inputs for alert limits, dropdowns for special values ("unlimited", "links_only", "none")
   - A "Reset to Default" button per cell to remove the override
   - Save button that upserts to `tier_access_overrides`

4. **Add tab to `src/pages/Admin.tsx`**
   - Add a "Tier Access" link button in the admin header nav (alongside Command Center, Affiliates, Park Content)
   - Or embed it as a collapsible section directly on the Admin page

### Technical details

- Feature keys come from the `PlanAccess` interface (38 features currently)
- Plan columns: Free, 90-Day Planner, 90-Day Friend, Magic Pass Planner, Magic Pass Plus, Founders Pass
- The override table uses `ON CONFLICT (feature_key, plan_id) DO UPDATE` for upserts
- A unique constraint on `(feature_key, plan_id)` ensures one override per feature per plan
- Feature flags (`featureFlags.ts`) remain separate — they control whether a feature is visible at all, while tier access controls who can use it

### Files changed
- **New migration**: Create `tier_access_overrides` table with RLS
- **New file**: `src/components/admin/TierAccessManager.tsx`
- **Edit**: `src/lib/planFeatures.ts` — add override loading + cache
- **Edit**: `src/pages/Admin.tsx` — add Tier Access section/link
- **Edit**: `src/integrations/supabase/types.ts` — auto-updated after migration

### Build error fix (included)
- **Edit**: `src/games/Match3Scene.ts` — exclude from TypeScript compilation by adding it to `tsconfig.app.json` exclude list (it requires the `phaser` package which is not installed in the client build)

