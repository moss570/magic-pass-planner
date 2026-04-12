

## Fix Trip Compare Blank Screen

### Root Cause
The `TripCompare` page fetches versions via a raw `fetch()` call to the `trips` edge function, manually passing `session?.access_token` in headers. This approach is fragile — if the session isn't ready when the effect fires, or if the edge function has deployment issues, the page stays stuck on the loading spinner (appearing as a blank screen). Edge function logs show zero `list-versions` requests, confirming calls never reach the function.

### Fix
Replace the edge function fetch with a direct Supabase client query — the same pattern used successfully in `MyTrips.tsx`. The `trip_versions` table already has RLS policies allowing users to read their own versions, so no edge function is needed.

### Changes to `src/pages/TripCompare.tsx`

1. **Remove** the raw `fetch()` calls to the edge function and the `SUPABASE_URL`/`SUPABASE_ANON` constants
2. **Import** `supabase` from `@/integrations/supabase/client`
3. **Replace the versions fetch** with:
   ```ts
   const { data } = await supabase
     .from("trip_versions")
     .select("*")
     .eq("trip_id", tripId)
     .eq("user_id", user.id)
     .order("version_number", { ascending: true });
   setVersions(data || []);
   ```
4. **Replace the "choose version" handler** with a direct Supabase update:
   ```ts
   // Deactivate all versions for this trip
   await supabase.from("trip_versions")
     .update({ is_active: false })
     .eq("trip_id", tripId).eq("user_id", user.id);
   // Activate selected version
   await supabase.from("trip_versions")
     .update({ is_active: true })
     .eq("id", versionId).eq("user_id", user.id);
   ```
5. **Switch** from `useAuth().session` to `useAuth().user` since we only need the user ID
6. **Update** the "Back" button to navigate to `/my-trips` instead of `/trip-planner`

### Why This Works
- The Supabase JS client handles auth tokens automatically — no manual header management
- RLS on `trip_versions` already restricts access to `user_id = auth.uid()`
- Eliminates the edge function as a point of failure
- Matches the pattern used successfully throughout the app (MyTrips, DashboardLayout, etc.)

### Files Changed
- `src/pages/TripCompare.tsx` — replace edge function calls with direct Supabase queries

