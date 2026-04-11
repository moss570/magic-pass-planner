import { useState } from "react";
import { motion } from "framer-motion";
import { generateAvatar, AVATAR_STYLES } from "@/lib/avatars";
import { Check } from "lucide-react";

interface AvatarPickerProps {
  onSelect: (url: string) => void;
  selected?: string;
}

export default function AvatarPicker({ onSelect, selected }: AvatarPickerProps) {
  const [seed] = useState(() => Math.random().toString(36).substring(2, 8));
  const avatars = AVATAR_STYLES.map((style, i) => ({
    url: generateAvatar(`${seed}-${i}`, style),
    style,
  }));

  return (
    <div>
      <p className="text-xs text-white/60 mb-3">Choose your avatar</p>
      <div className="grid grid-cols-4 gap-3">
        {avatars.map((a, i) => (
          <motion.button key={i} whileTap={{ scale: 0.9 }}
            onClick={() => onSelect(a.url)}
            className={`relative rounded-xl p-1 transition-all border-2 ${
              selected === a.url ? "border-primary bg-primary/10" : "border-transparent hover:border-white/20"}`}>
            <img src={a.url} alt={a.style} className="w-full aspect-square rounded-lg" />
            {selected === a.url && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-black" />
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
