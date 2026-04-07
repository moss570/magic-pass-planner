import { useState, useEffect } from "react";
import { Send, UserPlus, Flag, Ban, MessageSquare, Image as ImageIcon, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  post_type: string;
  created_at: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  membership_category?: string;
}

export default function Feed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [posting, setPosting] = useState(false);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [pendingSent, setPendingSent] = useState<Set<string>>(new Set());

  const loadPosts = async () => {
    setLoading(true);
    try {
      // Load posts
      const { data: postsData } = await (supabase.from("social_posts" as any).select("*") as any)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50);

      // Load blocked users
      const { data: blocks } = await (supabase.from("user_blocks" as any).select("blocked_id") as any)
        .eq("blocker_id", user?.id);
      const blockSet = new Set((blocks || []).map((b: any) => b.blocked_id));
      setBlockedIds(blockSet);

      // Load friends
      const { data: friendships1 } = await supabase.from("friendships").select("user_id_2").eq("user_id_1", user?.id || "");
      const { data: friendships2 } = await supabase.from("friendships").select("user_id_1").eq("user_id_2", user?.id || "");
      const fIds = new Set([
        ...(friendships1 || []).map(f => f.user_id_2),
        ...(friendships2 || []).map(f => f.user_id_1),
      ]);
      setFriendIds(fIds);

      // Load pending sent requests
      const { data: sentReqs } = await supabase.from("friend_requests").select("to_user_id").eq("from_user_id", user?.id || "").eq("status", "pending");
      setPendingSent(new Set((sentReqs || []).map(r => r.to_user_id).filter(Boolean) as string[]));

      // Enrich posts with user profiles
      const enriched: Post[] = [];
      for (const post of (postsData || [])) {
        if (blockSet.has(post.user_id)) continue; // filter blocked
        const { data: profile } = await supabase.from("users_profile").select("username, first_name, last_name, membership_category").eq("id", post.user_id).single();
        enriched.push({
          ...post,
          username: profile?.username || undefined,
          first_name: profile?.first_name || undefined,
          last_name: profile?.last_name || undefined,
          membership_category: (profile as any)?.membership_category || undefined,
        });
      }
      setPosts(enriched);
    } catch (err) {
      console.error("Feed load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) loadPosts(); }, [user]);

  const createPost = async () => {
    if (!newContent.trim() || !user) return;
    setPosting(true);
    try {
      const { error } = await (supabase.from("social_posts" as any).insert({
        user_id: user.id,
        content: newContent.trim(),
        image_url: newImageUrl.trim() || null,
        post_type: "user",
      }) as any);
      if (error) throw error;
      setNewContent("");
      setNewImageUrl("");
      toast({ title: "✅ Posted!" });
      loadPosts();
    } catch (err) {
      toast({ title: "Failed to post", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const sendFriendRequest = async (toUserId: string) => {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from("users_profile").select("first_name, last_name").eq("id", user.id).single();
      const fromName = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "A Magic Pass user";
      await supabase.from("friend_requests").insert({
        from_user_id: user.id,
        to_user_id: toUserId,
        from_name: fromName,
        status: "pending",
      });
      // Also send an inbox notification
      await (supabase.from("messages" as any).insert({
        sender_id: user.id,
        receiver_id: toUserId,
        content: `${fromName} sent you a friend request!`,
        message_type: "system",
      }) as any);
      setPendingSent(prev => new Set(prev).add(toUserId));
      toast({ title: "✅ Friend request sent!" });
    } catch {
      toast({ title: "Failed to send request", variant: "destructive" });
    }
  };

  const blockUser = async (blockedId: string) => {
    if (!user || !confirm("Block this user? You won't see their posts or messages.")) return;
    try {
      await (supabase.from("user_blocks" as any).insert({
        blocker_id: user.id,
        blocked_id: blockedId,
      }) as any);
      setBlockedIds(prev => new Set(prev).add(blockedId));
      setPosts(prev => prev.filter(p => p.user_id !== blockedId));
      toast({ title: "User blocked" });
    } catch {
      toast({ title: "Failed to block user", variant: "destructive" });
    }
  };

  const MEMBERSHIP_BADGES: Record<string, { label: string; color: string }> = {
    "Annual Passholder": { label: "🎟️ AP", color: "bg-primary/20 text-primary" },
    "DVC Member": { label: "🏰 DVC", color: "bg-purple-500/20 text-purple-400" },
    "Out of State Traveler": { label: "✈️ Traveler", color: "bg-blue-500/20 text-blue-400" },
  };

  return (
    <DashboardLayout title="📱 Social Feed" subtitle="Connect with the Magic Pass community">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* New post composer */}
        <div className="rounded-xl border border-white/8 p-4" style={{ background: "var(--card)" }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 space-y-3">
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Share a tip, photo, or Disney moment..."
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40 resize-none"
                style={{ background: "var(--muted)", minHeight: 80 }}
                maxLength={500}
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  placeholder="Image URL (optional)"
                  className="flex-1 px-3 py-2 rounded-lg border border-white/10 text-xs text-foreground focus:outline-none focus:border-primary/40"
                  style={{ background: "var(--muted)" }}
                />
                <button
                  onClick={createPost}
                  disabled={posting || !newContent.trim()}
                  className="px-4 py-2 rounded-lg font-bold text-sm text-[var(--background)] disabled:opacity-50 flex items-center gap-1.5"
                  style={{ background: "#F5C842" }}
                >
                  {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts feed */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">No posts yet</p>
            <p className="text-xs text-muted-foreground">Be the first to share something with the community!</p>
          </div>
        ) : (
          posts.map(post => {
            const isSelf = post.user_id === user?.id;
            const isFriend = friendIds.has(post.user_id);
            const isPendingSent = pendingSent.has(post.user_id);
            const displayName = post.username || `${post.first_name || ""} ${post.last_name || ""}`.trim() || "Magic Pass User";
            const badge = post.membership_category ? MEMBERSHIP_BADGES[post.membership_category] : null;

            return (
              <div key={post.id} className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "var(--card)" }}>
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {(post.first_name?.[0] || post.username?.[0] || "?").toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground">{displayName}</p>
                          {badge && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badge.color}`}>
                              {badge.label}
                            </span>
                          )}
                          {post.post_type === "admin" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-yellow-500/20 text-yellow-400">
                              ⭐ Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString()} · {new Date(post.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    {/* Actions menu */}
                    {!isSelf && (
                      <div className="flex gap-1">
                        {!isFriend && !isPendingSent && (
                          <button
                            onClick={() => sendFriendRequest(post.user_id)}
                            className="text-xs px-3 py-1.5 rounded-lg font-bold text-[var(--background)] flex items-center gap-1"
                            style={{ background: "#F5C842" }}
                          >
                            <UserPlus className="w-3 h-3" /> Connect
                          </button>
                        )}
                        {isPendingSent && (
                          <span className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground font-semibold">
                            ⏳ Pending
                          </span>
                        )}
                        {isFriend && (
                          <span className="text-xs px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 font-semibold">
                            ✅ Friends
                          </span>
                        )}
                        <button
                          onClick={() => blockUser(post.user_id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Block user"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <p className="text-sm text-foreground leading-relaxed mb-3">{post.content}</p>

                  {/* Image */}
                  {post.image_url && (
                    <div className="rounded-lg overflow-hidden mb-3">
                      <img src={post.image_url} alt="Post" className="w-full max-h-96 object-cover" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
