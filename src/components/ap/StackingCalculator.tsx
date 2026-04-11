import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { computeBestStack, StackInputs, StackResult, UserPass, UserCard, UserMembership, Restaurant, Promotion, Discount } from "@/lib/stackingEngine";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, ArrowRight, Lightbulb } from "lucide-react";

const StackingCalculator = () => {
  const { user, session } = useAuth();
  const [billAmount, setBillAmount] = useState("120");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [userPasses, setUserPasses] = useState<UserPass[]>([]);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [userMemberships, setUserMemberships] = useState<UserMembership[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [result, setResult] = useState<StackResult | null>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [loadingAlt, setLoadingAlt] = useState(false);

  // Filters
  const [filterPark, setFilterPark] = useState("all");
  const [filterService, setFilterService] = useState("all");

  useEffect(() => {
    // Load restaurants
    supabase.from("restaurants").select("*").eq("is_active", true).order("name").then(({ data }) => {
      setRestaurants(data || []);
    });

    // Load discounts
    supabase.from("park_discounts" as any).select("*").eq("brand_id", "disney_wdw").then(({ data }) => {
      setDiscounts((data as any[] || []).map((d) => ({
        id: d.id,
        category: d.category,
        title: d.title,
        discountPercent: d.discount_percent,
        discountFlatAmount: d.discount_flat_amount,
        eligiblePassTiers: d.eligible_pass_tiers || [],
        eligibleCardIds: d.eligible_card_ids || [],
        isStackableWith: d.is_stackable_with || [],
        restaurantId: d.restaurant_id,
      })));
    });

    // Load promotions
    supabase.from("promotions" as any).select("*").eq("is_active", true).eq("brand_id", "disney_wdw").then(({ data }) => {
      setPromotions((data as any[] || []).map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        discountType: p.discount_type,
        discountValue: p.discount_value,
        eligibleCardIds: p.eligible_card_ids || [],
        eligiblePassTiers: p.eligible_pass_tiers || [],
        eligibleRestaurantIds: p.eligible_restaurant_ids || [],
      })));
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    // Load user's passes with details
    supabase.from("user_park_passes").select("pass_id").eq("user_id", user.id).eq("is_active", true).then(async ({ data: passRows }) => {
      if (!passRows?.length) { setUserPasses([]); return; }
      const ids = passRows.map((p: any) => p.pass_id);
      const { data: passDetails } = await supabase.from("park_passes" as any).select("*").in("id", ids);
      setUserPasses((passDetails as any[] || []).map((p) => ({
        passId: p.id,
        brandId: p.brand_id,
        tier: p.tier,
        displayName: p.display_name,
        discountPercentDining: p.discount_percent_dining || 0,
        discountPercentMerch: p.discount_percent_merch || 0,
      })));
    });

    // Load user's cards with details
    supabase.from("user_credit_cards").select("card_id").eq("user_id", user.id).then(async ({ data: cardRows }) => {
      if (!cardRows?.length) { setUserCards([]); return; }
      const ids = cardRows.map((c: any) => c.card_id);
      const { data: cardDetails } = await supabase.from("credit_cards" as any).select("*").in("id", ids);
      setUserCards((cardDetails as any[] || []).map((c) => ({
        cardId: c.id,
        issuer: c.issuer,
        name: c.name,
        rewardType: c.reward_type,
        baseRewardRate: c.base_reward_rate,
        diningRewardRate: c.dining_reward_rate,
        hotelRewardRate: c.hotel_reward_rate,
        disneyRewardRate: c.disney_reward_rate,
        notes: c.notes || "",
      })));
    });

    // Load memberships
    supabase.from("user_memberships" as any).select("*").eq("user_id", user.id).then(({ data }) => {
      setUserMemberships((data as any[] || []).map((m) => ({
        membershipType: m.membership_type,
        isActive: m.is_active,
        expirationDate: m.expiration_date,
        details: m.details,
      })));
    });
  }, [user]);

  const filteredRestaurants = useMemo(() => {
    let list = restaurants;
    if (filterPark !== "all") list = list.filter((r) => r.park_id === filterPark || r.location?.toLowerCase().includes(filterPark));
    if (filterService !== "all") list = list.filter((r) => r.service_type === filterService);
    if (searchTerm) list = list.filter((r) => r.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [restaurants, filterPark, filterService, searchTerm]);

  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);

  const handleCalculate = () => {
    if (!selectedRestaurant) return;
    const bill = parseFloat(billAmount) || 0;
    const restaurant: Restaurant = {
      id: selectedRestaurant.id,
      name: selectedRestaurant.name,
      brandId: selectedRestaurant.brand_id || "disney_wdw",
      parkId: selectedRestaurant.park_id,
      location: selectedRestaurant.location,
      serviceType: selectedRestaurant.service_type || "table",
      avgTicketPerPerson: selectedRestaurant.avg_ticket_per_person || 0,
      cuisine: selectedRestaurant.cuisine,
    };

    const inputs: StackInputs = {
      billAmount: bill,
      restaurantId: selectedRestaurant.id,
      userPasses,
      userCards,
      userMemberships,
      promotions,
      restaurant,
      discounts,
    };

    const r = computeBestStack(inputs);
    setResult(r);
    fetchAlternatives(bill);
  };

  const fetchAlternatives = async (bill: number) => {
    if (!selectedRestaurant || !session) return;
    setLoadingAlt(true);
    try {
      const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/stacking-suggest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ restaurantId: selectedRestaurant.id, billAmount: bill, userId: user?.id }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setAlternatives(data.alternatives || []);
      }
    } catch {
      // Silently fail alternatives
    }
    setLoadingAlt(false);
  };

  const bill = parseFloat(billAmount) || 120;

  return (
    <div className="rounded-xl bg-card gold-border p-4 md:p-6">
      <h2 className="text-sm md:text-base font-bold text-foreground mb-1">🧮 AP Discount Stacking Calculator</h2>
      <p className="text-xs text-muted-foreground mb-5">See exactly how much you'll save — reads your passes and cards automatically</p>

      {/* Profile summary */}
      <div className="flex flex-wrap gap-2 mb-4">
        {userPasses.length > 0 ? (
          userPasses.map((p) => (
            <Badge key={p.passId} variant="outline" className="text-[10px] border-primary/30 text-primary">🎟️ {p.displayName}</Badge>
          ))
        ) : (
          <Badge variant="outline" className="text-[10px] border-muted text-muted-foreground">No passes — add in Settings</Badge>
        )}
        {userCards.map((c) => (
          <Badge key={c.cardId} variant="outline" className="text-[10px] border-blue-400/30 text-blue-400">💳 {c.name}</Badge>
        ))}
        {userMemberships.filter((m) => m.isActive).map((m) => (
          <Badge key={m.membershipType} variant="outline" className="text-[10px] border-green-400/30 text-green-400">✓ {m.membershipType.replace(/_/g, " ")}</Badge>
        ))}
      </div>

      {/* Filters & Restaurant Picker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Park / Area</label>
          <Select value={filterPark} onValueChange={setFilterPark}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="magic-kingdom">Magic Kingdom</SelectItem>
              <SelectItem value="epcot">EPCOT</SelectItem>
              <SelectItem value="hollywood-studios">Hollywood Studios</SelectItem>
              <SelectItem value="animal-kingdom">Animal Kingdom</SelectItem>
              <SelectItem value="Disney Springs">Disney Springs</SelectItem>
              <SelectItem value="Resort">Resort Hotels</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Service Type</label>
          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="quick">Quick Service</SelectItem>
              <SelectItem value="table">Table Service</SelectItem>
              <SelectItem value="character">Character Dining</SelectItem>
              <SelectItem value="fine_dining">Fine Dining</SelectItem>
              <SelectItem value="lounge">Lounge</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Bill Amount</label>
          <Input type="number" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} placeholder="$120" className="text-sm" />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs text-muted-foreground mb-1 block">Restaurant</label>
        <Input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setSelectedRestaurantId(""); }} placeholder="Search restaurants..." className="text-sm mb-2" />
        {searchTerm && !selectedRestaurantId && (
          <div className="max-h-48 overflow-y-auto rounded-lg border border-primary/10 bg-background">
            {filteredRestaurants.slice(0, 15).map((r) => (
              <button
                key={r.id}
                className="w-full text-left px-3 py-2 hover:bg-muted/30 text-sm border-b border-primary/5 last:border-0"
                onClick={() => { setSelectedRestaurantId(r.id); setSearchTerm(r.name); }}
              >
                <span className="font-semibold text-foreground">{r.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{r.location} · {r.cuisine || r.service_type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button onClick={handleCalculate} disabled={!selectedRestaurantId} className="w-full mb-5">
        Calculate My Stack
      </Button>

      {/* Results */}
      {result && selectedRestaurant && (
        <div className="space-y-4">
          {/* Warnings & Caveats */}
          {(result.warnings.length > 0 || result.caveats.length > 0) && (
            <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3 space-y-1">
              {result.warnings.map((w, i) => (
                <p key={`w${i}`} className="text-xs text-yellow-400 flex items-start gap-1">
                  <Info className="w-3 h-3 shrink-0 mt-0.5" /> {w}
                </p>
              ))}
              {result.caveats.map((c, i) => (
                <p key={`c${i}`} className="text-xs text-muted-foreground flex items-start gap-1">
                  <Info className="w-3 h-3 shrink-0 mt-0.5" /> {c}
                </p>
              ))}
            </div>
          )}

          {/* Primary Result */}
          <div className="rounded-xl bg-muted/20 border border-primary/10 p-4 md:p-5">
            <p className="text-sm font-bold text-foreground mb-3">For a ${bill.toFixed(0)} bill at {selectedRestaurant.name}:</p>
            <div className="space-y-2 mb-3">
              {result.breakdown.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      item.type === "discount" ? "bg-green-500/15 text-green-400" :
                      item.type === "promotion" ? "bg-purple-500/15 text-purple-400" :
                      item.type === "gift_card_savings" ? "bg-blue-500/15 text-blue-400" :
                      "bg-yellow-500/15 text-yellow-400"
                    }`}>
                      {item.type === "discount" ? "Discount" : item.type === "promotion" ? "Promo" : item.type === "gift_card_savings" ? "Gift Card" : "Rewards"}
                    </span>
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="text-green-400 font-semibold">-${item.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-primary/10 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-foreground">Total discount</span>
              <span className="text-green-400 font-bold">-${result.totalSavings.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-bold text-foreground">You pay</span>
              <span className="text-xl md:text-2xl font-extrabold text-green-400">${(bill - result.totalSavings).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted-foreground">Effective savings rate</span>
              <span className="text-xs font-semibold text-primary">{(result.effectiveRate * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Alternatives */}
          {alternatives.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <p className="text-sm font-semibold text-foreground">Save more at a similar restaurant?</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {alternatives.map((alt: any, i: number) => (
                  <button
                    key={i}
                    className="rounded-xl border border-primary/10 bg-muted/20 p-3 text-left hover:border-primary/30 transition-colors"
                    onClick={() => { setSelectedRestaurantId(alt.restaurantId); setSearchTerm(alt.name); handleCalculate(); }}
                  >
                    <p className="text-xs font-bold text-foreground">{alt.name}</p>
                    <p className="text-[10px] text-muted-foreground">{alt.cuisine} · {alt.location}</p>
                    <p className="text-xs text-green-400 font-semibold mt-1">
                      Save ${alt.estimatedSavings?.toFixed(2)} (+${alt.savingsDelta?.toFixed(2)} more)
                    </p>
                    {alt.reason && <p className="text-[10px] text-primary mt-0.5">{alt.reason}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Gift card tip */}
          {userCards.some((c) => c.cardId.startsWith("target_redcard")) && (
            <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
              <p className="text-xs text-blue-400">
                💡 <strong>Tip:</strong> Buy Disney gift cards with your Target RedCard for 5% off, then use them to pay your bill for additional savings.
              </p>
            </div>
          )}

          {/* Credit card redemption tips */}
          {userCards.some((c) => c.cardId === "chase_sapphire_preferred" || c.cardId === "chase_sapphire_reserve") && (
            <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-3">
              <p className="text-xs text-purple-400">
                💳 <strong>Redemption Tip:</strong> Redeem Chase Ultimate Rewards at {userCards.find((c) => c.cardId === "chase_sapphire_reserve") ? "1.5x" : "1.25x"} through Chase Travel for extra value.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StackingCalculator;
