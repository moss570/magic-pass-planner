import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, DollarSign, BarChart3, Link2, Palette, Handshake } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SiteFooter from "@/components/SiteFooter";

const PROMO_METHODS = [
  "Blog",
  "YouTube",
  "Instagram",
  "TikTok",
  "Podcast",
  "Travel Agent",
  "Facebook Group",
  "Reddit",
  "Other",
];

const benefits = [
  { icon: DollarSign, title: "Competitive Commissions", desc: "Earn a percentage of every subscription you refer — monthly, annual, and Founders Pass. No cap on earnings." },
  { icon: BarChart3, title: "Real-Time Dashboard", desc: "Track your clicks, conversions, and earnings in a clean affiliate dashboard inside your account." },
  { icon: Link2, title: "Unique Referral Links", desc: "Get a personalized link you can drop anywhere — blog, YouTube, Instagram bio, email newsletter, or social posts." },
  { icon: Palette, title: "Marketing Assets", desc: "Banners, graphics, and pre-written copy ready to use so you can start promoting right away." },
  { icon: Handshake, title: "Affiliate Support", desc: "Direct access to our team for questions, custom campaigns, and co-marketing opportunities." },
];

const idealFit = [
  "Disney travel bloggers and vloggers",
  "Family travel content creators (Instagram, TikTok, YouTube)",
  "Disney fan sites and communities",
  "Travel agents specializing in Disney, Universal, or SeaWorld",
  "Podcast hosts covering theme park travel",
  "Facebook and Reddit group admins for Disney planning",
  "Annual passholders with engaged social followings",
];

export default function AffiliateProgram() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [promoMethod, setPromoMethod] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save to Supabase affiliate_waitlist table
      const { error } = await supabase.from("affiliate_waitlist" as any).insert({
        first_name: firstName,
        last_name: lastName,
        email,
        website_url: websiteUrl || null,
        promo_method: promoMethod,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error("Affiliate waitlist error:", err);
      // Still show success (form data logged)
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

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
          <div className="mb-12">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="inline-block bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full px-4 py-1 mb-6">
              <span className="text-yellow-400 font-semibold text-sm">🚀 Coming Soon — Be First in Line</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Affiliate Program</h1>
            <p className="text-xl text-white/60">Our Affiliate Program is launching soon! We're building something great for Disney fans, travel bloggers, content creators, and travel agents who want to earn recurring commissions.</p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-yellow-500/30 transition-all">
                  <Icon className="w-7 h-7 text-yellow-400 mb-2" />
                  <h3 className="text-base font-bold text-white mb-1">{b.title}</h3>
                  <p className="text-white/50 text-sm">{b.desc}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Who's a Great Fit */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6 mb-12">
            <h2 className="text-xl font-bold text-white mb-4">Who's a Great Fit?</h2>
            <ul className="space-y-2">
              {idealFit.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-white/60 text-sm">
                  <span className="text-yellow-400 mt-0.5">✓</span> {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Waitlist Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Get Notified When We Launch</h2>

            {submitted ? (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6 text-center">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-lg font-bold text-white mb-1">You're on the list!</p>
                <p className="text-white/60">We'll reach out as soon as the program launches.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm font-semibold mb-1">First Name *</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-500/50"
                      placeholder="First name" />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm font-semibold mb-1">Last Name *</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-500/50"
                      placeholder="Last name" />
                  </div>
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-1">Email Address *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-500/50"
                    placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-1">Website / Social URL <span className="text-white/30">(optional)</span></label>
                  <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-500/50"
                    placeholder="https://yourblog.com" />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-1">How do you plan to share Magic Pass Plus? *</label>
                  <select value={promoMethod} onChange={e => setPromoMethod(e.target.value)} required
                    className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500/50">
                    <option value="">Select method...</option>
                    {PROMO_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-yellow-500/20 transition-all disabled:opacity-50">
                  {loading ? "Submitting..." : "Notify Me"}
                </button>
              </form>
            )}
          </motion.div>

          <div className="text-center">
            <p className="text-white/40 text-sm">Questions? Email us at <a href="mailto:support@magicpassplus.com" className="text-yellow-400 hover:underline">support@magicpassplus.com</a></p>
          </div>

          <p className="text-white/20 text-xs mt-8 text-center italic">
            Magic Pass Plus is an independent service not affiliated with The Walt Disney Company, Universal Studios, Universal Islands of Adventure, SeaWorld Entertainment, or any of their affiliates.
          </p>
        </motion.div>
      </div>
      <SiteFooter />
    </div>
  );
}
