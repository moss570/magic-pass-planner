import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import SiteFooter from "@/components/SiteFooter";

const sections = [
  { title: "🚀 Getting Started", faqs: [
    { q: "How do I set up my first dining or experience alert?", a: "Log in → Dashboard → New Alert. Pick your restaurant or experience, select your date range, party size, and preferred time window. Choose email and/or SMS, then hit Save Alert. We'll watch 24/7 and notify you the moment a match opens." },
    { q: "How fast are alerts?", a: "Fast. Our system continuously monitors availability and most alerts fire within seconds to a few minutes of a reservation opening. For the best results, keep your phone nearby and act immediately when an alert arrives — popular reservations go quickly." },
    { q: "Can I set alerts for experiences, not just restaurants?", a: "Absolutely. Magic Pass Plus monitors 150+ dining locations and hard-to-get experiences including Bibbidi Bobbidi Boutique, Savi's Workshop lightsaber building, character dining, and more." },
    { q: "What parks does Magic Pass Plus support?", a: "Currently: Walt Disney World Resort (Orlando). Additional parks — including Universal Studios, Universal's Epic Universe, and SeaWorld — are coming soon after launch." },
    { q: "Does Magic Pass Plus book reservations for me?", a: "No — we notify you the moment a reservation opens and you complete the booking yourself through Disney's official site or app. This keeps your theme park account safe and fully in your control. Just follow the link in your alert email or text message and enter your party size, date, and time if asked to. Confirm your reservation as soon as you can before others do." },
  ]},
  { title: "🔔 Alerts & Notifications", faqs: [
    { q: "I set up an alert but haven't heard anything. What should I check?", a: "Check that the alert is Active in your Dashboard. Check spam/junk folders. Verify your phone number for SMS. Try widening your date range or time window. Remember it only will send you an alert if a reservation is available." },
    { q: "My alert fired but the reservation was gone. What happened?", a: "Disney reservations — especially at popular spots like Cinderella's Royal Table, 'Ohana, and Be Our Guest — can disappear within seconds. Have the My Disney Experience app open, enable push notifications, and act the moment an alert arrives." },
    { q: "Can I pause an alert without deleting it?", a: "Yes. Dashboard → find your alert → tap Pause. Paused alerts don't count toward your active alert limit and can be reactivated anytime." },
    { q: "How many active alerts can I have?", a: "Depends on your plan — check your Dashboard or visit our pricing page. Magic Pass Plus (our top tier) includes unlimited simultaneous active alerts." },
  ]},
  { title: "🗓️ Trip Planning Features", faqs: [
    { q: "What is the AI Trip Planner?", a: "The AI Trip Planner takes your trip dates, park tickets, party details, and booked reservations and builds a personalized day-by-day itinerary. It factors in crowd levels, park hours, your priority attractions, and dining times." },
    { q: "What is the Smart Park Itinerary Timing Optimizer?", a: "This tool builds an optimized walk order for your park day based on your reservations, Lightning Lane selections, and current crowd data — so you're always in the right place at the right time." },
    { q: "How does the Lightning Lane Gap Finder work?", a: "It monitors live wait times and Lightning Lane return windows in real time to show you exactly when to grab each LL for your target rides." },
    { q: "How does the GPS Compass with Shortcut Optimizer work?", a: "With location permission enabled, the GPS Compass routes you through the park using optimized paths — including shortcuts most guests don't know about." },
    { q: "What is the Annual Passholder Command Center?", a: "Consolidates everything in one place: your blockout calendar, AP discount database, renewal alerts, hotel deal alerts exclusive to APs, and merchandise drop notifications." },
  ]},
  { title: "💳 Subscriptions & Billing", faqs: [
    { q: "How do I upgrade my plan?", a: "Settings → My Subscription → Change Plan. Upgrades take effect immediately." },
    { q: "How do I cancel?", a: "Account → Subscription → Cancel Subscription. You keep full access through the end of your current billing period. No partial refunds." },
    { q: "What happens to my data if I cancel?", a: "Your data stays intact for 90 days after cancellation. You can reactivate within that window. After 90 days it's permanently deleted." },
    { q: "I'm on a 90-day plan. What happens when it expires?", a: "All data — trip plans, itineraries, alerts, everything — is permanently and immediately deleted at expiration. Export anything you want to keep, or upgrade before it expires." },
    { q: "What is the Founders Pass?", a: "A limited annual subscription — 500 members only, available April 20 – June 25, 2026. Founders Pass members lock in a special annual price forever, as long as the subscription stays active. If it ever lapses, the price lock is gone permanently." },
    { q: "I see an unexpected charge. What do I do?", a: "Email support@magicpassplus.com with your account email and add BILLING to your subject line for priority handling." },
  ]},
];

export default function SupportFaq() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#060a14] flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-10 bg-purple-500" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-10 bg-teal-500" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-8 flex-1">
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </motion.button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl font-black text-white mb-2">Support</h1>
          <p className="text-white/50 mb-2">support@magicpassplus.com · magicpassplus.com</p>
          <p className="text-white/60 mb-10">Whether you're chasing a Be Our Guest reservation, optimizing your park day, or sorting out a billing question — we've got you.</p>

          {sections.map((section, si) => (
            <div key={si} className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4">{section.title}</h2>
              <div className="space-y-2">
                {section.faqs.map((faq, fi) => {
                  const key = `${si}-${fi}`;
                  return (
                    <div key={key} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all">
                      <button onClick={() => setExpanded(expanded === key ? null : key)}
                        className="w-full flex items-center justify-between p-5 text-left">
                        <h3 className="text-sm font-semibold text-white pr-4">{faq.q}</h3>
                        <motion.div animate={{ rotate: expanded === key ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        </motion.div>
                      </button>
                      <motion.div initial={{ height: 0 }} animate={{ height: expanded === key ? "auto" : 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className="px-5 pb-5 text-white/60 text-sm leading-relaxed">{faq.a}</div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-2">💡 Feature Requests</h3>
            <p className="text-white/60 text-sm">Got an idea? Send it to <strong>support@magicpassplus.com</strong> with "FEATURE REQUEST" in the subject line — we read every one.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Still need help?</h2>
            <p className="text-white/70 mb-6">We respond within 24 hours — usually much faster.</p>
            <a href="mailto:support@magicpassplus.com"
              className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-yellow-500/20 transition-all">
              Email Support
            </a>
          </motion.div>

          <p className="text-white/20 text-xs mt-8 text-center italic">
            Magic Pass Plus is an independent service not affiliated with The Walt Disney Company, Universal Studios, Universal Islands of Adventure, SeaWorld Entertainment, or any of their affiliates.
          </p>
        </motion.div>
      </div>
      <SiteFooter />
    </div>
  );
}
