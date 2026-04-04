import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Map, UtensilsCrossed, Gift, Zap, Ticket, Users,
  Clock, DollarSign, Star
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
  { icon: Gift, emoji: "🎁", title: "Gift Card Deal Tracker", desc: "24/7 monitor for discounted Disney gift cards at Sam's, Target & Costco" },
  { icon: Zap, emoji: "⚡", title: "Live Wait Time Alerts", desc: "Real-time push when rides drop to short waits — act in seconds" },
  { icon: Ticket, emoji: "🎟️", title: "Annual Passholder Hub", desc: "Blockout calendar, AP discounts, renewal alerts — all in one place" },
  { icon: Users, emoji: "👨‍👩‍👧", title: "Group Coordinator", desc: "Shared itinerary, split expenses, and group dining alerts" },
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
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #080E1E 0%, #0D1230 100%)" }}>
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-4 overflow-hidden">
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
            <Link to="/#features">
              <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-semibold rounded-lg px-8 h-12 text-base">
                See How It Works
              </Button>
            </Link>
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

      {/* Features */}
      <section id="features" className="py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
            Everything You Need for the <span className="text-primary">Perfect Trip</span>
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            Seven powerful tools designed for Disney families and Annual Passholders.
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
        <p className="text-muted-foreground mb-8">Start your 7-day free trial — no credit card required.</p>
        <Link to="/signup">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg px-10 h-12 text-base">
            Get Started Free
          </Button>
        </Link>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
