import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import {
  BarChart3, Users, UserPlus, Gift, FileText, ShoppingBag, Hotel, HelpCircle, Smartphone, Laugh,
  Gamepad2, Image, Calendar, Mail, MessageSquare, Bug, Send, Activity, Shield, Network, Globe,
  StickyNote, Wrench,
} from "lucide-react";

const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net"];

interface NavItem {
  title: string;
  url: string;
  icon: any;
}

const NAV_GROUPS: { label: string; emoji: string; items: NavItem[] }[] = [
  {
    label: "Overview", emoji: "📊",
    items: [
      { title: "Dashboard", url: "/admin", icon: BarChart3 },
    ],
  },
  {
    label: "Users & Leads", emoji: "👥",
    items: [
      { title: "User Management", url: "/admin/users", icon: Users },
      { title: "Early Access Leads", url: "/admin/early-access", icon: UserPlus },
      { title: "VIP Invites", url: "/admin/vip", icon: Gift },
    ],
  },
  {
    label: "Content", emoji: "📝",
    items: [
      { title: "Blog Editor", url: "/admin/blog", icon: FileText },
      { title: "Park Content CMS", url: "/admin/park-content", icon: ShoppingBag },
      { title: "Curated Hotels", url: "/admin/curated-hotels", icon: Hotel },
      { title: "Trivia Questions", url: "/admin/trivia", icon: HelpCircle },
      { title: "Line Mind Words", url: "/admin/linemind", icon: Smartphone },
      { title: "Haaaa!! Prompts", url: "/admin/haaaa", icon: Laugh },
    ],
  },
  {
    label: "Games & Media", emoji: "🎮",
    items: [
      { title: "Game Analytics", url: "/admin/game-analytics", icon: Gamepad2 },
      { title: "Photo Review", url: "/admin/photo-review", icon: Image },
      { title: "Beacon Events", url: "/admin/beacon-events", icon: Calendar },
    ],
  },
  {
    label: "Communications", emoji: "📬",
    items: [
      { title: "Support Inbox", url: "/admin/support", icon: Mail },
      { title: "User Messages", url: "/admin/messages", icon: MessageSquare },
      { title: "Beta Feedback", url: "/admin/feedback", icon: Bug },
      { title: "Email Templates", url: "/admin/email-templates", icon: Send },
    ],
  },
  {
    label: "System", emoji: "⚙️",
    items: [
      { title: "System Health", url: "/admin/system-health", icon: Activity },
      { title: "Tier Access", url: "/admin/tier-access", icon: Shield },
      { title: "Affiliate Networks", url: "/admin/affiliates", icon: Network },
      { title: "News Sources", url: "/admin/news-sources", icon: Globe },
      { title: "Services & Notes", url: "/admin/system", icon: Wrench },
    ],
  },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarContent className="bg-card">
        <div className={`px-4 py-4 border-b border-border/50 ${collapsed ? "px-2" : ""}`}>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary shrink-0" />
            {!collapsed && (
              <div>
                <p className="text-sm font-bold text-foreground">Admin Console</p>
                <p className="text-[10px] text-muted-foreground">Magic Pass Plus</p>
              </div>
            )}
          </div>
        </div>

        {NAV_GROUPS.map((group) => {
          const hasActiveRoute = group.items.some(
            (item) => location.pathname === item.url
          );
          return (
            <SidebarGroup key={group.label} defaultOpen={hasActiveRoute || group.label === "Overview"}>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {collapsed ? group.emoji : `${group.emoji} ${group.label}`}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/admin"}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          activeClassName="bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                        >
                          <item.icon className="w-4 h-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (!ADMIN_EMAILS.includes(user.email || "")) {
        navigate("/dashboard");
      }
    }
  }, [user, loading, navigate]);

  if (loading || !user || !ADMIN_EMAILS.includes(user.email || "")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border/50 px-4 bg-card/50 shrink-0">
            <SidebarTrigger className="mr-3" />
            <span className="text-xs text-muted-foreground">Admin Console</span>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
