# Magic Pass Plus — 10 Games Mechanics Plan

**Date:** April 9, 2026, 9:35 AM EDT  
**Status:** PLANNING PHASE (No code yet)  
**Goal:** Design 10 group games with detailed mechanics, scoring, and high-score tracking

---

## High Scores & Leaderboards (Core Feature)

### Global High Scores Table
```sql
game_high_scores
- user_id (FK)
- game_type (e.g., "trivia", "bingo", "clue-pie", etc.)
- high_score (int)
- achieved_at (timestamp)
- game_session_id (FK) - which game session this came from
- is_personal_best (boolean)
```

### Leaderboard Display
- **Global:** Top 100 all-time high scores across all players (per game)
- **Friends:** High scores among your friends
- **Personal:** Your best scores per game (with attempts, win rate)

### Scoring Motivation
- Visual progress bar: "Beat your best score: 45/67"
- Achievement badges: "New Personal Best!" "Bingo Champion" (first 100 points)
- Streak tracking: "3-game winning streak"

---

## The 10 Games (Detailed Design)

### 🎓 Game 1: TRIVIA (Foundation Exists)

**Mechanics:**
- Host selects category: "Disney World", "Universal", "General Travel", "Random"
- 10 questions per round (multiple choice)
- 30 seconds per question
- Points: Faster answer = more points
  - Correct + <10s remaining = 100 points
  - Correct + 10-20s = 50 points
  - Correct + >20s = 25 points
  - Wrong = 0 points
- Max score per game: 1,000 points

**Host Options:**
- Category selection
- Question count (5, 10, 15, 20)
- Time per question (15s, 30s, 45s, 60s)
- Difficulty (Easy, Medium, Hard)

**UI:**
- Question displayed at top
- 4 answer buttons (A, B, C, D)
- Timer countdown
- Current score + leaderboard sidebar
- After each question: "Correct! +100 points"

**Winner:** Highest total score

---

### 🎲 Game 2: BINGO (Classic + Multiple Patterns)

**Mechanics:**
- Standard 5x5 bingo card with numbers 1-75 (B=1-15, I=16-30, N=31-45, G=46-60, O=61-75)
- Host calls numbers randomly (automated)
- Players mark numbers on their card (click/tap)
- Multiple rounds with different winning patterns:
  - **Round 1:** 5 in a row (horizontal, vertical, diagonal)
  - **Round 2:** All four corners + center (6 squares)
  - **Round 3:** Blackout (entire card - 25 squares)
  - **Round 4:** T-shape or L-shape or Z-shape
- Speed matters: First to mark all required squares wins the round
- 4 rounds = 4 winners possible

**Scoring:**
- Round 1 win: 100 points
- Round 2 win: 150 points
- Round 3 win: 200 points (hardest)
- Round 4 win: 100 points
- Max score: 550 points

**High Score:** Total from all 4 rounds (or single best round?)

**Host Options:**
- Auto-call speed (slow/normal/fast = 5s, 3s, 1s between numbers)
- Number of rounds (2, 3, 4)
- Card generator seed (lets players have different cards)

**UI:**
- Large bingo card (5x5 grid)
- Called numbers list (scrolling history)
- Player count + scores
- "BINGO!" button (when you win)

**Anti-Cheat:** Server validates that marked squares were actually called

---

### 🕵️ Game 3: WHO ATE THE PIE? (Clue-Style)

**Mechanics:**
- Similar to Clue but family-friendly and Disney-themed
- **Variables:**
  - WHO: 6 characters (Cinderella, Genie, Rapunzel, Gaston, Ursula, Maleficent)
  - WHERE: 6 locations (Kitchen, Garden, Ballroom, Library, Dining Hall, Hallway)
  - WITH WHAT: 6 utensils (Fork, Knife, Spoon, Plate, Napkin, Hands)
  - **Hidden:** 1 combo per round (e.g., Genie + Kitchen + Fork)

**Round Structure (Multiple Rounds):**
1. Host reveals the mystery at game start (shown only on host screen)
2. 15 cards dealt to players (WHO + WHERE + WHAT cards)
3. Each round, players get a clue: "WHO did it? Pick a character" (multiple choice)
4. 10 total clues given over the game
5. After 10 clues, players vote: "It was [WHO] in the [WHERE] with the [WHAT]"
6. Correct guess = 100 points
7. Wrong guess = 0 points

**Scoring:**
- Correct guess on first 5 rounds: 100 points each
- Correct guess on rounds 6-10: 50 points each (more info given)
- Max: 600 points possible
- Bonus: If you figure it out with <50% of clues revealed: +50 bonus

**Host Options:**
- Number of rounds (1-5)
- Clue types (character, location, utensil, or mix)
- Difficulty (the more specific the clues, the easier)

**UI:**
- Mystery card shown at bottom (host only)
- Clue: "Was it Rapunzel?" (Yes/No/Maybe)
- Your cards shown (what you hold)
- Round counter: "Round 3 of 10"
- Vote modal at end: dropdown menus for WHO/WHERE/WITH WHAT

**Anti-Cheat:** Server validates logic (can't have impossible combos)

---

### 🎨 Game 4: PICTURE PERFECT (Drawing + Guessing)

**Mechanics:**
- Host draws a simple picture
- Players guess what it is
- Multiple rounds
- Scoring based on speed + accuracy

**Round Structure:**
1. Host gets a prompt: "Draw: A Castle"
2. Host has 60 seconds to draw on a white canvas (mouse/touch drawing tool)
3. Players watch live as it draws
4. Players submit guesses: "It's a castle!"
5. Scoring:
   - Correct guess before 30s: 100 points
   - Correct guess 30-50s: 50 points
   - Correct guess >50s: 25 points
6. Host scores based on how many guessed correctly (bonus if >80% correct: +50)

**Scoring:**
- Multiple rounds (3-5 per game)
- Max: ~500 points

**Host Options:**
- Number of rounds
- Time per drawing
- Difficulty of prompts

**UI:**
- Drawing canvas (host only)
- Live preview for players
- Guess input field for players
- Countdown timer

---

### 🎭 Game 5: WOULD YOU RATHER (Icebreaker)

**Mechanics:**
- 20 "Would You Rather" questions specific to Disney fans/travelers
- Examples:
  - "Would you rather: Meet a Disney character OR skip one full day of park lines?"
  - "Would you rather: Free hotel for a week OR $5,000 cash?"
  - "Would you rather: Go to Disney every year for free OR visit 10 new countries once?"

**Round Structure:**
1. Question displayed: "Would you rather: A or B?"
2. Players vote (A or B)
3. Results shown with breakdown: "67% chose A, 33% chose B"
4. Discussion/chat optional
5. Next question

**Scoring:**
- Majority vote: 10 points (if you voted with majority)
- Minority vote: 20 points (bold contrarian point!)
- All players get same points (not competitive, just fun)
- Max: 200 points

**Host Options:**
- Category (Disney, Travel, Life, Random)
- Number of questions
- Time per vote (10s-30s)

**UI:**
- Question centered
- Two large A/B buttons
- Results pie chart
- Timer countdown

---

### 🎪 Game 6: PARTY TRIVIA (Easier, Faster Trivia)

**Mechanics:**
- 20 rapid-fire questions (less serious than Trivia)
- True/False or Multiple Choice (mix)
- No time penalty — just accuracy
- Wild category mix (Disney, pop culture, geography, food, random fun facts)

**Examples:**
- "True or False: Flamingos are naturally pink"
- "What's the capital of France?"
- "How many strings on a violin?"

**Round Structure:**
1. Question + 2-4 answers
2. 20 seconds to answer
3. Answer revealed immediately with fun fact
4. Move to next question

**Scoring:**
- Each correct: 10 points
- Max: 200 points

**Host Options:**
- Question count
- Time per question
- True/False only vs mixed

**UI:**
- Simple question card
- Answer buttons
- Fun fact popup after each answer
- Score ticker

---

### 🏆 Game 7: SPEED RACE (Real-Time Reflex Game)

**Mechanics:**
- Fastest fingers win
- Quick tasks: tap when you see something, click buttons in order, etc.
- Multiple mini-games in one round

**Round 1: Tap When You See It**
- Host shows symbols/emojis randomly
- Players tap when they see a specific symbol (e.g., 🏰)
- Fastest 3 taps = points

**Round 2: Click in Order**
- Numbers 1-10 displayed randomly on screen
- Players click 1, then 2, then 3, etc. in order
- Fastest to click all 10 wins

**Round 3: Pattern Match**
- Sequence of colors shown
- Players repeat by clicking colors in same order
- Gets progressively longer

**Scoring:**
- Each round: 1st = 100, 2nd = 50, 3rd = 25 points
- Max: 300 points

**Host Options:**
- Number of rounds
- Difficulty (speed of appearance)

**UI:**
- Large buttons/targets
- Real-time leaderboard during game
- Scores update instantly

---

### 🎼 Game 8: SONG LYRIC FILL-IN (Music + Lyrics)

**Mechanics:**
- Host plays a 10-second audio snippet of a song
- Players fill in the missing lyric
- Multiple choice or free text

**Examples:**
- "🎵 Happy Birthday to ___" → "you"
- "🎵 Let It ___ " → "Go"
- "🎵 How Far I'll ___" → "Go" (Disney)

**Round Structure:**
1. Audio plays (10 seconds)
2. Lyric question: "[Song Name] - Fill in: 'Let it ___'"
3. 4 answer choices or free-text input
4. 20 seconds to answer
5. Reveal + points

**Scoring:**
- Correct: 25 points per question
- 10 questions = 250 points max

**Host Options:**
- Category (Disney, Pop, Classic, 80s, etc.)
- Question count
- Multiple choice vs free text

**UI:**
- Album art (if available)
- Question text
- Answer buttons

---

### 🌍 Game 9: GEOGRAPHY CHALLENGE (Travel + Map)

**Mechanics:**
- Show a place (photo, landmark, or map)
- Players guess location/country/landmark
- Points for accuracy + speed

**Questions:**
- "Where is this landmark?" (shows photo)
- "Which country is this flag?" 
- "Name this Disney resort"
- "Guess the timezone"

**Scoring:**
- Exact match: 100 points
- Close (within 50 miles): 50 points
- Partially right: 25 points
- Wrong: 0 points

**Host Options:**
- Location type (landmarks, flags, Disney parks, world cities)
- Number of questions
- Time per question

**UI:**
- Large photo/image
- Text input or multiple choice
- Correct answer revealed with distance/details

---

### 🎯 Game 10: SPIN THE WHEEL (Chance + Bonus)

**Mechanics:**
- Spin a wheel with various outcomes
- Fun, unpredictable, high energy
- Each spin = different prize/challenge

**Wheel Options:**
- Instant points: +100, +50, +25 points
- Challenges: "Name 3 Disney songs in 10 seconds"
- Multipliers: "Next question = 2x points"
- Penalties: "-20 points" (rare, balanced)
- Twists: "Everyone votes on next player's answer"

**Round Structure:**
1. Player spins wheel
2. Wheel lands on outcome
3. Resolve outcome (earn points, do challenge, etc.)
4. Next player spins
5. 10 spins per game (if 10 players, everyone spins once)

**Scoring:**
- Highly variable (wheel-based)
- Max: 1,500+ points (if lucky)

**Host Options:**
- Number of spins
- Wheel customization (which outcomes to include)

**UI:**
- Large spinning wheel (animated)
- Outcome display (large!)
- Point explosions/animations
- Leaderboard updating live

---

## High Score Storage & Display

### Database
```sql
game_high_scores table additions:
- game_type (VARCHAR)
- difficulty (VARCHAR - for Trivia/Geography)
- rounds_completed (INT)
- final_score (INT)
- rank_percentile (INT - top 10%, 25%, etc.)
- badges_earned (ARRAY of strings - "Bingo Champion", "100-Point Streak", etc.)
```

### Leaderboard Screens
1. **Global Leaderboard** (per game)
   - All-time top 100 scores
   - Filter by week/month/all-time
   - Shows: Rank, Player, Score, Date

2. **Personal Stats** (in Settings/Profile)
   - Games played: 47
   - Total points across all games: 12,843
   - Personal best per game (all 10 games)
   - Win rate by game
   - Badges earned

3. **Friends Leaderboard** (on Friends page)
   - Your friends' top scores
   - Who beat you recently
   - Challenges: "Beat Sarah's Bingo score of 450"

---

## Game-Specific High Score Definitions

| Game | Max Points | Best Defined By | Leaderboard Metric |
|------|-----------|-----------------|-------------------|
| Trivia | 1,000 | Single game | Highest single game score |
| Bingo | 550 | All 4 rounds | Total from one game |
| Who Ate Pie | 600 | Correct guesses | Highest single game |
| Picture Perfect | 500 | Guesses + host bonus | Highest single game |
| Would You Rather | 200 | All 20 questions | Highest single game |
| Party Trivia | 200 | 20 correct answers | Highest single game |
| Speed Race | 300 | All 3 mini-games | Highest single game |
| Song Lyric | 250 | All 10 questions | Highest single game |
| Geography | 1,000+ | Accuracy + speed | Highest single game |
| Spin Wheel | Unlimited | Random chance | Highest single game |

---

## Brandon's Key Requirements Met

✅ **Trivia:** Existing foundation, made group-compatible  
✅ **Bingo:** Classic numbers, 5x5 card, multiple patterns/rounds  
✅ **Clue-Style:** "Who Ate The Pie?" family-friendly variant  
✅ **High Scores:** Stored globally, personal bests tracked, leaderboards  
✅ **9 Additional Games:** Party Trivia, Picture Perfect, Would You Rather, Speed Race, Song Lyric, Geography, Spin Wheel, + 2 research options (see below)

---

## Research Opportunities (2 More Games - Exploring Ideas)

### Option A: RHYME TIME (Word Game)
- Host says a word
- Players list words that rhyme
- Voting on best rhyme
- Similar to Rhyme Crimes or Spelling Bee

### Option B: CATEGORY CHAIN (Word Association)
- Host gives category: "Things at Disney Parks"
- Each player adds one item
- Items must start with last letter of previous item
- "Magic → Cinderella → Ariel → Lion King → Genie"
- Points for creative/funny additions

### Option C: CODENAMES (Team Game)
- Teams try to guess hidden words
- Clue-giver gives 1-word clues
- Similar to popular board game
- More strategy-focused

### Option D: COUNTDOWN (Numbers Game)
- Players solve math puzzles
- "Make 347 from these 6 numbers"
- Speed + accuracy

### Option E: HEADBANDS / POST-IT (Guessing Game)
- Show players a person/thing/character
- They guess what it is by asking yes/no questions
- Multiple rounds

---

## Questions for Brandon

1. **Which 2 research options** appeal to you most?
   - Rhyme Time, Category Chain, Codenames, Countdown, Headbands?
   - Or others?

2. **Spin the Wheel outcomes:** Should include penalties/losses, or keep it positive?

3. **Group game limits:**
   - Max players per game? (10, 20, 50?)
   - Can 1v1 games be played solo against a bot?

4. **Seasonal themes:**
   - Should we have Disney-themed versions? (Mickey's Bingo, Villain Trivia, etc.)
   - Or keep all games generic/universal?

5. **Achievements/Badges:**
   - What badges would feel rewarding?
   - "Bingo Master" (score >400)
   - "Speed Demon" (Speed Race #1)
   - "Trivia Genius" (Trivia 10/10 correct)
   - Others?

6. **Difficulty levels:**
   - Should each game have Easy/Medium/Hard?
   - Or just some games (Trivia, Geography)?

7. **Chat/Reactions during games:**
   - Should players chat/react live (emojis)?
   - Could be fun for social engagement

---

## Summary (Next Steps)

**Current plan: 10 games + research phase**

✅ Finalized:
1. Trivia
2. Bingo
3. Who Ate The Pie
4. Picture Perfect
5. Would You Rather
6. Party Trivia
7. Speed Race
8. Song Lyric
9. Geography Challenge
10. Spin The Wheel

⏳ Exploring: Rhyme Time, Category Chain, Codenames, Countdown, Headbands

🎯 Ready for your feedback, then we code!

