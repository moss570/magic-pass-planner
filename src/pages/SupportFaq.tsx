import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SupportFaq() {
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
          <h1 className="text-4xl font-black text-white mb-4">Support & FAQ</h1>
          <p className="text-white/60 mb-8">Find answers to common questions about Magic Pass Plus</p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 space-y-4">
            <h3 className="text-lg font-bold text-white">Common Questions</h3>
            <ul className="space-y-2 text-white/70">
              <li>✓ How do I set up dining alerts?</li>
              <li>✓ What subscription plan is best for me?</li>
              <li>✓ How do I cancel my subscription?</li>
              <li>✓ Is my payment information secure?</li>
              <li>✓ How do I contact support?</li>
            </ul>
            <a href="mailto:support@magicpassplus.com" className="block mt-6 px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg text-center">Email Support</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
