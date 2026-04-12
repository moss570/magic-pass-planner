import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-white/80 space-y-6">
          <h1 className="text-4xl font-black text-white mb-8">Terms of Service</h1>
          <p className="text-sm text-white/50"><strong>Effective Date: April 20, 2026</strong></p>
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
            <p>By accessing and using Magic Pass Plus, you accept and agree to be bound by the terms and provisions of this agreement.</p>
          </section>
          <section className="bg-white/5 p-6 rounded-xl border border-white/10">
            <p className="text-sm text-white/60">For complete details, visit support@magicpassplus.com</p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
