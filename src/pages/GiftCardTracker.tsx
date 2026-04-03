import { useState } from "react";
import { Bell, Mail, MessageSquare, Info } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const deals = [
  {
    retailer: "SAM'S CLUB",
    color: "bg-blue-600",
    title: '$500 Disney Gift Card',
    originalPrice: "$500",
    salePrice: "$485",
    savings: "SAVE $15",
    savingsBadge: "SAVE $15 🟢 LIVE",
    badgeColor: "bg-green-500/15 text-green-400",
    expiry: "In stock now · Updated 4 min ago",
    hasAction: true,
  },
  {
    retailer: "TARGET",
    color: "bg-red-600",
    title: '$200 Disney Gift Card + RedCard 5%',
    originalPrice: "$200",
    salePrice: "$190 effective",
    savings: "SAVE $10 + 5%",
    savingsBadge: "SAVE $10 + 5% 🟢 LIVE",
    badgeColor: "bg-green-500/15 text-green-400",
    expiry: "RedCard discount always active",
    hasAction: true,
  },
  {
    retailer: "COSTCO",
    color: "bg-blue-800",
    title: '$400 Disney Gift Card Bundle',
    originalPrice: "$400",
    salePrice: "$379.99",
    savings: "SAVE $20",
    savingsBadge: "SAVE $20 🟡 LIMITED",
    badgeColor: "bg-yellow-500/15 text-yellow-400",
    expiry: "Members only · Stock running low",
    hasAction: true,
  },
  {
    retailer: "BJ'S WHOLESALE",
    color: "bg-yellow-500",
    title: '$300 Disney Gift Card',
    originalPrice: "$300",
    salePrice: null,
    savings: null,
    savingsBadge: "⏳ NO DEAL NOW",
    badgeColor: "bg-muted text-muted-foreground",
    expiry: "Last deal: Mar 28 — Save $18",
    hasAction: false,
  },
];

const savingsOptions = ["$10+", "$15+", "$20+", "$25+"];
const cardValues = ["$100", "$200", "$300", "$400", "$500", "Any"];
const retailerOptions = ["Sam's Club", "Target", "Costco", "BJ's", "Raise", "CardCash", "All"];
const cashbackRates = ["1%", "2%", "3%", "5%", "6%", "Custom"];

const historyRows = [
  { retailer: "Sam's Club", deal: "$500 for $485", savings: "$15", dates: "Mar 1 – Mar 15", status: "expired" },
  { retailer: "Target", deal: "RedCard 5% off", savings: "5%", dates: "Ongoing", status: "active" },
  { retailer: "Costco", deal: "$400 for $379.99", savings: "$20.01", dates: "Feb 14 – Feb 28", status: "expired" },
  { retailer: "Sam's Club", deal: "$500 for $480", savings: "$20", dates: "Jan 10 – Jan 31", status: "expired" },
  { retailer: "BJ's", deal: "$300 for $282", savings: "$18", dates: "Mar 20 – Mar 28", status: "expired" },
];

const GiftCardTracker = () => {
  const [minSavings, setMinSavings] = useState("$15+");
  const [selectedCardValue, setSelectedCardValue] = useState("Any");
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>(["All"]);
  const [pushOn, setPushOn] = useState(true);
  const [emailOn, setEmailOn] = useState(true);
  const [smsOn, setSmsOn] = useState(false);
  const [tripSpend, setTripSpend] = useState("6500");
  const [hasRedCard, setHasRedCard] = useState(false);
  const [selectedCashback, setSelectedCashback] = useState("2%");
  const [customCashback, setCustomCashback] = useState("");

  const toggleRetailer = (r: string) => {
    if (r === "All") { setSelectedRetailers(["All"]); return; }
    setSelectedRetailers((prev) => {
      const without = prev.filter((x) => x !== "All");
      return without.includes(r) ? without.filter((x) => x !== r) : [...without, r];
    });
  };

  const spend = parseFloat(tripSpend) || 6500;
  const cashbackPct = selectedCashback === "Custom"
    ? (parseFloat(customCashback) || 0) / 100
    : parseFloat(selectedCashback) / 100;
  const samsSavings = (spend * 0.015).toFixed(2);
  const redCardSavings = hasRedCard ? (spend * 0.005).toFixed(2) : "0.00";
  const ccSavings = (spend * cashbackPct).toFixed(2);
  const costcoSavings = "20.00";
  const totalSavings = (parseFloat(samsSavings) + parseFloat(redCardSavings) + parseFloat(costcoSavings) + parseFloat(ccSavings)).toFixed(2);
  const pct = ((parseFloat(totalSavings) / spend) * 100).toFixed(1);

  return (
    <DashboardLayout title="🎁 Disney Gift Card Deal Tracker" subtitle="We monitor Sam's Club, Target, Costco, BJ's & more 24/7 — you get alerted the instant a deal goes live">
      <div className="space-y-6">
        {/* Value callout */}
        <div className="rounded-xl bg-card gold-border p-5 border-l-4 border-l-primary">
          <p className="text-sm text-foreground leading-relaxed">
            💡 <span className="font-semibold">The average Magic Pass member saves $280 per trip</span> using this feature alone. Sam's Club regularly sells $500 Disney gift cards for $485. Stack with Target RedCard for an extra 5%.
          </p>
        </div>

        {/* Section 1: Live Deals */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            🟢 Live Deals Right Now
            <span className="w-2 h-2 rounded-full bg-green-400 live-pulse" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deals.map((deal) => (
              <div key={deal.retailer} className="rounded-xl bg-card gold-border p-5 relative">
                <span className={`absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full ${deal.badgeColor}`}>
                  {deal.savingsBadge}
                </span>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${deal.color} flex items-center justify-center text-[8px] font-bold text-white leading-tight text-center px-1`}>
                    {deal.retailer.split(" ").map((w) => w[0]).join("")}
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{deal.retailer}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{deal.title}</h3>
                {deal.salePrice ? (
                  <p className="text-lg font-extrabold text-foreground mb-1">
                    <span className="line-through text-muted-foreground text-sm mr-2">{deal.originalPrice}</span>
                    → {deal.salePrice}
                    {deal.savings && <span className="text-green-400 text-sm ml-2">| {deal.savings}</span>}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mb-1">No current deal</p>
                )}
                <p className="text-xs text-muted-foreground mb-4">{deal.expiry}</p>
                {deal.hasAction ? (
                  <button className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
                    🛒 Shop This Deal →
                  </button>
                ) : (
                  <button className="w-full py-2.5 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary/10 transition-colors">
                    🔔 Alert Me When Back
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Set Alerts */}
        <div className="rounded-xl bg-card gold-border p-6">
          <h2 className="text-base font-bold text-foreground mb-1">🔔 Get Alerted on New Deals</h2>
          <p className="text-sm text-muted-foreground mb-5">Tell us what you're watching for — we'll text or email you the moment it goes live</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Minimum savings amount</label>
              <div className="flex flex-wrap gap-2">
                {savingsOptions.map((opt) => (
                  <button key={opt} onClick={() => setMinSavings(opt)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${minSavings === opt ? "bg-primary text-primary-foreground border-primary" : "border-primary/30 text-muted-foreground hover:border-primary hover:text-foreground"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Card value</label>
              <div className="flex flex-wrap gap-2">
                {cardValues.map((v) => (
                  <button key={v} onClick={() => setSelectedCardValue(v)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${selectedCardValue === v ? "bg-primary text-primary-foreground border-primary" : "border-primary/30 text-muted-foreground hover:border-primary hover:text-foreground"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Retailers</label>
              <div className="flex flex-wrap gap-2">
                {retailerOptions.map((r) => (
                  <button key={r} onClick={() => toggleRetailer(r)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${selectedRetailers.includes(r) ? "bg-primary text-primary-foreground border-primary" : "border-primary/30 text-muted-foreground hover:border-primary hover:text-foreground"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Alert via</label>
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Bell, label: "Push Notification", on: pushOn, set: setPushOn, locked: false },
                { icon: Mail, label: "Email", on: emailOn, set: setEmailOn, locked: false },
                { icon: MessageSquare, label: "SMS Text", on: smsOn, set: setSmsOn, locked: true },
              ].map((ch) => (
                <button key={ch.label} onClick={() => ch.set(!ch.on)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${ch.on ? "bg-primary/15 border-primary text-primary" : "border-primary/20 text-muted-foreground"}`}>
                  <ch.icon className="w-3.5 h-3.5" />
                  {ch.label}
                  {ch.locked && !ch.on && <span className="text-[10px] text-muted-foreground ml-1">Upgrade to enable</span>}
                </button>
              ))}
            </div>
          </div>

          <button className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
            💾 Save My Alert Preferences
          </button>
        </div>

        {/* Section 3: Savings Calculator */}
        <div className="rounded-xl bg-card gold-border p-6">
          <h2 className="text-base font-bold text-foreground mb-1">💰 Calculate Your Trip Savings</h2>
          <p className="text-sm text-muted-foreground mb-5">See exactly how much you can save buying discounted gift cards before your trip</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Estimated trip spend</label>
              <input
                type="number"
                placeholder="$6,500"
                value={tripSpend}
                onChange={(e) => setTripSpend(e.target.value)}
                className="w-full bg-muted/30 border border-primary/10 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Do you have a Target RedCard?</label>
              <div className="flex gap-2">
                {["Yes", "No"].map((opt) => (
                  <button key={opt} onClick={() => setHasRedCard(opt === "Yes")} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors border ${(opt === "Yes" ? hasRedCard : !hasRedCard) ? "bg-primary text-primary-foreground border-primary" : "border-primary/30 text-muted-foreground hover:border-primary"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Credit Card Cashback */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              💳 Credit Card Cashback
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  Many credit cards earn cashback on gift card purchases. Check if your card treats gift cards as a regular retail purchase — most do.
                </TooltipContent>
              </Tooltip>
            </label>
            <p className="text-xs text-muted-foreground mb-3">What cashback rate does your credit card earn on gift card purchases?</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {cashbackRates.map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSelectedCashback(rate)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${selectedCashback === rate ? "bg-primary text-primary-foreground border-primary" : "border-primary/30 text-muted-foreground hover:border-primary hover:text-foreground"}`}
                >
                  {rate}
                </button>
              ))}
            </div>
            {selectedCashback === "Custom" && (
              <input
                type="number"
                placeholder="Enter your rate %"
                value={customCashback}
                onChange={(e) => setCustomCashback(e.target.value)}
                className="w-40 bg-muted/30 border border-primary/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 mb-2"
              />
            )}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Chase Freedom Flex: 5% rotating · Amex Blue Cash Preferred: 6% at supermarkets · Citi Double Cash: 2% everywhere · Discover it: 5% rotating
            </p>
          </div>

          {/* Results */}
          <div className="rounded-xl bg-muted/20 border border-primary/10 p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Your Estimated Savings:</h3>
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sam's Club bulk purchase</span>
                <span className="text-green-400 font-semibold">Save ${samsSavings}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Target RedCard 5% on purchase</span>
                <span className="text-green-400 font-semibold">Save ${redCardSavings}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Credit card cashback ({selectedCashback === "Custom" ? `${customCashback || 0}%` : selectedCashback})</span>
                <span className="text-green-400 font-semibold">Save ${ccSavings}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stack Costco deal on dining spend</span>
                <span className="text-green-400 font-semibold">Save ${costcoSavings}</span>
              </div>
            </div>
            <div className="border-t border-primary/10 pt-3 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">Total stack savings</span>
                <span className="text-xl font-extrabold text-primary">${totalSavings}</span>
              </div>
            </div>
            <div className="border-t border-primary/10 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">Total Estimated Savings</span>
                <span className="text-2xl font-extrabold text-primary">${totalSavings}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">That's {pct}% back on your total trip spend — stacking gift card discounts + RedCard + credit card cashback</p>
            </div>
          </div>

          {/* Strategy callout */}
          <div className="rounded-xl bg-card gold-border p-4 mt-4 border-l-4 border-l-primary">
            <p className="text-sm text-foreground leading-relaxed">
              🏆 <span className="font-semibold">Maximum Stack Strategy:</span> Buy $500 Sam's Club gift cards with your Amex Blue Cash at a supermarket (6% back) + Sam's Club discount ($15 off) + Target RedCard on remaining spend (5% back) = up to 8-11% total savings on your Disney spend.
            </p>
          </div>

          <button className="w-full mt-4 py-3 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary/10 transition-colors">
            📋 Show Me How to Stack These Deals
          </button>
        </div>

        {/* Section 4: Deal History */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-4">Recent Deal History</h2>
          <div className="rounded-xl bg-card gold-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/10">
                  {["Retailer", "Deal", "Savings", "Live Dates", "Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-primary uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row, i) => (
                  <tr key={i} className="border-b border-primary/5 last:border-0">
                    <td className="px-5 py-3 font-medium text-foreground">{row.retailer}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.deal}</td>
                    <td className="px-5 py-3 text-green-400 font-semibold">{row.savings}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.dates}</td>
                    <td className="px-5 py-3">
                      {row.status === "active" ? (
                        <span className="text-green-400 text-xs font-semibold">🟢 Active</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Expired</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GiftCardTracker;