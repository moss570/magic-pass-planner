import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Shield, Loader2, AlertTriangle, Crown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PLANS, type PlanId } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbmVsaHJtZ3NwdXp0ZWhldHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzcyNzgsImV4cCI6MjA5MDgxMzI3OH0.vjT4Iun32HsCfoO7nVnfzLBnJy-Lye6N9ZryBbWuAjo";

const invokeCheckout = async (body: { priceId: string; planName: string; userEmail: string }, accessToken: string) => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "x-client-authorization": `Bearer ${accessToken}`,
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  let data: { error?: string; message?: string; url?: string } | null = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
  if (!res.ok) throw new Error(data?.error || data?.message || raw || `Checkout failed (${res.status})`);
  return data;
};

interface TierDisplay {
  planId: PlanId;
  name: string;
  subtitle?: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  oneTimePrice: number | null;
  popular: boolean;
  badge?: string;
  features: string[];
  dataWarning: boolean;
  noAutoRenew: boolean;
}

const tiers: TierDisplay[] = [
  {
    planId: 'free',
    name: 'Free – 7 Days',
    subtitle: 'Try everything, no credit card',
    monthlyPrice: null,
    annualPrice: null,
    oneTimePrice: 0,
    popular: false,
    features: [
      "AI Trip Planner",
      "Smart Trip Timing Optimizer",
      "Budget Manager",
      "Gift Card Deal Tracker",
      "1 Hotel Alert",
      "1 Dining Alert",
      "Live Wait Times",
      "Rain Radar",
      "Ride Closure Alerts",
      "Group Games",
      "Orlando Insiders Guide",
    ],
    dataWarning: true,
    noAutoRenew: false,
  },
  {
    planId: 'ninety_day_planner',
    name: '90 Day Planner',
    subtitle: 'Perfect for a single trip',
    monthlyPrice: null,
    annualPrice: null,
    oneTimePrice: 36.99,
    popular: false,
    features: [
      "Everything in Free, plus:",
      "7 Hotel, Dining & Airfare Alerts",
      "3 Event Alerts",
      "Reservation Folder",
      "Attraction & Character Priorities",
      "Shows & Fireworks Priorities",
      "Group Expense Tracking",
      "Group Coordinator & Polls",
      "Lightning Lane Gap Finder",
      "GPS Compass & Calibration",
      "Nearby Snacks & Merch",
      "Photo Opp Tools",
      "Social Feed",
    ],
    dataWarning: true,
    noAutoRenew: true,
  },
  {
    planId: 'ninety_day_friend',
    name: '90 Day Friend',
    subtitle: 'Join a group trip as a guest',
    monthlyPrice: null,
    annualPrice: null,
    oneTimePrice: 14.99,
    popular: false,
    features: [
      "View shared alert links",
      "Group Coordinator (read-only)",
      "Group Expense Tracking (read-only)",
      "Group Polls",
      "Group Games",
      "Live Wait Times",
      "GPS Compass & Calibration",
      "Rain Radar",
      "Orlando Insiders Guide",
    ],
    dataWarning: true,
    noAutoRenew: true,
  },
  {
    planId: 'magic_pass_planner',
    name: 'Magic Pass Planner',
    subtitle: 'For dedicated trip planners',
    monthlyPrice: 9.99,
    annualPrice: 105.99,
    oneTimePrice: null,
    popular: true,
    badge: 'Most Popular',
    features: [
      "Everything in 90 Day Planner, plus:",
      "20 of each alert type",
      "Trip Versions (3 per trip)",
      "AP Blockout Calendar",
      "AP Renewal Alerts",
      "AP Hotel & Merch Alerts",
      "Social Feed & Magic Beacon",
      "All In-Park Live Features",
      "Data saved forever",
    ],
    dataWarning: false,
    noAutoRenew: false,
  },
  {
    planId: 'magic_pass_plus',
    name: 'Magic Pass Plus',
    subtitle: 'The full platform — unlimited',
    monthlyPrice: 17.99,
    annualPrice: 174.99,
    oneTimePrice: null,
    popular: false,
    badge: 'Best Value',
    features: [
      "Everything in Magic Pass Planner, plus:",
      "Unlimited alerts (all types)",
      "AP Discount Database (searchable)",
      "AP Discount Stacking Calculator",
      "Best Days to Go AI Predictor",
      "All current + future features",
    ],
    dataWarning: false,
    noAutoRenew: false,
  },
];

const Pricing = () => {
  const [annual, setAnnual] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [foundersRemaining, setFoundersRemaining] = useState<number | null>(null);
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const resumedCheckoutRef = useRef(false);

  useEffect(() => {
    supabase.rpc('get_founders_remaining').then(({ data }) => {
      if (typeof data === 'number') setFoundersRemaining(data);
    });
  }, []);

  const redirectToSignup = useCallback((planId: string, period: string, offer?: string) => {
    const params = new URLSearchParams({ returnTo: "/pricing", tier: planId, period });
    if (offer) params.set("offer", offer);
    navigate(`/signup?${params.toString()}`);
  }, [navigate]);

  const startCheckout = useCallback(async ({
    priceId, planName, loadingKey, userEmail,
  }: { priceId: string; planName: string; loadingKey: string; userEmail: string }) => {
    if (!session?.access_token || !userEmail) {
      toast.error("Unable to start checkout. Please log in again.");
      return;
    }
    setLoadingTier(loadingKey);
    try {
      const data = await invokeCheckout({ priceId, planName, userEmail });
      if (data?.url) window.location.href = data.url;
      else toast.error("No checkout URL returned. Please try again.");
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  }, [session?.access_token]);

  useEffect(() => {
    const period = new URLSearchParams(location.search).get("period");
    if (period === "annual") setAnnual(true);
  }, [location.search]);

  useEffect(() => {
    if (!user || !session || resumedCheckoutRef.current) return;
    const params = new URLSearchParams(location.search);
    const tierName = params.get("tier");
    const period = params.get("period");
    const userEmail = user.email;
    if (!tierName || !userEmail) return;
    resumedCheckoutRef.current = true;

    const plan = PLANS[tierName as PlanId];
    if (!plan) return;

    const priceId = period === 'annual'
      ? plan.stripePriceIds.annual
      : period === 'one_time'
      ? plan.stripePriceIds.oneTime
      : plan.stripePriceIds.monthly;

    if (!priceId) return;
    void startCheckout({ priceId, planName: tierName, loadingKey: tierName, userEmail });
  }, [location.search, session, startCheckout, user]);

  const handleCheckout = async (tier: TierDisplay) => {
    if (!user || !session) {
      const period = tier.oneTimePrice !== null ? 'one_time' : annual ? 'annual' : 'monthly';
      redirectToSignup(tier.planId, period);
      return;
    }
    if (!user.email) { toast.error("Unable to start checkout. Please log in again."); return; }
    if (tier.planId === 'free') { toast.info("You're already on the free plan!"); return; }

    const plan = PLANS[tier.planId];
    let priceId: string | undefined;
    if (tier.oneTimePrice !== null) priceId = plan.stripePriceIds.oneTime;
    else priceId = annual ? plan.stripePriceIds.annual : plan.stripePriceIds.monthly;

    if (!priceId) { toast.error("Price not configured yet."); return; }

    await startCheckout({ priceId, planName: tier.planId, loadingKey: tier.planId, userEmail: user.email });
  };

  const handleFounderCheckout = async () => {
    if (!user || !session) {
      redirectToSignup("founders_pass", "annual", "founder");
      return;
    }
    if (!user.email) { toast.error("Unable to start checkout. Please log in again."); return; }

    const priceId = PLANS.founders_pass.stripePriceIds.annual;
    if (!priceId) { toast.error("Founders Pass price not configured."); return; }

    await startCheckout({ priceId, planName: "founders_pass", loadingKey: "founder", userEmail: user.email });
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)" }}>
      <Header />

      <section className="pt-32 md:pt-40 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Founders Pass Banner */}
          {foundersRemaining !== null && foundersRemaining > 0 && (
            <div
              className="mb-8 rounded-xl p-4 text-center cursor-pointer bg-primary hover:bg-primary/90 transition-colors"
              onClick={handleFounderCheckout}
            >
              <p className="text-base md:text-lg font-extrabold text-primary-foreground">
                <Crown className="w-5 h-5 inline mr-1 -mt-0.5" />
                Founding Member Offer: Magic Pass Plus for $74.99/yr — forever.
              </p>
              <p className="text-xs md:text-sm mt-1 font-medium text-primary-foreground/80">
                Regular price $174.99/yr · Save $100/year for life · 🎉 {foundersRemaining} spots remaining
              </p>
              {loadingTier === "founder" && (
                <Loader2 className="w-5 h-5 animate-spin mx-auto mt-2 text-primary-foreground" />
              )}
            </div>
          )}
          {foundersRemaining === 0 && (
            <div className="mb-8 rounded-xl p-4 text-center bg-muted border border-primary/20">
              <p className="text-base font-bold text-muted-foreground">
                Founders Pass — Sold Out! Join the waitlist for future openings.
              </p>
            </div>
          )}

          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground text-center mb-4">
            Choose Your <span className="text-primary">Magic Plan</span>
          </h1>
          <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
            Start free for 7 days. No credit card required.
          </p>

          {/* Toggle — only affects subscription plans */}
          <div className="flex items-center justify-center gap-4 mb-14">
            <span className={`text-sm font-medium ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${annual ? "bg-primary" : "bg-muted"}`}
            >
              <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-background shadow transition-transform ${annual ? "translate-x-7" : "translate-x-0.5"}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? "text-foreground" : "text-muted-foreground"}`}>Annual</span>
            {annual && (
              <span className="text-xs font-semibold bg-primary/20 text-primary px-3 py-1 rounded-full">
                Save up to 42%
              </span>
            )}
          </div>

          {/* Tier Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 max-w-full">
            {tiers.map((tier) => {
              const price = tier.oneTimePrice !== null
                ? tier.oneTimePrice
                : annual
                ? tier.annualPrice
                : tier.monthlyPrice;
              const priceSuffix = tier.oneTimePrice !== null
                ? (tier.planId === 'free' ? '' : ' one-time')
                : annual ? '/yr' : '/mo';

              return (
                <div
                  key={tier.planId}
                  className={`relative rounded-xl bg-card p-5 flex flex-col ${
                    tier.popular
                      ? "border-2 border-primary shadow-lg shadow-primary/10"
                      : "border border-primary/15"
                  }`}
                >
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                      {tier.badge}
                    </div>
                  )}

                  <h3 className="text-base font-bold text-foreground mb-0.5">{tier.name}</h3>
                  {tier.subtitle && <p className="text-xs text-muted-foreground mb-3">{tier.subtitle}</p>}

                  <div className="mt-1 mb-5">
                    {price !== null ? (
                      <>
                        <span className="text-3xl font-extrabold text-foreground">${price}</span>
                        <span className="text-muted-foreground text-sm">{priceSuffix}</span>
                      </>
                    ) : (
                      <span className="text-3xl font-extrabold text-foreground">Free</span>
                    )}
                  </div>

                  {/* Warnings */}
                  {tier.dataWarning && (
                    <div className="flex items-start gap-1.5 mb-3 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                      <span className="text-[11px] text-destructive">Data deleted when plan expires</span>
                    </div>
                  )}
                  {tier.noAutoRenew && (
                    <div className="flex items-start gap-1.5 mb-3 text-xs text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                      <span>One-time purchase. Does not auto-renew.</span>
                    </div>
                  )}

                  <ul className="space-y-2 mb-6 flex-1">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground text-xs">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleCheckout(tier)}
                    disabled={loadingTier === tier.planId || tier.planId === 'free'}
                    className={`w-full font-semibold rounded-lg h-10 text-sm ${
                      tier.planId === 'free'
                        ? "bg-muted text-muted-foreground cursor-default"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {loadingTier === tier.planId && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {tier.planId === 'free'
                      ? 'Current Plan'
                      : user
                      ? 'Upgrade Now'
                      : 'Start Free Trial'}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Shield className="w-4 h-4" />
            <span>🔒 Cancel anytime. Upgrade or downgrade instantly. No contracts.</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
