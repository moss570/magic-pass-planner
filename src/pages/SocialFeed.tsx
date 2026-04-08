import { useState, useEffect } from "react";
import { Heart, ExternalLink, Star, Pin, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORY_COLORS: Record<string, string> = {
  deal: "bg-green-500/20 text-green-400",
  news: "bg-blue-500/20 text-blue-400",
  tip: "bg-yellow-500/20 text-yellow-400",
  event: "bg-purple-500/20 text-purple-400",
  entertainment: "bg-pink-500/20 text-pink-400",
  ap_exclusive: "bg-primary/20 text-primary",
};

const CATEGORY_LABELS: Record<string, string> = {
  deal: "💰 Deal",
  news: "📰 News",
  tip: "💡 Tip",
  event: "🎪 Event",
  entertainment: "🎬 Entertainment",
  ap_exclusive: "🎟️ AP Exclusive",
};

export default function SocialFeed() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const loadPosts = async () => {
    setLoading(true);
    let query = supabase.from("social_feed").select("*").eq("is_published", true).order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(30);
    if (filter !== "all") query = query.eq("category", filter);
    const { data } = await query;
    setPosts(data || []);
    setLoading(false);

    // Load liked posts from localStorage
    const liked = localStorage.getItem("magic-pass:liked-posts");
    if (liked) setLikedPosts(new Set(JSON.parse(liked)));
  };

  const likePost = async (postId: string, currentLikes: number) => {
    const newLiked = new Set(likedPosts);
    if (newLiked.has(postId)) {
      newLiked.delete(postId);
      await supabase.from("social_feed").update({ like_count: currentLikes - 1 }).eq("id", postId);
      setPosts(p => p.map(post => post.id === postId ? { ...post, like_count: post.like_count - 1 } : post));
    } else {
      newLiked.add(postId);
      await supabase.from("social_feed").update({ like_count: currentLikes + 1 }).eq("id", postId);
      setPosts(p => p.map(post => post.id === postId ? { ...post, like_count: post.like_count + 1 } : post));
    }
    setLikedPosts(newLiked);
    localStorage.setItem("magic-pass:liked-posts", JSON.stringify([...newLiked]));
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  };

  return (
    <DashboardLayout title="📢 Magic Pass Insider" subtitle="Deals, news, tips and Disney updates — straight from Clark">
      <div className="space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {["all", "deal", "ap_exclusive", "news", "tip", "entertainment", "event"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors ${filter === f ? "bg-primary text-[#080E1E] border-primary" : "border-white/10 text-muted-foreground"}`}>
              {f === "all" ? "All" : CATEGORY_LABELS[f] || f}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No posts yet. Check back soon!</p>
          </div>
        ) : posts.map(post => {
          const isLiked = likedPosts.has(post.id);
          return (
            <div key={post.id} className={`rounded-xl border overflow-hidden ${post.is_pinned ? "border-primary/30" : "border-white/8"}`} style={{ background: "#111827" }}>
              {post.is_pinned && (
                <div className="px-4 py-1.5 flex items-center gap-1.5" style={{ background: "rgba(245,200,66,0.1)" }}>
                  <Pin className="w-3 h-3 text-primary" />
                  <span className="text-xs font-semibold text-primary">Pinned Post</span>
                </div>
              )}
              <div className="p-4">
                {/* Author + category */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                      {post.author_emoji}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{post.author}</p>
                      <p className="text-xs text-muted-foreground">{post.author_role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CATEGORY_COLORS[post.category] || "bg-white/10 text-muted-foreground"}`}>
                      {CATEGORY_LABELS[post.category] || post.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="text-sm text-foreground leading-relaxed mb-3 whitespace-pre-line">
                  {post.content}
                </div>

                {/* Tags */}
                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.map((tag: string) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-muted-foreground">#{tag.replace(/\s+/g, "")}</span>
                    ))}
                  </div>
                )}

                {/* Link */}
                {post.link_url && (
                  <a href={post.link_url.startsWith("http") ? post.link_url : undefined}
                    onClick={!post.link_url.startsWith("http") ? () => window.location.href = post.link_url : undefined}
                    target={post.link_url.startsWith("http") ? "_blank" : undefined}
                    rel={post.link_url.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors mb-3">
                    <span className="text-sm font-semibold text-primary">{post.link_label || "Learn More"}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-primary" />
                  </a>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button onClick={() => likePost(post.id, post.like_count)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${isLiked ? "text-red-400" : "text-muted-foreground hover:text-red-400"}`}>
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-red-400" : ""}`} />
                    {post.like_count} {post.like_count === 1 ? "like" : "likes"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
