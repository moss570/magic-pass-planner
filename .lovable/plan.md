

## Fix: Budget Manager Black Screen

### Root Cause
When trips load successfully, `selectTrip()` is called which sets `loading = true` again. But the main render path (line 228+) has no loading spinner — it renders the full layout with empty data on the dark background. If the API calls to edge functions fail (network/auth errors), the component may also crash silently, leaving a black screen.

### Changes

**`src/pages/BudgetManager.tsx`**
1. Add a loading spinner state: when `loading` is true and `selectedTrip` exists, show a centered spinner/skeleton inside the DashboardLayout instead of rendering the full (empty) content
2. Wrap the `selectTrip` fetch calls with better error handling — catch failures gracefully and still set `loading = false`
3. Add a try/catch around member data access (e.g., `m.first_name[0]` at line 466 can crash if `first_name` is undefined)

The fix ensures users always see a loading indicator or valid content, never a blank dark screen.

