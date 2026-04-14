import { useState, useEffect } from "react";
import { Image, Check, X, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

export default function PhotoReview() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<any[]>([]);
  const [approvedPhotos, setApprovedPhotos] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    const [pending, approved] = await Promise.all([
      supabase.from("game_content").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("game_content").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(20),
    ]);
    setPendingPhotos(pending.data || []);
    setApprovedPhotos(approved.data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const reviewPhoto = async (id: string, status: "approved" | "rejected") => {
    await supabase.from("game_content").update({ status }).eq("id", id);
    toast({ title: status === "approved" ? "✅ Photo approved!" : "❌ Photo rejected" });
    loadData();
  };

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Image className="w-5 h-5 text-primary" /> Photo Review</h1>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">⏳ Pending Review ({pendingPhotos.length})</p>
          {pendingPhotos.length === 0 ? (
            <div className="text-center py-8 rounded-xl border border-border/50 bg-card"><p className="text-xs text-muted-foreground">No photos pending review</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingPhotos.map(photo => (
                <div key={photo.id} className="rounded-xl overflow-hidden border border-yellow-500/30 bg-card">
                  {photo.image_url && <img src={photo.image_url} className="w-full object-cover" style={{ maxHeight: 200 }} alt={photo.title} onError={e => (e.currentTarget.style.display='none')} />}
                  <div className="p-4">
                    <p className="text-sm font-bold text-foreground">{photo.title}</p>
                    <p className="text-xs text-muted-foreground mb-1">{photo.game_type === "where_am_i" ? "📸 Where Am I?" : "🔍 Scavenger Hunt"} · {photo.park}</p>
                    {photo.clue_description && <p className="text-xs text-muted-foreground italic mb-1">"{photo.clue_description}"</p>}
                    {photo.multiple_choice && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {photo.multiple_choice.map((opt: string, i: number) => (
                          <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${i === photo.correct_answer ? "bg-green-500/20 text-green-400 font-semibold" : "bg-muted/50 text-muted-foreground"}`}>
                            {i === photo.correct_answer ? "✓ " : ""}{opt}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => reviewPhoto(photo.id, "approved")} className="flex-1 py-2 rounded-lg font-bold text-sm bg-green-600 text-white flex items-center justify-center gap-1">
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => reviewPhoto(photo.id, "rejected")} className="flex-1 py-2 rounded-lg font-bold text-sm border border-red-500/30 text-red-400 flex items-center justify-center gap-1 hover:bg-red-500/10">
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3">✅ Live in Games ({approvedPhotos.length})</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {approvedPhotos.map(photo => (
              <div key={photo.id} className="rounded-xl overflow-hidden border border-border/50 bg-card">
                {photo.image_url && <img src={photo.image_url} className="w-full object-cover" style={{ aspectRatio: "1", objectFit: "cover" }} alt={photo.title} onError={e => (e.currentTarget.style.display='none')} />}
                <div className="p-2">
                  <p className="text-xs font-medium text-foreground truncate">{photo.title}</p>
                  <p className="text-xs text-muted-foreground">{photo.park}</p>
                  <button onClick={() => reviewPhoto(photo.id, "rejected")} className="text-xs text-red-400 hover:underline mt-1">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
