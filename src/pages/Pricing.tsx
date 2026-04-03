import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Check, Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

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

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #080E1E 0%, #0D1230 100%)" }}>
      <Header />

      <section className="pt-32 md:pt-40 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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

                <Link to="/signup">
                  <Button
                    className="w-full font-semibold rounded-lg h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Shield className="w-4 h-4" />
            <span>🔒 Cancel anytime. Upgrade or downgrade instantly. No contracts.</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
