# Magic Pass Plus — Weekend Launch Roadmap (April 9-14, 2026)

**Status:** EXECUTION MODE — APPROVED TO CODE  
**Target:** Live by Sunday, April 14, 2026  
**Priority:** Games + Graphics first, then deploy

---

## PHASE 1: Graphics Foundation (Wed-Thu)

### Day 1 (Wednesday, April 9 — 10:15 AM-8 PM)

**Task 1: Install & Learn Framer Motion + Pixi.js**
- [ ] Research ClawHub for both skills
- [ ] Install locally: `npm install framer-motion pixi.js`
- [ ] Test in React component (simple animations)
- [ ] Create reusable animation components

**Task 2: Full App Color Palette Redesign**
- [ ] Audit current colors (#080E1E, #F5C842, #7C3AED, etc.)
- [ ] Use ColorBox.io to generate vibrant game theme colors
- [ ] Create 5 game theme palettes (Bingo, Trivia, Who Did It, etc.)
- [ ] Update Tailwind config with new colors
- [ ] Update main UI (header, sidebar, buttons) with new palette

**Task 3: AI Avatar Generation Setup**
- [ ] Research: Stable Diffusion API vs DALL-E vs Hugging Face
- [ ] Set up API access (cheapest option = Stable Diffusion, ~$0.001/image)
- [ ] Create prompt templates for family-friendly avatars
- [ ] Test generation (5 sample avatars)

**Deliverables:**
- Framer Motion test components ✓
- Tailwind color palette updated ✓
- AI avatar API working ✓

---

### Day 2 (Thursday, April 10 — 8 AM-6 PM)

**Task 4: Game UI Framework with Framer Motion**
- [ ] Create reusable game card component (animated entrance)
- [ ] Score popup animation ("+100 POINTS!" with burst effect)
- [ ] Leaderboard smooth scroll animation
- [ ] Page transition animations
- [ ] Button press feedback (click → scale + glow)

**Task 5: Pixi.js Particle Effects**
- [ ] Confetti effect (high score celebration)
- [ ] Sparkle/twinkle background animation
- [ ] Animated game board transitions
- [ ] Smooth number counter (score ticking up)

**Task 6: Create Game Discovery Page (High Quality)**
- [ ] Design game cards with new color palette
- [ ] Add Framer Motion entrance animations
- [ ] Host/Join buttons with hover effects
- [ ] Game category filtering (Trivia, Bingo, Logic, etc.)

**Deliverables:**
- All game components animated ✓
- Pixi.js particle effects working ✓
- Game discovery page live ✓

---

## PHASE 2: Database & Core Games (Thu-Fri)

### Day 2 Continued (Thursday evening)

**Task 7: Create Supabase Migrations**
- [ ] `game_hosts` table (host who creates game)
- [ ] `game_players` table (participants)
- [ ] `game_sessions` table (active instance)
- [ ] `game_submissions` table (player answers)
- [ ] `game_high_scores` table (all-time leaderboard)
- [ ] `game_avatars` table (AI-generated avatars)
- [ ] Set RLS policies on all tables
- [ ] Deploy migrations to production

**Deliverables:**
- All game tables in Supabase ✓
- RLS policies enforced ✓

---

### Day 3 (Friday, April 11 — 8 AM-10 PM)

**Task 8: Build Core Games (Parallel)**

**Trivia Game** (2 hrs)
- [ ] Use existing foundation
- [ ] Add group hosting/joining
- [ ] Integrate Framer Motion animations
- [ ] Add high score tracking
- [ ] Test with 5 players

**Bingo Game** (3 hrs)
- [ ] 5x5 card generator
- [ ] Random number calling (automated)
- [ ] Pattern detection (5-in-row, blackout, etc.)
- [ ] Pixi.js ball animations
- [ ] Multi-round scoring

**Who Did It? Game** (2.5 hrs)
- [ ] 6 suspects + 6 locations + 6 tools
- [ ] Clue generation + shuffling
- [ ] Vote/deduction UI
- [ ] Scoring logic
- [ ] Anti-cheat validation

**Would You Rather** (1.5 hrs)
- [ ] Question pool (30+ generic questions)
- [ ] Vote display (pie chart)
- [ ] Results animation
- [ ] Scoring

**Picture Perfect** (2.5 hrs)
- [ ] Drawing canvas (host)
- [ ] Live preview (players)
- [ ] Guess input/submission
- [ ] Auto-grading (fuzzy match)
- [ ] Scoring

**Task 9: Integrate Existing Games**
- [ ] Line Mind → group-compatible
- [ ] HAAAA! (Psych!) → implement bluffing logic
- [ ] Add high score tracking to both

**Task 10: High Score Leaderboard**
- [ ] Global leaderboard (top 100 per game)
- [ ] Friends leaderboard
- [ ] Personal bests
- [ ] Real-time updates
- [ ] Social Feed integration (top 20 auto-posts)

**Deliverables:**
- All 8 core games playable ✓
- Existing games integrated ✓
- Leaderboards live ✓

---

### Day 3 Evening (Friday 8 PM-Midnight)

**Task 11: Final Graphics Polish**
- [ ] Apply Pixi.js particle effects to all games
- [ ] Animate game completion screens
- [ ] High score celebration (confetti + sound)
- [ ] Smooth transitions between screens
- [ ] Test on mobile (responsive)

**Deliverables:**
- All games visually polished ✓

---

## PHASE 3: Testing & Deployment (Saturday)

### Day 4 (Saturday, April 12 — 8 AM-8 PM)

**Task 12: QA & Bug Fixes**
- [ ] Play each game 3x (easy, hard, expert)
- [ ] Test 10-player multiplayer
- [ ] Test solo mode (vs AI)
- [ ] Check high score tracking
- [ ] Verify leaderboard updates
- [ ] Test Social Feed posts
- [ ] Check mobile responsiveness
- [ ] Browser compatibility (Chrome, Safari, Firefox)

**Task 13: Performance Testing**
- [ ] Pixi.js particle effects on low-end devices
- [ ] Framer Motion animation smoothness
- [ ] Load time <3 seconds per game
- [ ] No memory leaks (extended play)

**Task 14: User Testing (Internal)**
- [ ] Gary tests 2 games
- [ ] Brandon tests all games (focus: UX)
- [ ] Document feedback
- [ ] Quick fixes

**Task 15: Deploy to Production**
- [ ] Git commit all changes
- [ ] Deploy to Railway (backend)
- [ ] Deploy to Lovable (frontend)
- [ ] DNS/SSL verify
- [ ] Check magicpassplus.com is live

**Deliverables:**
- Zero critical bugs ✓
- All performance targets met ✓
- Live on magicpassplus.com ✓

---

## PHASE 4: Launch Prep (Sunday)

### Day 5 (Sunday, April 13 — 10 AM-2 PM)

**Task 16: Launch Activities**
- [ ] Announce on Social Feed: "Games launch today!"
- [ ] Post on Discord #clark channel
- [ ] Send email to early users (if list exists)
- [ ] Monitor for errors in production
- [ ] Be on standby for hot-fixes

**Task 17: Post-Launch Monitoring (Sunday 2 PM-Midnight)
- [ ] Watch error logs (Sentry or similar)
- [ ] Monitor database performance
- [ ] Check leaderboard updates
- [ ] Respond to user feedback
- [ ] Fix any critical issues within 1 hour

**Deliverables:**
- Games launched ✓
- Users playing ✓
- No critical issues ✓

---

## Tech Stack (Confirmed)

**Frontend:**
- React (Lovable)
- Framer Motion (animations)
- Pixi.js (particles + performance)
- Tailwind CSS (new color palette)

**Backend:**
- Supabase (PostgreSQL + Edge Functions)
- Node.js (if needed for heavier logic)

**APIs:**
- Stable Diffusion (AI avatars)
- Canva (card design, if needed)

**Deployment:**
- Lovable → magicpassplus.com
- Railway (if additional backend needed)

---

## Time Estimate (Total)

| Phase | Duration | Notes |
|-------|----------|-------|
| Graphics Foundation | 10 hrs | Framer Motion + Pixi.js + colors |
| Core Games | 16 hrs | 8 games + 2 integrations |
| Leaderboard | 4 hrs | Global + friends + posts |
| Polish | 4 hrs | Animations + mobile |
| Testing | 6 hrs | QA + perf + user test |
| Deployment | 2 hrs | Deploy + verify |
| **TOTAL** | **42 hrs** | ~10.5 hrs/day × 4 days |

**Achievable:** YES (with focused execution, minimal distractions)

---

## Potential Bottlenecks

⚠️ **Framer Motion learning curve** — 2 hrs to get proficient  
⚠️ **Pixi.js integration** — Different paradigm, may take 3-4 hrs  
⚠️ **AI avatar generation** — API setup, testing, cost monitoring  
⚠️ **Testing with real users** — Feedback may require quick iteration  
⚠️ **Mobile responsiveness** — Game canvases on small screens challenging  

---

## Success Criteria (Sunday Night)

✅ All 10 games playable on magicpassplus.com  
✅ Graphics look professional (Jackbox-inspired)  
✅ Leaderboards tracking correctly  
✅ High scores posting to Social Feed  
✅ At least 1 user has played each game  
✅ Zero critical bugs in production  

---

## READY TO START?

**Next step:** 
1. Confirm Canva credentials are working
2. Start ClawHub skill research for Framer Motion + Pixi.js
3. Begin Day 1 graphics work immediately

**GO/NOGO decision:** Gary + Brandon approval to proceed with full weekend sprint?

