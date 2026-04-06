

## Fix 4 Build Errors in Edge Functions

### Error 1-3: `ai-trip-planner/index.ts` line 168 — undefined `preference`, `crowdLevel`, `input`

The `nearbyDining` function (line 101) has signature `(location: string, park: string): string[]` — it only takes two parameters and returns a string array of nearby dining names. But line 168 calls `planUniversalRoute(park, locations, preference, crowdLevel, input)` which requires variables that don't exist in `nearbyDining`'s scope.

The `nearbyDining` function is meant to return nearby dining names, not a full itinerary. For non-MK parks, it should simply filter the park locations for dining entries and return them sorted by distance, same as it does for MK (lines 170-190).

**Fix**: Remove the `planUniversalRoute` call at line 168. Instead, for non-MK parks, replicate the same distance-based dining lookup logic that lines 170+ do for MK — iterate `locations`, filter for `category === "dining"`, sort by proximity, and return names. Since there's no `location` reference point for non-MK, return all dining options for that park.

### Error 4: `social/index.ts` line 219 — `.catch()` on PostgREST builder

Supabase PostgREST builders don't have `.catch()`. The upsert call returns a promise-like object but `.catch()` isn't available.

**Fix**: Wrap the upsert in a try/catch or just ignore the error by not chaining `.catch()`. Replace:
```typescript
await supabase.from("friendships").upsert([...]).catch(() => {});
```
with:
```typescript
try {
  await supabase.from("friendships").upsert([...]);
} catch {}
```

### Files Changed
1. `supabase/functions/ai-trip-planner/index.ts` — Fix `nearbyDining` to handle non-MK parks without calling `planUniversalRoute`
2. `supabase/functions/social/index.ts` — Replace `.catch()` with try/catch

