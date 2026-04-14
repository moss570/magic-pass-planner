import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

interface BlogPost {
  title: string;
  slug: string;
  content: string;
  category: string;
  featured_image_url: string;
  published_at: string;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const { data, error } = await (supabase
          .from("blog_posts" as any)
          .select("*") as any)
          .eq("slug", slug)
          .eq("is_published", true)
          .single();
        if (error || !data) { navigate("/blog"); return; }
        setPost(data as BlogPost);
      } catch (err) { console.error(err); navigate("/blog"); }
      finally { setLoading(false); }
    };
    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <div className="pt-24 flex-1">
        {/* Hero */}
        {post.featured_image_url && (
          <div className="w-full h-96 bg-gradient-to-b from-primary/20 to-background overflow-hidden">
            <img src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <article className="max-w-3xl mx-auto px-4 py-12">
          <div className="mb-6">
            <button
              onClick={() => navigate("/blog")}
              className="flex items-center gap-2 text-primary hover:underline mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </button>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(post.published_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                {post.category}
              </span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-foreground prose-a:text-primary">
            <div
              dangerouslySetInnerHTML={{
                __html: post.content
                  .replace(/^## /gm, "<h2>")
                  .replace(/^### /gm, "<h3>")
                  .replace(/\n\n/g, "</p><p>")
                  .replace(/^- /gm, "<li>")
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
              }}
              className="space-y-4"
            />
          </div>
        </article>
      </div>

      <SiteFooter />
    </div>
  );
}
