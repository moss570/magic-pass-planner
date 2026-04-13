import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Castle, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const publicLinks = [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "For Annual Passholders", href: "/for-passholders" },
    { label: "For Travelers", href: "/for-travelers" },
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
            {publicLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {!loading && !user && (
              <Link
                to="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Login
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {loading ? null : user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-semibold rounded-lg px-5">
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={signOut}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/signup">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg px-6">
                  Start Free Trial
                </Button>
              </Link>
            )}
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
            {publicLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!loading && !user && (
              <Link
                to="/login"
                className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
            )}
            {!loading && user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-primary text-primary-foreground font-semibold rounded-lg mt-2">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground mt-1"
                >
                  Sign Out
                </Button>
              </>
            ) : !loading ? (
              <Link to="/signup" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-primary text-primary-foreground font-semibold rounded-lg mt-2">
                  Start Free Trial
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
