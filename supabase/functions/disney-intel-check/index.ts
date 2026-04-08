import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_KEY = Deno.env.get("BREVO_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const logStep = (step: string, details?: any) => {
  console.log(`[DISNEY-INTEL] ${step}${details ? " " + JSON.stringify(details) : ""}`);
};

// Scrape a news source for Disney deals/news
async function scrapeSource(sourceUrl: string, sourceName: string): Promise<string> {
  try {
    const resp = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!resp.ok) return "";
    const html = await resp.text();
    // Extract text content (simplified)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .substring(0, 3000);
    return text;
  } catch (err) {
    logStep(`Error scraping ${sourceName}`, { error: String(err) });
    return "";
  }
}

// Check for new offers on Disney's official page
async function checkDisneyOfficialOffers(): Promise<Array<{ title: string; summary: string; url: string; importance: string }>> {
  const offers = [];
  
  try {
    // Check Disney special offers page
    const resp = await fetch("https://disneyworld.disney.go.com/special-offers/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html",
      },
    });
    
    if (resp.ok) {
      const html = await resp.text();
      
      // Look for offer titles and descriptions
      const offerMatches = html.matchAll(/data-title="([^"]+)"|offer-title[^>]*>([^<]+)</g);
      const freeMatches = html.match(/free\s+dining|free\s+nights?|save\s+\d+%|discount|special\s+offer/gi) || [];
      
      logStep("Disney offers page scraped", { 
        status: resp.status, 
        freeKeywords: freeMatches.length,
        htmlLength: html.length 
      });
      
      // Extract offer sections
      const sections = html.match(/<article[^>]*>[\s\S]{0,500}/g) || [];
      for (const section of sections.slice(0, 5)) {
        const titleMatch = section.match(/(?:class="[^"]*title[^"]*"[^>]*>|<h[23][^>]*>)([^<]+)</i);
        if (titleMatch && titleMatch[1].length > 10) {
          offers.push({
            title: titleMatch[1].trim(),
            summary: "New offer detected on Disney World special offers page",
            url: "https://disneyworld.disney.go.com/special-offers/",
            importance: "normal",
          });
        }
      }
    }
  } catch (err) {
    logStep("Disney official check error", { error: String(err) });
  }
  
  return offers;
}

// Check Disney Parks Blog for new posts
async function checkDisneyParksBlog(): Promise<Array<{ title: string; summary: string; url: string }>> {
  try {
    const resp = await fetch("https://disneyparks.disney.go.com/blog/feed/", {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/rss+xml, application/xml" },
    });
    
    if (!resp.ok) return [];
    const xml = await resp.text();
    const items = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    const posts = [];
    
    for (const item of items) {
      const content = item[1];
      const titleMatch = content.match(/<title>(?:<!\[CDATA\[)?([^\]]+?)(?:\]\]>)?<\/title>/);
      const linkMatch = content.match(/<link>([^<]+)<\/link>/);
      const descMatch = content.match(/<description>(?:<!\[CDATA\[)?([^<\]]{0,200})/);
      
      if (titleMatch) {
        posts.push({
          title: titleMatch[1].trim(),
          summary: descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim().substring(0, 150) : "",
          url: linkMatch ? linkMatch[1].trim() : "https://disneyparks.disney.go.com/blog/",
        });
      }
    }
    
    logStep("Disney Parks Blog fetched", { posts: posts.length });
    return posts.slice(0, 3);
  } catch (err) {
    logStep("Disney Parks Blog error", { error: String(err) });
    return [];
  }
}

// Post to social feed
async function postToFeed(supabase: any, content: string, category: string, linkUrl?: string, linkLabel?: string) {
  await supabase.from("social_feed").insert({
    author: "Clark Kent",
    author_role: "Magic Pass Chief Insider",
    author_emoji: "📢",
    content,
    category,
    tags: ["disney", "deals", "auto-intel"],
    link_url: linkUrl || null,
    link_label: linkLabel || null,
    is_pinned: false,
    is_published: true,
  });
}

// Send Brevo email to admins when breaking news found
async function notifyAdmin(subject: string, body: string) {
  if (!BREVO_KEY) return;
  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Magic Pass Intel", email: "alerts@magicpassplus.com" },
      to: [{ email: "moss570@gmail.com", name: "Brandon Moss" }],
      subject: `[Magic Pass Intel] ${subject}`,
      textContent: body,
    }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    const body = await req.json().catch(() => ({}));
    const trigger = body.trigger || "manual";
    logStep(`Intel check triggered: ${trigger}`);

    const results: any = { trigger, newOffers: [], blogPosts: [], timestamp: new Date().toISOString() };

    // 1. Check Disney official offers page
    const officialOffers = await checkDisneyOfficialOffers();
    
    // 2. Check Disney Parks Blog for new posts
    const blogPosts = await checkDisneyParksBlog();
    results.blogPosts = blogPosts.map(p => p.title);

    // 3. If we found blog posts, create feed items
    for (const post of blogPosts.slice(0, 2)) {
      const isOffer = /deal|discount|offer|save|free|promo/i.test(post.title + post.summary);
      const category = isOffer ? "deal" : "news";
      
      // Check if we already posted this (by URL)
      const { data: existing } = await supabase.from("social_feed").select("id").eq("link_url", post.url).single();
      
      if (!existing) {
        await postToFeed(
          supabase,
          `📰 New from Disney Parks Blog:\n\n**${post.title}**\n\n${post.summary}`,
          category,
          post.url,
          "Read on Disney Parks Blog →"
        );
        logStep("Posted blog item to feed", { title: post.title });
        results.newOffers.push(post.title);
        
        // Notify admin for anything that looks like a deal
        if (isOffer) {
          await notifyAdmin(`New Disney Deal: ${post.title}`, `${post.title}\n\n${post.summary}\n\nURL: ${post.url}`);
        }
      }
    }

    // 4. Update last_scraped for active sources
    await supabase.from("news_sources")
      .update({ last_scraped: new Date().toISOString() })
      .in("name", ["Disney Parks Blog", "Disney World Official Special Offers"]);

    logStep("Intel check complete", results);

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("FATAL ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
