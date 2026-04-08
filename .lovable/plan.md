

# Line Mind Game + Admin Management

## Overview
Build "Line Mind" — a forehead-guessing party game (like the popular "heads up" format) with Disney-only words. Players hold the phone to their forehead while friends give clues. Tilt to answer. Admins manage the word bank from the Admin Command Center.

## 1. Database Migration
- Create `headsup_words` table: `id` (uuid), `word` (text), `category` (text: characters/rides/food/movies/parks/general), `is_active` (boolean), `created_at` (timestamptz)
- Seed ~50 Disney words across categories
- RLS: public SELECT for active words; admin-only INSERT/UPDATE/DELETE

## 2. Game Component: `src/components/LineMind.tsx`
- **Menu screen**: Pick category (All, Characters, Rides, Food, Movies, Parks), see rules, tap "Start"
- **Countdown**: 3-2-1 animation, prompts user to raise phone to forehead
- **Playing screen**: Large centered word, 60-second timer, device tilt detection via DeviceOrientationEvent (tilt down = correct/green flash, tilt up = skip/red flash), fallback tap buttons for non-gyro devices
- **Game over**: Score summary with correct/skipped word lists, play again button

## 3. Line Games Integration: `src/pages/LineGames.tsx`
- Add new card: id `"linemind"`, emoji "🤳", title "Line Mind", subtitle "Hold phone to forehead", tag "Party", color `#F59E0B`
- Route to `LineMind` component when selected

## 4. Admin Tab: `src/pages/AdminCommandCenter.tsx`
- Add `"linemind"` to the `Tab` type
- New tab with Smartphone icon showing:
  - Word list with category filter and search
  - Add new word form (word + category dropdown)
  - Inline edit/delete for existing words
  - Toggle active/inactive
- Follows existing trivia admin patterns

## 5. Bug Fix: `src/pages/Settings.tsx`
- Line 105: Replace `toast({ title: ..., description: ..., variant: ... })` with `toast.error("Username required — please set a username for your public profile")`

## Files Changed
1. **New migration** — `headsup_words` table + seed data
2. **New** `src/components/LineMind.tsx` — game component
3. **Edit** `src/pages/LineGames.tsx` — add Line Mind card
4. **Edit** `src/pages/AdminCommandCenter.tsx` — add linemind admin tab
5. **Edit** `src/pages/Settings.tsx` — fix toast build error

