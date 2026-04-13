import { motion } from "framer-motion";
import { ArrowRight, Bell, MapPin, Calendar, Users, Shield, Ticket, Radio, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

const features = [
  {
    icon: Bell, emoji: "🔔", title: "Unlimited Reservation Alerts",
    desc: "Never miss a dining reservation again. Monitor every restaurant in every park — unlimited alerts, 24/7 monitoring, instant email and SMS notifications the moment a table opens.",
    highlight: "Get alerted in seconds, not hours.",
    color: "from-yellow-500/20 to-orange-500/20",
    border: "border-yellow-500/30",
  },
  {
    icon: Radio, emoji: "📡", title: "Magic Beacon",
    desc: "Find fellow Annual Passholders in the park! The Magic Beacon lets you connect with nearby AP holders without sharing personal info until you both opt in. Perfect for meetups, group rides, and making new park friends.",
    highlight: "Meet your park community.",
    color: "from-purple-500/20 to-fuchsia-500/20",
    border: "border-purple-500/30",
  },
  {
    icon: Calendar, emoji: "🎪", title: "Events & Experiences",
    desc: "Track every special event, seasonal experience, and limited-time offering. Get alerts for character meet-and-greets, fireworks viewing spots, festival food booths, and exclusive AP events before they fill up.",
    highlight: "First to know, first in line.",
    color: "from-blue-500/20 to-indigo-500/20",
    border: "border-blue-500/30",
  },
  {
    icon: Users, emoji: "💬", title: "Social Feed & Community",
    desc: "Join the Magic Pass Plus community! Share trip photos, tips, and reviews. Follow other passholders, get insider intel from our team, and stay connected between visits. Your own Disney social network.",
    highlight: "Your park community, always connected.",
    color: "from-green-500/20 to-emerald-500/20",
    border: "border-green-500/30",
  },
  {
    icon: Ticket, emoji: "🎟️", title: "AP Command Center",
    desc: "Everything you need in one place: blockout calendar synced to your pass type, AP discount database, hotel deal alerts exclusive to passholders, merchandise drop notifications, and renewal reminders.",
    highlight: "Your AP life, organized.",
    color: "from-amber-500/20 to-yellow-500/20",
    border: "border-amber-500/30",
  },
  {
    icon: Sparkles, emoji: "🎮", title: "In-Park Games",
    desc: "Turn wait times into fun times! Play multiplayer games with your group while waiting in line — detective mysteries, card games, puzzles, and more. QR code to join, no downloads needed.",
    highlight: "Never a boring line again.",
    color: "from-pink-500/20 to-rose-500/20",
    border: "border-pink-500/30",
  },
];

export default function ForPassholders() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <div className="pt-24 flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-block bg-primary/20 text-primary text-sm font-bold px-4 py-1.5 rounded-full mb-6">
                🎟️ Built for Annual Passholders
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                Your Pass. <span className="text-primary">Your Park.</span><br />Your Advantage.
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Magic Pass Plus gives Annual Passholders the tools to maximize every visit — unlimited alerts, community features, and in-park experiences built specifically for you.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/signup">
                  <button className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black rounded-xl text-lg shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 transition-all">
                    Start Free Trial →
                  </button>
                </Link>
                <Link to="/pricing">
                  <button className="px-8 py-4 bg-white/5 border border-white/20 text-white font-bold rounded-xl text-lg hover:bg-white/10 transition-all">
                    See Pricing
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className={`rounded-2xl bg-gradient-to-br ${f.color} border ${f.border} p-6 hover:scale-[1.02] transition-transform`}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">{f.emoji}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                        <p className="text-white/60 text-sm leading-relaxed mb-2">{f.desc}</p>
                        <p className="text-primary text-sm font-semibold">{f.highlight}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-10">
              <h2 className="text-3xl font-black text-white mb-4">Ready to Upgrade Your Park Experience?</h2>
              <p className="text-white/60 mb-8 max-w-lg mx-auto">Join thousands of Annual Passholders who use Magic Pass Plus to get more out of every visit.</p>
              <Link to="/signup">
                <button className="px-10 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black rounded-xl text-lg shadow-lg">
                  Start Your Free 7-Day Trial →
                </button>
              </Link>
              <p className="text-white/30 text-xs mt-4">No credit card required. Cancel anytime.</p>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
