import { saveHighScore } from "@/lib/gameScores";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Music } from "lucide-react";
import ConfettiEffect from "@/components/ConfettiEffect";

const SONGS = [
  { lyric: "Is this the real life? Is this just ___?", answer: "fantasy", options: ["fantasy","reality","a dream","imaginary"], song: "Bohemian Rhapsody", artist: "Queen" },
  { lyric: "Just a small town girl, living in a ___ world", answer: "lonely", options: ["lonely","crazy","happy","busy"], song: "Don't Stop Believin'", artist: "Journey" },
  { lyric: "I got my mind set on ___, I got my mind set on you", answer: "you", options: ["you","gold","love","free"], song: "Got My Mind Set On You", artist: "George Harrison" },
  { lyric: "We will, we will ___ you!", answer: "rock", options: ["rock","love","find","get"], song: "We Will Rock You", artist: "Queen" },
  { lyric: "Sweet ___ of mine", answer: "child", options: ["child","love","dream","heart"], song: "Sweet Child O' Mine", artist: "Guns N' Roses" },
  { lyric: "I will always ___ you", answer: "love", options: ["love","need","find","miss"], song: "I Will Always Love You", artist: "Whitney Houston" },
  { lyric: "Every breath you take, every ___ you make", answer: "move", options: ["move","step","choice","sound"], song: "Every Breath You Take", artist: "The Police" },
  { lyric: "Hit me baby one more ___", answer: "time", options: ["time","day","chance","way"], song: "Baby One More Time", artist: "Britney Spears" },
  { lyric: "I'm walking on ___", answer: "sunshine", options: ["sunshine","air","water","clouds"], song: "Walking on Sunshine", artist: "Katrina & The Waves" },
  { lyric: "Another one bites the ___", answer: "dust", options: ["dust","road","bullet","ground"], song: "Another One Bites the Dust", artist: "Queen" },
  { lyric: "Don't stop ___ in tomorrow", answer: "believin'", options: ["believin'","living","thinking","dreaming"], song: "Don't Stop Believin'", artist: "Journey" },
  { lyric: "I want to break ___", answer: "free", options: ["free","out","through","away"], song: "I Want to Break Free", artist: "Queen" },
  { lyric: "We are the ___ of the world", answer: "champions", options: ["champions","children","future","hope"], song: "We Are The Champions", artist: "Queen" },
  { lyric: "Living on a ___", answer: "prayer", options: ["prayer","dream","wire","edge"], song: "Livin' on a Prayer", artist: "Bon Jovi" },
  { lyric: "Take me to the place I ___", answer: "love", options: ["love","know","need","dream"], song: "Under the Bridge", artist: "Red Hot Chili Peppers" },
];

export default function SongLyricGame({ onClose }: { onClose: () => void }) {
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string|null>(null);
  const [correct, setCorrect] = useState<boolean|null>(null);
  const [gameOver, setGameOver] = useState(false);

  const q = SONGS[qIdx];

  const pick = (answer: string) => {
    if (picked) return;
    setPicked(answer);
    const isCorrect = answer === q.answer;
    setCorrect(isCorrect);
    if (isCorrect) setScore(s => s + 25);

    setTimeout(() => {
      setPicked(null);
      setCorrect(null);
      if (qIdx < SONGS.length - 1) setQIdx(i => i + 1);
      else { setGameOver(true); saveHighScore("song-lyric", score + (answer === q.answer ? 25 : 0), "normal", true); }
    }, 1500);
  };

  if (gameOver) {
    return (
      <div className="min-h-screen bg-[#060a14] p-4 flex items-center justify-center relative overflow-hidden">
      <><div className="absolute inset-0 bg-black/60 pointer-events-none" /><div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/3 w-72 h-72 rounded-full blur-[100px] opacity-20 bg-amber-500" />
      </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 rounded-xl bg-black/40 border border-yellow-500/30 max-w-md w-full">
          <ConfettiEffect trigger={score >= 200} />
          <Music className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <p className="text-2xl font-bold text-white mb-2">Game Over!</p>
          <p className="text-4xl font-black text-yellow-400 mb-6">{score}/{SONGS.length * 25} points</p>
          <button onClick={onClose} className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg">Back to Games</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a14] p-4 relative overflow-hidden">
      <><div className="absolute inset-0 bg-black/60 pointer-events-none" /><div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/3 w-72 h-72 rounded-full blur-[100px] opacity-20 bg-amber-500" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full blur-[100px] opacity-15 bg-orange-400" />
      </div>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="text-white/70 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-red-400">🎵 Song Lyric</h1>
          <p className="text-sm text-white/60">{qIdx+1}/{SONGS.length}</p>
        </div>

        <p className="text-center text-sm text-yellow-400 mb-2">Score: {score}</p>

        <div className="bg-black/30 rounded-xl p-6 border border-yellow-500/20 mb-6 text-center">
          <Music className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
          <p className="text-xl font-bold text-white leading-relaxed">"{q.lyric}"</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {q.options.map(opt => (
            <motion.button key={opt} whileTap={{ scale: 0.95 }} onClick={() => pick(opt)}
              className={`p-4 rounded-xl font-bold text-lg transition-all border-2
                ${picked === opt ? (opt === q.answer ? "bg-green-500/30 border-green-500 text-green-300" : "bg-red-500/30 border-red-500 text-red-300") :
                  picked && opt === q.answer ? "bg-green-500/30 border-green-500 text-green-300" :
                  "bg-white/10 border-white/10 text-white hover:bg-white/20"}`}>
              {opt}
            </motion.button>
          ))}
        </div>

        {picked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-4 text-center text-sm text-white/60">
            "{q.song}" — {q.artist}
          </motion.div>
        )}
      </div>
    </div>
  );
}
