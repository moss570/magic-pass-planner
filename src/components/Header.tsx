import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Castle, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "For Annual Passholders", href: "/pricing" },
    { label: "Login", href: "/login" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-xl shadow-lg shadow-primary/5" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2">
            <Castle className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold text-primary">Magic Pass</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Link to="/signup">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg px-6">
                Start Free Trial
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-xl border-t border-border">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/signup" onClick={() => setMobileOpen(false)}>
              <Button className="w-full bg-primary text-primary-foreground font-semibold rounded-lg mt-2">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
