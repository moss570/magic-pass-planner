import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-authorization",
};

const VALID_API_KEY = "cee09ceea8ff8ef34bebef2e60c9441beb7e0c98069d1e3b2e8882d3da4adfa8";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Authentication
    const authHeader = req.headers.get("authorization") || "";
    const providedKey = authHeader.replace("Bearer ", "");
    
    let authorEmail = "";
    
    // Check if API key is valid
    if (providedKey === VALID_API_KEY) {
      authorEmail = "rocket@discountmikeblinds.net";
    } else {
      return new Response(JSON.stringify({ error: "Invalid API key" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Parse request body
    const body = await req.json();
    const { title, excerpt, content, category = "general", featured_image_url, publish_now = true } = body;

    // Validate
    if (!title || !content) {
      return new Response(JSON.stringify({ error: "title and content required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Auto-generate slug from title
    const slug = (body.slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Insert blog post
    const { data, error } = await supabase
      .from("blog_posts")
      .insert([{
        title,
        slug,
        excerpt: excerpt || content.substring(0, 150),
        content,
        category,
        featured_image_url,
        author_email: authorEmail,
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
