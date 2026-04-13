import { motion } from "framer-motion";
import { Plane, Hotel, DollarSign, Users, Map, Calendar, Sparkles, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

const features = [
  {
    icon: Plane, emoji: "✈️", title: "Airfare Tracking & Alerts", image: "/feature-art/airfare-tracker.png",
    desc: "Set your travel dates and we'll monitor flight prices daily. Get instant alerts when prices drop — whether it's a flash sale or a gradual decrease. Compare airlines, track price history, and book at the perfect moment.",
    highlight: "Save hundreds on flights.",
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
  },
  {
    icon: Hotel, emoji: "🏨", title: "Hotel Deal Tracking", image: "/feature-art/hotel-deals.png",
    desc: "Monitor hotel prices near the parks. We track Disney resorts, partner hotels, and nearby options — alerting you when rates drop or special packages appear. See price history charts to know if you're getting a real deal.",
    highlight: "Never overpay for a hotel.",
    color: "from-purple-500/20 to-violet-500/20",
    border: "border-purple-500/30",
  },
  {
    icon: DollarSign, emoji: "💰", title: "Trip Budget Manager", image: "/feature-art/budget-manager.png",
    desc: "Plan your entire trip budget in one place. Track tickets, hotel, flights, dining, merchandise, and extras. Set daily spending limits, monitor actual vs. planned spending, and keep your vacation on budget.",
    highlight: "Know exactly what your trip costs.",
    color: "from-green-500/20 to-emerald-500/20",
    border: "border-green-500/30",
  },
  {
    icon: Users, emoji: "👨‍👩‍👧‍👦", title: "Group Expenses & Settle-Up", image: "/feature-art/group-expenses.png",
    desc: "Traveling with family or friends? Track shared expenses, split bills fairly, and settle up at the end of the trip. No more awkward 'who owes what' conversations. Everyone sees the same numbers in real time.",
    highlight: "Split costs without the drama.",
    color: "from-orange-500/20 to-amber-500/20",
    border: "border-orange-500/30",
  },
  {
    icon: Map, emoji: "🗺️", title: "AI Trip Planner", image: "/feature-art/ai-trip-planner.png",
    desc: "Tell us your dates, party size, and priorities — our AI builds a personalized day-by-day itinerary. Optimized for crowd levels, park hours, dining reservations, and your must-do list. Share it with your whole group.",
    highlight: "Your perfect trip, planned in minutes.",
    color: "from-yellow-500/20 to-orange-500/20",
    border: "border-yellow-500/30",
  },
  {
    icon: Calendar, emoji: "🍽️", title: "Dining Reservation Alerts", image: "/feature-art/dining-alerts.png",
    desc: "The hardest part of a Disney trip? Getting the restaurants you want. We monitor 150+ dining locations 24/7 and alert you the moment a table opens at your dream restaurant. Be Our Guest? Cinderella's Royal Table? We've got you.",
    highlight: "Snag the impossible reservation.",
    color: "from-red-500/20 to-pink-500/20",
    border: "border-red-500/30",
  },
  {
    icon: Sparkles, emoji: "🎁", title: "Gift Card Deal Tracker", image: "/feature-art/gift-cards.png",
    desc: "Save money before you even arrive. We track discounted Disney Gift Cards from 13+ retailers. Buy gift cards at a discount, use them to pay for everything in the parks — instant savings on dining, merchandise, and more.",
    highlight: "Save 5-15% on everything in the parks.",
    color: "from-teal-500/20 to-cyan-500/20",
    border: "border-teal-500/30",
  },
  {
    icon: Shield, emoji: "📊", title: "Trip Comparison Tool", image: "/feature-art/budget-manager.png",
    desc: "Planning multiple trip options? Compare different date ranges, hotel options, and itineraries side by side. See total costs, crowd level predictions, and weather forecasts for each option to make the best choice.",
    highlight: "Make data-driven vacation decisions.",
    color: "from-indigo-500/20 to-purple-500/20",
    border: "border-indigo-500/30",
  },
];

export default function ForTravelers() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <div className="pt-24 flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-block bg-blue-500/20 text-blue-400 text-sm font-bold px-4 py-1.5 rounded-full mb-6">
                ✈️ Built for Vacation Planners
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                Plan Smarter. <span className="text-blue-400">Save More.</span><br />Stress Less.
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                From booking flights to splitting the dinner bill — Magic Pass Plus has every tool you need to plan the perfect theme park vacation without breaking the bank.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/signup">
                  <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black rounded-xl text-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all">
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
                  <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className={`rounded-2xl bg-gradient-to-br ${f.color} border ${f.border} p-6 hover:scale-[1.02] transition-transform`}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">{f.emoji}</span>
                      {(f as any).image && <img src={(f as any).image} alt={f.title} className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-10" />}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                        <p className="text-white/60 text-sm leading-relaxed mb-2">{f.desc}</p>
                        <p className="text-blue-400 text-sm font-semibold">{f.highlight}</p>
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
            <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 p-10">
              <h2 className="text-3xl font-black text-white mb-4">Your Dream Vacation Starts Here</h2>
              <p className="text-white/60 mb-8 max-w-lg mx-auto">Join families who save $300+ per trip with Magic Pass Plus. Plan smarter, spend less, experience more.</p>
              <Link to="/signup">
                <button className="px-10 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black rounded-xl text-lg shadow-lg">
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
