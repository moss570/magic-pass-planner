/**
 * Generate game card art using DALL-E 3
 * Requires: npm install openai
 * Usage: VITE_OPENAI_API_KEY=sk-proj-... node scripts/generate-game-art.js
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

const games = [
  {
    id: "trivia",
    name: "Trivia",
    prompt: "A vibrant game card illustration for a trivia quiz game. Features a glowing lightbulb in the center with colorful quiz question marks floating around it. Bold, modern style with red and orange gradients. Game show aesthetic. High quality, game card design."
  },
  {
    id: "bingo",
    name: "Bingo",
    prompt: "A colorful bingo card game illustration with 5x5 grid pattern visible. Features golden balls with numbers bouncing around. Green and teal color scheme. Jackpot-style arcade aesthetic. Celebratory mood. Vibrant, game card quality."
  },
  {
    id: "who-did-it",
    name: "Who Did It?",
    prompt: "A mystery detective game card. Features a magnifying glass with shadowy suspects silhouettes behind it. Purple and violet color scheme. Noir detective atmosphere with modern twist. Puzzle-solving vibe. Game card quality."
  },
  {
    id: "would-you-rather",
    name: "Would You Rather",
    prompt: "A split-screen game card showing two contrasting scenarios. Left and right sides with different vibrant colors (blue and indigo). Thought bubble symbols. Choice and decision theme. Modern, clean design. Game card quality."
  },
  {
    id: "picture-perfect",
    name: "Picture Perfect",
    prompt: "An artistic game card featuring a paintbrush and canvas with colorful brush strokes. Pink and rose color scheme. Creative, playful art style. Sketch and drawing aesthetic. Imagination theme. Game card quality."
  },
  {
    id: "song-lyric",
    name: "Song Lyric",
    prompt: "A music-themed game card with musical notes and a microphone. Amber and orange color scheme. Concert stage lighting effects. Melodic, energetic vibe. Music festival aesthetic. Game card quality."
  },
  {
    id: "geography",
    name: "Geography",
    prompt: "A world map game card with globe and landmarks. Green and emerald color scheme. Famous world monuments visible. Global travel theme. Adventure aesthetic. Game card quality."
  },
  {
    id: "spy-word",
    name: "Spy Word",
    prompt: "A spy game card with hidden words in a grid pattern. Cyan and blue color scheme. Secret agent, espionage atmosphere. Silhouettes and covert theme. Modern thriller aesthetic. Game card quality."
  },
  {
    id: "haaaa",
    name: "HAAAA!",
    prompt: "A hilarious bluffing game card with laughing face and joke elements. Teal and green color scheme. Comedy club lights, playful and silly mood. Party atmosphere. Fun, expressive design. Game card quality."
  },
  {
    id: "linemind",
    name: "Line Mind",
    prompt: "A mind-reading game card with thought bubbles and connected neurons. Violet and purple color scheme. Brain imagery, psychic vibes. Mental connection theme. Mysterious yet playful. Game card quality."
  },
  {
    id: "mystery-case",
    name: "Mystery Case",
    prompt: "A detective case file game card with classified stamps, clues, and evidence. Amber and yellow color scheme. Vintage investigation folder aesthetic. Cryptic, intriguing mood. Mystery unfolding theme. Game card quality."
  }
];

async function generateArt() {
  const outDir = path.join(__dirname, "../public/game-art");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const game of games) {
    const filepath = path.join(outDir, `${game.id}.png`);
    
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  ${game.name}: already exists, skipping`);
      continue;
    }

    try {
      console.log(`🎨 Generating ${game.name}...`);
      const response = await client.images.generate({
        prompt: game.prompt,
        model: "dall-e-3",
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const imageUrl = response.data[0].url;
      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.arrayBuffer();
      fs.writeFileSync(filepath, Buffer.from(buffer));
      console.log(`✅ ${game.name} → ${filepath}`);
    } catch (error) {
      console.error(`❌ ${game.name}: ${error.message}`);
    }
  }

  console.log("\n🎉 Art generation complete!");
}

generateArt();
