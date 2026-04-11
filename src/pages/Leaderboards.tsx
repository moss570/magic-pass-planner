import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, User, Medal, Crown, Star } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const GAME_TYPES = [
  { id: "all", label: "All Games", emoji: "🎮" },
  { id: "trivia", label: "Trivia", emoji: "🎓" },
  { id: "bingo", label: "Bingo", emoji: "🎲" },
  { id: "who-did-it", label: "Who Did It?", emoji: "🕵️" },
  { id: "would-you-rather", label: "Would You Rather", emoji: "🤔" },
  { id: "picture-perfect", label: "Picture Perfect", emoji: "🎨" },
  { id: "song-lyric", label: "Song Lyric", emoji: "🎵" },
  { id: "geography", label: "Geography", emoji: "🌍" },
  { id: "spy-word", label: "Spy Word", emoji: "🕵️" },
  { id: "haaaa", label: "HAAAA!", emoji: "😂" },
  { id: "linemind", label: "Line Mind", emoji: "🎯" },
];

const TABS = [
  { id: "global", label: "Global", icon: Trophy },
  { id: "friends", label: "Friends", icon: Users },
  { id: "personal", label: "Personal", icon: User },
];

const RANK_BADGES = ["👑", "🥈", "🥉"];

export default function Leaderboards() {
  const { user } = useAuth();
  const [tab, setTab] = useState("global");
  const [gameFilter, setGameFilter] = useState("all");
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScores();
  }, [tab, gameFilter, user]);

  const fetchScores = async () => {
    setLoading(true);
    let query = supabase.from("game_high_scores")
      .select("*, user:users_profile(username, first_name)")
      .order("final_score", { ascending: false })
      .limit(100);

    if (gameFilter !== "all") query = query.eq("game_type", gameFilter);

    if (tab === "personal" && user) {
      query = query.eq("user_id", user.id);
    }

    const { data } = await query;
    setScores(data || []);
    setLoading(false);
  };

  return (
    <DashboardLayout title="🏆 Leaderboards" subtitle="Compete globally, track your bests">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-white/10 text-white/60 hover:text-white"}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Game Filter */}
        <div className="flex flex-wrap gap-2">
          {GAME_TYPES.map(g => (
            <button key={g.id} onClick={() => setGameFilter(g.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                gameFilter === g.id ? "bg-yellow-500 text-black" : "bg-white/10 text-white/60 hover:text-white"}`}>
              {g.emoji} {g.label}
            </button>
          ))}
        </div>

        {/* Scores */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-white/40">Loading scores...</div>
          ) : scores.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">No scores yet. Play a game to get on the board!</p>
            </div>
          ) : (
            scores.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  i < 3 ? "bg-yellow-500/5 border-yellow-500/20" : "bg-white/5 border-white/10"}`}>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-black w-8 text-center">
                    {i < 3 ? RANK_BADGES[i] : <span className="text-white/40">{i + 1}</span>}
                  </span>
                  <div>
                    <p className="font-bold text-white">
                      {s.user?.username || s.user?.first_name || "Anonymous"}
                    </p>
                    <p className="text-xs text-white/40">
                      {GAME_TYPES.find(g => g.id === s.game_type)?.emoji} {s.game_type} • {s.difficulty || "normal"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-yellow-400">{s.final_score?.toLocaleString()}</p>
                  <p className="text-xs text-white/30">{new Date(s.achieved_at).toLocaleDateString()}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
