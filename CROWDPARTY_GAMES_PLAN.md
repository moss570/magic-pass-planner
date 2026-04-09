# Magic Pass Plus — CrowdParty-Style Games Integration Plan

**Date:** April 9, 2026, 9:30 AM EDT  
**Status:** PLANNING PHASE (No code changes yet)  
**Goal:** Replace internal games with CrowdParty-style hosted game model

---

## Key Strategic Changes

### 1. Eliminate Disney Copyright/Trademark Risk
- ❌ Remove: Internal games (Castle Tapper, Where Am I?, Trivia, etc.)
- ✅ Add: CrowdParty-style game hosting (generic, non-Disney games)
- **Why:** CrowdParty games are universally applicable (not Disney-specific)

### 2. New Revenue Stream: 90-Day Game Host Subscription
- **Price:** $23.99 (one-time, 90-day auto-expiring)
- **Duration:** Auto-expires after exactly 90 days
- **Features included:**
  - ✅ Receive shared dining alerts (up to 6 invited guests)
  - ✅ Receive shared event alerts
  - ✅ Host/join CrowdParty-style games
  - ✅ View-only dining alerts (cannot create new ones)
- **Target:** Groups planning trips together

### 3. New Feature: Shared Alert Invitations
- **Who can invite:** Any Magic Pass subscriber (NOT free tier)
- **Invite recipients:** Can be anyone, but must be Magic Pass subscriber to receive alerts
- **Max invites:** 6 additional people per alert
- **Delivery:** SMS + Email for shared alert
- **Restriction on 90-Day users:** Can only RECEIVE alerts, not CREATE them

---

## Current Subscription Tiers (Revised)

### Tier 1: Pre-Trip Planner ($6.99/mo | $49.99/yr)
- Trip planning only
- No games
- No dining alerts

### Tier 2: Magic Pass ($12.99/mo | $89.99/yr)
- Full platform
- ✅ Create dining/event alerts
- ✅ Invite up to 6 others to alerts
- ❌ CrowdParty games NOT included
- Note: Games removed due to Disney IP concerns

### Tier 3: AP Command Center ($7.99/mo | $59.99/yr)
- AP-specific tools
- No games

### Tier 4: AP Command Center PLUS ($10.99/mo | $79.99/yr)
- AP tools + full platform
- ✅ Create dining/event alerts
- ✅ Invite up to 6 others to alerts
- ❌ CrowdParty games NOT included

### **Tier 5: 90-Day Game Host (NEW!)**
- **Price:** $23.99 (one-time, auto-expires)
- **Duration:** Exactly 90 days from purchase
- **Target:** Groups trip-planning together
- **Includes:**
  - ✅ Host/join CrowdParty-style games
  - ✅ Receive shared dining alerts (from invited host)
  - ✅ Receive shared event alerts
  - ❌ CANNOT create own alerts
  - ❌ CANNOT invite others to alerts
  - ❌ Trip planning features
  - ❌ Wait time alerts
  - ❌ AP tools
- **Use case:** "I'm going to Disney in 90 days with friends. We'll share a dining alert and play games together."

---

## Database Schema Requirements

### New Tables

#### `game_hosts` (Host who creates a game session)
```sql
game_host_id (UUID, PK)
user_id (UUID, FK → users)
game_type (varchar: "bingo", "guess-who", "party-mix", "trivia-night", etc.)
game_title (varchar, 255)
max_players (int, default 50)
current_players (int, auto-calculated from game_players)
status (enum: "pending", "active", "completed", "cancelled")
host_avatar (url)
host_nickname (varchar, 50 - display name only, not real name)
qr_code (text - full QR code data URI)
join_code (varchar, 6) - alphanumeric code (e.g., "A7F2K9")
created_at (timestamp)
started_at (timestamp, nullable)
ended_at (timestamp, nullable)
is_public (boolean, default true)
discord_channel_id (optional, for cross-platform sharing)
magic_pass_subscription_id (FK → subscriptions, if from 90-day tier)
```

#### `game_players` (Participants in a game)
```sql
game_player_id (UUID, PK)
game_host_id (UUID, FK → game_hosts)
user_id (UUID, FK → users, nullable for anonymous)
player_nickname (varchar, 50)
player_avatar (url, colorful avatar icon)
joined_at (timestamp)
is_host (boolean, default false)
score (int, nullable)
status (enum: "joined", "active", "idle", "finished")
device_type (varchar: "mobile", "web")
```

#### `game_sessions` (Active game instance)
```sql
game_session_id (UUID, PK)
game_host_id (UUID, FK → game_hosts)
round_number (int, auto-increment)
current_question/challenge (text)
time_remaining_seconds (int)
started_at (timestamp)
ended_at (timestamp, nullable)
is_live (boolean)
```

#### `game_submissions` (Player responses/answers)
```sql
submission_id (UUID, PK)
game_session_id (UUID, FK → game_sessions)
game_player_id (UUID, FK → game_players)
answer/response (text or json)
submitted_at (timestamp)
is_correct (boolean, nullable)
points_awarded (int, nullable)
```

#### `alert_invitations` (New feature: shared alerts)
```sql
invitation_id (UUID, PK)
alert_id (UUID, FK → dining_alerts or event_alerts)
created_by (UUID, FK → users) - person who sent invitation
invited_user_id (UUID, FK → users) - recipient
is_accepted (boolean, default false)
accepted_at (timestamp, nullable)
status (enum: "pending", "accepted", "declined", "revoked")
created_at (timestamp)
notification_sent_at (timestamp, nullable)
```

#### `game_subscriptions` (90-day tier tracking)
```sql
game_sub_id (UUID, PK)
user_id (UUID, FK → users)
stripe_transaction_id (varchar, unique)
purchased_at (timestamp)
expires_at (timestamp, exactly 90 days after purchased_at)
is_active (boolean, auto-managed by cron job)
game_host_limit (int, default 5 - max hosts user can create during 90 days)
current_hosted_games (int, auto-calculated)
alerts_invited_to (int, auto-calculated)
```

---

## Proposed UI/UX (Based on CrowdParty Screenshots)

### Games Discovery Page
**Layout:** CrowdParty-style card grid (fun colors, gradients)

**Card Design:**
- Background: Colorful gradient (teal, coral, purple, orange, pink)
- Icon: Game emoji/icon (🎲 bingo, 🧩 puzzle, 🎭 charades, 🎪 party-mix, etc.)
- Title: "Party Mix", "Bingo", "Guess Who", "Word Cloud", etc.
- Description: 1-line fun tagline ("All the craziness in one freakin' room!")
- Players badge: "3+ players" or "2+ players"
- CTA: Click card → "Join" or "Host"

**Available Games (CrowdParty-style, non-Disney):**
1. **Party Mix** — Icebreaker questions/challenges
2. **Bingo** — Classic or Social (customizable)
3. **Guess Who** — "Guess who said it?"
4. **Word Cloud** — "Share your ideas, transform into word cloud"
5. **Easy Raffle** — Random winner selection
6. **Cha Cha Charades** — Charades-style game
7. **Pick Who** — Opinion-based "Would you rather?"
8. **Two Truths & A Lie** — Trust/deception game
9. **With-Draw** — Drawing + guessing game
10. **Trivia Night** — Generic trivia (NOT Disney-specific)

### Host Game Flow (Modal)

**Step 1: Select Game Type**
- List of games (like CrowdParty screenshot #3)
- "Classic Bingo" vs "Social Bingo" choice (if applicable)

**Step 2: Configure Game**
- Enter game title (e.g., "Team Bingo", "Pre-Trip Icebreaker")
- Select template (e.g., "Icebreaker" for Bingo)
- Max players (slider, 1-50, default 50)
- Play button (large, vibrant color)
- Customize button (advanced options)

**Step 3: Game Started**
- QR code displayed (large, scannable)
- Join code shown (e.g., "A7F2K9") with copy button
- Share instructions: "Share this code or QR to invite others"
- Instructions below: "Invite others to the game"
- "Give Feedback" button (bottom left)
- Share buttons (social, Discord, text)

**Step 4: Game Play Screen** (like CrowdParty #6)
- Game title at top: "TEAM BINGO"
- Large game board (9-square bingo card, customizable items)
- QR code in center (interactive)
- Bottom: "Send Feedback", "Invite", "Share" buttons
- Colorful gradient background (same as card)

### Join Game Flow

**Step 1: Enter Code or Scan QR**
- Option A: Type join code (e.g., "A7F2K9")
- Option B: Scan QR code (camera)
- Enter player nickname (not real name)
- Select avatar (colorful icons, like CrowdParty)

**Step 2: Waiting Room**
- Host's avatar/nickname at top
- Game title
- Current players list (live update)
- "Start Game" button (visible only to host)
- Copy join code for more invites

**Step 3: Play**
- Game-specific UI (bingo card, word cloud, trivia questions, etc.)
- Real-time scoring
- Chat/reactions (optional)

---

## Shared Alert Invitation Flow

### Create Alert → Invite Others

**Current flow:** User creates dining alert

**New flow:**
1. User creates dining alert (e.g., "The Plaza Restaurant, May 31 Dinner for 2")
2. Alert confirmation page shows: "Invite others to this alert"
3. Button: "Invite up to 6 people"
4. Opens modal:
   - "Search for Magic Pass users"
   - "Add email addresses" (will be sent invitation)
   - Preview: "They'll receive SMS + email when availability found"
   - "Send invitations" button
5. Each invitee gets:
   - SMS: "Brandon invited you to a dining alert. Accept: [link]"
   - Email: Same message with link to `/dining-alerts?invitation_id=xxx`
6. Invitee clicks link → views the shared alert
7. When availability found: ALL invited people + creator get notified

### Invite Recipients Must Be Paid Subscribers

**Validation:**
- When creator tries to invite someone, check if they're Magic Pass subscriber
- If free tier → show: "Invitees must have Magic Pass subscription"
- Block invitation until they upgrade

---

## 90-Day Subscription Behavior

### Purchase Flow
1. User sees: "Plan a group trip? Host games + get shared alerts for 90 days"
2. Clicks "Get 90-Day Game Host"
3. Price: $23.99
4. Checkout → Stripe
5. After payment: Subscription created with `expires_at = NOW + 90 days`

### After Purchase (0-90 days)
- ✅ Can host games (up to 5 simultaneous)
- ✅ Can join any game (hosted or others')
- ✅ Can receive shared dining/event alerts
- ✅ Sees "90 days remaining" countdown in settings
- ❌ Cannot create own dining alerts
- ❌ Cannot invite others to alerts (only receives)
- ❌ No trip planning features
- ❌ No wait time alerts

### After 90 Days (Auto-Expiry)
- Subscription marked: `is_active = false`
- User loses access to games
- User loses access to received alerts
- Settings shows: "Your game subscription expired on [date]"
- Button: "Renew for another 90 days - $23.99"

### Cron Job: Expire Old Subscriptions
```sql
-- Runs daily at 2 AM ET
UPDATE game_subscriptions 
SET is_active = false 
WHERE expires_at < NOW() AND is_active = true;

-- Optional: Send email reminder 7 days before expiry
SELECT * FROM game_subscriptions 
WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL 7 DAY;
```

---

## Implementation Roadmap (No Changes Yet!)

### Phase 1: Database + Schema (Day 1)
- Create 6 new tables (game_hosts, game_players, game_sessions, game_submissions, alert_invitations, game_subscriptions)
- Add migration to Supabase
- Add RLS policies

### Phase 2: Games Discovery + Hosting (Day 2)
- Games discovery page (card grid)
- Host game modal (select → configure → start)
- QR code generation
- Join code generation

### Phase 3: Game Play (Day 3)
- Game play screens (different per game type)
- Real-time player updates (WebSocket or polling)
- Scoring/leaderboard

### Phase 4: Shared Alert Invitations (Day 4)
- Invitation creation modal
- User search/email input
- SMS + email invitations (Twilio + Brevo)
- Invitation acceptance flow

### Phase 5: 90-Day Subscription (Day 5)
- Add Stripe product + price ID
- Pricing page integration
- Checkout flow
- Auto-expiry cron job
- Subscription status display

---

## Questions for Brandon Before Coding

1. **Game List:** Do these 10 games feel right? Any additions/removals?
   - CrowdParty has: Party Mix, Bingo, Guess Who, Word Cloud, Easy Raffle, Cha Cha Charades, Pick Who, Two Truths & A Lie, With-Draw, Trivia Night
   - Should we include all of these?

2. **90-Day Price:** $23.99 feels right for 90-day group gaming + alert sharing?

3. **Host Limits:** Should a 90-day subscriber be able to host unlimited games, or cap at 5?

4. **Alert Sharing:** Limit to 6 invitees? Any other constraints?

5. **Game Customization:** How deep do we want?
   - Light: Just title + max players
   - Medium: Title + template selection + max players + custom questions (for trivia)
   - Full: Everything + custom branding + themes

6. **Naming:** Should the subscription be called:
   - "90-Day Game Host" 
   - "Group Games Pass"
   - "Trip Games Bundle"
   - Something else?

7. **Timeline:** When do you want this live?
   - Before launch (part of Day 1/2 go-live)?
   - After launch (Phase 2 release)?
   - Optional/optional alpha?

---

## Summary (For Brandon)

**What changes:**
- Remove internal Disney-specific games (risk mitigation)
- Add CrowdParty-style generic games (bingo, trivia, charades, etc.)
- Add 90-day subscription ($23.99) for group trip gaming + shared alerts
- Add alert invitation feature (share dining/event alerts with 6 others)

**New data structures:** 6 tables, auto-expiring subscriptions, QR/join codes

**No code yet** — waiting for your feedback on questions above.

Ready to code once you give the green light! 🎮🎯

