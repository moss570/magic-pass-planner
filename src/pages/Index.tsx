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
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
  { icon: Map, emoji: "🗺️", title: "AI Trip Planner", desc: "Personalized itineraries built around your dates, party, and budget" },
  { icon: UtensilsCrossed, emoji: "🍽️", title: "Dining Reservation Alerts", desc: "Instant alerts the moment a hard-to-get reservation opens" },
  { icon: CalendarCheck, emoji: "🎪", title: "Event & Experience Alerts", desc: "Get notified when hard-to-book events like dessert parties and fireworks cruises open up" },
  { icon: Gift, emoji: "🎁", title: "Gift Card Deal Tracker", desc: "24/7 monitor for discounted Disney gift cards at Sam's, Target & Costco" },
  { icon: Zap, emoji: "⚡", title: "Live Wait Times & Lightning Lane", desc: "Real-time wait time alerts and Lightning Lane gap finder — act in seconds" },
  { icon: Hotel, emoji: "🏨", title: "Hotel Price Alerts", desc: "Track Disney resort and off-property hotel prices — get alerted when rates drop" },
  { icon: Plane, emoji: "✈️", title: "Airfare Tracker", desc: "Monitor flight prices to Orlando and get notified when fares hit your target" },
  { icon: Wallet, emoji: "💰", title: "Budget Manager", desc: "Track every dollar — auto-categorize expenses, set caps, and export reports" },
  { icon: Ticket, emoji: "🎟️", title: "Annual Passholder Hub", desc: "Blockout calendar, AP discounts, renewal alerts — all in one place" },
  { icon: Users, emoji: "👨‍👩‍👧", title: "Group Coordinator", desc: "Shared itinerary, split expenses, group polls, and group dining alerts" },
  { icon: Gamepad2, emoji: "🎮", title: "Line Games & Trivia", desc: "Disney trivia, mystery games, and party games to play while waiting in line" },
  { icon: Camera, emoji: "📸", title: "Photo Opportunities", desc: "Fireworks ride timing, golden hour planner, and PhotoPass proximity alerts" },
  { icon: Sparkles, emoji: "🎆", title: "Shows & Fireworks Planner", desc: "Rank must-see shows, get viewing spot suggestions, and sync with your itinerary" },
  { icon: Users, emoji: "🏰", title: "AP Meetup Beacon", desc: "Meet fellow Annual Passholders in the park — no personal info shared until you both choose to connect" },
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
      {/* Beta Banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-500 text-black text-center py-2 px-4 font-bold text-sm md:text-base tracking-wide">
        🚧 WE ARE IN BETA TESTING MODE — Some features are not currently operating correctly. 🚧
      </div>

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

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={user ? "/dashboard" : "/signup"}>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg px-8 h-12 text-base">
                {user ? "Go to Dashboard" : "Start Free Trial"}
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-semibold rounded-lg px-8 h-12 text-base">
                See How It Works
              </Button>
            </a>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            {[
              "15-Second Wait Time Alerts",
              "Save $300+ on Every Trip",
              "Built for Annual Passholders",
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
                <div className="text-3xl mb-4">{f.emoji}</div>
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
