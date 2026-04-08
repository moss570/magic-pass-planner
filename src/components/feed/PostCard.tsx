import { UserPlus, Ban } from "lucide-react";

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
  onSendFriendRequest: (userId: string) => void;
  onBlockUser: (userId: string) => void;
}

export default function PostCard({ post, isSelf, isFriend, isPendingSent, onSendFriendRequest, onBlockUser }: PostCardProps) {
  const displayName = post.username || `${post.first_name || ""} ${post.last_name || ""}`.trim() || "Magic Pass User";
  const badge = post.membership_category ? MEMBERSHIP_BADGES[post.membership_category] : null;

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "var(--card)" }}>
      <div className="p-4">
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
              <p className="text-xs text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString()} · {new Date(post.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
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
        <p className="text-sm text-foreground leading-relaxed mb-3">{post.content}</p>
        {post.image_url && (
          <div className="rounded-lg overflow-hidden mb-3">
            <img src={post.image_url} alt="Post" className="w-full max-h-96 object-cover" />
          </div>
        )}
      </div>
    </div>
  );
}
