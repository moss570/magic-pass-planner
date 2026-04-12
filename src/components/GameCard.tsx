import { motion } from "framer-motion";
import { Users, Clock, Star } from "lucide-react";

interface GameCardProps {
  emoji: string;
  name: string;
  description: string;
  players: string;
  time: string;
  gradient: string;
  glowColor: string;
  imageUrl?: string;
  badge?: string;
  onClick: () => void;
  delay?: number;
}

export default function GameCard({ emoji, name, description, players, time, gradient, glowColor, imageUrl, badge, onClick, delay = 0 }: GameCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ 
        scale: 1.04, 
        y: -8,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative cursor-pointer group"
    >
      {/* Glow effect behind card */}
      <div className={`absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300`}
        style={{ background: glowColor }} />
      
      {/* Card */}
      <div className={`relative overflow-hidden rounded-2xl ${gradient} p-[2px]`}>
        <div className="relative bg-[#0a0e1a]/90 backdrop-blur-sm rounded-[14px] p-5 h-full overflow-hidden">
          
          {/* Card Image */}
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt={name}
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300"
            />
          )}

          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl"
              style={{ background: glowColor }} />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl"
              style={{ background: glowColor }} />
          </div>

          {/* Card Image */}
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt={name}
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300"
            />
          )}

          {/* Badge */}
          {badge && (
            <div className="absolute top-3 right-3 z-20">
              <span className="px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-black text-[10px] font-black rounded-full uppercase tracking-wider">
                {badge}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="relative z-10">
            {/* Emoji with bounce */}
            <motion.div 
              className="text-5xl mb-3 filter drop-shadow-lg"
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: delay * 2 }}
            >
              {emoji}
            </motion.div>

            {/* Title */}
            <h3 className="text-xl font-black text-white mb-1 tracking-tight">{name}</h3>
            <p className="text-sm text-white/50 mb-4 leading-snug">{description}</p>

            {/* Stats */}
            <div className="flex gap-3 text-xs text-white/40 mb-4">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{players}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{time}</span>
            </div>

            {/* Play button */}
            <motion.div 
              className={`w-full py-2.5 rounded-xl text-center font-bold text-sm tracking-wide text-white/90 ${gradient}`}
              whileHover={{ filter: "brightness(1.2)" }}
            >
              PLAY NOW →
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
