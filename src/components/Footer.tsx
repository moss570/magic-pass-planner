import { Castle } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t" style={{ background: "#0D1230", borderColor: "rgba(245,200,66,0.15)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Column 1 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Castle className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold text-primary">Magic Pass</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Plan smarter. Save more. Enjoy every minute.</p>
            <p className="text-xs text-muted-foreground">© 2026 Magic Pass Plus LLC</p>
          </div>

          {/* Column 2 */}
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Product</p>
            <ul className="space-y-2">
              {[
                { label: "Features", to: "/#features" },
                { label: "Pricing", to: "/pricing" },
                { label: "For Annual Passholders", to: "/pricing" },
                { label: "Blog", to: "#" },
                { label: "Contact", to: "#" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Legal</p>
            <ul className="space-y-2">
              {["Privacy Policy", "Terms of Service", "Affiliate Program", "Support"].map((l) => (
                <li key={l}>
                  <Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom disclaimer */}
      <div className="border-t px-4 py-4 text-center" style={{ borderColor: "rgba(245,200,66,0.1)" }}>
        <p className="text-[11px] text-muted-foreground max-w-3xl mx-auto">
          magicpassplus.com — Not affiliated with The Walt Disney Company. Disney®, Walt Disney World®, and related marks are trademarks of Disney.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
