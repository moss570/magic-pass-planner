import { motion } from "framer-motion";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Map, UtensilsCrossed, Gift, Zap, Ticket, Users,
  Clock, DollarSign, Star, Hotel, Plane, CalendarCheck,
  Gamepad2, Camera, Sparkles, Wallet
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LaunchSignupModal from "@/components/LaunchSignupModal";

const StarField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2,
    }));

    let frame: number;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        const opacity = 0.3 + 0.7 * Math.abs(Math.sin(t * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 200, 66, ${opacity * 0.4})`;
        ctx.fill();
      });
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

const features = [
  { icon: Map, emoji: "🗺️", title: "AI Trip Planner", image: "/feature-art/ai-trip-planner.png", desc: "Personalized itineraries built around your dates, party, and budget" },
  { icon: UtensilsCrossed, emoji: "🍽️", title: "Dining Reservation Alerts", image: "/feature-art/dining-alerts.png", desc: "Instant alerts the moment a hard-to-get reservation opens" },
  { icon: CalendarCheck, emoji: "🎪", title: "Event & Experience Alerts", image: "/feature-art/dining-alerts.png", desc: "Get notified when hard-to-book events like dessert parties and fireworks cruises open up" },
  { icon: Gift, emoji: "🎁", title: "Gift Card Deal Tracker", image: "/feature-art/gift-cards.png", desc: "24/7 monitor for discounted Disney gift cards at Sam's, Target & Costco" },
  { icon: Zap, emoji: "⚡", title: "Live Wait Times & Lightning Lane", image: "/feature-art/line-games.png", desc: "Real-time wait time alerts and Lightning Lane gap finder — act in seconds" },
  { icon: Hotel, emoji: "🏨", title: "Hotel Price Alerts", image: "/feature-art/hotel-deals.png", desc: "Track Disney resort and off-property hotel prices — get alerted when rates drop" },
  { icon: Plane, emoji: "✈️", title: "Airfare Tracker", image: "/feature-art/airfare-tracker.png", desc: "Monitor flight prices to Orlando and get notified when fares hit your target" },
  { icon: Wallet, emoji: "💰", title: "Budget Manager", image: "/feature-art/budget-manager.png", desc: "Track every dollar — auto-categorize expenses, set caps, and export reports" },
  { icon: Ticket, emoji: "🎟️", title: "Annual Passholder Hub", image: "/feature-art/ap-hub.png", desc: "Blockout calendar, AP discounts, renewal alerts — all in one place" },
  { icon: Users, emoji: "👨‍👩‍👧", title: "Group Coordinator", image: "/feature-art/group-expenses.png", desc: "Shared itinerary, split expenses, group polls, and group dining alerts" },
  { icon: Gamepad2, emoji: "🎮", title: "Line Games & Trivia", image: "/feature-art/line-games.png", desc: "Disney trivia, mystery games, and party games to play while waiting in line" },
  { icon: Camera, emoji: "📸", title: "Photo Opportunities", desc: "Fireworks ride timing, golden hour planner, and PhotoPass proximity alerts" },
  { icon: Sparkles, emoji: "🎆", title: "Shows & Fireworks Planner", desc: "Rank must-see shows, get viewing spot suggestions, and sync with your itinerary" },
  { icon: Users, emoji: "🏰", title: "AP Meetup Beacon", image: "/feature-art/magic-beacon.png", desc: "Meet fellow Annual Passholders in the park — no personal info shared until you both choose to connect" },
];

const stats = [
  { icon: Users, value: "2,400+", label: "Active Members" },
  { icon: DollarSign, value: "$520", label: "Avg. Trip Savings" },
  { icon: Star, value: "4.9★", label: "Rating" },
  { icon: Users, value: "340+", label: "🏰 AP Meetup Connections" },
];

const Index = () => {
  const { user, loading } = useAuth();
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, var(--background) 0%, var(--muted) 100%)" }}>
      <Header />

      {/* Founders Pass Banner */}
      <section className="relative mt-16 pt-4 px-4">
        <Link to="/pricing" className="block max-w-4xl mx-auto">
          <div className="rounded-xl border-2 border-primary/60 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 p-5 md:p-6 flex flex-col sm:flex-row items-center gap-4 hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group cursor-pointer">
            <div className="text-4xl md:text-5xl">🏰</div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Limited to 500 Members</span>
                <span className="inline-block w-2 h-2 rounded-full bg-success live-pulse" />
              </div>
              <h3 className="text-xl md:text-2xl font-extrabold text-foreground group-hover:text-primary transition-colors">
                Founders Pass — $74.99/year
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Lock in lifetime pricing with every feature included. Early supporters get priority access and exclusive perks forever.
              </p>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg px-6 h-10 text-sm shrink-0">
              Claim Your Spot
            </Button>
          </div>
        </Link>
      </section>

      {/* Beta Banner */}
      <div className="max-w-4xl mx-auto mt-4 px-4">
        <div className="rounded-lg bg-yellow-500 text-black text-center py-3 px-4 font-bold text-sm md:text-base tracking-wide">
          🚧 WE ARE IN BETA TESTING MODE — Some features are not currently operating correctly. 🚧
        </div>
      </div>

      {/* Hero */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 px-4 overflow-hidden">
        <StarField />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-tight tracking-tight">
            Your Complete Disney Vacation{" "}
            <span className="text-primary">Command Center</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Plan smarter. Save more. Enjoy every minute.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <a href="#how-it-works">
              <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-semibold rounded-lg px-8 h-12 text-base">
                See How It Works
              </Button>
            </a>

            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-sm font-semibold text-primary tracking-wide uppercase">Coming Soon</p>
              <p className="text-xs text-muted-foreground">Complete App on Google Play and Apple App Store</p>
              <div className="flex items-center gap-4 mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-8 h-8 text-muted-foreground">
                  <path fill="currentColor" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-7 h-7 text-muted-foreground">
                  <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-27.1-46.9-42.2-83.7-45.4-35.6-3.1-74.4 20.9-88.5 20.9-15 0-49.4-19.7-74.3-19.7C60.5 141.1 0 187.7 0 281.4c0 28.2 5.1 57.5 15.4 87.8 13.7 39.7 63.1 136.8 114.6 135.1 26.5-.6 45.2-19 79.7-19 33.5 0 50.8 19 80.4 18.4 52.3-.8 96.5-88.2 109.3-128.1-69.4-32.9-68.7-96.5-68.7-98.9zM261.5 73.3c27.3-33 24.5-63.3 23.6-74.3-23.6 1.3-51 15.7-66.9 34.1-17.4 19.9-27.6 44.7-25.4 73.1 25.5 1.9 49.1-12.7 68.7-32.9z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            {[
              "Smart Itinerary Builder, Budgeting, Dining and Event Alerts",
              "In Park Live Mode With GPS Navigator",
              "Built for Travelers & Annual Passholders",
            ].map((badge) => (
              <div key={badge} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-success live-pulse" />
                <span>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 px-4 border-b border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
            How <span className="text-primary">Magic Pass Plus</span> Works
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            Three simple steps to never miss a reservation again.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                <span className="text-4xl">🔔</span>
              </div>
              <div className="inline-block bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full mb-3">STEP 1</div>
              <h3 className="text-xl font-bold text-white mb-2">Set Your Alerts</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Choose the restaurants and experiences you want. Set your dates, party size, and preferred times. We start monitoring instantly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                <span className="text-4xl">⚡</span>
              </div>
              <div className="inline-block bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-3">STEP 2</div>
              <h3 className="text-xl font-bold text-white mb-2">Get Instant Notifications</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The moment a reservation opens up, you get an alert via email and/or SMS — usually within seconds. We monitor 24/7 so you don't have to.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                <span className="text-4xl">🎉</span>
              </div>
              <div className="inline-block bg-yellow-500/20 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full mb-3">STEP 3</div>
              <h3 className="text-xl font-bold text-white mb-2">Book It & Enjoy</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Tap the alert, book your reservation on Disney's site, and enjoy! Plus use our AI trip planner, GPS navigator, and budget tracker to plan every detail.
              </p>
            </div>
          </div>

          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
            <div className="rounded-xl bg-card gold-border p-5">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2">🎯 150+ Restaurants & Experiences</h4>
              <p className="text-muted-foreground text-sm">Monitor dining reservations at every Disney restaurant plus hard-to-get experiences like Savi's Workshop, Bibbidi Bobbidi Boutique, and character dining.</p>
            </div>
            <div className="rounded-xl bg-card gold-border p-5">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2">📱 Works on Any Device</h4>
              <p className="text-muted-foreground text-sm">Use Magic Pass Plus on your phone, tablet, or computer. Get alerts via email, SMS, or both. Our responsive design works beautifully everywhere.</p>
            </div>
            <div className="rounded-xl bg-card gold-border p-5">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2">🤖 AI Trip Planner</h4>
              <p className="text-muted-foreground text-sm">Our AI builds you a personalized day-by-day itinerary based on your dates, party, and priorities. Optimized for crowd levels, park hours, and dining times.</p>
            </div>
            <div className="rounded-xl bg-card gold-border p-5">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2">🏰 Built for Annual Passholders</h4>
              <p className="text-muted-foreground text-sm">AP Command Center with blockout calendars, AP-exclusive hotel deals, merchandise drop alerts, discount database, and renewal reminders all in one place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
            Everything You Need for the <span className="text-primary">Perfect Trip</span>
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            Fourteen powerful tools designed for Disney families and Annual Passholders.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [&>*:nth-child(7)]:md:col-start-1 [&>*:nth-child(7)]:lg:col-start-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl bg-card gold-border p-6 hover:border-primary/40 transition-all duration-300 group"
              >
                <div className="relative mb-4">
                  {(f as any).image && <img src={(f as any).image} alt={f.title} className="w-full h-32 object-cover rounded-lg mb-3 opacity-80" />}
                  <div className="text-3xl">{f.emoji}</div>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 border-t border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground mb-10 text-lg">
            Trusted by Disney families and Annual Passholders across Florida
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Ready to plan your perfect Disney trip?</h2>
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

export default Index;
