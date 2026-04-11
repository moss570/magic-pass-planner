import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BrandPassSwitcher from "./BrandPassSwitcher";
import { BrandScope } from "@/lib/brandScope";
import CompassButton from "@/components/CompassButton";

const categoryFilters = ["All", "Dining", "Merchandise", "Hotels", "Experiences", "Tours", "PhotoPass", "Other"];

const categoryBadge: Record<string, { emoji: string; color: string }> = {
  dining: { emoji: "🍽️", color: "bg-orange-500/15 text-orange-400" },
  merchandise: { emoji: "🛍️", color: "bg-pink-500/15 text-pink-400" },
  hotels: { emoji: "🏨", color: "bg-blue-500/15 text-blue-400" },
  experiences: { emoji: "🎭", color: "bg-purple-500/15 text-purple-400" },
  tours: { emoji: "🗺️", color: "bg-teal-500/15 text-teal-400" },
  photopass: { emoji: "📸", color: "bg-green-500/15 text-green-400" },
  other: { emoji: "✨", color: "bg-yellow-500/15 text-yellow-400" },
};

const ActiveDiscountsSection = () => {
  const { user } = useAuth();
  const [brand, setBrand] = useState<BrandScope | null>(null);
  const [filter, setFilter] = useState("All");
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPassIds, setUserPassIds] = useState<string[]>([]);
  const [userCardIds, setUserCardIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("user_park_passes").select("pass_id").eq("user_id", user.id).eq("is_active", true),
      supabase.from("user_credit_cards").select("card_id").eq("user_id", user.id),
    ]).then(([passRes, cardRes]) => {
      setUserPassIds((passRes.data || []).map((p: any) => p.pass_id));
      setUserCardIds((cardRes.data || []).map((c: any) => c.card_id));
    });
  }, [user]);

  useEffect(() => {
    if (!brand) return;
    setLoading(true);
    let query = supabase
      .from("park_discounts" as any)
      .select("*")
      .eq("brand_id", brand.id)
      .order("importance", { ascending: false });

    query.then(({ data }) => {
      // Filter to discounts eligible for user's passes/cards
      const filtered = (data as any[] || []).filter((d) => {
        const passTiers: string[] = d.eligible_pass_tiers || [];
        const cardIds: string[] = d.eligible_card_ids || [];
        const passMatch = passTiers.length === 0 || passTiers.some((t: string) => userPassIds.includes(t));
        const cardMatch = cardIds.length === 0 || cardIds.some((c: string) => userCardIds.includes(c));
        const dateMatch = !d.end_date || new Date(d.end_date) >= new Date();
        return (passMatch || cardMatch) && dateMatch;
      });
      setDiscounts(filtered);
      setLoading(false);
    });
  }, [brand, userPassIds, userCardIds]);

  const filteredDiscounts = filter === "All" ? discounts : discounts.filter((d) => d.category?.toLowerCase() === filter.toLowerCase());

  const hasNoPasses = userPassIds.length === 0 && userCardIds.length === 0;

  return (
    <div className="rounded-xl bg-card gold-border p-4 md:p-6">
      <h2 className="text-sm md:text-base font-bold text-foreground mb-1">🏷️ Active AP Discounts</h2>
      <p className="text-xs text-muted-foreground mb-4">Filtered to your passes and cards — updated daily</p>

      <div className="mb-4">
        <BrandPassSwitcher onBrandChange={setBrand} selectedBrandId={brand?.id} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {categoryFilters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-primary/30 text-muted-foreground hover:border-primary hover:text-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      {hasNoPasses ? (
        <div className="rounded-xl bg-muted/20 border border-primary/10 p-6 text-center">
          <p className="text-sm text-muted-foreground">Add a pass or card in <a href="/settings" className="text-primary hover:underline">Settings</a> to unlock brand-specific discounts.</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-muted/20 border border-primary/5 p-4 h-32 animate-pulse" />
          ))}
        </div>
      ) : filteredDiscounts.length === 0 ? (
        <div className="rounded-xl bg-muted/20 border border-primary/10 p-6 text-center">
          <p className="text-sm text-muted-foreground">No active discounts for your pass tier and cards right now. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDiscounts.map((d) => {
            const badge = categoryBadge[d.category] || categoryBadge.other;
            return (
              <div key={d.id} className="rounded-xl bg-muted/20 border border-primary/5 p-4">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${badge.color} mb-2 inline-block`}>
                  {badge.emoji} {d.category}
                </span>
                <h3 className="text-sm font-bold text-foreground mb-1">{d.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">{d.description}</p>
                {d.discount_percent && (
                  <span className="text-xs font-bold text-green-400">{d.discount_percent}% off</span>
                )}
                {d.location && (
                  <p className="text-[10px] text-muted-foreground mt-1">📍 {d.location}</p>
                )}
                {(d.is_stackable_with?.length > 0) && (
                  <p className="text-[10px] text-primary mt-1">Stackable with: {d.is_stackable_with.join(", ")}</p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {d.source && (
                    <button className="text-xs font-semibold text-primary hover:underline">View Details →</button>
                  )}
                  {d.category === "dining" && d.location && (
                    <CompassButton destination={d.title} context={`${d.category} Discount`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveDiscountsSection;
