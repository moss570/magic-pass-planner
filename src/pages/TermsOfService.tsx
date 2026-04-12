import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";

export default function TermsOfService() {
  const navigate = useNavigate();
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-white/80 space-y-6 leading-relaxed">
          <h1 className="text-4xl font-black text-white">Terms of Service</h1>
          <p className="text-sm text-white/40"><strong>Effective Date: April 20, 2026</strong> · <strong>Last Updated: April 20, 2026</strong></p>

          <section><h2 className="text-2xl font-bold text-white mb-3">1. Agreement</h2>
          <p>By creating an account or using Magic Pass Plus (the "Service"), you agree to these Terms of Service. If you don't agree, please don't use the Service.</p>
          <p className="text-white/50 text-sm italic">Magic Pass Plus is an independent service. We are not affiliated with, endorsed by, or officially connected to The Walt Disney Company, Universal Studios, Universal Islands of Adventure, SeaWorld Entertainment, or any of their subsidiaries.</p></section>

          <section><h2 className="text-2xl font-bold text-white mb-3">2. What Magic Pass Plus Does</h2>
          <p>Magic Pass Plus is a subscription platform that helps you:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Get instant alerts when dining reservations and hard-to-get experiences become available</li>
            <li>Plan your trip day-by-day with our AI Trip Planner and Smart Park Itinerary Optimizer</li>
            <li>Track your full trip budget, airfare prices, hotel deals, and Gift Card offers</li>
            <li>Navigate parks in real time with GPS routing, Lightning Lane Gap Finder, and live wait times</li>
            <li>Coordinate group trips with shared itineraries, group expense tracking, and trip polls</li>
            <li>Manage Annual Passholder perks, blockout calendars, AP discounts, and renewal alerts</li>
          </ul>
          <p className="mt-2 font-semibold text-white/70">We monitor publicly available reservation availability and notify you when openings match your criteria. We do not book reservations on your behalf.</p></section>

          <section><h2 className="text-2xl font-bold text-white mb-3">3. Your Account</h2>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>You must provide accurate information and keep it current</li>
            <li>You must be at least 18 years old to subscribe</li>
            <li>You are responsible for all activity under your account</li>
            <li>Report suspected unauthorized access to support@magicpassplus.com</li>
          </ul></section>

          <section><h2 className="text-2xl font-bold text-white mb-3">4. Subscriptions and Billing</h2>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-white/10"><th className="text-left py-2 text-white/70">Plan</th><th className="text-left py-2 text-white/70">Billing</th><th className="text-left py-2 text-white/70">Auto-Renews</th></tr></thead>
            <tbody className="text-white/60">
              <tr className="border-b border-white/5"><td className="py-2">7-Day Free Trial</td><td>Free</td><td>No</td></tr>
              <tr className="border-b border-white/5"><td className="py-2">90-Day Magic Pass Friend</td><td>One-time</td><td>No</td></tr>
              <tr className="border-b border-white/5"><td className="py-2">90-Day Magic Pass Planner</td><td>One-time</td><td>No</td></tr>
              <tr className="border-b border-white/5"><td className="py-2">Magic Pass Planner</td><td>Monthly or Annual</td><td>Yes</td></tr>
              <tr className="border-b border-white/5"><td className="py-2">Magic Pass Plus</td><td>Monthly or Annual</td><td>Yes</td></tr>
              <tr className="border-b border-white/5"><td className="py-2">Founders Pass</td><td>Annual</td><td>No — must manually renew</td></tr>
            </tbody>
          </table></div>
          <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">Cancellation</h3>
          <p>Cancel monthly or annual plans anytime in Account → Subscription. Access continues through the end of your billing period. No partial refunds.</p>
          <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">Founders Pass Price Lock</h3>
          <p>Founders Pass members (limited to 500, April 20 – June 25, 2026) lock in their annual price forever — <strong>as long as the subscription stays active</strong>. If the subscription lapses for any reason, the Founders Pass price is permanently forfeited.</p>
          <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">90-Day Plan Data Deletion</h3>
          <p>When a 90-day plan expires, <strong>all trip data, itineraries, alert configurations, and account content are permanently and irrecoverably deleted.</strong></p></section>

          <section className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-3">5. Beta Tester Program</h2>
            <h3 className="text-lg font-semibold text-white/90 mb-2">Eligibility</h3>
            <p>Beta testers are individuals personally invited by Magic Pass Plus. Participation is by invitation only and is not transferable.</p>
            <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">Free One-Year Membership</h3>
            <p>Approved beta testers receive one (1) year of complimentary access at the Magic Pass Plus tier. No credit card required. The free year does not auto-renew.</p>
            <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">What We Ask in Return</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use the Service genuinely, including on real Disney trips where possible</li>
              <li>Provide honest feedback about bugs, usability issues, or missing features</li>
              <li>Report issues via the feedback channel provided at onboarding</li>
              <li>Not publicly disclose unreleased features without prior written permission</li>
            </ul>
            <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">What We Don't Ask</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Beta testers are <strong>not required to post about Magic Pass Plus</strong> on social media</li>
              <li>Feedback is voluntary — there is no minimum participation requirement</li>
              <li>Beta access is not contingent on writing reviews or endorsements</li>
            </ul>
            <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">No Warranties During Beta</h3>
            <p className="text-white/60 text-sm">The Service during the beta period may contain bugs or incomplete features. Beta testers acknowledge this and agree that the beta experience may differ from the final released product.</p>
          </section>

          <section><h2 className="text-2xl font-bold text-white mb-3">6. Acceptable Use</h2>
          <p>You may not:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Use the Service for unlawful purposes</li>
            <li>Resell reservations or operate a reservation-selling business</li>
            <li>Share account credentials</li>
            <li>Reverse engineer, scrape, or interfere with the Service</li>
            <li>Use bots or automation beyond normal user activity</li>
            <li>Upload malicious code or attempt to compromise our systems</li>
          </ul></section>

          <section><h2 className="text-2xl font-bold text-white mb-3">7-8. Third-Party Platforms & IP</h2>
          <p>Magic Pass Plus connects with third-party platforms including Disney's reservation system. Your use of those platforms is governed by their own terms.</p>
          <p className="mt-2">All content, features, and functionality of Magic Pass Plus are our exclusive property and protected by applicable IP laws.</p></section>

          <section><h2 className="text-2xl font-bold text-white mb-3">9. Disclaimers</h2>
          <p className="text-white/60 uppercase text-sm font-mono">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT ANY DINING RESERVATION OR EXPERIENCE WILL BECOME AVAILABLE.</p></section>

          <section><h2 className="text-2xl font-bold text-white mb-3">10. Limitation of Liability</h2>
          <p className="text-white/60 uppercase text-sm font-mono">OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE THREE (3) MONTHS PRIOR TO THE CLAIM.</p></section>

          <section><h2 className="text-2xl font-bold text-white mb-3">11-14. Indemnification, Termination, Governing Law, Changes</h2>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>You agree to indemnify and hold harmless Magic Pass Plus from claims arising from your use</li>
            <li>We may suspend or terminate accounts for violations</li>
            <li>Governed by Florida law; disputes resolved through binding arbitration</li>
            <li>Material changes notified at least 14 days before taking effect</li>
          </ul></section>

          <section className="bg-white/5 p-6 rounded-xl border border-white/10">
            <h2 className="text-lg font-bold text-white mb-2">Contact</h2>
            <p>Magic Pass Plus · <a href="mailto:support@magicpassplus.com" className="text-yellow-400 hover:underline">support@magicpassplus.com</a> · magicpassplus.com</p>
          </section>
        </motion.div>
      </div>
      <SiteFooter />
    </div>
  );
}
