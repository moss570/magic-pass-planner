import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AffiliateProgram() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#060a14] p-4 md:p-8">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-10 bg-purple-500" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-10 bg-teal-500" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-block bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full px-4 py-1 mb-6">
            <span className="text-yellow-400 font-semibold text-sm">Coming Soon</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-4">Affiliate Program</h1>
          <p className="text-white/60 mb-8">Earn commissions by promoting Magic Pass Plus. Up to 30% recurring commission on each referral.</p>
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Join the Waitlist</h2>
            <p className="text-white/70">We'll notify you as soon as the program launches with exclusive benefits for early members.</p>
            <button className="mt-6 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-lg hover:shadow-lg transition-all">
              Join Waitlist
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
