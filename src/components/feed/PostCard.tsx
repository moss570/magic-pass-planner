import { useState } from "react";
import { UserPlus, Ban, Heart, ThumbsUp, Share2, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  post_type: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  membership_category?: string;
}

interface Reaction {
  like: number;
  love: number;
  userReaction: "like" | "love" | null;
}

interface Friend {
  id: string;
  name: string;
}

const MEMBERSHIP_BADGES: Record<string, { label: string; color: string }> = {
  "Annual Passholder": { label: "🎟️ AP", color: "bg-primary/20 text-primary" },
  "DVC Member": { label: "🏰 DVC", color: "bg-purple-500/20 text-purple-400" },
  "Out of State Traveler": { label: "✈️ Traveler", color: "bg-blue-500/20 text-blue-400" },
};

interface PostCardProps {
  post: Post;
  isSelf: boolean;
  isFriend: boolean;
  isPendingSent: boolean;
  currentUserId?: string;
  reactions: Reaction;
  friends: Friend[];
  onSendFriendRequest: (userId: string) => void;
  onBlockUser: (userId: string) => void;
  onReact: (postId: string, type: "like" | "love") => void;
}

export default function PostCard({
  post, isSelf, isFriend, isPendingSent, currentUserId,
  reactions, friends, onSendFriendRequest, onBlockUser, onReact,
}: PostCardProps) {
  const { toast } = useToast();
  const displayName = post.username || `${post.first_name || ""} ${post.last_name || ""}`.trim() || "Magic Pass User";
  const badge = post.membership_category ? MEMBERSHIP_BADGES[post.membership_category] : null;
  const [showShare, setShowShare] = useState(false);
  const [sending, setSending] = useState(false);

  const shareToFriend = async (friendId: string, friendName: string) => {
    if (!currentUserId) return;
    setSending(true);
    try {
      const snippet = post.content.length > 80 ? post.content.slice(0, 80) + "…" : post.content;
      await supabase.from("messages").insert({
        sender_id: currentUserId,
        receiver_id: friendId,
        content: `📱 Shared a post from ${displayName}: "${snippet}"${post.image_url ? "\n📸 [Photo attached]" : ""}`,
        message_type: "direct",
      });
      toast({ title: `✅ Shared with ${friendName}!` });
      setShowShare(false);
    } catch {
      toast({ title: "Failed to share", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const postDate = new Date(post.created_at);
  const formattedDate = postDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formattedTime = postDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "var(--card)" }}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {(post.first_name?.[0] || post.username?.[0] || "?").toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
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
              <p className="text-xs text-muted-foreground">{formattedDate} · {formattedTime}</p>
            </div>
          </div>
          {!isSelf && (
            <div className="flex gap-1">
              {!isFriend && !isPendingSent && (
                <button
                  onClick={() => onSendFriendRequest(post.user_id)}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold text-[var(--background)] flex items-center gap-1"
                  style={{ background: "#F5C842" }}
                >
                  <UserPlus className="w-3 h-3" /> Connect
                </button>
              )}
              {isPendingSent && (
                <span className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground font-semibold">⏳ Pending</span>
              )}
              {isFriend && (
                <span className="text-xs px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 font-semibold">✅ Friends</span>
              )}
              <button
                onClick={() => onBlockUser(post.user_id)}
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
        {post.image_url && (
          <div className="rounded-lg overflow-hidden mb-3">
            <img src={post.image_url} alt="Post" className="w-full max-h-96 object-cover" />
          </div>
        )}

        {/* Reactions bar */}
        <div className="flex items-center gap-1 pt-2 border-t border-white/5">
          <button
            onClick={() => onReact(post.id, "like")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              reactions.userReaction === "like"
                ? "bg-blue-500/20 text-blue-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            Like{reactions.like > 0 && ` · ${reactions.like}`}
          </button>

          <button
            onClick={() => onReact(post.id, "love")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              reactions.userReaction === "love"
                ? "bg-red-500/20 text-red-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${reactions.userReaction === "love" ? "fill-red-400" : ""}`} />
            Love{reactions.love > 0 && ` · ${reactions.love}`}
          </button>

          <div className="relative ml-auto">
            <button
              onClick={() => setShowShare(!showShare)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>

            {showShare && (
              <div
                className="absolute right-0 bottom-full mb-2 w-56 rounded-xl border border-white/10 shadow-xl z-50 p-3 space-y-1"
                style={{ background: "var(--card)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-foreground">Send to friend</p>
                  <button onClick={() => setShowShare(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {friends.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No friends yet. Connect with people first!</p>
                ) : (
                  friends.map((f) => (
                    <button
                      key={f.id}
                      disabled={sending}
                      onClick={() => shareToFriend(f.id, f.name)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-foreground hover:bg-muted transition-colors text-left"
                    >
                      <Send className="w-3 h-3 text-primary shrink-0" />
                      {f.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
