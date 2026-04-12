import { useState, useEffect } from "react";
import { Castle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { isFeatureEnabled } from "@/lib/featureFlags";
import BestDaysWidget from "@/components/ap/BestDaysWidget";
import ActiveDiscountsSection from "@/components/ap/ActiveDiscountsSection";
import HotelDealAlertsSection from "@/components/ap/HotelDealAlertsSection";
import MerchDropAlertsSection from "@/components/ap/MerchDropAlertsSection";
import StackingCalculator from "@/components/ap/StackingCalculator";
import { useSubscription } from "@/hooks/useSubscription";
import { FeatureGate } from "@/components/FeatureGate";
import BlockoutCalendar from "@/components/ap/BlockoutCalendar";

const APCommandCenter = () => {
  const [liveOffers, setLiveOffers] = useState<any[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const { access } = useSubscription();

  useEffect(() => {
    supabase.from("disney_offers")
      .select("*")
      .eq("is_active", true)
      .order("importance", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setLiveOffers(data || []);
        setOffersLoading(false);
      });
  }, []);

  return (
    <DashboardLayout title="🎟️ AP Command Center" subtitle="Your Annual Passholder headquarters — blockouts, discounts, renewals, and deals">
      <div className="space-y-6">
        {/* Pass tier badge */}
        <div className="inline-flex items-center gap-1.5 bg-primary/15 text-primary text-xs font-semibold px-4 py-2 rounded-full">
          <Castle className="w-3.5 h-3.5" />
          Incredi-Pass Holder ✓
        </div>

        {/* Section 1: Pass Overview */}
        <div className="rounded-xl bg-card gold-border p-4 md:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: "Pass Tier", value: "Incredi-Pass", valueColor: "text-primary", sub: "" },
              { label: "Expiration", value: "Nov 14, 2026", valueColor: "text-foreground", sub: "224 days remaining", subColor: "text-green-400" },
              { label: "Renewal Cost", value: "$1,399/adult", valueColor: "text-foreground", sub: "Current price if renewed today" },
              { label: "Renewal Alert", value: "⏰ 60-day alert set", valueColor: "text-primary", sub: "Reminder: Sep 15, 2026" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-[10px] md:text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className={`text-lg md:text-2xl font-extrabold ${s.valueColor} leading-tight`}>{s.value}</p>
                {s.sub && <p className={`text-[10px] md:text-xs mt-0.5 ${(s as any).subColor || "text-muted-foreground"}`}>{s.sub}</p>}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Pass Year Progress</span>
              <span>141 of 365 days used</span>
            </div>
            <Progress value={38.6} className="h-1.5 bg-muted" />
          </div>
        </div>

        {/* Section 2: Current Disney Offers (moved above calendar) */}
        <div className="rounded-xl p-4 md:p-5 border border-white/8" style={{ background: "#111827" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">🚨 Current Disney Offers</h2>
              <p className="text-xs text-muted-foreground">Live from disneyworld.disney.go.com · Updated 5x daily</p>
            </div>
            <Link to="/social-feed" className="text-xs text-primary hover:underline">Social Feed →</Link>
          </div>
          {liveOffers.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3">Loading current offers...</p>
          ) : (
            <div className="space-y-3">
              {liveOffers.map((offer: any) => (
                <div key={offer.id} className={`rounded-xl p-3 border ${offer.importance === "breaking" ? "border-red-500/30 bg-red-500/5" : "border-white/8 bg-white/3"}`}>
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    {offer.importance === "breaking" && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">🚨 BREAKING</span>}
                    {offer.importance === "high" && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold">⚡ HOT</span>}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground capitalize">{offer.category?.replace("_"," ")}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{offer.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{offer.summary}</p>
                  {offer.valid_through && (
                    <p className="text-xs text-yellow-400 mt-1">⏰ Valid through {new Date(offer.valid_through + "T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p>
                  )}
                  {offer.offer_url && (
                    <a href={offer.offer_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1.5 block">Book at Disney World →</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Calendar + Best Days */}
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6">
          <FeatureGate hasAccess={!!access.apBlockoutCalendar} featureName="AP Blockout Calendar" requiredPlan="Magic Pass Planner">
            <BlockoutCalendar passTier="incredi-pass" />
          </FeatureGate>

          {isFeatureEnabled("bestDaysToGoV2") ? (
            <BestDaysWidget userPassTier={null} />
          ) : (
            <div className="rounded-xl bg-card gold-border p-4 md:p-6">
              <h2 className="text-sm md:text-base font-bold text-foreground mb-1">🧠 Best Days to Go</h2>
              <p className="text-xs text-muted-foreground">Coming soon — real 10-day forecast</p>
            </div>
          )}
        </div>

        {/* Section 4: AP Discounts */}
        <FeatureGate hasAccess={!!access.apDiscountDatabase} featureName="AP Discount Database" requiredPlan="Magic Pass Plus">
          {isFeatureEnabled("apCommandCenterV2") ? (
            <ActiveDiscountsSection />
          ) : (
            <div className="rounded-xl bg-card gold-border p-4 md:p-6">
              <h2 className="text-sm md:text-base font-bold text-foreground mb-1">🏷️ Active AP Discounts</h2>
              <p className="text-xs text-muted-foreground">Coming soon — live discount feed</p>
            </div>
          )}
        </FeatureGate>

        {/* Section 5: Hotel + Merch Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeatureGate hasAccess={!!access.apHotelAlerts} featureName="AP Hotel Deal Alerts" requiredPlan="Magic Pass Planner">
            {isFeatureEnabled("apCommandCenterV2") ? (
              <HotelDealAlertsSection />
            ) : (
              <div className="rounded-xl bg-card gold-border p-4 md:p-6">
                <h2 className="text-sm md:text-base font-bold text-foreground mb-1">🏨 AP Hotel Deal Alerts</h2>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
            )}
          </FeatureGate>
          <FeatureGate hasAccess={!!access.apMerchAlerts} featureName="AP Merch Drop Alerts" requiredPlan="Magic Pass Planner">
            {isFeatureEnabled("apCommandCenterV2") ? (
              <MerchDropAlertsSection />
            ) : (
              <div className="rounded-xl bg-card gold-border p-4 md:p-6">
                <h2 className="text-sm md:text-base font-bold text-foreground mb-1">🛍️ AP Merchandise Drop Alerts</h2>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
            )}
          </FeatureGate>
        </div>

        {/* Section 6: Stacking Calculator */}
        {isFeatureEnabled("apCommandCenterV2") ? (
          <StackingCalculator />
        ) : (
          <div className="rounded-xl bg-card gold-border p-4 md:p-6">
            <h2 className="text-sm md:text-base font-bold text-foreground mb-1">🧮 AP Discount Stacking Calculator</h2>
            <p className="text-xs text-muted-foreground">Coming soon — real stacking engine</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default APCommandCenter;
