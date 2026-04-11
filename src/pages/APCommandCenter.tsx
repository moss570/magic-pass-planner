import { useState, useEffect } from "react";
import { Castle, Info } from "lucide-react";
import CompassButton from "@/components/CompassButton";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { isFeatureEnabled } from "@/lib/featureFlags";
import BestDaysWidget from "@/components/ap/BestDaysWidget";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const discountFilters = ["All", "Dining", "Merchandise", "Hotels", "Experiences"];

const discounts = [
  { cat: "Dining", badge: "🍽️ Dining", badgeColor: "bg-orange-500/15 text-orange-400", title: "10% off dining at select restaurants", detail: "Valid at 100+ locations · Show AP card at checkout", btn: "View Eligible Restaurants →" },
  { cat: "Merchandise", badge: "🛍️ Merch", badgeColor: "bg-pink-500/15 text-pink-400", title: "20% off select merchandise", detail: "Valid at most park gift shops · Exclusions apply", btn: "View Exclusions →" },
  { cat: "Hotels", badge: "🏨 Hotel", badgeColor: "bg-blue-500/15 text-blue-400", title: "Up to 25% off resort stays", detail: "Valid for select dates · Book by May 31", btn: "Book Now →" },
  { cat: "Dining", badge: "🍽️ Dining", badgeColor: "bg-orange-500/15 text-orange-400", title: "Disney Visa Dining Discount", detail: "10% off dining at select WDW table-service restaurants · Disney Visa cardholders only", btn: "View Eligible Restaurants →" },
  { cat: "Experiences", badge: "🎭 Experience", badgeColor: "bg-purple-500/15 text-purple-400", title: "15% off Disney After Hours tickets", detail: "AP exclusive pricing · Limited availability", btn: "View Dates →" },
  { cat: "Merchandise", badge: "🛍️ Merch", badgeColor: "bg-pink-500/15 text-pink-400", title: "AP Exclusive MagicBand+ discount", detail: "$34.99 (reg $44.99) · AP holders only", btn: "Shop Now →" },
];


// Calendar helpers
const blockedDates = [24, 25, 26, 27];
const today = 3;

const APCommandCenter = () => {
  const [discountFilter, setDiscountFilter] = useState("All");
  const [liveOffers, setLiveOffers] = useState<any[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);

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
  const [hotelAlert, setHotelAlert] = useState(true);
  const [merchAlert, setMerchAlert] = useState(true);
  const [billAmount, setBillAmount] = useState("120");
  const [hasAP, setHasAP] = useState(true);
  const [hasVisa, setHasVisa] = useState(true);
  const [hasRedCard, setHasRedCard] = useState(true);

  const bill = parseFloat(billAmount) || 120;
  const apSavings = hasAP ? bill * 0.1 : 0;
  const visaSavings = hasVisa ? bill * 0.1 : 0;
  const bestDining = Math.max(apSavings, visaSavings);
  const giftCardSavings = hasRedCard ? bill * 0.015 : 0;
  const totalDiscount = bestDining + giftCardSavings;
  const youPay = (bill - totalDiscount).toFixed(2);

  const filteredDiscounts = discountFilter === "All" ? discounts : discounts.filter((d) => d.cat === discountFilter);

  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);

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

        {/* Section 2: Calendar + Best Days */}
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6">
          {/* Blockout Calendar */}
          <div className="rounded-xl bg-card gold-border p-4 md:p-6">
            <h2 className="text-sm md:text-base font-bold text-foreground mb-1">📅 Blockout Calendar — Incredi-Pass</h2>
            <p className="text-xs text-muted-foreground mb-4">Days you CANNOT enter the parks on your pass</p>

            <div className="rounded-xl bg-muted/20 border border-primary/10 p-3 md:p-4 mb-4">
              <div className="text-center mb-3">
                <span className="text-sm font-bold text-foreground">May 2026</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => <span key={d} className="font-semibold">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* May 2026 starts on Friday → 5 empty slots */}
                {Array.from({ length: 5 }).map((_, i) => <div key={`e${i}`} />)}
                {calendarDays.map((day) => {
                  const blocked = blockedDates.includes(day);
                  const isToday = day === today;
                  return (
                    <div key={day} className={`aspect-square flex items-center justify-center rounded-md text-[11px] font-semibold ${
                      blocked ? "bg-red-500/20 text-red-400" : "text-green-400"
                    } ${isToday ? "ring-2 ring-primary" : ""}`}>
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground mb-3">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500/20" /> Blocked</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-500/20" /> Available</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-yellow-500/20" /> Predicted Busy</span>
            </div>

            <p className="text-xs text-foreground mb-1">Next blocked period: <span className="text-red-400 font-semibold">Memorial Day Weekend — May 23–26</span></p>
            <p className="text-xs text-green-400 mb-2">Next fully open stretch: May 13–22 (10 consecutive open days)</p>
            <p className="text-[10px] text-muted-foreground italic">Blockout dates are estimated based on your pass tier. Always verify at disneyworld.com before visiting.</p>
          </div>

          {/* Best Days */}
          <div className="rounded-xl bg-card gold-border p-4 md:p-6">
            <h2 className="text-sm md:text-base font-bold text-foreground mb-1">🧠 Best Days to Go</h2>
            <p className="text-xs text-muted-foreground mb-4">AI-ranked open days based on crowds + your pass tier</p>

            <div className="space-y-3 mb-5">
              {bestDays.map((d, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/20 border border-primary/5">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-primary w-4">{i + 1}.</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${d.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{d.day}</p>
                    <p className={`text-xs ${d.color}`}>Crowd: {d.crowd}/10</p>
                    <p className="text-[11px] text-muted-foreground">{d.note}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
              📅 Add Best Days to My Calendar
            </button>
          </div>
        </div>

        {/* LIVE DISNEY OFFERS */}
        <div className="rounded-xl p-4 md:p-5 border border-white/8" style={{ background: "#111827" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">🚨 Current Disney Offers</h2>
              <p className="text-xs text-muted-foreground">Live from disneyworld.disney.go.com · Updated 5x daily</p>
            </div>
            <Link to="/feed" className="text-xs text-primary hover:underline">Insider Feed →</Link>
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

        {/* Section 3: AP Discounts */}
        <div className="rounded-xl bg-card gold-border p-4 md:p-6">
          <h2 className="text-sm md:text-base font-bold text-foreground mb-1">🏷️ Active AP Discounts</h2>
          <p className="text-xs text-muted-foreground mb-4">Updated daily — all current Annual Passholder discounts</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {discountFilters.map((f) => (
              <button key={f} onClick={() => setDiscountFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${discountFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-primary/30 text-muted-foreground hover:border-primary hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDiscounts.map((d, i) => (
              <div key={i} className="rounded-xl bg-muted/20 border border-primary/5 p-4">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${d.badgeColor} mb-2 inline-block`}>{d.badge}</span>
                <h3 className="text-sm font-bold text-foreground mb-1">{d.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{d.detail}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button className="text-xs font-semibold text-primary hover:underline">{d.btn}</button>
                  {d.cat === "Dining" && (
                    <CompassButton destination={d.title} context={`${d.cat} Discount · Walt Disney World`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Hotel + Merch Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hotel Deals */}
          <div className="rounded-xl bg-card gold-border p-4 md:p-6">
            <h2 className="text-sm md:text-base font-bold text-foreground mb-1">🏨 AP Hotel Deal Alerts</h2>
            <p className="text-xs text-muted-foreground mb-4">We watch for passholder room discounts — you get alerted instantly</p>

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-foreground">Alert me when AP hotel deals drop</span>
              <button onClick={() => setHotelAlert(!hotelAlert)} className={`w-10 h-5 rounded-full relative transition-colors ${hotelAlert ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${hotelAlert ? "left-5.5 right-0.5" : "left-0.5"}`} style={{ left: hotelAlert ? "calc(100% - 18px)" : 2 }} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3">
                <p className="text-xs font-bold text-green-400 mb-1">🟢 LIVE — Port Orleans Riverside</p>
                <p className="text-sm text-foreground font-semibold">AP Rate: $189/night <span className="text-muted-foreground line-through text-xs">(reg $267)</span> — Save 29%</p>
                <p className="text-[10px] text-muted-foreground mt-1">May 13–16, 2026 · Limited rooms</p>
                <div className="flex items-center gap-2 mt-2">
                  <button className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90">Book Now →</button>
                  <CompassButton destination="Port Orleans Riverside" context="Walt Disney World Resort" />
                </div>
              </div>
              <div className="rounded-lg bg-muted/20 border border-primary/5 p-3 opacity-70">
                <p className="text-xs font-bold text-muted-foreground mb-1">⏰ EXPIRED — Wilderness Lodge</p>
                <p className="text-sm text-foreground">Was: AP Rate $312/night <span className="text-muted-foreground text-xs">(reg $398)</span></p>
                <p className="text-[10px] text-muted-foreground mt-1">Expired Apr 28 · Gone in 6 hours</p>
              </div>
            </div>
          </div>

          {/* Merch Drops */}
          <div className="rounded-xl bg-card gold-border p-4 md:p-6">
            <h2 className="text-sm md:text-base font-bold text-foreground mb-1">🛍️ AP Merchandise Drop Alerts</h2>
            <p className="text-xs text-muted-foreground mb-4">Limited edition drops sell out in minutes — be first</p>

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-foreground">Alert me on new AP-exclusive drops</span>
              <button onClick={() => setMerchAlert(!merchAlert)} className={`w-10 h-5 rounded-full relative transition-colors ${merchAlert ? "bg-primary" : "bg-muted"}`}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: merchAlert ? "calc(100% - 18px)" : 2 }} />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { status: "🟢", label: "LIVE — 50th Anniversary AP-Exclusive Ears", sub: "In stock now", action: "Shop →", live: true },
                { status: "⏰", label: "SOLD OUT — Haunted Mansion LE Pin Set", sub: "Gone in 4 min · Apr 29", live: false },
                { status: "⏰", label: "SOLD OUT — EPCOT Festival AP Popcorn Bucket", sub: "Gone in 11 min · Apr 22", live: false },
              ].map((item, i) => (
                <div key={i} className={`flex items-start gap-2 p-3 rounded-lg border ${item.live ? "bg-green-500/5 border-green-500/20" : "bg-muted/20 border-primary/5 opacity-70"}`}>
                  <span className="text-sm">{item.status}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                  </div>
                  {item.live && (
                    <button className="text-xs font-semibold text-primary hover:underline shrink-0">{item.action}</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5: Stacking Calculator */}
        <div className="rounded-xl bg-card gold-border p-4 md:p-6">
          <h2 className="text-sm md:text-base font-bold text-foreground mb-1">🧮 AP Discount Stacking Calculator</h2>
          <p className="text-xs text-muted-foreground mb-5">Can you combine AP dining discounts with Disney Visa? Find out instantly.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Restaurant</label>
              <select className="w-full bg-muted/30 border border-primary/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50">
                <option>Be Our Guest</option>
                <option>Cinderella's Royal Table</option>
                <option>Space 220</option>
                <option>Topolino's Terrace</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Bill amount</label>
              <input type="number" placeholder="$120" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} className="w-full bg-muted/30 border border-primary/10 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            {[
              { label: "I have an Annual Pass (10% dining)", val: hasAP, set: setHasAP },
              { label: "I have a Disney Visa Card (10% at select restaurants)", val: hasVisa, set: setHasVisa },
              { label: "Target RedCard (5% on gift card purchases used for this meal)", val: hasRedCard, set: setHasRedCard },
            ].map((cb) => (
              <label key={cb.label} className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={cb.val} onChange={() => cb.set(!cb.val)} className="mt-0.5 accent-primary" />
                <span className="text-xs text-foreground">{cb.label}</span>
              </label>
            ))}
          </div>

          <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors mb-5">
            Calculate My Stack
          </button>

          <div className="rounded-xl bg-muted/20 border border-primary/10 p-4 md:p-5">
            <p className="text-sm font-bold text-foreground mb-3">For a ${bill.toFixed(0)} bill at Be Our Guest:</p>
            <div className="space-y-2 mb-3">
              {hasAP && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">AP Discount (10%)</span>
                  <span className={`font-semibold ${hasVisa ? "text-muted-foreground" : "text-green-400"}`}>
                    {hasVisa ? `Use whichever is higher` : `-$${apSavings.toFixed(2)}`}
                  </span>
                </div>
              )}
              {hasVisa && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Disney Visa Card (10%)</span>
                  <span className={`font-semibold ${hasAP ? "text-muted-foreground" : "text-green-400"}`}>
                    {hasAP ? `Does not stack with AP` : `-$${visaSavings.toFixed(2)}`}
                  </span>
                </div>
              )}
              {hasRedCard && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gift card savings (pre-purchased at Sam's discount)</span>
                  <span className="text-green-400 font-semibold">-${giftCardSavings.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="border-t border-primary/10 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-foreground">Total discount</span>
              <span className="text-green-400 font-bold">-${totalDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-bold text-foreground">You pay</span>
              <span className="text-xl md:text-2xl font-extrabold text-green-400">${youPay}</span>
            </div>
            {hasAP && hasVisa && (
              <p className="text-xs text-primary mt-2 font-semibold">Disney Visa and AP discounts typically cannot be combined — use whichever is higher for your bill.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default APCommandCenter;
