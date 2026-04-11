// AI Avatar Generation — Uses DiceBear API (free, no API key needed)
// Family-friendly, non-Disney, procedural avatars

const STYLES = [
  "adventurer",
  "adventurer-neutral", 
  "avataaars",
  "big-ears",
  "big-smile",
  "bottts",
  "fun-emoji",
  "lorelei",
  "micah",
  "miniavs",
  "personas",
  "pixel-art",
];

const BACKGROUNDS = [
  "b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf",
  "a3e4d7", "f9e79f", "f5b7b1", "aed6f1", "d7bde2",
];

export function generateAvatar(seed?: string, style?: string): string {
  const s = style || STYLES[Math.floor(Math.random() * STYLES.length)];
  const seedVal = seed || Math.random().toString(36).substring(2, 10);
  const bg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
  return `https://api.dicebear.com/7.x/${s}/svg?seed=${seedVal}&backgroundColor=${bg}&radius=50`;
}

export function generateAvatarSet(count: number = 12): string[] {
  return Array.from({ length: count }, (_, i) => 
    generateAvatar(`player-${i}-${Date.now()}`, STYLES[i % STYLES.length])
  );
}

export const AVATAR_STYLES = STYLES;
