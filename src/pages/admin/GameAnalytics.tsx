import { useState, useEffect } from "react";
import { Gamepad2, RefreshCw, TrendingUp, Clock, Users, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

export default function GameAnalytics() {
  const [loading, setLoading] = useState(false);
  const [gameStats, setGameStats] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await (supabase.from("game_sessions" as any)
        .select("game_id, game_name, score, duration_seconds, completed, created_at") as any)
        .order("created_at", { ascending: false })
        .limit(500);
      const stats: Record<string, any> = {};
      (data || []).forEach((s: any) => {
        if (!stats[s.game_id]) stats[s.game_id] = { game_id: s.game_id, game_name: s.game_name || s.game_id, plays: 0, completions: 0, totalScore: 0, totalDuration: 0 };
        stats[s.game_id].plays++;
        if (s.completed) stats[s.game_id].completions++;
        stats[s.game_id].totalScore += s.score || 0;
        stats[s.game_id].totalDuration += s.duration_seconds || 0;
      });
      setGameStats(Object.values(stats).map((s: any) => ({
        ...s,
        avgScore: s.plays > 0 ? Math.round(s.totalScore / s.plays) : 0,
        avgDuration: s.plays > 0 ? Math.round(s.totalDuration / s.plays) : 0,
        completionRate: s.plays > 0 ? Math.round((s.completions / s.plays) * 100) : 0,
      })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Gamepad2 className="w-5 h-5 text-primary" /> Game Analytics</h1>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {gameStats.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-border/50 bg-card">
            <Gamepad2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No game sessions recorded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameStats.map(g => (
              <div key={g.game_id} className="rounded-xl border border-border/50 p-5 bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <Gamepad2 className="w-4 h-4 text-primary" />
                  <p className="text-sm font-bold text-foreground">{g.game_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total Plays", value: g.plays, icon: Users, color: "text-blue-400" },
                    { label: "Completion Rate", value: `${g.completionRate}%`, icon: TrendingUp, color: "text-green-400" },
                    { label: "Avg Score", value: g.avgScore, icon: Star, color: "text-primary" },
                    { label: "Avg Duration", value: `${g.avgDuration}s`, icon: Clock, color: "text-purple-400" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2">
                      <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                      <div>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
