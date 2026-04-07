import { useState, useEffect } from "react";
import { Bell, RefreshCw, Calculator, ExternalLink, TrendingUp, ShoppingBag, CreditCard, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const RETAILER_COLORS: Record<string, { bg: string; color: string; emoji: string }> = {
  "Sam's Club": { bg: "bg-blue-600", color: "text-white", emoji: "🏪" },
  "Target": { bg: "bg-red-600", color: "text-white", emoji: "🎯" },
  "Costco": { bg: "bg-blue-900", color: "text-white", emoji: "🏬" },
  "BJ's Wholesale": { bg: "bg-yellow-600", color: "text-white", emoji: "🏢" },
  "Kroger": { bg: "bg-green-700", color: "text-white", emoji: "🛒" },
  "Safeway": { bg: "bg-orange-600", color: "text-white", emoji: "🛍️" },
};

interface Deal {
  id: string; retailer: string; card_value: number; sale_price: number;
  savings: number; savings_pct: number; deal_url: string; is_live: boolean;
  last_verified: string; notes: string; expires_at?: string;
}

export default function GiftCardTracker() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripBudget, setTripBudget] = useState(6500);
  const [hasRedCard, setHasRedCard] = useState(false);
  const [creditCardRate, setCreditCardRate] = useState(2);
  const [alertPrefs, setAlertPrefs] = useState({ minSavings: 10, alertEmail: true, active: false });
  const [settingAlert, setSettingAlert] = useState(false);

  useEffect(() => {
    loadDeals();
    if (session) loadAlertPrefs();
  }, [session]);

  const loadDeals = async () => {
    setLoading(true);
    const { data } = await supabase.from("gift_card_deals").select("*").order("priority", { ascending: true, nullsLast: true }).order("is_live", { ascending: false }).order("savings", { ascending: false });
    setDeals(data || []);
    setLoading(false);
  };

  const loadAlertPrefs = async () => {
    if (!session) return;
    const { data } = await supabase.from("gift_card_alerts").select("*").eq("user_id", session.user.id).single();
    if (data) setAlertPrefs({ minSavings: data.min_savings, alertEmail: data.alert_email, active: data.is_active });
  };

  const saveAlert = async () => {
    if (!session) { toast({ title: "Please log in to set alerts", variant: "destructive" }); return; }
    setSettingAlert(true);
    await supabase.from("gift_card_alerts").upsert({
      user_id: session.user.id,
      min_savings: alertPrefs.minSavings,
      alert_email: alertPrefs.alertEmail,
      is_active: true,
    }, { onConflict: "user_id" });
    setAlertPrefs(p => ({ ...p, active: true }));
    toast({ title: "✅ Alert set! We'll notify you when new deals go live." });
    setSettingAlert(false);
  };

  // Savings calculator
  const calcSavings = () => {
    const samsClub = deals.find(d => d.retailer === "Sam's Club" && d.is_live);
    const samsSavings = samsClub ? (tripBudget / samsClub.card_value) * samsClub.savings : 0;
    const redCardSavings = hasRedCard ? tripBudget * 0.05 : 0;
    const ccSavings = tripBudget * (creditCardRate / 100);
    // Can't double-stack Sam's + RedCard on same purchase, take the better deal
    const retailSavings = Math.max(samsSavings, redCardSavings);
    return { retailSavings, ccSavings, total: retailSavings + ccSavings };
  };

  const savings = calcSavings();
  // Keep priority order from database (already sorted by priority ASC)
  const liveDeals = deals.filter(d => d.is_live);
  const watchDeals = deals.filter(d => !d.is_live);

  return (
    <DashboardLayout title="🎁 Disney Gift Card Deal Tracker" subtitle="Save $200-600 on every Disney trip with discounted gift cards">
      <div className="space-y-5">

        {/* Live deals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 live-pulse" />
              <p className="text-sm font-bold text-foreground">🟢 Live Deals ({liveDeals.length})</p>
            </div>
            <button onClick={loadDeals} disabled={loading} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" /></div>
          ) : liveDeals.length === 0 ? (
            <div className="rounded-xl p-6 text-center border border-white/8" style={{ background: "var(--card)" }}>
              <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No live deals right now</p>
              <p className="text-xs text-muted-foreground mt-1">Set an alert to be notified when deals appear</p>
            </div>
          ) : (
            <div className="space-y-3">
              {liveDeals.map(deal => {
                const retailer = RETAILER_COLORS[deal.retailer] || { bg: "bg-muted", color: "text-foreground", emoji: "🏪" };
                return (
                  <div key={deal.id} className="rounded-xl border border-green-500/30 overflow-hidden" style={{ background: "var(--card)" }}>
                    <div className="flex items-center gap-3 p-4">
                      <div className={`w-12 h-12 rounded-xl ${retailer.bg} flex items-center justify-center text-xl shrink-0`}>
                        {retailer.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-foreground">{deal.retailer}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">
                            🟢 LIVE — SAVE ${deal.savings}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{deal.notes}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground line-through">${deal.card_value}</p>
                        <p className="text-lg font-black text-primary">${deal.sale_price}</p>
                        <p className="text-xs text-green-400 font-semibold">{deal.savings_pct}% off</p>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <a href={deal.deal_url} target="_blank" rel="noopener noreferrer"
                        className="w-full py-2.5 rounded-xl font-bold text-sm text-[var(--background)] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                        style={{ background: "#F5C842" }}>
                        🛒 Shop This Deal <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Watching (no current deal) */}
        {watchDeals.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">⏳ Watching — No Active Deal</p>
            <div className="space-y-2">
              {watchDeals.map(deal => {
                const retailer = RETAILER_COLORS[deal.retailer] || { bg: "bg-muted", color: "text-foreground", emoji: "🏪" };
                return (
                  <div key={deal.id} className="rounded-xl p-3 border border-white/8 flex items-center gap-3" style={{ background: "var(--card)" }}>
                    <div className={`w-10 h-10 rounded-lg ${retailer.bg} flex items-center justify-center text-lg shrink-0 opacity-60`}>
                      {retailer.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-muted-foreground">{deal.retailer} — ${deal.card_value} card</p>
                      <p className="text-xs text-muted-foreground">{deal.notes}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">No deal now</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Set Alert */}
        <div className="rounded-xl p-5 border border-white/8" style={{ background: "var(--card)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-foreground">Deal Alerts</p>
            </div>
            {alertPrefs.active && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-semibold">✅ Active</span>}
          </div>
          <p className="text-xs text-muted-foreground mb-3">Get notified the instant a gift card deal goes live</p>
          <div className="flex items-center gap-3 mb-3">
            <p className="text-xs text-muted-foreground whitespace-nowrap">Alert me when savings ≥</p>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map(v => (
                <button key={v} onClick={() => setAlertPrefs(p => ({ ...p, minSavings: v }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${alertPrefs.minSavings === v ? "bg-primary text-[var(--background)] border-primary" : "border-white/10 text-muted-foreground"}`}>
                  ${v}
                </button>
              ))}
            </div>
          </div>
          <button onClick={saveAlert} disabled={settingAlert}
            className="w-full py-2.5 rounded-xl font-bold text-sm text-[var(--background)] disabled:opacity-60"
            style={{ background: "#F5C842" }}>
            {settingAlert ? "Saving..." : alertPrefs.active ? "✅ Update Alert Settings" : "🔔 Set Alert"}
          </button>
        </div>

        {/* Savings Calculator */}
        <div className="rounded-xl p-5 border border-white/8" style={{ background: "var(--card)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Trip Savings Calculator</p>
          </div>
          <div className="space-y-3 mb-5">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">My total trip spend: <span className="text-primary font-bold">${tripBudget.toLocaleString()}</span></label>
              <input type="range" min={1000} max={15000} step={500} value={tripBudget} onChange={e => setTripBudget(parseInt(e.target.value))}
                className="w-full accent-primary" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-foreground">Target RedCard (5% back)</label>
              <button onClick={() => setHasRedCard(r => !r)}
                className={`w-12 h-6 rounded-full transition-all ${hasRedCard ? "bg-primary" : "bg-white/20"}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-all mx-0.5 ${hasRedCard ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Credit card cashback: <span className="text-primary font-bold">{creditCardRate}%</span></label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 5, 6].map(r => (
                  <button key={r} onClick={() => setCreditCardRate(r)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${creditCardRate === r ? "bg-primary text-[var(--background)] border-primary" : "border-white/10 text-muted-foreground"}`}>
                    {r}%
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Chase 5% · Amex Blue Cash 6% (supermarkets) · Citi 2% · Standard 1-2%</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {[
              { label: "Gift card discount (Sam's Club)", value: savings.retailSavings, note: "Best deal on $500 cards" },
              { label: `Credit card cashback (${creditCardRate}%)`, value: savings.ccSavings, note: "Applied to gift card purchases" },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-xs font-medium text-foreground">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.note}</p>
                </div>
                <p className="text-sm font-bold text-green-400">-${row.value.toFixed(0)}</p>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total estimated savings</p>
              <p className="text-2xl font-black text-primary">${savings.total.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">{((savings.total / tripBudget) * 100).toFixed(1)}% back on your trip</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary opacity-50" />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            💡 <strong>Stack strategy:</strong> Buy Sam's Club gift cards with your highest cashback credit card for maximum savings.
            {hasRedCard ? " Target RedCard only applies at Target — use it there, Sam's elsewhere." : " Consider a Target RedCard for 5% off all Target gift card purchases."}
          </p>
        </div>

        {/* How it works */}
        <div className="rounded-xl p-4 border border-white/8" style={{ background: "var(--card)" }}>
          <p className="text-xs font-bold text-foreground mb-3">💡 How to maximize Disney gift card savings</p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>1. 🎯 <strong className="text-foreground">Buy at Sam's Club</strong> — best consistent Disney gift card discounts for members</p>
            <p>2. 💳 <strong className="text-foreground">Use a cashback card</strong> — Amex Blue Cash Preferred earns 6% at supermarkets on gift cards</p>
            <p>3. 🔴 <strong className="text-foreground">Target RedCard</strong> — 5% off Target gift cards (different store, can stack with Sam's strategy)</p>
            <p>4. 📱 <strong className="text-foreground">Use gift cards everywhere</strong> — tickets, hotel, dining, merchandise, Lightning Lane</p>
            <p>5. 🔔 <strong className="text-foreground">Set an alert above</strong> — deals sell out fast, often within hours</p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
