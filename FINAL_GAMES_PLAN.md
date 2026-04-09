# Magic Pass Plus — FINAL Games Plan (April 9, 2026)

**Status:** PLANNING COMPLETE — Ready for coding approval  
**Last Updated:** 10:05 AM EDT

---

## Game Lineup: FINAL (9 Core Games)

### ✅ Core Games (8 + 1 Existing)

1. **Trivia** (existing foundation)
2. **Bingo** (4 rounds, multiple patterns)
3. **Who Did It?** (Clue-style deduction, no Disney)
4. **Would You Rather** (Generic life/travel questions, no Disney)
5. **Picture Perfect** (Host draws, players guess)
6. **Song Lyric Fill-In** (Generic music, no Disney)
7. **Geography Challenge** (Landmarks, capitals, flags)
8. **Spy Word** (Codenames variant)
9. **HAAAA!** (Psych! clone — bluffing trivia game)

### ✅ Existing Game Integrated
10. **Line Mind** (Guess drawing with increasing detail)

---

## HAAAA! Game Details (Psych! Clone)

### How It Works

**Core Mechanic:** Bluffing trivia game where fake answers score points

**Round Structure:**
1. **Host reads a real trivia question** (e.g., "What is the capital of France?")
2. **Each player submits an answer:**
   - First player (Trivia Expert) = TRUE answer ("Paris")
   - Other 9 players = FAKE answers they make up ("Brussels", "Lyon", "Marseille")
3. **All answers shuffled and displayed randomly**
4. **Each player votes** for which answer they think is real
5. **Scoring:**
   - Correct guess = 100 points
   - If your fake answer fools others = 10 points per person fooled
   - Trivia Expert = 50 points for every person fooled by fake answers

**Example:**
```
Question: "What year was the Eiffel Tower built?"

Answers (shuffled):
A) 1889 (REAL)
B) 1823 (Fake - Sarah's)
C) 1901 (Fake - Mike's)
D) 1776 (Fake - Lisa's)

Voting:
- Sarah picks A (correct = +100)
- Mike picks B (wrong = 0, but his fake fooled 2 people = +20)
- Lisa picks C (wrong = 0)
- Jessica picks D (wrong = 0, but her fake fooled 3 people = +30)

Trivia Expert score: 5 people fooled = +250 points
```

### Game Modes

**Category Selection (Host chooses):**
- History
- Geography
- Science
- Pop Culture
- Random Mix

**Difficulty Levels:**
- **Easy:** Well-known facts (Eiffel Tower, Shakespeare, etc.)
- **Hard:** Lesser-known facts (Statue of Liberty copper mine, oldest tree species)
- **Expert:** Obscure facts (exact coin circulation dates, specific battle casualties)

**Rounds:** 5-10 per game (host configurable)

**Max Players:** 10 (1 trivia expert role rotates each round)

**Solo Mode:** Play vs 9 AI bluffers

**Scoring Scale (Brandon's points system):**
- Easy: Max 500 points per game (10 rounds × 50)
- Hard: Max 750 points per game
- Expert: Max 1,000 points per game

---

## Mystery Case File (Phase 2 — Planned)

### Key Features (Confirmation)

✅ **Pause Button on Ride:** When player gets on a ride, they pause the game and resume later  
✅ **Endless Clues:** Procedural generation ensures unique mystery each time  
✅ **Not Free:** Requires subscription (Premium tier)  
✅ **Launch:** Phase 2 (after core games stable)  
✅ **Database:** 2 new tables (game_mystery_cases, game_mystery_clue_lines)

---

## High Score System (Final Specs)

### Leaderboard Tiers

**1. GLOBAL LEADERBOARD**
- Top 100 all-time scores per game
- Real-time updates
- Shows: Rank, Username, Score, Difficulty, Date

**2. FRIENDS LEADERBOARD**
- Your friends' best scores only
- Filter by game type
- Shows: Friend name, Score, Difficulty, Date

**3. PERSONAL BEST**
- Your highest score per game per difficulty
- Shows: Score, Difficulty, Attempts, Date achieved
- Progress bar: "Beat this: 450/500"

### Social Feed Integration

**Trigger:** New global high score set by any player

**Post to Social Feed:** Top 20 scores per game

**Example Post:**
```
🏆 NEW RECORD! 🏆
"Sarah just set a new Magic Pass record!
BINGO - Expert: 550 points! 🎉
Can you beat it?"

[Link to Leaderboard]
```

**Update Frequency:** Real-time (every new top 20 score posts)

### Score Tracking

✅ **Count solo games:** Yes (solo + multiplayer mixed)  
✅ **Count multiplayer games:** Yes  
✅ **Separate leaderboards:** No (combined)  
✅**Personal stats page:** Show games played, total points, badges earned

---

## Game Specs (Locked)

- ✅ Max 10 players per game
- ✅ Difficulty: Easy, Hard, Expert (all games)
- ✅ Solo mode: Yes (all games)
- ✅ No Disney themes
- ✅ No chat/reactions
- ✅ Points scale by difficulty (Easy = 500, Hard = 750, Expert = 1,000)
- ✅ Pause game button (especially for Mystery Case in Phase 2)

---

## Graphics & Visual Design Research

### Current Situation

**Goal:** Improve overall Magic Pass Plus visual design + create Jackbox-style game graphics

**Current Tech:**
- ✅ Canva API — Static card design
- ✅ best-image-generation — AI graphics
- ✅ React Expert — Component design

**Needed Additions:**

#### 1. Framer Motion (Animation Library)
- **What:** React animation library for smooth transitions, button effects, scoring explosions
- **Use Cases:**
  - Animated score popups: "+100 POINTS!" with particle effects
  - Smooth page transitions
  - Button hover/press animations
  - Character expressions (micro-animations)
  - Leaderboard updates (smooth scrolling)

- **Installation:** `npm install framer-motion`
- **Difficulty:** Low (React-native, well-documented)
- **Time to integrate:** 4-6 hours

#### 2. Pixi.js (WebGL Rendering)
- **What:** High-performance 2D rendering library (faster than Canvas)
- **Use Cases:**
  - Particle effects (confetti, sparkles on high scores)
  - Animated backgrounds
  - Speed Race animations (fast-moving targets)
  - Spinning wheels, animated cards
  - Performance-heavy games (Speed Race, Bingo animations)

- **Installation:** `npm install pixi.js`
- **Difficulty:** Medium (different paradigm from React, but powerful)
- **Time to integrate:** 8-10 hours

#### 3. Three.js (3D Graphics) — Optional
- **What:** 3D rendering library
- **Use Cases:**
  - 3D character models (rotating, animated)
  - Fancy transitions (cards flipping in 3D)
  - More "wow" factor for game starts
  - Mystery case cinematic effects

- **Installation:** `npm install three`
- **Difficulty:** Hard (steep learning curve)
- **Time to integrate:** 16+ hours
- **Recommendation:** Skip for now (Pixi.js sufficient)

#### 4. AI Illustration API (Procedural Art)
- **What:** Generate unique character art per game/user
- **Services:**
  - Stable Diffusion API
  - DALL-E API
  - Hugging Face model
- **Use Cases:**
  - Game host avatars (procedurally generated faces)
  - Mystery Case character generation
  - Backgrounds
  - Game icons
- **Difficulty:** Medium (API integration)
- **Cost:** Pennies per image (Stable Diffusion ~$0.001/image)
- **Time to integrate:** 4-6 hours

#### 5. Font & Color System Upgrade
- **Current:** Plus Jakarta Sans (good, keep it)
- **Color improvements:**
  - Expand palette for game themes (bold, vibrant)
  - Add gradient library (like Jackbox)
  - Dark mode variant (improve readability)
  
- **Tools:**
  - Tailwind CSS (already in use) — extend color palette
  - ColorBox.io — generate cohesive color scales
  - Gradient generator — custom gradients per game

- **Difficulty:** Low (CSS updates)
- **Time:** 3-4 hours

---

## Recommended Graphics Implementation Plan

### Phase 1 (Before Launch) — Essential
1. **Framer Motion** — Smooth animations, scoring effects ✅ PRIORITY
2. **Tailwind color palette expansion** — Better game visuals ✅ PRIORITY
3. **Pixi.js for Speed Race** — Particle effects, smooth animations ✅ PRIORITY

**Effort:** 12-16 hours total  
**Impact:** Game feel improves dramatically

### Phase 2 (Post-Launch) — Nice-to-Have
4. **AI Illustration API** — Procedural character art for Mystery Cases
5. **Three.js** — Advanced 3D effects (lower priority)

---

## Skill Research Required

### Should I Install These Skills on ClawHub?

**ClawHub availability:**
- ✅ **Framer Motion skill** — Likely available (popular library)
- ✅ **Pixi.js skill** — Likely available
- ⚠️ **Three.js skill** — May exist, optional
- ⚠️ **DALL-E/Stable Diffusion skill** — Likely available

**Action:** Let me search ClawHub for graphics acceleration skills?

---

## Summary: What We Know

✅ **9 games finalized** with mechanics locked  
✅ **HAAAA! = Psych! clone** (bluffing trivia)  
✅ **High score posts top 20 to Social Feed**  
✅ **Leaderboards count solo + multiplayer**  
✅ **Graphics skills to research:** Framer Motion, Pixi.js, color palette  
✅ **Mystery Case File → Phase 2** (not launch)  
⏳ **Ready to code when you say go**

---

## Questions for Brandon (Final Confirmation)

1. **Graphics timeline:** Add Framer Motion + Pixi.js before launch, or Phase 2?

2. **AI character generation:** Want procedurally generated avatars for game hosts/Mystery cases?

3. **Color palette:** Want me to redesign the color scheme for the whole app (game themes + main UI)?

4. **Launch date target:** Today, tomorrow, or next week?

---

## READY TO CODE?

Once you confirm above, I can:
1. Research ClawHub for graphics skills
2. Create Supabase migrations (game tables)
3. Build game discovery page + host flows
4. Integrate existing Line Mind + HAAAA!
5. Deploy step-by-step

🎯 **Awaiting final go-ahead!**

