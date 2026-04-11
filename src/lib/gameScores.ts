import { supabase } from "@/integrations/supabase/client";

export async function saveHighScore(
  gameType: string,
  finalScore: number,
  difficulty: string = "normal",
  soloMode: boolean = true
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || finalScore <= 0) return;

  // Save score
  await supabase.from("game_high_scores").insert({
    user_id: user.id,
    game_type: gameType,
    final_score: finalScore,
    difficulty,
    solo_mode: soloMode,
    is_personal_best: false,
  });

  // Check if personal best
  const { data: best } = await supabase.from("game_high_scores")
    .select("final_score")
    .eq("user_id", user.id)
    .eq("game_type", gameType)
    .order("final_score", { ascending: false })
    .limit(1)
    .single();

  if (best && best.final_score <= finalScore) {
    // Mark as personal best
    await supabase.from("game_high_scores")
      .update({ is_personal_best: true })
      .eq("user_id", user.id)
      .eq("game_type", gameType)
      .eq("final_score", finalScore);
  }

  // Check if top 20 globally — auto-post to Social Feed
  const { data: topScores } = await supabase.from("game_high_scores")
    .select("final_score")
    .eq("game_type", gameType)
    .order("final_score", { ascending: false })
    .limit(20);

  if (topScores && topScores.length > 0) {
    const threshold = topScores[topScores.length - 1]?.final_score || 0;
    if (finalScore >= threshold) {
      // Get username
      const { data: profile } = await supabase.from("users_profile")
        .select("username, first_name")
        .eq("id", user.id)
        .single();

      const displayName = profile?.username || profile?.first_name || "A Magic Pass player";

      await supabase.from("social_feed").insert({
        author: "Clark Kent",
        author_role: "Magic Pass Games",
        author_emoji: "🏆",
        content: `🏆 NEW HIGH SCORE! ${displayName} just scored ${finalScore.toLocaleString()} points in ${gameType}! Can you beat it? 🎮`,
        category: "community",
        post_type: "clark",
        tags: ["high-score", gameType],
        is_published: true,
      });
    }
  }

  return { personalBest: best?.final_score || 0, newScore: finalScore };
}
