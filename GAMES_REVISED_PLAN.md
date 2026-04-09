# Magic Pass Plus — REVISED Games Plan (April 9, 2026)

**Status:** PLANNING PHASE — NO CODE CHANGES YET  
**Inspiration:** Jackbox Games (graphics style, party energy, character art)

---

## Revised Game Lineup (8 Core Games)

### ✅ Finalized Games

1. **Trivia** (existing foundation)
   - Difficulty: Easy, Hard, Expert
   - Max 10 players
   - Solo mode: Yes (play vs AI)

2. **Bingo** (4 rounds, multiple patterns)
   - Difficulty: Easy, Hard, Expert
   - Max 10 players
   - Solo mode: Yes

3. **WHO DID IT?** (Clue-style, NO Disney characters)
   - Generic scenario: "Who stole the painting? From where? With what tool?"
   - Characters: 6 generic suspects (Detective, Thief, Guard, Mayor, Artist, Journalist)
   - Locations: 6 generic rooms (Museum, Office, Gallery, Library, Mansion, Penthouse)
   - Tools: 6 items (Rope, Key, Hammer, Lockpick, Briefcase, Mask)
   - Difficulty: Easy, Hard, Expert
   - Max 10 players
   - Solo mode: Yes (play against AI)

4. **WOULD YOU RATHER** (NO Disney references)
   - Generic life/travel/fun questions
   - Example questions:
     - "Would you rather: Never fly again OR never drive again?"
     - "Would you rather: $10,000 now OR $50,000 in 5 years?"
     - "Would you rather: Time travel to past OR future?"
   - Difficulty: Easy (funny), Hard (philosophical), Expert (impossible choices)
   - Max 10 players
   - Solo mode: Yes (vote vs aggregate)

5. **PICTURE PERFECT** (Host draws, players guess)
   - Difficulty: Easy (simple), Hard (complex), Expert (abstract)
   - Max 10 players
   - Solo mode: Yes (draw for AI to guess)

6. **SONG LYRIC FILL-IN** (Generic music, no Disney)
   - Categories: Pop, Rock, Classic, 80s, 90s, 2000s
   - Difficulty: Easy (famous), Hard (deep cuts), Expert (one-word lyrics)
   - Max 10 players
   - Solo mode: Yes

7. **GEOGRAPHY CHALLENGE**
   - Question types: Landmarks, Capitals, Flags, Rivers, Mountains
   - Difficulty: Easy (major cities), Hard (small towns), Expert (obscure locations)
   - Max 10 players
   - Solo mode: Yes

8. **SPY WORD** (Codenames variant)
   - Teams try to guess words from 1-word clues
   - One player is "spy" who knows the words
   - Simplified rules for easier play
   - Difficulty: Easy (obvious words), Hard (abstract clues), Expert (cryptic)
   - Max 10 players (5v5)
   - Solo mode: Limited (can play against AI)

---

## Games to Keep & Integrate

### ✅ LINE MIND (Already exists)
- Description: Players guess a line drawing with increasing detail
- Integrate: Add to group games with point tracking
- Leaderboard: Track personal bests + friends
- Difficulty: Easy, Hard, Expert (different drawing styles)
- Max 10 players
- Solo mode: Yes

### ✅ HAAAA! (Already exists)
- Description: ???? (Need to confirm mechanics)
- Integrate: Add to group games with point tracking
- Leaderboard: Track personal bests + friends
- Difficulty: Easy, Hard, Expert (if applicable)
- Max 10 players
- Solo mode: Yes

---

## Games to Remove

❌ **Party Trivia** — Redundant with main Trivia  
❌ **Spin The Wheel** — Doesn't fit vision  
❌ **Speed Race** — Needs higher-quality graphics (see graphics section)

---

## NEW: All-Day Mystery Game (Persistent, Infinite Replay)

### Concept: MYSTERY CASE FILE

**The Puzzle:**
- A multi-step mystery that unfolds over hours/days
- Players progress through "clue lines" that they unlock as they play
- Each time a new game starts = completely different mystery (procedurally generated)

**Example Structure:**

**Day 1 (Morning):**
- User launches app
- Sees: "New Mystery Available: [CASE NAME]"
- Opens first line of clues: "PERSON: [Name] is missing"
- Solves first clue (multiple choice or logic puzzle)
- Unlocks 2nd clue line

**Day 1 (Afternoon):**
- User reopens app
- Continues: "LOCATION: The missing person was last seen at..."
- Solves 2nd clue
- Unlocks 3rd clue

**Day 1 (Evening):**
- User reopens app
- Continues: "EVIDENCE: A clue was found..."
- And so on

**Final:** After solving 8-10 clue lines, user makes final deduction

**Mechanics:**

```
game_mystery_cases table:
- case_id (UUID)
- case_name (string) - procedurally generated
- user_id (FK)
- status (enum: "in_progress", "completed", "abandoned")
- created_at (timestamp)
- completed_at (timestamp, nullable)
- current_line (int) - which clue line they're on (1-10)
- clues_unlocked (ARRAY) - which clues they've solved
- final_deduction (string, nullable) - their guess
- is_correct (boolean, nullable)
- points_earned (int)
- time_spent_minutes (int, auto-calculated)

game_mystery_clue_lines table:
- clue_line_id (UUID)
- case_id (FK)
- line_number (int) - 1-10
- clue_text (string) - "Person X was seen at Location Y with Item Z"
- challenge_type (enum: "multiple_choice", "pattern_match", "logic_puzzle", "fill_in")
- challenge_data (json) - questions, answers, hints
- points_if_correct (int)
- points_if_wrong (int)
- is_solved (boolean)
```

### Procedural Generation (Why it's infinite)

**Case names:** "The Vanishing at the Harbor", "The Missing Jewels", "The Secret Letter"

**Characters:** Pool of 50 generic names randomly selected
**Locations:** Pool of 30 generic locations randomly selected
**Items:** Pool of 40 generic items randomly selected

**Each new game combines:**
- Random case name generator
- Random character selection (3-5 suspects)
- Random location selection (2-3 locations)
- Random item selection (2-3 items)
- Random clue order (shuffled 8-10 clues)
- Random challenge types per line

**Result:** Billions of possible unique mysteries

### Gameplay Flow

1. **Unlock:** Solve a clue line to unlock the next
2. **Wait:** Can reopen anytime, pick up where left off
3. **Solve:** Complete 8-10 clue lines total
4. **Deduction:** Make final guess (Who? Where? Why?)
5. **Score:** Points based on accuracy + speed
6. **Leaderboard:** Final mystery scores tracked

### Example Case (Procedurally Generated)

**Case Name:** "The Stolen Painting"
**Suspects:** Detective Sarah, Gallery Owner James, Art Thief Marcus, Museum Guard Linda, Mysterious Stranger Alex

**Clue Lines:**
1. "PERSON: The painting was stolen by someone with access to the gallery"
2. "TIME: The theft occurred between midnight and 6 AM"
3. "LOCATION: Security cameras show the thief entered through the back door"
4. "EVIDENCE: Fingerprints found match someone with a criminal record"
5. "MOTIVE: The thief is known to work for a wealthy collector"
6. "CONNECTION: The thief was seen with Marcus the art dealer"
7. "CONFIRMATION: Check if Marcus has prior theft convictions"
8. "FINAL: Who stole the painting? Marcus"

**Player journey:**
- Solves clue 1 (multiple choice: identify suspects with access)
- Solves clue 2 (logic puzzle: timeline analysis)
- Solves clue 3 (pattern match: security footage matching)
- Solves clue 4 (fill-in: identify criminal from fingerprints)
- Solves clue 5 (deduction: connect motive to suspect)
- Solves clue 6 (observation: spot connection in photos)
- Solves clue 7 (research: lookup criminal database)
- Final deduction: "Marcus stole it"
- **CORRECT!** +200 points

---

## High Score Leaderboard (Redesigned)

### Three-Tier Display

**1. GLOBAL LEADERBOARD** (All Magic Pass users)
- Top 100 scores per game
- Shows: Rank, Player (username), Score, Date
- Update frequency: Real-time

**2. FRIENDS LEADERBOARD**
- Your friends' best scores
- Shows: Friend name, Score, Difficulty, Date
- Sortable: All friends, just beaten you, head-to-head challenges

**3. PERSONAL BEST**
- Your highest score per game
- Shows: Score, Difficulty, Date achieved, Attempt count
- Progress bar: "Beat this score: 450/500"

### Record-Breaking Alert System

**When a new global high score is set:**
- 🎉 Post to Social Feed automatically
- Example: "[username] just set a new Magic Pass record! Bingo: 550 points! 🏆"
- Visible to all users in the community
- Creates aspirational competition

---

## Graphics Style (Jackbox Inspiration)

### Current Assessment

**Jackbox Games Style:**
- Bold, hand-drawn character art
- Vibrant color palettes
- Expressive character animations
- High-contrast dark backgrounds
- Playful typography
- Animated transitions + particle effects

**Speed Race redesign needed:**
- Current: Simple buttons/targets
- Desired: Animated characters, energy particles, screen shakes on success

### Required Skills for Higher-Quality Graphics

Checking if we need additional tools...

**Current capabilities (via existing skills):**
- ✅ Canva API — Design static graphics, cards, backgrounds
- ✅ best-image-generation — AI-generated graphics
- ✅ React Expert — UI/UX design patterns

**Potential needs:**
- ❌ **Character animation** — Lottie, Framer Motion, or similar
- ❌ **Particle effects** — Pixi.js, Three.js, or similar
- ❌ **Hand-drawn illustration style** — Need illustrator or AI art generator
- ❌ **Procedural graphics** — For mystery case generation

### Recommendation

1. **Canva API** — Design game card backgrounds/menu screens
2. **Framer Motion** — Animate buttons, transitions, scoring explosions
3. **Pixi.js or Babylon.js** — Complex particle effects for Speed Race
4. **AI illustration API** — Generate procedural character art for mysteries

**Should I research + install these skills?** (YES/NO from Brandon)

---

## Questions for Brandon (Before Coding)

1. **HAAAA! Game:** What are the mechanics? (Need to know to integrate properly)

2. **Mystery Case File:**
   - Is this too ambitious for launch, or Phase 2?
   - Should it be free or premium feature?
   - How many clue lines per case? (8-10? 12-15?)

3. **Graphics:** Should I research animation skills (Framer Motion, Pixi.js) now?

4. **Difficulty Scaling:**
   - For all games, should difficulty affect max points?
   - Example: Expert Trivia = 1,500 points, Easy = 500 points?

5. **High Score Alerts:**
   - Post EVERY new global high score to Social Feed?
   - Or only "milestone" scores (top 10, top 50, etc.)?

6. **Solo Mode:**
   - Should solo games count toward leaderboards?
   - Or only multiplayer scores?

---

## Summary (Next Steps)

**Confirmed lineup:**
1. Trivia ✅
2. Bingo ✅
3. Who Did It? (no Disney) ✅
4. Would You Rather (no Disney) ✅
5. Picture Perfect ✅
6. Song Lyric Fill-In (non-Disney) ✅
7. Geography Challenge ✅
8. Spy Word (Codenames variant) ✅
9. Line Mind (existing, integrated) ✅
10. HAAAA! (existing, integrated) ⏳ Need details

**New concept:**
- Mystery Case File (all-day, procedurally infinite) ⏳ Need approval

**Design specs:**
- Max 10 players per game ✅
- Easy/Hard/Expert difficulties ✅
- Solo mode enabled ✅
- No Disney themes ✅
- No chat/reactions ✅
- Jackbox-style graphics ⏳ Need skill research approval

🎯 Ready for your feedback + answers to above questions!

