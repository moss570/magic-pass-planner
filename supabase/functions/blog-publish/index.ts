import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-authorization",
};

const ALLOWED_AUTHORS = ["rocket@discountmikeblinds.net", "moss570@gmail.com", "brandon@discountmikeblinds.net"];
const API_KEY = Deno.env.get("BLOG_PUBLISH_API_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Check for API key auth (primary method for automation)
    const authHeader = req.headers.get("authorization") || "";
    const providedKey = authHeader.replace("Bearer ", "");
    
    // If API key is provided and valid, allow it
    if (providedKey && API_KEY && providedKey === API_KEY) {
      // API key authentication successful
      // Continue to blog post creation
    } else if (providedKey && providedKey.startsWith("eyJ")) {
      // Fallback to Supabase token auth for manual testing
      const { data: { user }, error: authErr } = await supabase.auth.getUser(providedKey);
      if (authErr || !user || !ALLOWED_AUTHORS.includes(user.email || "")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      return new Response(JSON.stringify({ error: "Missing or invalid API key" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { title, excerpt, content, category = "general", featured_image_url, publish_now = true } = body;

    if (!title || !content) {
      return new Response(JSON.stringify({ error: "title and content required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Auto-generate slug from title
    const slug = (body.slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data, error } = await supabase
      .from("blog_posts")
      .insert([{
        title,
        slug,
        excerpt: excerpt || content.substring(0, 150),
        content,
        category,
        featured_image_url,
        author_email: user.email,
        is_published: publish_now,
        published_at: publish_now ? new Date().toISOString() : null,
      }])
      .select();

    if (error) throw error;

    const post = data?.[0];
    return new Response(JSON.stringify({
      success: true,
      post_id: post?.id,
      slug: post?.slug,
      url: `https://magicpassplus.com/blog/${post?.slug}`,
      is_published: post?.is_published,
    }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
