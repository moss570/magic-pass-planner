import { Users } from "lucide-react";
import UserManagerComponent from "@/components/admin/UserManager";
import AdminLayout from "@/components/admin/AdminLayout";

export default function UserManagerPage() {
  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Users className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">User Management</h1>
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-primary/20 text-primary">Admin</span>
          </div>
          <p className="text-muted-foreground text-sm">Search, manage tiers, and review user accounts</p>
        </div>
        <UserManagerComponent />
      </div>
    </AdminLayout>
  );
}
