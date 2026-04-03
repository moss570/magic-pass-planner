import { Castle, Home, Map, UtensilsCrossed, Gift, Zap, Ticket, Users, Wallet, Settings, Bell, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const sidebarNav = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Map, label: "Trip Planner", path: "/trip-planner" },
  { icon: UtensilsCrossed, label: "Dining Alerts", path: "#" },
  { icon: Gift, label: "Gift Card Tracker", path: "#" },
  { icon: Zap, label: "Live Park Mode", path: "#" },
  { icon: Ticket, label: "AP Command Center", path: "#" },
  { icon: Users, label: "Group Coordinator", path: "#" },
  { icon: Wallet, label: "Budget Manager", path: "#" },
  { icon: Settings, label: "Settings", path: "#" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-60 flex flex-col z-40" style={{ background: "#0D1230" }}>
        <div className="px-5 pt-6 pb-4">
          <Link to="/" className="flex items-center gap-2">
            <Castle className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold text-primary">Magic Pass</span>
          </Link>
        </div>

        <div className="px-5 pb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold">B</div>
          <div>
            <p className="text-xs text-muted-foreground">Welcome back,</p>
            <p className="text-sm font-semibold text-foreground">Brandon</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {sidebarNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary border-l-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-5 pb-6 space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-primary/15 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
            <Castle className="w-3 h-3" />
            Magic Pass Plan
          </div>
          <div>
            <Link to="/pricing" className="block text-xs font-medium text-secondary hover:underline mb-1">Upgrade Plan</Link>
            <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <LogOut className="w-3 h-3" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 min-h-screen" style={{ background: "#080E1E" }}>
        <div className="px-8 pt-8 pb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-4">
            <button className="relative">
              <Bell className="w-5 h-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive" />
            </button>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500/15 text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-pulse" />
              7-day free trial active
            </span>
          </div>
        </div>
        <div className="px-8 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
