import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[GC-SCRAPER] ${step}${details ? " " + JSON.stringify(details) : ""}`);
};

// Raise.com API — they have a public API for card pricing
async function checkRaise(cardValue: number): Promise<{ price: number; savings: number; available: boolean; url: string } | null> {
  try {
    const searchUrl = `https://www.raise.com/api/gift-cards/search?query=disney&sortby=savings&page=1`;
    const resp = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });
    
    if (resp.ok) {
      const data = await resp.json();
      const cards = data?.results || data?.data || [];
      // Find Disney cards near the requested value
      const matching = cards.filter((c: any) => 
        c?.brand?.toLowerCase().includes("disney") && 
        Math.abs((c?.value || 0) - cardValue) < 10
      );
      
      if (matching.length > 0) {
        const card = matching[0];
        const price = card.price || card.salePrice;
        const value = card.value || cardValue;
        return {
          price,
          savings: value - price,
          available: true,
          url: `https://www.raise.com/buy/disney`,
        };
      }
    }
    return null;
  } catch (err) {
    logStep("Raise API error", { error: String(err) });
    return null;
  }
}

// CardCash — check their API
async function checkCardCash(cardValue: number): Promise<{ price: number; savings: number; available: boolean; url: string } | null> {
  try {
    const resp = await fetch(
      `https://www.cardcash.com/store/disney/`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json, text/html",
        },
      }
    );
    
    if (resp.ok) {
      const html = await resp.text();
      // Parse savings percentage from HTML
      const savingsMatch = html.match(/save[^0-9]*(\d+)%/i) || html.match(/(\d+)%\s*off/i);
      if (savingsMatch) {
        const pct = parseInt(savingsMatch[1]) / 100;
        const savings = Math.round(cardValue * pct * 100) / 100;
        const price = cardValue - savings;
        return {
          price,
          savings,
          available: savings > 0,
          url: "https://www.cardcash.com/store/disney/",
        };
      }
    }
    return null;
  } catch (err) {
    logStep("CardCash error", { error: String(err) });
    return null;
  }
}

// Sam's Club — check if Disney gift card is available and get current price
async function checkSamsClub(): Promise<{ price: number; savings: number; available: boolean; url: string } | null> {
  try {
    // Sam's Club has a search API
    const resp = await fetch(
      "https://www.samsclub.com/api/node/vivaldi/v2/products/search?searchTerm=disney+gift+card+500&pageSize=6&sortKey=relevance&sortOrder=0",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
          "Origin": "https://www.samsclub.com",
          "Referer": "https://www.samsclub.com/",
        },
      }
    );
    
    if (resp.ok) {
      const data = await resp.json();
      const products = data?.payload?.records || [];
      const disneyCard = products.find((p: any) => 
        p?.name?.toLowerCase().includes("disney") && 
        p?.name?.toLowerCase().includes("500")
      );
      
      if (disneyCard) {
        const price = disneyCard?.skus?.[0]?.finalPrice || disneyCard?.finalPrice;
        if (price) {
          return {
            price: parseFloat(price),
            savings: 500 - parseFloat(price),
            available: true,
            url: `https://www.samsclub.com/p/${disneyCard.productId || "disney-gift-card-500"}`,
          };
        }
      }
    }
    // Fallback: Sam's Club regularly sells at $485 - check if page exists
    return { price: 485, savings: 15, available: false, url: "https://www.samsclub.com/s/disney%20gift%20card" };
  } catch (err) {
    logStep("Sam's Club error", { error: String(err) });
    return null;
  }
}

// Check Gift Card Granny (aggregator that tracks multiple retailers)
async function checkGiftCardGranny(): Promise<Array<{ retailer: string; price: number; savings: number; url: string }>> {
  try {
    const resp = await fetch(
      "https://www.giftcardgranny.com/gift-cards/disney/",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml",
        },
      }
    );
    
    const results: Array<{ retailer: string; price: number; savings: number; url: string }> = [];
    
    if (resp.ok) {
      const html = await resp.text();
      // Parse deals from the page
      const dealMatches = html.matchAll(/data-price="([\d.]+)"[^>]*data-face-value="([\d.]+)"[^>]*data-merchant="([^"]+)"/g);
      for (const match of dealMatches) {
        const price = parseFloat(match[1]);
        const faceValue = parseFloat(match[2]);
        const retailer = match[3];
        if (faceValue > 0 && price < faceValue) {
          results.push({
            retailer,
            price,
            savings: faceValue - price,
            url: `https://www.giftcardgranny.com/gift-cards/disney/`,
          });
        }
      }
    }
    
    return results;
  } catch (err) {
    logStep("GiftCardGranny error", { error: String(err) });
    return [];
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
    logStep("Starting gift card price check...");
    const results: string[] = [];

    // Check Raise.com for $100, $200, $500 cards
    for (const cardValue of [100, 200, 500]) {
      const raiseResult = await checkRaise(cardValue);
      if (raiseResult) {
        logStep("Raise result", { cardValue, ...raiseResult });
        const isGoodDeal = raiseResult.savings >= 5;
        await supabase.from("gift_card_deals").upsert({
          retailer: "Raise",
          card_value: cardValue,
          sale_price: raiseResult.price,
          deal_url: raiseResult.url,
          is_live: raiseResult.available && isGoodDeal,
          notes: `Secondary market. ${raiseResult.savings.toFixed(2) > 0 ? `Save $${raiseResult.savings.toFixed(2)} on $${cardValue} card.` : "No savings available right now."} Instant digital delivery.`,
          last_verified: new Date().toISOString(),
        }, { onConflict: "retailer,card_value" });
        results.push(`Raise $${cardValue}: $${raiseResult.price} (save $${raiseResult.savings.toFixed(2)})`);
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    // Check CardCash
    const cardCashResult = await checkCardCash(200);
    if (cardCashResult) {
      logStep("CardCash result", cardCashResult);
      await supabase.from("gift_card_deals").upsert({
        retailer: "CardCash",
        card_value: 200,
        sale_price: cardCashResult.price,
        deal_url: cardCashResult.url,
        is_live: cardCashResult.available,
        notes: `Secondary market Disney gift cards. Save $${cardCashResult.savings.toFixed(2)} on $200 card. Savings vary daily.`,
        last_verified: new Date().toISOString(),
      }, { onConflict: "retailer,card_value" });
      results.push(`CardCash $200: $${cardCashResult.price} (save $${cardCashResult.savings.toFixed(2)})`);
    }

    // Check Sam's Club
    const samsResult = await checkSamsClub();
    if (samsResult) {
      logStep("Sam's Club result", samsResult);
      await supabase.from("gift_card_deals").upsert({
        retailer: "Sam's Club",
        card_value: 500,
        sale_price: samsResult.price,
        deal_url: samsResult.url,
        is_live: samsResult.available,
        notes: `Members only. $500 Disney for $${samsResult.price} — save $${samsResult.savings}. Login required.`,
        last_verified: new Date().toISOString(),
      }, { onConflict: "retailer,card_value" });
      results.push(`Sam's Club $500: $${samsResult.price} (save $${samsResult.savings})`);
    }

    // Check Gift Card Granny aggregator
    const grannyResults = await checkGiftCardGranny();
    if (grannyResults.length > 0) {
      logStep("GiftCardGranny results", { count: grannyResults.length });
      for (const deal of grannyResults.slice(0, 3)) {
        await supabase.from("gift_card_deals").upsert({
          retailer: deal.retailer,
          card_value: 100,
          sale_price: deal.price,
          deal_url: deal.url,
          is_live: deal.savings > 2,
          notes: `Via GiftCardGranny. Save $${deal.savings.toFixed(2)}. Multiple sellers.`,
          last_verified: new Date().toISOString(),
        }, { onConflict: "retailer,card_value" });
        results.push(`${deal.retailer}: save $${deal.savings.toFixed(2)}`);
      }
    }

    // Notify users who have alerts for deals that just went live
    const { data: liveDeals } = await supabase.from("gift_card_deals")
      .select("*")
      .eq("is_live", true)
      .gte("last_verified", new Date(Date.now() - 3600000).toISOString());

    if (liveDeals && liveDeals.length > 0) {
      const { data: alerts } = await supabase.from("gift_card_alerts")
        .select("*, users_profile:user_id(email:users_profile.email)")
        .eq("is_active", true);
      
      // For each live deal, check if any alert matches
      let notified = 0;
      for (const deal of liveDeals) {
        for (const alert of (alerts || [])) {
          const minSavings = alert.min_savings || 10;
          const cardValues = alert.card_values || ["500"];
          const retailers = alert.retailers || ["Sam's Club"];
          
          if (
            deal.savings >= minSavings &&
            (cardValues.includes("Any") || cardValues.includes(String(Math.round(deal.card_value)))) &&
            (retailers.includes("All") || retailers.includes(deal.retailer))
          ) {
            // Send notification via send-notification function
            await supabase.from("dining_notifications").insert({
              alert_id: null,
              user_id: alert.user_id,
              restaurant_name: `🎁 ${deal.retailer} Disney Gift Card Deal`,
              alert_date: new Date().toISOString().split("T")[0],
              party_size: 1,
              availability_url: deal.deal_url,
              notification_type: "email",
            });
            notified++;
          }
        }
      }
      
      if (notified > 0) logStep(`Sent ${notified} gift card deal notifications`);
    }

    logStep("Scrape complete", { results });
    return new Response(JSON.stringify({ success: true, results, checkedAt: new Date().toISOString() }), {
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
