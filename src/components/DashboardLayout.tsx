import { useState } from "react";
import { Castle, Home, Map, UtensilsCrossed, Gift, Zap, Ticket, Users, Wallet, Settings, Bell, LogOut, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const sidebarNav = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Map, label: "Trip Planner", path: "/trip-planner" },
  { icon: UtensilsCrossed, label: "Dining Alerts", path: "/dining-alerts" },
  { icon: Gift, label: "Gift Card Tracker", path: "/gift-card-tracker" },
  { icon: Zap, label: "Live Park Mode", path: "/live-park" },
  { icon: Ticket, label: "AP Command Center", path: "/ap-command-center" },
  { icon: Users, label: "Group Coordinator", path: "#" },
  { icon: Wallet, label: "Budget Manager", path: "#" },
  { icon: Settings, label: "Settings", path: "#" },
];

const bottomNavItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Map, label: "Plan", path: "/trip-planner" },
  { icon: Zap, label: "Live", path: "/live-park" },
  { icon: Bell, label: "Alerts", path: "/dining-alerts" },
];

const moreDrawerItems = sidebarNav.filter(
  (item) => !bottomNavItems.some((b) => b.path === item.path)
);

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — hidden on mobile, icon-only on tablet, full on desktop */}
      <aside className="fixed top-0 left-0 bottom-0 hidden md:flex flex-col z-40 w-16 lg:w-60 transition-all" style={{ background: "#0D1230" }}>
        <div className="px-3 lg:px-5 pt-6 pb-4">
          <Link to="/" className="flex items-center gap-2">
            <Castle className="w-6 h-6 text-primary shrink-0" />
            <span className="text-lg font-bold text-primary hidden lg:block">Magic Pass</span>
          </Link>
        </div>

        <div className="px-3 lg:px-5 pb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold shrink-0">B</div>
          <div className="hidden lg:block">
            <p className="text-xs text-muted-foreground">Welcome back,</p>
            <p className="text-sm font-semibold text-foreground">Brandon</p>
          </div>
        </div>

        <nav className="flex-1 px-2 lg:px-3 space-y-1">
          {sidebarNav.map((item) => {
            const isActive = location.pathname === item.path;
            const link = (
              <Link
                key={item.label}
                to={item.path}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary border-l-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                } lg:justify-start justify-center`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
            // On tablet (md but not lg), wrap in tooltip
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild className="lg:hidden">
                  {link}
                </TooltipTrigger>
                <TooltipContent side="right" className="lg:hidden">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <div className="px-3 lg:px-5 pb-6 space-y-3">
          <div className="hidden lg:inline-flex items-center gap-1.5 bg-primary/15 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
            <Castle className="w-3 h-3" />
            Magic Pass Plan
          </div>
          <div className="hidden lg:block">
            <Link to="/pricing" className="block text-xs font-medium text-secondary hover:underline mb-1">Upgrade Plan</Link>
            <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <LogOut className="w-3 h-3" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="md:ml-16 lg:ml-60 flex-1 min-h-screen pb-20 md:pb-0 w-full max-w-full overflow-x-hidden" style={{ background: "#080E1E" }}>
        {/* Top bar */}
        <div className="px-4 md:px-8 pt-4 md:pt-8 pb-4 md:pb-6 flex items-start justify-between">
          <div className="flex items-center gap-3 md:block">
            {/* Mobile logo */}
            <Link to="/" className="md:hidden flex items-center gap-1.5">
              <Castle className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-primary">Magic Pass</span>
            </Link>
            <h1 className="hidden md:block text-xl lg:text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && <p className="hidden md:block text-muted-foreground text-sm mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <button className="relative">
              <Bell className="w-5 h-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive" />
            </button>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500/15 text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-pulse" />
              7-day free trial active
            </span>
          </div>
        </div>
        {/* Mobile title below top bar */}
        <div className="md:hidden px-4 pb-3 border-b border-primary/10">
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-xs mt-0.5">{subtitle}</p>}
        </div>
        <div className="px-4 md:px-8 py-4 md:pb-8 md:pt-2">
          {children}
        </div>
      </main>

      {/* Bottom Nav — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-center justify-around h-16 border-t" style={{ background: "#0D1230", borderColor: "rgba(245,200,66,0.15)" }}>
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.label} to={item.path} className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
        <button onClick={() => setMoreOpen(true)} className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold ${moreOpen ? "text-primary" : "text-muted-foreground"}`}>
          <Menu className="w-5 h-5" />
          More
        </button>
      </nav>

      {/* More drawer — mobile */}
      {moreOpen && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMoreOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[61] md:hidden rounded-t-2xl" style={{ background: "#111827", height: "70vh" }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-primary/10">
              <span className="text-sm font-bold text-foreground">More</span>
              <button onClick={() => setMoreOpen(false)} className="text-primary text-xs font-semibold flex items-center gap-1">
                <X className="w-4 h-4" /> Close
              </button>
            </div>
            <div className="px-3 py-3 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(70vh - 56px)" }}>
              {moreDrawerItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setMoreOpen(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardLayout;
