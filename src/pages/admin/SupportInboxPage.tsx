import AdminLayout from "@/components/admin/AdminLayout";
import SupportInbox from "@/components/admin/SupportInbox";

export default function SupportInboxPage() {
  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold text-foreground mb-4">Support Inbox</h1>
        <SupportInbox />
      </div>
    </AdminLayout>
  );
}
