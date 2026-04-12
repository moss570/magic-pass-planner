/**
 * Generate FULL game visual assets using DALL-E 3
 * - 11 game card illustrations
 * - 11 game background images
 * - 2 reusable character illustrations (theme park tourists)
 * - UI decorative elements
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { OpenAI } from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiKey = process.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.error("❌ VITE_OPENAI_API_KEY not found in environment");
  process.exit(1);
}

const client = new OpenAI({ apiKey });

const assets = {
  characters: [
    {
      id: "character-happy-tourist-1",
      name: "Happy Tourist 1",
      prompt: "A cheerful male tourist at a theme park, age 30s, wearing colorful vacation clothes - bright Hawaiian shirt, shorts, sunglasses on his head. Big genuine smile, holding a park map. Illustration style, vibrant colors, friendly and approachable. Theme park balloons and fun atmosphere in background. High quality character art."
    },
    {
      id: "character-happy-tourist-2", 
      name: "Happy Tourist 2",
      prompt: "A cheerful female tourist at a theme park, age 30s, wearing summer vacation outfit - colorful sundress, sun hat, excited expression. Wide smile, holding a drink with park colors. Illustration style, vibrant and playful. Theme park magic castle visible in background. High quality character art, approachable and fun."
    }
  ],
  gameCards: [
    { id: "trivia", prompt: "Premium game card for Trivia game. Glowing lightbulb center, colorful question marks floating around. Red-orange gradient. Game show stage lights. Bold 3D perspective. High quality illustration." },
    { id: "bingo", prompt: "Premium game card for Bingo. 5x5 grid with golden balls bouncing. Green-teal colors. Jackpot explosion effect. Celebratory confetti. Arcade style. High quality illustration." },
    { id: "who-did-it", prompt: "Premium game card for Who Did It? Detective theme. Magnifying glass with suspects. Purple-violet noir style. Mystery atmosphere. Detective hat visible. High quality illustration." },
    { id: "would-you-rather", prompt: "Premium game card for Would You Rather. Split screen with contrasting scenarios. Blue-indigo. Thought bubbles and choice symbols. Modern minimalist. High quality illustration." },
    { id: "picture-perfect", prompt: "Premium game card for Picture Perfect. Paintbrush and canvas with colorful strokes. Pink-rose palette. Artist palette visible. Creative energy. High quality illustration." },
    { id: "song-lyric", prompt: "Premium game card for Song Lyric. Microphone and musical notes. Amber-orange stage lights. Concert atmosphere. Music waves. High quality illustration." },
    { id: "geography", prompt: "Premium game card for Geography. Globe with landmarks - pyramids, Eiffel Tower, Big Ben. Green-emerald. World map. Adventure theme. High quality illustration." },
    { id: "spy-word", prompt: "Premium game card for Spy Word. Word grid with hidden words highlighted. Cyan-blue. Secret agent silhouettes. Covert theme. High quality illustration." },
    { id: "haaaa", prompt: "Premium game card for HAAAA! Laughing faces and joke bubbles. Teal-green. Comedy theater lights. Party poppers. Fun expressive style. High quality illustration." },
    { id: "linemind", prompt: "Premium game card for Line Mind. Connected thought bubbles and brain neurons. Violet-purple. Psychic energy waves. Mysterious. High quality illustration." },
    { id: "mystery-case", prompt: "Premium game card for Mystery Case. Detective case file with stamps and clues. Amber-yellow. Classified marking. Vintage investigation aesthetic. High quality illustration." }
  ],
  gameBackgrounds: [
    { id: "bg-trivia", prompt: "Full-screen game background for Trivia. Dark cinematic theater stage. Red curtain with gold trim. Spotlight effect. Quiz board visible. Professional game show set. 1920x1080." },
    { id: "bg-bingo", prompt: "Full-screen game background for Bingo. Vegas casino style. Green felt. Golden ball machine visible. Jackpot lights. Celebratory atmosphere. Dark elegant. 1920x1080." },
    { id: "bg-who-did-it", prompt: "Full-screen game background for Who Did It? Dark noir detective office. Dim lamp light. Suspect profiles on walls. Mystery board with red strings. Classic detective aesthetic. 1920x1080." },
    { id: "bg-would-you-rather", prompt: "Full-screen game background for Would You Rather. Modern minimalist. Split blue-purple colors. Choice doors opening. Clean geometric design. Contemporary feel. 1920x1080." },
    { id: "bg-picture-perfect", prompt: "Full-screen game background for Picture Perfect. Artist studio. Paint splashes. Canvas frames. Easels. Colorful palette scattered. Creative energy. Warm lighting. 1920x1080." },
    { id: "bg-song-lyric", prompt: "Full-screen game background for Song Lyric. Concert stage. Microphone stand center. Stage lights beaming. Amplifiers. Musical equipment. High energy. Dark with neon. 1920x1080." },
    { id: "bg-geography", prompt: "Full-screen game background for Geography. World travel collage. Landmarks scattered. Passport stamps. Map texture. Global adventure theme. Warm earthy tones. 1920x1080." },
    { id: "bg-spy-word", prompt: "Full-screen game background for Spy Word. Secret intelligence agency office. Surveillance monitors. Document walls. Code screens. Dark cyber aesthetic. Classified atmosphere. 1920x1080." },
    { id: "bg-haaaa", prompt: "Full-screen game background for HAAAA! Comedy club stage. Red velvet curtains. Spotlight on stage. Microphone. Laugh track visuals. Party atmosphere. Vibrant neon. 1920x1080." },
    { id: "bg-linemind", prompt: "Full-screen game background for Line Mind. Psychic medium parlor. Crystal ball center. Mystical energy waves. Tarot cards. Purple ambient light. Mysterious ethereal. 1920x1080." },
    { id: "bg-mystery-case", prompt: "Full-screen game background for Mystery Case. Detective bureau. Filing cabinets. Evidence boards. Clue maps. Bulletin board wall. Investigation room. Vintage-modern hybrid. 1920x1080." }
  ]
};

async function generateAssets() {
  const publicDir = path.join(__dirname, "../public");
  const dirsToCreate = [
    path.join(publicDir, "game-cards"),
    path.join(publicDir, "game-backgrounds"),
    path.join(publicDir, "game-characters")
  ];

  dirsToCreate.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  // Generate characters
  console.log("\n🎭 GENERATING CHARACTERS...");
  for (const char of assets.characters) {
    const filepath = path.join(publicDir, "game-characters", `${char.id}.png`);
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  ${char.name}: exists`);
      skipped++;
      continue;
    }
    try {
      console.log(`🎨 ${char.name}...`);
      const response = await client.images.generate({
        prompt: char.prompt,
        model: "dall-e-3",
        n: 1,
        size: "1024x1024",
        quality: "standard"
      });
      const imageUrl = response.data[0].url;
      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.arrayBuffer();
      fs.writeFileSync(filepath, Buffer.from(buffer));
      console.log(`✅ ${char.name}`);
      generated++;
    } catch (error) {
      console.error(`❌ ${char.name}: ${error.message}`);
      failed++;
    }
  }

  // Generate game cards
  console.log("\n🎮 GENERATING GAME CARDS...");
  for (const card of assets.gameCards) {
    const filepath = path.join(publicDir, "game-cards", `${card.id}.png`);
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  ${card.id}: exists`);
      skipped++;
      continue;
    }
    try {
      console.log(`🎨 ${card.id}...`);
      const response = await client.images.generate({
        prompt: card.prompt,
        model: "dall-e-3",
        n: 1,
        size: "1024x1024",
        quality: "standard"
      });
      const imageUrl = response.data[0].url;
      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.arrayBuffer();
      fs.writeFileSync(filepath, Buffer.from(buffer));
      console.log(`✅ ${card.id}`);
      generated++;
    } catch (error) {
      console.error(`❌ ${card.id}: ${error.message}`);
      failed++;
    }
  }

  // Generate backgrounds
  console.log("\n🖼️  GENERATING BACKGROUNDS...");
  for (const bg of assets.gameBackgrounds) {
    const filepath = path.join(publicDir, "game-backgrounds", `${bg.id}.jpg`);
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  ${bg.id}: exists`);
      skipped++;
      continue;
    }
    try {
      console.log(`🎨 ${bg.id}...`);
      const response = await client.images.generate({
        prompt: bg.prompt,
        model: "dall-e-3",
        n: 1,
        size: "1024x1024",
        quality: "standard"
      });
      const imageUrl = response.data[0].url;
      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.arrayBuffer();
      fs.writeFileSync(filepath, Buffer.from(buffer));
      console.log(`✅ ${bg.id}`);
      generated++;
    } catch (error) {
      console.error(`❌ ${bg.id}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 SUMMARY:`);
  console.log(`✅ Generated: ${generated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\n🎉 Asset generation complete!`);
}

generateAssets().catch(console.error);
