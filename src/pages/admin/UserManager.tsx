import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import UserManagerComponent from "@/components/admin/UserManager";

const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net"];

export default function UserManagerPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !ADMIN_EMAILS.includes(user.email || ""))) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading || !user || !ADMIN_EMAILS.includes(user.email || "")) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--background)" }}>
      <div className="px-4 md:px-8 pt-8 pb-6 border-b" style={{ borderColor: "rgba(245,200,66,0.15)" }}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Users className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">User Management</h1>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-primary/20 text-primary">Admin</span>
            </div>
            <p className="text-muted-foreground text-sm">Search, manage tiers, and review user accounts</p>
          </div>
          <a href="/admin" className="text-xs text-primary hover:underline">← Admin Dashboard</a>
        </div>
      </div>
      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
        <UserManagerComponent />
      </div>
    </div>
  );
}
