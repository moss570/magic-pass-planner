

## Keep Attraction/Show Data Current: `is_open` Column + Nighttime Show Fixes

### Problem
1. **Closed attractions still appear**: Rock 'n' Roller Coaster and MuppetVision 3D show up in Must-Dos despite being permanently closed.
2. **No way to mark closures** without deleting rows — need an `is_open` flag.
3. **Nighttime shows are inconsistent**:
   - Fantasmic! is in the `attractions` table (ride_type = "show") instead of `shows` — it works but is misplaced.
   - "Disney Harmonious" is in `shows` but that show ended — replaced by **Luminous: The Symphony of Us**.
   - "KiteTails" at Animal Kingdom ended — should be marked closed.
   - "EPCOT Forever / Luminous" row exists but the name is outdated.
4. **No nighttime-specific tagging** — no way to distinguish nighttime spectaculars from daytime shows in the UI.

### Plan

#### 1. Migration: Add `is_open` column + fix data
Single SQL migration that:
- Adds `is_open boolean NOT NULL DEFAULT true` to `attractions` and `shows`
- Adds `is_nighttime boolean NOT NULL DEFAULT false` to `shows` (so the UI can flag them with a 🌙)
- Marks closed items: Rock 'n' Roller Coaster, MuppetVision 3D, KiteTails, Disney Harmonious
- Renames "EPCOT Forever / Luminous" → "Luminous: The Symphony of Us"
- Sets `is_nighttime = true` on: Happily Ever After, Luminous, Fantasmic!, Wonderful World of Animation, Disney Movie Magic, Tree of Life Awakenings
- Moves Fantasmic! from `attractions` to `shows` (insert + mark attraction row closed)

#### 2. Client query filter (`parkContent.ts`)
- Add `.eq('is_open', true)` to both `getAttractionsForPark` and `getShowsForPark`
- Add `is_open` and `is_nighttime` to TypeScript interfaces

#### 3. Must-Dos UI hint (`StepMustDos.tsx`)
- Show a 🌙 icon next to nighttime shows in the picker so users can easily identify them for evening-only scheduling

#### 4. Hardcoded reference cleanup
- `LivePark.tsx` — remove "Rockin' Roller Coaster" from HS queues
- `GameDeveloper.tsx` — remove from `HS_QUEUES`
- `ai-trip-planner/park-maps.ts` — remove closed entries

### Files to edit
- **New migration file** — schema changes + data fixes
- `src/lib/parkContent.ts` — add `is_open` filter, update types
- `src/components/trip-planner/steps/StepMustDos.tsx` — nighttime show icon
- `src/pages/LivePark.tsx` — remove closed rides
- `src/pages/GameDeveloper.tsx` — remove closed rides
- `supabase/functions/ai-trip-planner/park-maps.ts` — remove closed rides

### Outcome
Closed attractions vanish everywhere. Nighttime shows are properly labeled. Future closures or show replacements only need a single `UPDATE` — no code changes required.

