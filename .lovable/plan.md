

# Haaaa!! — Disney Party Bluffing Game + Admin Management

## What is it?
A multiplayer party game inspired by Psych! — one player reads a Disney/theme park trivia prompt aloud, everyone else types in a fake answer on their own phone, then all answers (including the real one) are shown and players vote on which they think is correct. Points for guessing right AND for fooling others with your fake answer.

## How it works (single-device MVP)
Since this is a client-side app without real-time multiplayer infrastructure, the game will use a **pass-the-phone** model:
1. **Setup**: Choose number of players (2-8), enter names, pick a category
2. **Round flow** (repeated for N rounds):
   - A prompt is shown (e.g. "What year did Space Mountain open at Magic Kingdom?")
   - Each player takes the phone privately and types a fake answer, then passes it on
   - Once all fakes are submitted, ALL answers (fakes + real) are shuffled and displayed
   - Each player picks which answer they think is real
   - Scoring: +1000 for guessing correctly, +500 for each player your fake answer fooled
3. **Game over**: Leaderboard with final scores

## Database

**New table: `haaaa_prompts`**
- `id` (uuid, PK, default gen_random_uuid())
- `prompt` (text, not null) — the question shown to players
- `real_answer` (text, not null) — the actual correct answer
- `category` (text, default 'general') — characters, rides, parks, history, movies, star_wars, pixar, food, general
- `difficulty` (text, default 'medium')
- `is_active` (boolean, default true)
- `created_at` (timestamptz, default now())

RLS: Public SELECT for active prompts; admin ALL (same email pattern as other admin tables).

**Seed ~40 prompts** across categories with fun Disney trivia that works well for bluffing.

## Game Component: `src/components/HaaaaGame.tsx`

- **Setup screen**: Player count selector, name entry for each player, category picker, "Start Game" button
- **Fake answer phase**: Shows prompt, current player name, text input for fake answer, "Lock In" button — repeats per player
- **Voting phase**: All answers (fakes + real) shuffled, each player taps their guess — repeats per player
- **Round results**: Reveals correct answer with green highlight, shows who was fooled, points breakdown
- **Game over**: Final leaderboard sorted by score, play again button
- Logs session to `game_sessions` (game_id: "haaaa")

## Line Games Integration: `src/pages/LineGames.tsx`

Add new game card:
- id: `"haaaa"`, emoji: "🤪", title: "Haaaa!!", subtitle: "Bluff your friends", description: "A Disney trivia prompt appears — everyone makes up a fake answer. Then guess which one is real! Fool your friends for bonus points.", color: "#EC4899", tag: "Party", available: true

Route to `HaaaaGame` component when selected.

## Admin Tab: `src/pages/AdminCommandCenter.tsx`

Add `"haaaa"` to the `Tab` type. New tab (icon: `Laugh` or `Zap`) showing:
- Prompt list with category filter and search
- Each row shows prompt text, real answer, category, difficulty, active toggle
- Add new prompt form (prompt + real answer + category + difficulty)
- Inline edit/delete for existing prompts
- Follows existing trivia/linemind admin patterns

## Files Changed

1. **New migration** — `haaaa_prompts` table + RLS + seed data (~40 prompts)
2. **New** `src/components/HaaaaGame.tsx` — full game component
3. **Edit** `src/pages/LineGames.tsx` — add Haaaa!! game card + import
4. **Edit** `src/pages/AdminCommandCenter.tsx` — add `"haaaa"` tab type, state, load logic, and admin UI

