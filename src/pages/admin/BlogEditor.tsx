import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, Plus, Save, Eye, Trash2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net", "rocket@discountmikeblinds.net"];
const CATEGORIES = ["general", "dining", "attractions", "planning", "news", "guides"];

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author_email: string;
  featured_image_url: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function BlogEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) { navigate("/dashboard"); return; }
    loadPosts();
  }, [user]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from("blog_posts" as any)
        .select("*") as any)
        .order("published_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      setPosts((data || []) as BlogPost[]);
    } catch (err) { console.error(err); toast({ title: "Failed to load posts", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const saveBlogPost = async (post: Partial<BlogPost>) => {
    if (!post.title || !post.content) { toast({ title: "Title and content required", variant: "destructive" }); return; }

    const slug = post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    try {
      if (editing) {
        const { error } = await (supabase
          .from("blog_posts" as any)
          .update({ ...post, slug, updated_at: new Date().toISOString() }) as any)
          .eq("id", editing.id);
        if (error) throw error;
        toast({ title: "✅ Post updated" });
      } else {
        const { error } = await (supabase
          .from("blog_posts" as any)
          .insert([{ ...post, slug, author_email: user?.email }]) as any);
        if (error) throw error;
        toast({ title: "✅ Post created" });
      }
      setEditing(null);
      setShowForm(false);
      loadPosts();
    } catch (err) { toast({ title: "Save failed", variant: "destructive" }); }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      const { error } = await (supabase.from("blog_posts" as any).delete() as any).eq("id", id);
      if (error) throw error;
      toast({ title: "✅ Post deleted" });
      loadPosts();
    } catch (err) { toast({ title: "Delete failed", variant: "destructive" }); }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      const { error } = await (supabase
        .from("blog_posts" as any)
        .update({
          is_published: !post.is_published,
          published_at: !post.is_published ? new Date().toISOString() : null,
        }) as any)
        .eq("id", post.id);
      if (error) throw error;
      toast({ title: !post.is_published ? "✅ Published" : "✅ Unpublished" });
      loadPosts();
    } catch (err) { toast({ title: "Toggle failed", variant: "destructive" }); }
  };

  if (!user || !ADMIN_EMAILS.includes(user.email || "")) return null;

  return (
    <div className="min-h-screen" style={{ background: "#080E1E" }}>
      <div className="px-4 md:px-8 pt-6 pb-4 border-b" style={{ borderColor: "rgba(245,200,66,0.15)", background: "#0D1230" }}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Blog Editor</h1>
          </div>
          <div className="flex gap-2">
            <a href="/admin/command-center" className="text-xs text-primary hover:underline">← Command Center</a>
            <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> New Post
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        {showForm && <PostForm post={editing} onSave={saveBlogPost} onCancel={() => { setEditing(null); setShowForm(false); }} />}

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {posts.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No posts yet. Create one!</p>
            ) : (
              posts.map(post => (
                <div key={post.id} className="rounded-lg border border-white/10 bg-card p-4 hover:border-white/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground">{post.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{post.excerpt}</p>
                      <div className="flex gap-3 mt-3">
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">{post.category}</span>
                        {post.is_published && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Published</span>}
                        <span className="text-xs text-muted-foreground">{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => window.open(`/blog/${post.slug}`, "_blank")}><Eye className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(post); setShowForm(true); }}>✏️</Button>
                      <Button variant="ghost" size="sm" onClick={() => togglePublish(post)}>{post.is_published ? "🔒" : "🔓"}</Button>
                      <Button variant="ghost" size="sm" onClick={() => deletePost(post.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PostForm({ post, onSave, onCancel }: { post: BlogPost | null; onSave: (p: Partial<BlogPost>) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState<Partial<BlogPost>>(post || {
    title: "", slug: "", excerpt: "", content: "", category: "general",
    featured_image_url: "", author_email: "", is_published: false,
  });

  return (
    <div className="rounded-xl border border-white/10 bg-card p-6 mb-6">
      <h2 className="text-lg font-bold text-foreground mb-4">{post ? "Edit Post" : "New Blog Post"}</h2>
      <div className="space-y-4">
        <input placeholder="Post title" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
        <input placeholder="URL slug (auto-generated from title)" value={formData.slug || ""} onChange={e => setFormData({ ...formData, slug: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
        <input placeholder="Excerpt (short preview)" value={formData.excerpt || ""} onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
        <select value={formData.category || "general"} onChange={e => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Featured image URL (optional)" value={formData.featured_image_url || ""} onChange={e => setFormData({ ...formData, featured_image_url: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
        <textarea placeholder="Post content (Markdown supported)" value={formData.content || ""} onChange={e => setFormData({ ...formData, content: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm min-h-64 font-mono text-xs" />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.is_published || false} onChange={e => setFormData({ ...formData, is_published: e.target.checked })} />
          <span className="text-sm text-foreground">Publish immediately</span>
        </label>
      </div>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => onSave(formData)} className="bg-primary text-primary-foreground"><Save className="w-3.5 h-3.5 mr-1" /> Save Post</Button>
        <Button onClick={onCancel} variant="ghost">Cancel</Button>
      </div>
    </div>
  );
}
