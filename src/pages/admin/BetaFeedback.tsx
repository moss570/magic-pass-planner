import AdminLayout from "@/components/admin/AdminLayout";
import BetaFeedbackPanel from "@/components/admin/BetaFeedbackPanel";

export default function BetaFeedback() {
  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold text-foreground mb-4">Beta Feedback</h1>
        <BetaFeedbackPanel />
      </div>
    </AdminLayout>
  );
}
