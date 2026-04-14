import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify auth
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { restaurantId, billAmount, userId } = await req.json();

    // Get the selected restaurant
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .single();

    if (!restaurant) {
      return new Response(JSON.stringify({ alternatives: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's passes and cards
    const [passesRes, cardsRes, membershipsRes] = await Promise.all([
      supabase.from("user_park_passes").select("pass_id").eq("user_id", userId).eq("is_active", true),
      supabase.from("user_credit_cards").select("card_id").eq("user_id", userId),
      supabase.from("user_memberships").select("*").eq("user_id", userId).eq("is_active", true),
    ]);

    const userPassIds = (passesRes.data || []).map((p: any) => p.pass_id);
    const userCardIds = (cardsRes.data || []).map((c: any) => c.card_id);
    const hasTiw = (membershipsRes.data || []).some((m: any) => m.membership_type === "tables_in_wonderland");

    // Get discounts
    const { data: discounts } = await supabase
      .from("park_discounts")
      .select("*")
      .eq("brand_id", restaurant.brand_id || "disney_wdw")
      .eq("category", "dining");

    // Get promotions
    const { data: promotions } = await supabase
      .from("promotions")
      .select("*")
      .eq("is_active", true)
      .eq("brand_id", restaurant.brand_id || "disney_wdw");

    // Calculate current restaurant savings
    const currentSavings = calculateSimpleSavings(billAmount, userPassIds, userCardIds, hasTiw, discounts || [], promotions || [], restaurantId);

    // Find similar restaurants
    const { data: candidates } = await supabase
      .from("restaurants")
      .select("*")
      .eq("is_active", true)
      .neq("id", restaurantId)
      .eq("brand_id", restaurant.brand_id || "disney_wdw")
      .limit(50);

    // Score each candidate
    const scored = (candidates || [])
      .filter((c: any) => {
        // Same price range or similar
        return c.price_range === restaurant.price_range || 
          (restaurant.location_type === c.location_type);
      })
      .map((c: any) => {
        const savings = calculateSimpleSavings(billAmount, userPassIds, userCardIds, hasTiw, discounts || [], promotions || [], c.id);
        return {
          restaurantId: c.id,
          name: c.name,
          cuisine: c.cuisine,
          location: c.location,
          image_url: c.image_url,
          avgTicketPerPerson: c.avg_ticket_per_person,
          estimatedSavings: savings,
          savingsDelta: savings - currentSavings,
          reason: savings > currentSavings ? "Higher discount eligibility" : "Similar experience",
          currentPromotions: (promotions || []).filter((p: any) =>
            (p.eligible_restaurant_ids || []).includes(c.id)
          ).map((p: any) => p.title),
        };
      })
      .filter((c: any) => c.savingsDelta > 0)
      .sort((a: any, b: any) => b.savingsDelta - a.savingsDelta)
      .slice(0, 3);

    return new Response(JSON.stringify({
      currentSavings,
      alternatives: scored,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculateSimpleSavings(
  bill: number,
  passIds: string[],
  cardIds: string[],
  hasTiw: boolean,
  discounts: any[],
  promotions: any[],
  restaurantId: string
): number {
  let bestExclusive = 0;

  // AP discounts
  for (const d of discounts) {
    if (d.discount_percent && (d.eligible_pass_tiers || []).some((t: string) => passIds.includes(t))) {
      bestExclusive = Math.max(bestExclusive, bill * (d.discount_percent / 100));
    }
  }

  // Card discounts
  for (const d of discounts) {
    if (d.discount_percent && (d.eligible_card_ids || []).some((c: string) => cardIds.includes(c))) {
      bestExclusive = Math.max(bestExclusive, bill * (d.discount_percent / 100));
    }
  }

  // TIW
  if (hasTiw) {
    bestExclusive = Math.max(bestExclusive, bill * 0.2);
  }

  // Promotions
  let promoSavings = 0;
  for (const p of promotions) {
    if ((p.eligible_restaurant_ids || []).includes(restaurantId) || (p.eligible_restaurant_ids || []).length === 0) {
      if (p.discount_type === "percent") {
        promoSavings += bill * (p.discount_value / 100);
      }
    }
  }

  // Gift card savings (assume 5% if user has RedCard)
  const giftCardSavings = cardIds.some((c: string) => c.startsWith("target_redcard")) ? bill * 0.05 : 0;

  return bestExclusive + promoSavings + giftCardSavings;
}
