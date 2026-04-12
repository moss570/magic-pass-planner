/**
 * Mystery Strategy Game Room (Colyseus)
 * 3-4 hour cooperative detective game
 * GPT-4 generates unique mystery each session
 * GPS-triggered clues at ride lines, restaurants, merchandise zones
 * 
 * Tone: Agatha Christie + Murder She Wrote + Inspector Gadget
 * Family-friendly, lighthearted, clever
 */

import { Room, Client } from "colyseus";
import { MysteryState, MysteryPlayer, Suspect, Clue } from "../schemas/GameState";

// ─── Mystery Zones (Generic — NO Disney IP) ─────────────
const PARK_ZONES = {
  ride_lines: [
    { name: "Thunder Valley Coaster", lat: 28.4177, lng: -81.5812, type: "ride_line" },
    { name: "Starlight Spinner", lat: 28.4185, lng: -81.5800, type: "ride_line" },
    { name: "Splash Rapids", lat: 28.4192, lng: -81.5825, type: "ride_line" },
    { name: "The Haunted Passage", lat: 28.4168, lng: -81.5808, type: "ride_line" },
    { name: "Galaxy Explorer", lat: 28.4175, lng: -81.5795, type: "ride_line" },
    { name: "Enchanted Garden Train", lat: 28.4188, lng: -81.5835, type: "ride_line" },
    { name: "Sky Tower Drop", lat: 28.4180, lng: -81.5818, type: "ride_line" },
    { name: "Pirate's Cove Adventure", lat: 28.4170, lng: -81.5790, type: "ride_line" },
  ],
  restaurants: [
    { name: "Main Street Grill", lat: 28.4183, lng: -81.5805, type: "restaurant" },
    { name: "Sunset Café", lat: 28.4190, lng: -81.5815, type: "restaurant" },
    { name: "Frontier BBQ Pit", lat: 28.4172, lng: -81.5830, type: "restaurant" },
    { name: "Starlite Diner", lat: 28.4178, lng: -81.5798, type: "restaurant" },
  ],
  merchandise: [
    { name: "Park Treasures Gift Shop", lat: 28.4186, lng: -81.5810, type: "merchandise" },
    { name: "Adventure Outfitters", lat: 28.4174, lng: -81.5820, type: "merchandise" },
    { name: "Souvenir Corner", lat: 28.4182, lng: -81.5803, type: "merchandise" },
  ],
};

// ─── Hint Shame Messages ─────────────────────────────────
const SHAME_MESSAGES = [
  "🐑 {player} just used a hint! The Black Sheep of the team strikes again!",
  "🔍 {player} needed help... Looks like SOMEONE skipped detective school!",
  "🤦 {player} used a hint. Sherlock Holmes is rolling in his grave!",
  "💡 {player} couldn't figure it out alone. The team carries another!",
  "🐔 Bawk bawk! {player} chickened out and used a hint!",
  "📖 {player} had to peek at the answer key. Classic rookie move!",
  "🎭 {player} used a hint. Inspector Gadget would be disappointed!",
  "🧠 {player}'s brain took a coffee break — hint activated!",
  "🕵️ Breaking news: {player} is officially the WORST detective on the team!",
  "😂 {player} needed a hint. Don't worry, we won't tell anyone... oh wait, we just did!",
];

// ─── Role Descriptions ──────────────────────────────────
const ROLES = {
  lead_detective: {
    name: "Lead Detective",
    description: "You lead the investigation. Your vote counts double in the final accusation.",
    ability: "Double vote weight",
  },
  evidence_analyst: {
    name: "Evidence Analyst",
    description: "You specialize in physical evidence. You get extra details on evidence clues.",
    ability: "Bonus evidence info",
  },
  suspect_expert: {
    name: "Suspect Expert",
    description: "You read people like books. You detect contradictions in suspect statements.",
    ability: "Contradiction detection",
  },
};

export class MysteryRoom extends Room<MysteryState> {
  maxClients = 8;
  private storyData: any = null;
  private clueUnlockTimers: Map<string, number> = new Map(); // Rate limit clue reveals
  private actTimers: NodeJS.Timeout[] = [];

  onCreate(options: any) {
    this.setState(new MysteryState());
    this.state.duration = options.duration || "all_day";
    this.state.joinCode = this.generateJoinCode();

    this.onMessage("start_game", (client) => this.handleStartGame(client));
    this.onMessage("select_role", (client, data) => this.handleSelectRole(client, data));
    this.onMessage("search_area", (client, data) => this.handleSearchArea(client, data));
    this.onMessage("gps_trigger", (client, data) => this.handleGpsTrigger(client, data));
    this.onMessage("interrogate_suspect", (client, data) => this.handleInterrogate(client, data));
    this.onMessage("use_hint", (client) => this.handleUseHint(client));
    this.onMessage("vote_culprit", (client, data) => this.handleVote(client, data));
    this.onMessage("advance_act", (client) => this.handleAdvanceAct(client));
    this.onMessage("get_investigation_board", (client) => this.sendInvestigationBoard(client));
  }

  onJoin(client: Client, options: any) {
    const player = new MysteryPlayer();
    player.id = client.sessionId;
    player.name = options.name || `Detective ${this.state.players.size + 1}`;
    player.isHost = this.state.players.size === 0;
    player.role = "detective";
    this.state.players.set(client.sessionId, player);

    console.log(`🔍 Mystery: ${player.name} joined (${this.state.players.size} players)`);
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) player.isConnected = false;
  }

  onDispose() {
    this.actTimers.forEach(t => clearTimeout(t));
  }

  // ─── Game Start ──────────────────────────────────────────

  private async handleStartGame(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (!player?.isHost) return;

    this.broadcast("generating_mystery", { message: "🔮 Generating your unique mystery..." });

    // Generate mystery with GPT-4
    try {
      this.storyData = await this.generateMysteryWithGPT4();
      this.populateStateFromStory();

      this.state.phase = "act1";
      this.state.currentAct = 1;
      this.state.startedAt = Date.now();

      // Send intro story to all players
      this.broadcast("mystery_started", {
        title: this.state.title,
        introStory: this.state.introStory,
        crimeDescription: this.state.crimeDescription,
        suspects: this.storyData.acts[0].suspects.map((s: any) => ({
          id: s.id, name: s.name, role: s.role, description: s.description,
        })),
        duration: this.state.duration,
        totalActs: 4,
      });
    } catch (error) {
      console.error("Failed to generate mystery:", error);
      // Fallback: use pre-generated mystery
      this.storyData = this.generateFallbackMystery();
      this.populateStateFromStory();
      this.state.phase = "act1";
      this.state.currentAct = 1;
      this.state.startedAt = Date.now();

      this.broadcast("mystery_started", {
        title: this.state.title,
        introStory: this.state.introStory,
        crimeDescription: this.state.crimeDescription,
        suspects: this.storyData.acts[0].suspects.map((s: any) => ({
          id: s.id, name: s.name, role: s.role, description: s.description,
        })),
        duration: this.state.duration,
        totalActs: 4,
      });
    }
  }

  // ─── GPT-4 Story Generation ──────────────────────────────

  private async generateMysteryWithGPT4(): Promise<any> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("No OpenAI API key");

    const isAllDay = this.state.duration === "all_day";
    const clueCount = isAllDay ? 35 : 20;
    const suspectCount = 5;
    const actCount = 4;

    const prompt = `Generate a ${isAllDay ? "3-4 hour" : "1.5-2 hour"} episodic mystery for a theme park adventure game.

TONE: Agatha Christie meets Murder She Wrote meets Inspector Gadget. Lighthearted, clever, family-friendly. Slightly edgy humor but nothing dark. Think quirky characters with funny motives.

SETTING: A fictional generic theme park called "Adventure World" — rides, restaurants, gift shops. NO Disney references. NO real theme park names.

STRUCTURE:
ACT 1 (Discovery — 30 min): Crime is discovered, ${suspectCount} suspects introduced, 8 initial clues scattered across the park
ACT 2 (Investigation — 45 min): Deeper investigation, 12 more clues, suspect contradictions emerge, interrogation reveals inconsistencies
ACT 3 (The Twist — 60 min): Major plot twist changes everything, secondary mystery introduced, 10 new clues, players re-evaluate all evidence
ACT 4 (Resolution — 60 min): Final investigation, 5 critical clues, timeline reconstruction, final vote on culprit + optional accomplice

REQUIREMENTS:
- ${suspectCount} distinct suspects with believable motives, alibis, and personality quirks
- ${clueCount}+ total clues (some red herrings, some crucial, some time-locked)
- 1 major twist that genuinely surprises
- 1 secondary mystery (sub-plot worth bonus points)
- Resolution that makes logical sense with ALL clues
- Each clue tied to a location type: "ride_line", "restaurant", or "merchandise"
- Funny character names and quirky dialogue
- At least 3 red herrings that seem convincing

OUTPUT AS VALID JSON:
{
  "title": "The [Mystery Name]",
  "crime": "What happened (1 paragraph)",
  "setting": "Adventure World theme park",
  "intro_story": "5 minute read setting the scene (3-4 paragraphs)",
  "suspects": [
    {
      "id": "suspect_1",
      "name": "Character Name",
      "role": "Their job at the park",
      "description": "Physical description + personality (2 sentences)",
      "motive": "Why they might have done it",
      "alibi": "Where they claim to have been",
      "is_culprit": false,
      "is_accomplice": false,
      "interrogation_responses": {
        "about_crime": "What they say about the crime",
        "about_alibi": "Details of their alibi",
        "about_others": "What they say about other suspects",
        "contradiction": "A statement that contradicts evidence (if any)"
      }
    }
  ],
  "acts": [
    {
      "act": 1,
      "title": "Act 1: [Title]",
      "intro": "Brief act introduction",
      "clues": [
        {
          "id": "clue_1",
          "text": "Detailed clue description (2-3 sentences)",
          "category": "witness|evidence|location|motive",
          "zone_type": "ride_line|restaurant|merchandise",
          "is_red_herring": false,
          "points": 10
        }
      ]
    }
  ],
  "twist": {
    "reveal": "The twist description (1 paragraph)",
    "impact": "How it changes the investigation"
  },
  "secondary_mystery": {
    "description": "Sub-plot description",
    "clues": [...],
    "solution": "Who/what was behind it"
  },
  "solution": {
    "culprit_id": "suspect_X",
    "accomplice_id": "suspect_Y or null",
    "motive": "The real motive",
    "method": "How they did it",
    "timeline": "Step-by-step what happened",
    "resolution_story": "Concluding narrative (2 paragraphs)"
  }
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 8000,
      }),
    });

    const result: any = await response.json();
    const content: string = result.choices[0].message.content;

    // Parse JSON from GPT-4 response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse mystery JSON");

    return JSON.parse(jsonMatch[0]);
  }

  // ─── Fallback Mystery (if GPT-4 fails) ──────────────────

  private generateFallbackMystery(): any {
    return {
      title: "The Carousel Caper",
      crime: "The legendary Golden Horse — Adventure World's most prized carousel figure — has vanished overnight. Park security found the carousel locked but the horse gone, with only a trail of golden glitter leading toward the maintenance tunnels.",
      setting: "Adventure World theme park",
      intro_story: "It was supposed to be a perfect day at Adventure World. The sun was shining, the cotton candy was flowing, and the new summer season was off to a record-breaking start. But when Head Groundskeeper Martha Wiggins arrived at 6 AM to polish the famous Golden Horse on the Grand Carousel, she found an empty pole where the 200-pound golden stallion should have been.\n\nThe Golden Horse wasn't just any decoration — it was Adventure World's mascot, hand-crafted by the park's founder 40 years ago and worth an estimated $2 million. Its disappearance sent shockwaves through the park staff.\n\nPark Director Theodore 'Teddy' Pemberton III called an emergency meeting. 'Nobody leaves this park until we find that horse,' he declared, adjusting his bow tie nervously. 'And somebody get me a detective!'\n\nThat's where you come in. You and your team of investigators have been called to solve the mystery before the park opens to the public. The clock is ticking, the suspects are sweating, and somewhere in Adventure World, a golden horse is waiting to be found.",
      suspects: [
        { id: "suspect_1", name: "Dizzy Dave Delacroix", role: "Carousel Operator (20 years)", description: "A wiry man in his 50s with paint-stained overalls and a nervous twitch. Known for talking to the carousel animals like they're real.", motive: "Recently told his horse was being replaced with a modern replica", alibi: "Claims he was at the bowling alley until midnight", is_culprit: false, is_accomplice: false, interrogation_responses: { about_crime: "I would NEVER hurt my babies! That horse is family!", about_alibi: "I bowled a 180 that night! Ask anyone at Sunset Lanes!", about_others: "Widget Wendy's been acting suspicious. She measured the horse last week.", contradiction: "Says he left at midnight but bowling alley closes at 11 PM" } },
        { id: "suspect_2", name: "Widget Wendy Wu", role: "Head of Merchandise", description: "A sharp-dressed businesswoman who's always on her tablet calculating profit margins. Has a collection of miniature carousel horses on her desk.", motive: "Was caught researching 'how to sell antiques internationally' on her work computer", alibi: "Working late on inventory reports in her office", is_culprit: true, is_accomplice: false, interrogation_responses: { about_crime: "A terrible loss for the brand. We'll need to order replacement merchandise immediately.", about_alibi: "I was in my office until 2 AM. The security cameras can confirm.", about_others: "Professor Peculiar has been sneaking around the maintenance tunnels. Very suspicious.", contradiction: "Security footage shows her office lights were off after 10 PM" } },
        { id: "suspect_3", name: "Professor Peculiar Pete", role: "Park Engineer & Inventor", description: "A wild-haired eccentric in a lab coat covered in grease stains. Claims to be building a 'revolutionary ride' in his workshop.", motive: "Needs rare golden alloy for his 'invention' — the horse contains the exact material", alibi: "Was in his workshop all night working on a secret project", is_culprit: false, is_accomplice: true, interrogation_responses: { about_crime: "Fascinating! The engineering required to remove a 200-pound figure without triggering alarms... purely hypothetically, of course.", about_alibi: "I was calibrating my Whirligig 3000. Science never sleeps!", about_others: "Dizzy Dave has been more emotional than usual. Maybe he snapped.", contradiction: "Workshop security log shows he left at 9 PM and returned at 3 AM" } },
        { id: "suspect_4", name: "Jolly Janet Jimenez", role: "Head Chef, Main Street Grill", description: "A boisterous woman who laughs at everything, even when nothing's funny. Makes the best funnel cakes in three counties.", motive: "The carousel area is scheduled to become her new restaurant expansion", alibi: "Was prepping tomorrow's special sauce in the kitchen", is_culprit: false, is_accomplice: false, interrogation_responses: { about_crime: "HA HA HA! Who would steal a HORSE? That's hilarious! ...wait, it's actually missing?", about_alibi: "My sauce takes 14 hours to simmer! I was stirring it ALL night!", about_others: "Teddy the director has been acting weird about the insurance lately.", contradiction: "Kitchen staff says she left at 8 PM and nobody saw her until morning" } },
        { id: "suspect_5", name: "Theodore 'Teddy' Pemberton III", role: "Park Director", description: "A pompous man in a three-piece suit who sweats profusely when nervous. Third generation to run the park.", motive: "Park is in financial trouble — the horse's insurance payout would save the budget", alibi: "At a charity dinner downtown", is_culprit: false, is_accomplice: false, interrogation_responses: { about_crime: "This is a DISASTER! Do you know what this does to our stock price?!", about_alibi: "I was at the Mayor's Gala until 11 PM. 200 witnesses!", about_others: "I trust my staff completely. Well, mostly. Well... just find the horse.", contradiction: "Gala ended at 9 PM, not 11 PM — verified by event coordinator" } }
      ],
      acts: [
        { act: 1, title: "Act 1: The Golden Horse Vanishes", intro: "The carousel sits empty. Five suspects. One missing horse. Time to investigate.", clues: [
          { id: "clue_1", text: "A trail of golden glitter leads from the carousel to the maintenance tunnels. The glitter appears to be flaking paint, not decorative.", category: "evidence", zone_type: "ride_line", is_red_herring: false, points: 10 },
          { id: "clue_2", text: "Security camera near the carousel was 'malfunctioning' between 10 PM and 2 AM. The tech team says someone manually disabled it.", category: "evidence", zone_type: "ride_line", is_red_herring: false, points: 15 },
          { id: "clue_3", text: "A large dolly cart is missing from the maintenance shed. It's rated for loads up to 300 pounds.", category: "evidence", zone_type: "merchandise", is_red_herring: false, points: 10 },
          { id: "clue_4", text: "A witness saw someone in a lab coat near the carousel at 11 PM. They were carrying what looked like tools.", category: "witness", zone_type: "ride_line", is_red_herring: false, points: 15 },
          { id: "clue_5", text: "Dizzy Dave's locker contains a framed photo of him hugging the Golden Horse with the caption 'Best Friends Forever.'", category: "motive", zone_type: "ride_line", is_red_herring: true, points: 5 },
          { id: "clue_6", text: "A mysterious van was spotted in the employee parking lot at midnight. License plate: partially obscured.", category: "location", zone_type: "restaurant", is_red_herring: true, points: 5 },
          { id: "clue_7", text: "The carousel's security bolt was unscrewed professionally — this wasn't a smash-and-grab.", category: "evidence", zone_type: "ride_line", is_red_herring: false, points: 10 },
          { id: "clue_8", text: "Wendy's tablet shows recent searches for 'international antique shipping' and 'golden horse value estimate.'", category: "motive", zone_type: "merchandise", is_red_herring: false, points: 20 },
        ]},
        { act: 2, title: "Act 2: Contradictions and Connections", intro: "The investigation deepens. Alibis crack. New evidence surfaces.", clues: [
          { id: "clue_9", text: "The bowling alley confirms they close at 11 PM, not midnight. Dizzy Dave's alibi has a gap.", category: "witness", zone_type: "restaurant", is_red_herring: false, points: 10 },
          { id: "clue_10", text: "Professor Pete's workshop log shows exit at 9 PM and re-entry at 3 AM. Where was he for 6 hours?", category: "evidence", zone_type: "ride_line", is_red_herring: false, points: 15 },
          { id: "clue_11", text: "Wendy's office security footage shows lights off after 10 PM — she wasn't working late as claimed.", category: "evidence", zone_type: "merchandise", is_red_herring: false, points: 20 },
          { id: "clue_12", text: "A park maintenance worker reports seeing TWO people in the tunnels around midnight.", category: "witness", zone_type: "ride_line", is_red_herring: false, points: 15 },
        ]},
        { act: 3, title: "Act 3: The Plot Thickens", intro: "A shocking discovery changes everything you thought you knew.", clues: [
          { id: "clue_13", text: "The Golden Horse is found — but it's a REPLICA! The real one was switched weeks ago!", category: "evidence", zone_type: "ride_line", is_red_herring: false, points: 25 },
        ]},
        { act: 4, title: "Act 4: The Final Piece", intro: "All roads lead to one conclusion. Time to make your accusation.", clues: [
          { id: "clue_14", text: "A shipping receipt in Wendy's name for a 200-pound package to an overseas address, dated two weeks ago.", category: "evidence", zone_type: "merchandise", is_red_herring: false, points: 30 },
        ]},
      ],
      twist: {
        reveal: "The horse stolen last night was actually a REPLICA that Wendy had commissioned weeks ago! She swapped the real Golden Horse with a perfect copy two weeks earlier and shipped the original overseas. Last night's 'theft' of the replica was staged by Professor Pete (who helped with the swap) to create an alibi — making it look like the theft happened recently, not weeks ago.",
        impact: "Players must re-evaluate timeline. The crime didn't happen last night — it happened two weeks ago. All the alibis for last night are irrelevant for the REAL theft.",
      },
      secondary_mystery: {
        description: "Who disabled the security cameras? It wasn't the same person who stole the horse.",
        clues: [],
        solution: "Teddy disabled the cameras himself — he was sneaking a midnight snack from the kitchen and didn't want it on camera (he's on a diet his wife monitors).",
      },
      solution: {
        culprit_id: "suspect_2",
        accomplice_id: "suspect_3",
        motive: "Wendy planned to sell the real Golden Horse to a private collector for $2 million. She enlisted Professor Pete to help with the technical removal, promising to fund his inventions.",
        method: "Step 1: Commission perfect replica (3 weeks ago). Step 2: Swap real horse for replica at night with Pete's help (2 weeks ago). Step 3: Ship real horse overseas. Step 4: Stage 'theft' of replica to create cover story.",
        timeline: "3 weeks ago: Wendy orders replica. 2 weeks ago: Wendy and Pete swap horses at night. 1 week ago: Real horse shipped overseas. Last night: Pete stages theft of replica to create alibi timeline.",
        resolution_story: "Widget Wendy Wu's plan was almost perfect — swap the real horse with a replica, ship the original overseas, then stage a dramatic 'theft' to throw off any investigation. With Professor Peculiar Pete's engineering expertise, the swap was flawless.\n\nBut they didn't count on a team of brilliant detectives noticing the timeline inconsistencies. Wendy's search history, Pete's unexplained absence, and the crucial discovery that the stolen horse was a replica — it all added up to one conclusion.\n\nAs park security escorted Wendy and Pete away, Dizzy Dave could be heard sobbing with relief: 'I KNEW my horse didn't run away!' The Golden Horse was recovered from a shipping container in Miami, and Adventure World's most famous attraction was restored to its rightful place.\n\nAs for Teddy's midnight kitchen raids? His wife found out anyway. Some mysteries solve themselves.",
      },
    };
  }

  // ─── State Population ────────────────────────────────────

  private populateStateFromStory() {
    this.state.title = this.storyData.title;
    this.state.crimeDescription = this.storyData.crime;
    this.state.introStory = this.storyData.intro_story;

    // Add suspects
    this.storyData.suspects.forEach((s: any) => {
      const suspect = new Suspect();
      suspect.id = s.id;
      suspect.name = s.name;
      suspect.role = s.role;
      suspect.description = s.description;
      suspect.motive = s.motive;
      suspect.alibi = s.alibi;
      suspect.isCulprit = s.is_culprit;
      suspect.isAccomplice = s.is_accomplice || false;
      this.state.suspects.push(suspect);
    });

    // Add clues from all acts
    let clueIndex = 0;
    const allZones = [...PARK_ZONES.ride_lines, ...PARK_ZONES.restaurants, ...PARK_ZONES.merchandise];

    this.storyData.acts.forEach((act: any) => {
      act.clues.forEach((c: any) => {
        const clue = new Clue();
        clue.id = c.id;
        clue.text = c.text;
        clue.category = c.category;
        clue.act = `act${act.act}`;
        clue.revealed = false;
        clue.isRedHerring = c.is_red_herring || false;
        clue.points = c.points || 10;
        clue.gpsZone = c.zone_type;

        // Assign GPS coordinates from park zones
        const matchingZones = allZones.filter(z => z.type === c.zone_type);
        if (matchingZones.length > 0) {
          const zone = matchingZones[clueIndex % matchingZones.length];
          clue.lat = zone.lat;
          clue.lng = zone.lng;
        }
        clueIndex++;

        this.state.clues.push(clue);
      });
    });

    this.state.totalCluesAvailable = this.state.clues.length;
    this.state.culpritId = this.storyData.solution.culprit_id;
    this.state.accompliceId = this.storyData.solution.accomplice_id || "";

    if (this.storyData.twist) {
      this.state.twistReveal = this.storyData.twist.reveal;
    }
    if (this.storyData.secondary_mystery) {
      this.state.secondaryMystery = this.storyData.secondary_mystery.description;
    }
    if (this.storyData.solution) {
      this.state.resolution = this.storyData.solution.resolution_story;
    }
  }

  // ─── Player Actions ──────────────────────────────────────

  private handleSelectRole(client: Client, data: { role: string }) {
    const player = this.state.players.get(client.sessionId) as MysteryPlayer;
    if (!player) return;
    if (["lead_detective", "evidence_analyst", "suspect_expert"].includes(data.role)) {
      player.role = data.role;
      const roleInfo = ROLES[data.role as keyof typeof ROLES];
      this.broadcast("role_selected", {
        playerId: client.sessionId,
        playerName: player.name,
        role: roleInfo.name,
        ability: roleInfo.ability,
      });
    }
  }

  private handleSearchArea(client: Client, data: { lat?: number; lng?: number }) {
    const player = this.state.players.get(client.sessionId) as MysteryPlayer;
    if (!player) return;

    // Rate limit: 1 clue per 5 minutes
    const lastUnlock = this.clueUnlockTimers.get(client.sessionId) || 0;
    const now = Date.now();
    if (now - lastUnlock < 5 * 60 * 1000) {
      client.send("search_cooldown", {
        remainingSeconds: Math.ceil((5 * 60 * 1000 - (now - lastUnlock)) / 1000),
      });
      return;
    }

    // Find an unrevealed clue for the current act
    const currentActClues = this.state.clues.filter(
      c => c.act === `act${this.state.currentAct}` && !c.revealed
    );

    if (currentActClues.length === 0) {
      client.send("no_more_clues", { message: "All clues in this act have been found! Advance to the next act." });
      return;
    }

    // Reveal next clue
    const clue = currentActClues[0];
    clue.revealed = true;
    player.cluesFound++;
    this.state.totalCluesFound++;
    this.clueUnlockTimers.set(client.sessionId, now);

    this.broadcast("clue_found", {
      finderId: client.sessionId,
      finderName: player.name,
      clue: { id: clue.id, text: clue.text, category: clue.category, points: clue.points },
      totalFound: this.state.totalCluesFound,
      totalAvailable: this.state.totalCluesAvailable,
    });
  }

  private handleGpsTrigger(client: Client, data: { lat: number; lng: number }) {
    // Find nearest unrevealed clue within 50m radius
    const player = this.state.players.get(client.sessionId) as MysteryPlayer;
    if (!player) return;

    const nearbyClue = this.state.clues.find(c => {
      if (c.revealed || c.act !== `act${this.state.currentAct}`) return false;
      const dist = this.haversineDistance(data.lat, data.lng, c.lat, c.lng);
      return dist < 50; // Within 50 meters
    });

    if (nearbyClue) {
      nearbyClue.revealed = true;
      player.cluesFound++;
      this.state.totalCluesFound++;

      this.broadcast("gps_clue_found", {
        finderId: client.sessionId,
        finderName: player.name,
        clue: { id: nearbyClue.id, text: nearbyClue.text, category: nearbyClue.category },
        zone: nearbyClue.gpsZone,
      });
    }
  }

  private handleInterrogate(client: Client, data: { suspectId: string; topic: string }) {
    const suspect = this.storyData.suspects.find((s: any) => s.id === data.suspectId);
    if (!suspect) return;

    const response = suspect.interrogation_responses?.[data.topic] || "I have nothing more to say.";
    const player = this.state.players.get(client.sessionId) as MysteryPlayer;

    // Evidence Analyst gets bonus info on evidence topics
    let bonus = "";
    if (player?.role === "evidence_analyst" && data.topic === "about_crime") {
      bonus = "\n[ANALYST BONUS] You notice the suspect's body language suggests they're hiding something about the timeline.";
    }

    // Suspect Expert detects contradictions
    if (player?.role === "suspect_expert" && suspect.interrogation_responses?.contradiction) {
      bonus += "\n[EXPERT INSIGHT] ⚠️ This statement contradicts earlier evidence!";
    }

    client.send("interrogation_response", {
      suspectId: data.suspectId,
      suspectName: suspect.name,
      topic: data.topic,
      response: response + bonus,
    });

    this.broadcast("interrogation_happened", {
      playerId: client.sessionId,
      playerName: player?.name,
      suspectName: suspect.name,
    });
  }

  private handleUseHint(client: Client) {
    const player = this.state.players.get(client.sessionId) as MysteryPlayer;
    if (!player) return;

    player.hintsUsed++;

    // Find next unrevealed important clue (non-red herring)
    const importantClue = this.state.clues.find(
      c => !c.revealed && !c.isRedHerring && c.act === `act${this.state.currentAct}`
    );

    if (importantClue) {
      importantClue.revealed = true;
      this.state.totalCluesFound++;

      client.send("hint_result", {
        clue: { id: importantClue.id, text: importantClue.text, category: importantClue.category },
      });
    }

    // SHAME THE PLAYER! 😂
    const shameMessage = SHAME_MESSAGES[Math.floor(Math.random() * SHAME_MESSAGES.length)]
      .replace("{player}", player.name);

    this.broadcast("hint_shame", {
      playerId: client.sessionId,
      playerName: player.name,
      message: shameMessage,
      hintsUsed: player.hintsUsed,
    });
  }

  private handleVote(client: Client, data: { suspectId: string; accompliceId?: string }) {
    const player = this.state.players.get(client.sessionId) as MysteryPlayer;
    if (!player) return;

    player.vote = data.suspectId;

    this.broadcast("player_voted", {
      playerId: client.sessionId,
      playerName: player.name,
      message: `${player.name} has made their accusation! 🕵️`,
    });

    // Check if all players have voted
    const allVoted = Array.from(this.state.players.values()).every(
      p => (p as MysteryPlayer).vote !== ""
    );

    if (allVoted) {
      this.resolveVotes();
    }
  }

  private handleAdvanceAct(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (!player?.isHost) return;

    if (this.state.currentAct < 4) {
      this.state.currentAct++;
      this.state.phase = `act${this.state.currentAct}`;

      // Reveal twist at Act 3
      if (this.state.currentAct === 3 && this.state.twistReveal) {
        this.broadcast("twist_revealed", {
          twist: this.state.twistReveal,
          message: "🔄 PLOT TWIST! Everything you thought you knew just changed!",
        });
      }

      // Reveal secondary mystery at Act 3
      if (this.state.currentAct === 3 && this.state.secondaryMystery) {
        this.broadcast("secondary_mystery", {
          description: this.state.secondaryMystery,
          message: "🔍 A NEW MYSTERY has been discovered! Can you solve both?",
        });
      }

      this.broadcast("act_advanced", {
        act: this.state.currentAct,
        title: this.storyData.acts[this.state.currentAct - 1]?.title || `Act ${this.state.currentAct}`,
        intro: this.storyData.acts[this.state.currentAct - 1]?.intro || "",
      });
    } else {
      // Final act complete — time to vote
      this.state.phase = "voting";
      this.broadcast("voting_phase", {
        message: "🗳️ Time to make your final accusation! Who did it?",
        suspects: this.state.suspects.map(s => ({ id: s.id, name: s.name, role: s.role })),
      });
    }
  }

  // ─── Resolution ──────────────────────────────────────────

  private resolveVotes() {
    this.state.phase = "results";

    // Count votes (Lead Detective gets double weight)
    const voteCounts = new Map<string, number>();
    this.state.players.forEach((p) => {
      const mp = p as MysteryPlayer;
      const weight = mp.role === "lead_detective" ? 2 : 1;
      voteCounts.set(mp.vote, (voteCounts.get(mp.vote) || 0) + weight);
    });

    // Find most voted suspect
    let topVote = "";
    let topCount = 0;
    voteCounts.forEach((count, suspectId) => {
      if (count > topCount) {
        topCount = count;
        topVote = suspectId;
      }
    });

    const isCorrect = topVote === this.state.culpritId;

    // Calculate accuracy score
    let accuracyScore = 0;
    if (isCorrect) accuracyScore = 100;
    else {
      // Partial credit if they got the accomplice
      const hasAccompliceVote = Array.from(voteCounts.keys()).includes(this.state.accompliceId);
      if (hasAccompliceVote) accuracyScore = 50;
    }

    // Hint penalty
    let totalHints = 0;
    this.state.players.forEach(p => { totalHints += (p as MysteryPlayer).hintsUsed; });
    const hintPenalty = totalHints > 0 ? Math.min(totalHints * 5, 30) : 0;
    const noHintBonus = totalHints === 0 ? 20 : 0;

    const finalScore = Math.max(0, accuracyScore - hintPenalty + noHintBonus);

    this.broadcast("mystery_resolved", {
      teamVote: topVote,
      teamVoteName: this.state.suspects.find(s => s.id === topVote)?.name,
      isCorrect,
      culpritName: this.state.suspects.find(s => s.id === this.state.culpritId)?.name,
      accompliceName: this.state.accompliceId ? this.state.suspects.find(s => s.id === this.state.accompliceId)?.name : null,
      resolution: this.state.resolution,
      motive: this.storyData.solution.motive,
      method: this.storyData.solution.method,
      timeline: this.storyData.solution.timeline,
      score: finalScore,
      accuracy: accuracyScore,
      hintPenalty,
      noHintBonus,
      totalHints,
      message: isCorrect
        ? "🎉 CASE SOLVED! Your team cracked it! Brilliant detective work!"
        : "🤔 Not quite... but you gave it your best shot! The truth was hiding in plain sight.",
      secondaryMystery: this.storyData.secondary_mystery?.solution || null,
    });
  }

  // ─── Investigation Board ─────────────────────────────────

  private sendInvestigationBoard(client: Client) {
    const revealedClues = this.state.clues.filter(c => c.revealed);
    client.send("investigation_board", {
      title: this.state.title,
      currentAct: this.state.currentAct,
      suspects: this.state.suspects.map(s => ({
        id: s.id, name: s.name, role: s.role, motive: s.motive, alibi: s.alibi,
      })),
      clues: revealedClues.map(c => ({
        id: c.id, text: c.text, category: c.category, act: c.act, isRedHerring: c.isRedHerring,
      })),
      progress: {
        found: this.state.totalCluesFound,
        total: this.state.totalCluesAvailable,
        percentage: Math.round((this.state.totalCluesFound / this.state.totalCluesAvailable) * 100),
      },
    });
  }

  // ─── Utilities ───────────────────────────────────────────

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth radius in meters
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dp = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private generateJoinCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }
}
