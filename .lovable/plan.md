

# Add Game Developer Mode Entry Point

## Problem
The Game Developer page exists at `/game-developer` but has zero UI entry points — no links, buttons, or menu items anywhere in the app. A user with `is_game_developer = true` has no way to discover or navigate to it.

## Solution
Add a conditional entry point on the **Line Games** page. If the user has `is_game_developer` access, show a "Game Developer Mode" button/banner at the top of the Line Games page that links to `/game-developer`.

## Files Changed

**1. `src/pages/LineGames.tsx`**
- Add a `useEffect` that checks `vip_accounts.is_game_developer` for the current user
- If true, render a small banner/button at the top of the games list: "🎮 Game Developer Mode — Submit new game content" linking to `/game-developer`
- Styled as a subtle card with the gold accent color, only visible to game devs

