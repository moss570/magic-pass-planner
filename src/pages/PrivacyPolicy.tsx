import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Add noindex meta tag to this page
    const noindexMeta = document.createElement("meta");
    noindexMeta.name = "robots";
    noindexMeta.content = "noindex, follow";
    document.head.appendChild(noindexMeta);
    
    return () => document.head.removeChild(noindexMeta);
  }, []);
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
          <h1 className="text-4xl font-black text-white">Privacy Policy</h1>
          <p className="text-sm text-white/40"><strong>Effective Date: April 20, 2026</strong> · <strong>Last Updated: April 20, 2026</strong></p>

          <section><h2 className="text-2xl font-bold text-white mb-3">1. Who We Are</h2>
          <p>Magic Pass Plus ("we," "us," or "our") is a subscription-based trip planning and reservation alert service for theme park guests. We help you snag hard-to-get dining reservations and experiences at Disney parks — and plan every moment of your trip from arrival to fireworks.</p>
          <p>We take your privacy seriously. This policy explains exactly what data we collect, why we collect it, and how we protect it.</p>
          <p className="text-white/50 text-sm italic">Magic Pass Plus is not affiliated with The Walt Disney Company, Universal Studios, Universal Islands of Adventure, SeaWorld Entertainment, or any of their affiliates.</p></section>

          <section><h2 className="text-2xl font-bold text-white mb-3">2. What Data We Collect</h2>
          <h3 className="text-lg font-semibold text-white/90 mb-2">Data You Give Us</h3>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Account:</strong> Name, email address, password</li>
            <li><strong>Trip profile:</strong> Party names and ages, trip dates, park preferences, Annual Passholder status, party size</li>
            <li><strong>Alert settings:</strong> Restaurants, experiences, dates, times, and party size for each alert</li>
            <li><strong>Payment:</strong> Billing details handled securely by our payment processor — we never store full card numbers</li>
            <li><strong>Support messages:</strong> Anything you send our support team</li>
          </ul>
          <h3 className="text-lg font-semibold text-white/90 mb-2 mt-4">Data We Collect Automatically</h3>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Usage:</strong> Which features you use, how long, alert history</li>
            <li><strong>Device:</strong> Device type, OS, browser, IP address</li>
            <li><strong>Location:</strong> GPS data for in-park features — <strong>only with your explicit permission</strong></li>
            <li><strong>Session data:</strong> Cookies and similar tools to keep you logged in</li>
          </ul></section>

          <section><h2 className="text-2xl font-bold text-white mb-3">3. How We Use Your Data</h2>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-white/10"><th className="text-left py-2 text-white/70">Purpose</th><th className="text-left py-2 text-white/70">Why</th></tr></thead>
            <tbody className="text-white/60">
              <tr className="border-b border-white/5"><td className="py-2">Create and manage your account</td><td>Core service</td></tr>
              <tr className="border-b border-white/5"><td className="py-2">Send dining & experience alerts via email/SMS</td><td>Core service</td></tr>
              <tr className="border-b border-white/5"><td className="py-2">Build your AI trip itinerary</td><td>Core service</td></tr>
              <tr className="border-b border-white/5"><td className="py-2">Power in-park features (GPS, wait times)</td><td>Core service</td></tr>
              <tr className="border-b border-white/5"><td className="py-2">Process payments and subscriptions</td><td>Required for billing</td></tr>
              <tr className="border-b border-white/5"><td className="py-2">Send promotional emails</td><td>With your consent; opt out anytime</td></tr>
              <tr className="border-b border-white/5"><td className="py-2">Prevent fraud and enforce our Terms</td><td>Security</td></tr>
            </tbody>
          </table></div></section>

          <section><h2 className="text-2xl font-bold text-white mb-3">4. Who We Share Your Data With</h2>
          <p className="text-xl font-bold text-yellow-400 mb-2">We do not sell your data. Ever.</p>
          <p>We share data only with service providers (Twilio for SMS, Brevo for email, Supabase for database, Railway for hosting), your trip group members you invite, legal authorities when required by law, and potential acquirers in the event of a merger.</p></section>

          <section><h2 className="text-2xl font-bold text-white mb-3">5. Alerts and Notifications</h2>
          <p>By creating an alert, you consent to receive notifications. To opt out: click "Unsubscribe" in emails, reply STOP for SMS, or pause/delete alerts in your Dashboard.</p></section>

          <section><h2 className="text-2xl font-bold text-white mb-3">6. Data Retention by Plan</h2>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-white/10"><th className="text-left py-2 text-white/70">Plan</th><th className="text-left py-2 text-white/70">Data Retention</th></tr></thead>
            <tbody className="text-white/60">
              <tr className="border-b border-white/5"><td className="py-2">Monthly / Annual</td><td>Kept while active; deleted 90 days after cancellation</td></tr>
              <tr className="border-b border-white/5"><td className="py-2">90-Day Plans</td><td>Permanently deleted at plan expiration</td></tr>
              <tr className="border-b border-white/5"><td className="py-2">Founders Pass</td><td>Retained for the life of active subscription</td></tr>
            </tbody>
          </table></div>
          <p className="text-sm mt-2">To request deletion at any time, email <strong>support@magicpassplus.com</strong>.</p></section>

          <section><h2 className="text-2xl font-bold text-white mb-3">7. Children's Privacy</h2>
          <p>Magic Pass Plus is not intended for children under 13. We do not knowingly collect data from children under 13.</p></section>

          <section><h2 className="text-2xl font-bold text-white mb-3">8. Security</h2>
          <p>We use TLS/HTTPS encryption in transit and encryption at rest for sensitive data. No system is 100% secure — we cannot guarantee absolute protection against every threat.</p></section>

          <section><h2 className="text-2xl font-bold text-white mb-3">9. Your Privacy Rights</h2>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Access</strong> your personal data</li>
            <li><strong>Correct</strong> inaccurate data</li>
            <li><strong>Delete</strong> your account and data</li>
            <li><strong>Opt out</strong> of marketing</li>
            <li><strong>Export</strong> your data in a portable format</li>
          </ul>
          <p className="mt-2 text-sm">Contact us at <strong>support@magicpassplus.com</strong> to exercise any of these rights.</p></section>

          <section><h2 className="text-2xl font-bold text-white mb-3">10. Policy Updates</h2>
          <p>We'll notify you of material changes by email or in-app notice at least 14 days before changes take effect.</p></section>

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
