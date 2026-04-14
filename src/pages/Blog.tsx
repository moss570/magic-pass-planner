import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, Calendar, Tag, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  featured_image_url: string;
  published_at: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const { data } = await supabase
          .from("blog_posts")
          .select("id, title, slug, excerpt, category, featured_image_url, published_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false });
        setPosts(data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    loadPosts();
  }, []);

  const categories = ["all", ...new Set(posts.map(p => p.category))];
  const filtered = selectedCategory === "all" ? posts : posts.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <div className="pt-24 flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-primary text-sm font-bold">Blog</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Disney Tips, Tricks & Guides</h1>
            <p className="text-lg text-muted-foreground">Expert insights to maximize your theme park experience</p>
          </div>
        </section>

        {/* Category filter */}
        <section className="px-4 pb-8">
          <div className="max-w-6xl mx-auto flex gap-2 flex-wrap justify-center">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/5 text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat === "all" ? "All Posts" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Posts grid */}
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No posts in this category yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(post => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="rounded-xl border border-white/10 bg-card overflow-hidden hover:border-primary/50 transition-all hover:scale-[1.02]"
                  >
                    {post.featured_image_url && (
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs text-primary font-semibold">{post.category}</span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.published_at).toLocaleDateString()}
                        </span>
                        <ArrowRight className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
