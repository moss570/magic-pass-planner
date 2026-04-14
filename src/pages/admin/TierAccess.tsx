import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield } from "lucide-react";
import TierAccessManager from "@/components/admin/TierAccessManager";
import AdminLayout from "@/components/admin/AdminLayout";

export default function TierAccess() {
  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Tier Access Manager</h1>
        </div>
        <TierAccessManager />
      </div>
    </AdminLayout>
  );
}
