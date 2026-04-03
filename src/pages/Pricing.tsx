import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Shield, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PRICE_IDS } from "@/lib/stripe";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";

const invokeCheckout = async (accessToken: string, body: { priceId: string; planName: string }) => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Checkout failed");
  return data;
};

const tiers = [
  {
    name: "Pre-Trip Planner",
    monthly: 6.99,
    annual: 49.99,
    label: null,
    popular: false,
    features: [
      "AI Trip Planner",
      "Smart Trip Timing Optimizer",
      "Total Trip Budget Manager",
      "Hotel Price Drop & Room Upgrade Alerts",
      "Dining Reservation Alerts",
      "Upgrade, downgrade or cancel anytime",
    ],
  },
  {
    name: "Magic Pass",
    monthly: 12.99,
    annual: 89.99,
    label: "Most Popular",
    popular: true,
    features: [
      "Everything in Pre-Trip Planner, plus:",
      "Live Wait Time Alerts (15-sec polling)",
      "Lightning Lane Gap Finder",
      "Smart Routing Engine",
      "Rain Radar Integration",
      "Ride Closure & Refurbishment Alerts",
      "Fireworks Ride Timing Calculator",
      "Golden Hour & Sunset Shot Planner",
      "Group Trip Coordinator",
      "Upgrade, downgrade or cancel anytime",
    ],
  },
  {
    name: "AP Command Center",
    monthly: 7.99,
    annual: 59.99,
    label: "Built for Annual Passholders",
    popular: false,
    features: [
      "Blockout Calendar (synced to your pass tier)",
      "AP Discount Database (food, merch, hotels)",
      "AP Hotel Deal Alerts",
      "Renewal Alerts (60/30/7 days)",
      "Rain Radar Integration",
      "Ride Closure & Refurbishment Alerts",
      "Fireworks Ride Timing Calculator",
      "Upgrade, downgrade or cancel anytime",
    ],
  },
  {
    name: "AP Command Center PLUS",
    monthly: 10.99,
    annual: 79.99,
    label: "The full platform for Annual Passholders",
    popular: false,
    features: [
      "Everything in AP Command Center, plus:",
      "Live Wait Time Alerts",
      "Lightning Lane Gap Finder",
      "Smart Routing Engine",
      "Gift Card Deal Tracker",
      "AP Merchandise Drop Alerts",
      "AP Discount Stacking Calculator",
      "\"Best Day to Go\" AI Predictor",
      "Group Trip Coordinator",
      "Upgrade, downgrade or cancel anytime",
    ],
  },
];

const Pricing = () => {
  const [annual, setAnnual] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const resumedCheckoutRef = useRef(false);

  const redirectToSignup = useCallback((tierName: string, period: "monthly" | "annual", offer?: "founder") => {
    const params = new URLSearchParams({
      returnTo: "/pricing",
      tier: tierName,
      period,
    });

    if (offer) {
      params.set("offer", offer);
    }

    navigate(`/signup?${params.toString()}`);
  }, [navigate]);

  const startCheckout = useCallback(async ({
    priceId,
    planName,
    loadingKey,
  }: {
    priceId: string;
    planName: string;
    loadingKey: string;
  }) => {
    if (!session?.access_token) return;

    setLoadingTier(loadingKey);
    try {
      console.log("Starting checkout for:", planName, priceId);
      const data = await invokeCheckout(session.access_token, { priceId, planName });

      console.log("Checkout response:", data);
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("No checkout URL returned. Please try again.");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  }, [session?.access_token]);

  useEffect(() => {
    const period = new URLSearchParams(location.search).get("period");
    if (period === "annual") {
      setAnnual(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (!user || !session || resumedCheckoutRef.current) return;

    const params = new URLSearchParams(location.search);
    const tierName = params.get("tier");
    const period = params.get("period");

    if (!tierName || (period !== "monthly" && period !== "annual")) return;

    const priceIds = PRICE_IDS[tierName];
    if (!priceIds) return;

    resumedCheckoutRef.current = true;

    void startCheckout({
      priceId: period === "annual" ? priceIds.annual : priceIds.monthly,
      planName: tierName,
      loadingKey: params.get("offer") === "founder" ? "founder" : tierName,
    });
  }, [location.search, session, startCheckout, user]);

  const handleCheckout = async (tierName: string) => {
    if (!user || !session) {
      redirectToSignup(tierName, annual ? "annual" : "monthly");
      return;
    }

    const priceIds = PRICE_IDS[tierName];
    if (!priceIds) return;

    await startCheckout({
      priceId: annual ? priceIds.annual : priceIds.monthly,
      planName: tierName,
      loadingKey: tierName,
    });
  };

  const handleFounderCheckout = async () => {
    if (!user || !session) {
      redirectToSignup("Magic Pass", "annual", "founder");
      return;
    }

    await startCheckout({
      priceId: PRICE_IDS["Magic Pass"].annual,
      planName: "Magic Pass",
      loadingKey: "founder",
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #080E1E 0%, #0D1230 100%)" }}>
      <Header />

      <section className="pt-32 md:pt-40 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Founding Member Banner */}
          <div className="mb-8 rounded-xl p-4 text-center cursor-pointer" style={{ background: '#F5C842' }} onClick={handleFounderCheckout}>
            <p className="text-base md:text-lg font-extrabold" style={{ color: '#080E1E' }}>
              🏆 Founding Member Offer: Lock in Magic Pass annual for $59.99/yr — forever. First 500 subscribers only.
            </p>
            <p className="text-xs md:text-sm mt-1 font-medium" style={{ color: '#080E1E', opacity: 0.8 }}>
              Regular price $89.99/yr · Save $30/year for life · Cancel anytime
            </p>
            {loadingTier === "founder" && (
              <Loader2 className="w-5 h-5 animate-spin mx-auto mt-2" style={{ color: '#080E1E' }} />
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground text-center mb-4">
            Choose Your <span className="text-primary">Magic Plan</span>
          </h1>
          <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
            Start free for 7 days. No credit card required.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mb-14">
            <span className={`text-sm font-medium ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${annual ? "bg-primary" : "bg-muted"}`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-background shadow transition-transform ${
                  annual ? "translate-x-7" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${annual ? "text-foreground" : "text-muted-foreground"}`}>
              Annual
            </span>
            {annual && (
              <span className="text-xs font-semibold bg-primary/20 text-primary px-3 py-1 rounded-full">
                Save up to 42%
              </span>
            )}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 max-w-full">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-xl bg-card p-6 flex flex-col ${
                  tier.popular
                    ? "border-2 border-primary shadow-lg shadow-primary/10"
                    : "gold-border"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <h3 className="text-lg font-bold text-foreground mb-1">{tier.name}</h3>
                {tier.label && !tier.popular && (
                  <p className="text-xs text-muted-foreground mb-3">{tier.label}</p>
                )}

                <div className="mt-2 mb-6">
                  <span className="text-4xl font-extrabold text-foreground">
                    ${annual ? tier.annual : tier.monthly}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    /{annual ? "yr" : "mo"}
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleCheckout(tier.name)}
                  disabled={loadingTier === tier.name}
                  className="w-full font-semibold rounded-lg h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loadingTier === tier.name ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Start Free Trial
                </Button>
              </div>
            ))}
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
