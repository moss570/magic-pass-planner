import { useState, useEffect, useRef } from "react";
import {
  Heart, MessageCircle, Send, Image as ImageIcon, X, ChevronDown,
  ChevronUp, Sparkles, MapPin, Camera, Star, UserPlus
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { FeatureGate } from "@/components/FeatureGate";

const PARKS = ["Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom", "Disney Springs", "Typhoon Lagoon", "Blizzard Beach", "Grand Floridian", "Polynesian", "Contemporary", "Wilderness Lodge"];

const POST_CATEGORIES = [
  { id: "tip", label: "💡 Tip", color: "bg-yellow-500/20 text-yellow-400" },
  { id: "photo", label: "📸 Photo", color: "bg-pink-500/20 text-pink-400" },
  { id: "deal", label: "💰 Deal", color: "bg-green-500/20 text-green-400" },
  { id: "trip", label: "🗺️ Trip Report", color: "bg-blue-500/20 text-blue-400" },
  { id: "question", label: "❓ Question", color: "bg-purple-500/20 text-purple-400" },
  { id: "news", label: "📰 News", color: "bg-cyan-500/20 text-cyan-400" },
  { id: "entertainment", label: "🎬 Entertainment", color: "bg-orange-500/20 text-orange-400" },
  { id: "ap_exclusive", label: "🎟️ AP Exclusive", color: "bg-primary/20 text-primary" },
];

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "deal", label: "💰 Deals" },
  { id: "ap_exclusive", label: "🎟️ AP" },
  { id: "photo", label: "📸 Photos" },
  { id: "tip", label: "💡 Tips" },
  { id: "news", label: "📰 News" },
  { id: "clark", label: "📢 Insider" },
  { id: "user", label: "👥 Community" },
];

const CATEGORY_COLORS: Record<string, string> = {
  deal: "bg-green-500/20 text-green-400",
  tip: "bg-yellow-500/20 text-yellow-400",
  photo: "bg-pink-500/20 text-pink-400",
  trip: "bg-blue-500/20 text-blue-400",
  question: "bg-purple-500/20 text-purple-400",
  news: "bg-cyan-500/20 text-cyan-400",
  entertainment: "bg-orange-500/20 text-orange-400",
  ap_exclusive: "bg-primary/20 text-primary",
  event: "bg-violet-500/20 text-violet-400",
};

export default function SocialFeed() {
  const { session, user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [postingComment, setPostingComment] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Magic Pass Member");
  const [username, setUsername] = useState("");
  const [myUserId, setMyUserId] = useState<string | null>(null);

  // New post state
  const [showCompose, setShowCompose] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("tip");
  const [newPostPark, setNewPostPark] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (user) {
      setMyUserId(user.id);
      supabase.from("users_profile").select("username, first_name, last_name").eq("id", user.id).single()
        .then(({ data }) => {
          const uname = data?.username?.trim();
          setUsername(uname || "");
          setDisplayName(uname || `${data?.first_name || ""} ${data?.last_name || ""}`.trim() || "Magic Pass Member");
        });
    }
    // Load liked posts
    const liked = localStorage.getItem("magic-pass:liked-posts");
    if (liked) setLikedPosts(new Set(JSON.parse(liked)));
  }, [user]);

  useEffect(() => { loadPosts(); }, [filter]);

  const loadPosts = async () => {
    setLoading(true);
    let query = supabase.from("social_feed")
      .select("*")
      .eq("is_published", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(40);

    if (filter === "clark") query = query.eq("post_type", "clark");
    else if (filter === "user") query = query.eq("post_type", "user");
    else if (filter !== "all") query = query.eq("category", filter);

    const { data } = await query;
    setPosts(data || []);
    setLoading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    setSelectedImages(files);
    const previews = files.map(f => URL.createObjectURL(f));
    setImagePreviews(previews);
  };

  const submitPost = async () => {
    if (!session || !newPostContent.trim()) return;
    setPosting(true);
    try {
      // Upload images if any
      const imageUrls: string[] = [];
      for (const file of selectedImages) {
        const fileName = `feed/${user?.id}-${Date.now()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("game-photos").upload(fileName, file, { contentType: file.type });
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage.from("game-photos").getPublicUrl(fileName);
          imageUrls.push(publicUrl);
        }
      }

      const displayUsername = username || displayName;
      await supabase.from("social_feed").insert({
        user_id: user?.id,
        display_name: displayUsername,
        username: username || null,
        author: displayUsername,
        author_role: "Magic Pass Member",
        author_emoji: "👤",
        content: newPostContent.trim(),
        category: "community",
        post_type: "user",
        park: newPostPark || null,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        like_count: 0,
        comment_count: 0,
        is_published: true,
        is_pinned: false,
        tags: ["community", newPostPark].filter(Boolean),
      });

      toast({ title: "✅ Post shared!" });
      setNewPostContent("");
      setNewPostCategory("tip");
      setNewPostPark("");
      setSelectedImages([]);
      setImagePreviews([]);
      setShowCompose(false);
      loadPosts();
    } catch (err) {
      toast({ title: "Failed to post", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const likePost = async (postId: string, currentLikes: number) => {
    const newLiked = new Set(likedPosts);
    const isLiked = newLiked.has(postId);
    if (isLiked) { newLiked.delete(postId); } else { newLiked.add(postId); }
    setLikedPosts(newLiked);
    localStorage.setItem("magic-pass:liked-posts", JSON.stringify([...newLiked]));
    const newCount = isLiked ? currentLikes - 1 : currentLikes + 1;
    await supabase.from("social_feed").update({ like_count: newCount }).eq("id", postId);
    setPosts(p => p.map(post => post.id === postId ? { ...post, like_count: newCount } : post));
  };

  const toggleComments = async (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
      if (!comments[postId]) {
        const { data } = await supabase.from("feed_comments").select("*").eq("post_id", postId).order("created_at").limit(20);
        setComments(c => ({ ...c, [postId]: data || [] }));
      }
    }
    setExpandedComments(newExpanded);
  };

  const postComment = async (postId: string, currentCount: number) => {
    if (!session || !commentText[postId]?.trim()) return;
    setPostingComment(postId);
    try {
      const { data: newComment } = await supabase.from("feed_comments").insert({
        post_id: postId,
        user_id: user?.id,
        display_name: username || displayName,
        username: username || null,
        content: commentText[postId].trim(),
      }).select().single();

      await supabase.from("social_feed").update({ comment_count: currentCount + 1 }).eq("id", postId);
      setComments(c => ({ ...c, [postId]: [...(c[postId] || []), newComment] }));
      setPosts(p => p.map(post => post.id === postId ? { ...post, comment_count: post.comment_count + 1 } : post));
      setCommentText(t => ({ ...t, [postId]: "" }));
    } finally {
      setPostingComment(null);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  };

  const getCategoryLabel = (cat: string) => POST_CATEGORIES.find(c => c.id === cat)?.label || cat;
  const getCategoryColor = (cat: string) => CATEGORY_COLORS[cat] || "bg-white/10 text-muted-foreground";

  return (
    <DashboardLayout title="📢 Magic Pass Social" subtitle="Share tips, photos, deals and Disney moments with the community">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTER_TABS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors ${filter === f.id ? "bg-primary text-[#080E1E] border-primary" : "border-white/10 text-muted-foreground"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Compose box — Facebook style */}
        {session && (
          <div className="rounded-xl border border-white/10" style={{ background: "#111827" }}>
            {!showCompose ? (
              <button onClick={() => setShowCompose(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/3 transition-colors rounded-xl">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {displayName[0] || "?"}
                </div>
                <span className="text-sm text-muted-foreground">Share a tip, photo, or Disney moment...</span>
                <div className="ml-auto flex gap-2 shrink-0">
                  <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-muted-foreground">📸 Photo</span>
                  <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-muted-foreground">💡 Post</span>
                </div>
              </button>
            ) : (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {displayName[0] || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{displayName}</p>
                    <p className="text-xs text-muted-foreground">Magic Pass Member</p>
                  </div>
                  <button onClick={() => { setShowCompose(false); setNewPostContent(""); setImagePreviews([]); setSelectedImages([]); }} className="ml-auto text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                  placeholder="What's on your mind? Share a Disney tip, deal, photo, or trip update..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
                  style={{ background: "#0D1230" }}
                  autoFocus
                />

                {/* Image previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {imagePreviews.map((preview, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden" style={{ aspectRatio: "4/3" }}>
                        <img src={preview} className="w-full h-full object-cover" alt="" />
                        <button onClick={() => {
                          setImagePreviews(p => p.filter((_, idx) => idx !== i));
                          setSelectedImages(s => s.filter((_, idx) => idx !== i));
                        }} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 items-center">
                  {/* Park selector */}
                  <select value={newPostPark} onChange={e => setNewPostPark(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg text-xs border border-white/10 text-muted-foreground focus:outline-none focus:border-primary/40"
                    style={{ background: "#0D1230" }}>
                    <option value="">📍 Tag a park (optional)</option>
                    {PARKS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>

                  {/* Photo button */}
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Camera className="w-3.5 h-3.5" /> Add Photo
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />

                  {/* Always community — show badge */}
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary font-semibold">👥 Community Post</span>
                </div>

                <button onClick={submitPost} disabled={posting || !newPostContent.trim()}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-[#080E1E] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "#F5C842" }}>
                  {posting ? <><span className="w-4 h-4 rounded-full border-2 border-[#080E1E] border-t-transparent animate-spin" /> Posting...</> : <><Send className="w-4 h-4" /> Share with Community</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">Nothing yet in this feed</p>
            <p className="text-xs text-muted-foreground">Be the first to post!</p>
          </div>
        ) : posts.map(post => {
          const isLiked = likedPosts.has(post.id);
          const isClark = post.post_type === "clark" || !post.user_id;
          const isCommentsOpen = expandedComments.has(post.id);
          const postComments = comments[post.id] || [];

          return (
            <div key={post.id} className={`rounded-xl border overflow-hidden ${post.is_pinned ? "border-primary/30" : "border-white/8"}`} style={{ background: "#111827" }}>
              {post.is_pinned && (
                <div className="px-4 py-1.5 flex items-center gap-1.5" style={{ background: "rgba(245,200,66,0.08)" }}>
                  <span className="text-xs font-semibold text-primary">📌 Pinned</span>
                </div>
              )}

              <div className="p-4">
                {/* Author header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${isClark ? "bg-primary/20" : "bg-secondary/20"}`}>
                      {post.author_emoji || (isClark ? "📢" : "👤")}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground leading-tight">{post.author || post.display_name || "Magic Pass Member"}</p>
                      <p className="text-xs text-muted-foreground">{post.author_role || "Member"} · {timeAgo(post.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.park && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {post.park}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getCategoryColor(post.category)}`}>
                      {getCategoryLabel(post.category)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-foreground leading-relaxed mb-3 whitespace-pre-line">{post.content}</p>

                {/* Images */}
                {post.image_urls?.length > 0 && (
                  <div className={`grid gap-2 mb-3 ${post.image_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                    {post.image_urls.map((imgUrl: string, i: number) => (
                      <div key={i} className="rounded-xl overflow-hidden" style={{ maxHeight: 300 }}>
                        <img src={imgUrl} className="w-full h-full object-cover" alt="" loading="lazy" onError={e => (e.currentTarget.style.display = "none")} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Link */}
                {post.link_url && (
                  <a href={post.link_url.startsWith("http") ? post.link_url : undefined}
                    target={post.link_url.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-primary/25 bg-primary/5 hover:bg-primary/10 transition-colors mb-3">
                    <span className="text-sm font-semibold text-primary">{post.link_label || "View →"}</span>
                    <span className="text-xs text-muted-foreground">↗</span>
                  </a>
                )}

                {/* Tags */}
                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.filter(Boolean).map((tag: string) => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">#{tag.replace(/\s+/g, "")}</span>
                    ))}
                  </div>
                )}

                {/* Actions bar */}
                <div className="flex items-center gap-4 pt-2 border-t border-white/8">
                  <button onClick={() => likePost(post.id, post.like_count)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${isLiked ? "text-red-400" : "text-muted-foreground hover:text-red-400"}`}>
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-red-400" : ""}`} />
                    {post.like_count || 0}
                  </button>
                  <button onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    {post.comment_count || 0} {isCommentsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {/* Add Friend button — only show on user posts that aren't the current user */}
                  {post.post_type === "user" && post.user_id && post.user_id !== myUserId && session && (
                    <button
                      onClick={async () => {
                        const email = ""; // We don't have email from post — use user_id approach
                        // Send friend request via social edge function
                        const resp = await fetch("https://wknelhrmgspuztehetpa.supabase.co/functions/v1/social?action=send-friend-request-by-id", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${session.access_token}`,
                            "x-client-authorization": `Bearer ${session.access_token}`,
                            "apikey": "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC",
                          },
                          body: JSON.stringify({ target_user_id: post.user_id, from_name: username || displayName }),
                        });
                        const data = await resp.json();
                        if (data.success) {
                          toast({ title: "✅ Friend request sent!", description: `Request sent to ${post.display_name || post.username}` });
                        } else {
                          toast({ title: data.error || "Already sent or already friends", variant: "destructive" });
                        }
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors ml-auto"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add Friend
                    </button>
                  )}
                </div>

                {/* Comments section */}
                {isCommentsOpen && (
                  <div className="mt-3 pt-3 border-t border-white/8 space-y-3">
                    {postComments.map(comment => (
                      <div key={comment.id} className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-bold text-secondary shrink-0">
                          {comment.display_name?.[0] || "?"}
                        </div>
                        <div className="flex-1 bg-white/4 rounded-xl px-3 py-2">
                          <p className="text-xs font-semibold text-foreground">{comment.display_name}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                    {session ? (
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {displayName[0] || "?"}
                        </div>
                        <div className="flex-1 flex gap-2">
                          <input
                            value={commentText[post.id] || ""}
                            onChange={e => setCommentText(t => ({ ...t, [post.id]: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && !e.shiftKey && postComment(post.id, post.comment_count)}
                            placeholder="Write a comment..."
                            className="flex-1 px-3 py-1.5 rounded-full text-xs text-foreground border border-white/10 focus:outline-none focus:border-primary/40"
                            style={{ background: "#0D1230" }}
                          />
                          <button onClick={() => postComment(post.id, post.comment_count)}
                            disabled={postingComment === post.id || !commentText[post.id]?.trim()}
                            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[#080E1E] disabled:opacity-50 shrink-0">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center">Log in to comment</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

      </div>
    </DashboardLayout>
  );
}
