import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Map, UtensilsCrossed, Gift, Zap, Ticket, Users,
  Hotel, Plane, CalendarCheck, Gamepad2, Camera,
  Sparkles, Wallet, Castle, Compass
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const keyFeatures = [
  {
    icon: Map,
    emoji: "🗺️",
    title: "AI Trip Planner",
    desc: "Personalized day-by-day itineraries built around your dates, party size, budget, and must-do priorities. Our AI optimizes for crowd levels, park hours, and walking distance.",
    link: "/trip-planner",
  },
  {
    icon: UtensilsCrossed,
    emoji: "🍽️",
    title: "Dining Reservation Alerts",
    desc: "Instant alerts the moment a hard-to-get reservation opens at any of 150+ Disney restaurants. We monitor 24/7 and notify you via email or SMS within seconds.",
    link: "/dining-alerts",
  },
  {
    icon: CalendarCheck,
    emoji: "🎪",
    title: "Event & Experience Alerts",
    desc: "Get notified when hard-to-book events like dessert parties, fireworks cruises, Savi's Workshop, and Bibbidi Bobbidi Boutique open up.",
    link: "/event-alerts",
  },
  {
    icon: Zap,
    emoji: "⚡",
    title: "Live Wait Times & Lightning Lane",
    desc: "Real-time wait time alerts and Lightning Lane gap finder. Get notified when your favorite ride drops below your target wait — act in seconds, not minutes.",
    link: "/live-park",
  },
];

const moreFeatures = [
  {
    icon: Gift,
    emoji: "🎁",
    title: "Gift Card Deal Tracker",
    desc: "24/7 monitor for discounted Disney gift cards at Sam's Club, Target, and Costco. Get alerted when savings hit your threshold.",
    link: "/gift-card-tracker",
  },
  {
    icon: Hotel,
    emoji: "🏨",
    title: "Hotel Price Alerts",
    desc: "Track Disney resort and off-property hotel prices. Get alerted when rates drop below your target — never overpay for your stay.",
    link: "/hotel-alerts",
  },
  {
    icon: Plane,
    emoji: "✈️",
    title: "Airfare Tracker",
    desc: "Monitor flight prices to Orlando from any origin. Set your target price and get notified when fares drop.",
    link: "/airfare",
  },
  {
    icon: Compass,
    emoji: "🧭",
    title: "Live Compass & In-Park GPS",
    desc: "Real-time turn-by-turn walking navigation inside the parks. Our GPS compass guides you to rides, dining, and shows with live distance tracking, shortcut detection, and off-route alerts — never get lost again.",
    link: "/live-park",
  },
  {
    icon: Wallet,
    emoji: "💰",
    title: "Budget Manager",
    desc: "Track every dollar of your Disney trip. Auto-categorize expenses, set budget caps per category, and export reports.",
    link: "/budget-manager",
  },
  {
    icon: Ticket,
    emoji: "🎟️",
    title: "Annual Passholder Hub",
    desc: "Blockout calendar, AP-exclusive discounts, merchandise drop alerts, hotel deals, and renewal reminders — all in one command center.",
    link: "/ap-command-center",
  },
  {
    icon: Users,
    emoji: "👨‍👩‍👧",
    title: "Group Coordinator",
    desc: "Shared itinerary with your travel party, split expenses, group polls for decisions, and group dining alerts so everyone stays in sync.",
    link: "/group-coordinator",
  },
  {
    icon: Gamepad2,
    emoji: "🎮",
    title: "Line Games & Trivia",
    desc: "Disney trivia, mystery detective games, and multiplayer party games designed to make wait times fly by.",
    link: "/games",
  },
  {
    icon: Camera,
    emoji: "📸",
    title: "Photo Opportunities",
    desc: "Fireworks ride timing, golden hour planner, hidden photo spots, and PhotoPass proximity alerts to capture perfect memories.",
    link: "/photo-opps",
  },
  {
    icon: Sparkles,
    emoji: "🎆",
    title: "Shows & Fireworks Planner",
    desc: "Rank must-see shows, get viewing spot suggestions with crowd data, and sync show times directly into your itinerary.",
    link: "/shows-fireworks",
  },
  {
    icon: Castle,
    emoji: "🏰",
    title: "AP Meetup Beacon",
    desc: "Meet fellow Annual Passholders in the park. No personal info shared until you both choose to connect. Find your Disney community.",
    link: "/magic-beacon",
  },
];

const Features = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, var(--background) 0%, var(--muted) 100%)" }}>
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-36 md:pb-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight">
          Every Tool You Need for the{" "}
          <span className="text-primary">Perfect Disney Trip</span>
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          14 powerful features designed for Disney families and Annual Passholders — from AI planning to real-time alerts.
        </p>
      </section>

      {/* Key Features — large cards */}
      <section className="px-4 pb-16 md:pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            🔑 Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {keyFeatures.map((f) => (
              <div
                key={f.title}
                className="rounded-xl bg-card gold-border p-8 hover:border-primary/40 transition-all duration-300 group flex flex-col"
              >
                <div className="text-5xl mb-5">{f.emoji}</div>
                <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {f.title}
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed flex-1">
                  {f.desc}
                </p>
                <Link to={user ? f.link : "/signup"} className="mt-6">
                  <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-semibold rounded-lg">
                    {user ? "Open" : "Try It Free"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* More Features — standard cards */}
      <section className="px-4 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            ✨ More Powerful Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {moreFeatures.map((f) => (
              <div
                key={f.title}
                className="rounded-xl bg-card gold-border p-6 hover:border-primary/40 transition-all duration-300 group flex flex-col"
              >
                <div className="text-3xl mb-4">{f.emoji}</div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {f.desc}
                </p>
                <Link to={user ? f.link : "/signup"} className="mt-4">
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 font-semibold px-0">
                    {user ? "Open →" : "Learn More →"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center border-t border-border">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          Ready to plan your perfect Disney trip?
        </h2>
        <p className="text-muted-foreground mb-8">
          {user ? "Head to your dashboard to get started." : "Start your 7-day free trial — no credit card required."}
        </p>
        <Link to={user ? "/dashboard" : "/signup"}>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg px-10 h-12 text-base">
            {user ? "Go to Dashboard" : "Get Started Free"}
          </Button>
        </Link>
      </section>

      <Footer />
      <SiteFooter />
    </div>
  );
};

export default Features;
