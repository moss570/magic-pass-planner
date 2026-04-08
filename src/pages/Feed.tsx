import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PostComposer from "@/components/feed/PostComposer";
import PostCard from "@/components/feed/PostCard";

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
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [pendingSent, setPendingSent] = useState<Set<string>>(new Set());

  const loadPosts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: postsData } = await supabase
        .from("social_posts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50);

      const { data: blocks } = await supabase
        .from("user_blocks")
        .select("blocked_id")
        .eq("blocker_id", user.id);
      const blockSet = new Set<string>((blocks || []).map((b: any) => b.blocked_id));
      setBlockedIds(blockSet);

      const { data: f1 } = await supabase.from("friendships").select("user_id_2").eq("user_id_1", user.id);
      const { data: f2 } = await supabase.from("friendships").select("user_id_1").eq("user_id_2", user.id);
      setFriendIds(new Set([
        ...(f1 || []).map(f => f.user_id_2),
        ...(f2 || []).map(f => f.user_id_1),
      ]));

      const { data: sentReqs } = await supabase.from("friend_requests").select("to_user_id").eq("from_user_id", user.id).eq("status", "pending");
      setPendingSent(new Set((sentReqs || []).map(r => r.to_user_id).filter(Boolean) as string[]));

      const enriched: Post[] = [];
      for (const post of postsData || []) {
        if (blockSet.has(post.user_id)) continue;
        const { data: profile } = await supabase.from("users_profile").select("first_name, last_name, username, membership_category").eq("id", post.user_id).single();
        enriched.push({
          ...post,
          username: profile?.username || undefined,
          first_name: profile?.first_name || undefined,
          last_name: profile?.last_name || undefined,
          membership_category: profile?.membership_category || undefined,
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
      await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: toUserId,
        content: `${fromName} sent you a friend request!`,
        message_type: "system",
      });
      setPendingSent(prev => new Set(prev).add(toUserId));
      toast({ title: "✅ Friend request sent!" });
    } catch {
      toast({ title: "Failed to send request", variant: "destructive" });
    }
  };

  const blockUser = async (blockedId: string) => {
    if (!user || !confirm("Block this user? You won't see their posts or messages.")) return;
    try {
      await supabase.from("user_blocks").insert({
        blocker_id: user.id,
        blocked_id: blockedId,
      });
      setBlockedIds(prev => new Set(prev).add(blockedId));
      setPosts(prev => prev.filter(p => p.user_id !== blockedId));
      toast({ title: "User blocked" });
    } catch {
      toast({ title: "Failed to block user", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title="📱 Social Feed" subtitle="Connect with the Magic Pass community">
      <div className="max-w-2xl mx-auto space-y-5">
        {user && (
          <PostComposer
            userId={user.id}
            userEmail={user.email}
            onPostCreated={loadPosts}
          />
        )}

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
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              isSelf={post.user_id === user?.id}
              isFriend={friendIds.has(post.user_id)}
              isPendingSent={pendingSent.has(post.user_id)}
              onSendFriendRequest={sendFriendRequest}
              onBlockUser={blockUser}
            />
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
