import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#050a12] py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-white/30 text-sm">
          © {new Date().getFullYear()} Magic Pass Plus. All rights reserved.
        </p>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/privacy-policy" className="text-white/40 hover:text-white/70 transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="text-white/40 hover:text-white/70 transition-colors">Terms of Service</Link>
          <Link to="/affiliate" className="text-white/40 hover:text-white/70 transition-colors">Affiliate Program</Link>
          <Link to="/support" className="text-white/40 hover:text-white/70 transition-colors">Support</Link>
        </nav>
      </div>
      <div className="max-w-6xl mx-auto mt-4">
        <p className="text-white/20 text-xs text-center">
          Magic Pass Plus is an independent service not affiliated with The Walt Disney Company, Universal Studios, Universal Islands of Adventure, SeaWorld Entertainment, or any of their affiliates.
        </p>
      </div>
    </footer>
  );
}
