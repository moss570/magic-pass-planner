import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[GC-LINK-CHECK] ${step}${details ? " " + JSON.stringify(details) : ""}`);
};

// Keywords that indicate Disney gift cards are available on the page
const DISNEY_KEYWORDS = [
  "disney gift card",
  "disney world gift card",
  "walt disney world",
  "disney gift",
  "disneyworld",
  "disney card",
];

// Known good URL patterns per retailer
const URL_VALIDATIONS: Record<string, { patterns: RegExp[]; fallback: string }> = {
  "Sam's Club": {
    patterns: [/samsclub\.com\/p\/.+disney.+gift/i, /samsclub\.com\/s\/disney/i],
    fallback: "https://www.samsclub.com/s/disney%20gift%20card",
  },
  "Target": {
    patterns: [/target\.com\/s\?searchTerm=disney/i, /target\.com\/p\/disney-gift-card/i],
    fallback: "https://www.target.com/s?searchTerm=disney+gift+card",
  },
  "Costco": {
    patterns: [/costco\.com\/gift-cards/i, /costco\.com\/disney/i],
    fallback: "https://www.costco.com/gift-cards.html",
  },
  "Kroger": {
    patterns: [/kroger\.com\/search\?query=disney/i, /kroger\.com.*disney/i],
    fallback: "https://www.kroger.com/search?query=disney+gift+card",
  },
  "Raise": {
    patterns: [/raise\.com\/buy\/disney/i, /raise\.com.*disney/i],
    fallback: "https://www.raise.com/buy/disney",
  },
  "CardCash": {
    patterns: [/cardcash\.com\/store\/disney/i],
    fallback: "https://www.cardcash.com/store/disney/",
  },
  "GiftCardGranny": {
    patterns: [/giftcardgranny\.com.*disney/i],
    fallback: "https://www.giftcardgranny.com/gift-cards/disney/",
  },
  "ClipKard": {
    patterns: [/clipkard\.com.*disney/i],
    fallback: "https://www.clipkard.com/gift-cards/disney-world/",
  },
};

async function checkLink(dealUrl: string, retailer: string): Promise<{
  status: "verified" | "broken" | "redirects" | "unverified";
  httpStatus: number;
  hasDisneyContent: boolean;
  finalUrl: string;
  error?: string;
}> {
  try {
    // Try to fetch the URL
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const resp = await fetch(dealUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);
    const finalUrl = resp.url;
    const httpStatus = resp.status;

    if (httpStatus >= 400) {
      return { status: "broken", httpStatus, hasDisneyContent: false, finalUrl, error: `HTTP ${httpStatus}` };
    }

    // Check if redirected to a completely different domain
    const originalDomain = new URL(dealUrl).hostname;
    const finalDomain = new URL(finalUrl).hostname;
    const wasRedirected = originalDomain !== finalDomain && !finalDomain.includes(originalDomain.split(".").slice(-2).join("."));

    // Try to read body to check for Disney content
    let hasDisneyContent = false;
    try {
      const bodyText = (await resp.text()).toLowerCase();
      hasDisneyContent = DISNEY_KEYWORDS.some(kw => bodyText.includes(kw));

      // Also check if it's an error page or "not found" page
      const isErrorPage = bodyText.includes("404") && bodyText.includes("not found") ||
        bodyText.includes("page not found") ||
        bodyText.includes("this item is unavailable") ||
        bodyText.includes("product not found");

      if (isErrorPage) {
        return { status: "broken", httpStatus, hasDisneyContent: false, finalUrl, error: "Page shows 'not found' content" };
      }
    } catch (_) {
      // Can't read body - still mark as accessible
    }

    // Determine validation
    const urlValidation = URL_VALIDATIONS[retailer];
    let isValidPattern = true;
    if (urlValidation) {
      isValidPattern = urlValidation.patterns.some(p => p.test(dealUrl));
    }

    if (wasRedirected && !hasDisneyContent) {
      return { status: "redirects", httpStatus, hasDisneyContent, finalUrl, error: `Redirected to ${finalDomain}` };
    }

    return {
      status: hasDisneyContent || isValidPattern ? "verified" : "unverified",
      httpStatus,
      hasDisneyContent,
      finalUrl,
    };

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("abort")) {
      return { status: "broken", httpStatus: 0, hasDisneyContent: false, finalUrl: dealUrl, error: "Request timeout (12s)" };
    }
    return { status: "broken", httpStatus: 0, hasDisneyContent: false, finalUrl: dealUrl, error: errMsg };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Starting gift card link verification...");

    // Get all deals to check
    const { data: deals, error } = await supabase
      .from("gift_card_deals")
      .select("id, retailer, deal_url, is_live, link_status")
      .order("link_checked_at", { ascending: true, nullsFirst: true })
      .limit(20); // Check 20 at a time to avoid timeout

    if (error) throw error;
    if (!deals?.length) return new Response(JSON.stringify({ message: "No deals to check" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    logStep(`Checking ${deals.length} deal links...`);
    const results: any[] = [];

    for (const deal of deals) {
      logStep(`Checking: ${deal.retailer} - ${deal.deal_url?.substring(0, 50)}`);

      const check = await checkLink(deal.deal_url, deal.retailer);

      // Determine if should be marked as live
      const shouldBeLive = check.status === "verified" && check.httpStatus < 400;
      const shouldBeOffline = check.status === "broken";

      // Update the deal
      const updateData: any = {
        link_status: check.status,
        http_status: check.httpStatus,
        link_checked_at: new Date().toISOString(),
        link_error: check.error || null,
      };

      // Auto-fix broken links with known fallback URLs
      const urlValidation = URL_VALIDATIONS[deal.retailer];
      if (check.status === "broken" && urlValidation?.fallback && deal.deal_url !== urlValidation.fallback) {
        updateData.deal_url = urlValidation.fallback;
        updateData.link_status = "unverified";
        updateData.link_error = `Fixed: was ${check.error}. Reverted to search page.`;
        logStep(`Auto-fixed ${deal.retailer} URL to fallback`);
      }

      // Only auto-deactivate if definitively broken (not just unverified)
      if (shouldBeOffline && deal.is_live) {
        updateData.is_live = false;
        logStep(`Deactivated broken deal: ${deal.retailer}`);
      }

      await supabase.from("gift_card_deals").update(updateData).eq("id", deal.id);

      results.push({
        retailer: deal.retailer,
        url: deal.deal_url,
        status: check.status,
        httpStatus: check.httpStatus,
        hasDisneyContent: check.hasDisneyContent,
        error: check.error,
        fixed: !!updateData.deal_url && updateData.deal_url !== deal.deal_url,
      });

      // Small delay between requests
      await new Promise(r => setTimeout(r, 1500));
    }

    const verified = results.filter(r => r.status === "verified").length;
    const broken = results.filter(r => r.status === "broken").length;
    const fixed = results.filter(r => r.fixed).length;

    logStep("Link check complete", { verified, broken, fixed, total: results.length });

    return new Response(JSON.stringify({
      success: true,
      summary: { verified, broken, fixed, total: results.length },
      results,
      checkedAt: new Date().toISOString(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
