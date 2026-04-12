import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import TripVersionCompare from "@/components/trip-planner/TripVersionCompare";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { TripVersion } from "@/components/trip-planner/VersionSwitcher";

export default function TripCompare() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [versions, setVersions] = useState<TripVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !tripId) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("trip_versions")
          .select("*")
          .eq("trip_id", tripId)
          .eq("user_id", user.id)
          .order("version_number", { ascending: true });
        if (error) throw error;
        setVersions(data || []);
      } catch {
        toast({ title: "Failed to load versions", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [user, tripId]);

  const handleChoose = async (versionId: string) => {
    if (!user || !tripId) return;
    try {
      await supabase
        .from("trip_versions")
        .update({ is_active: false })
        .eq("trip_id", tripId)
        .eq("user_id", user.id);
      await supabase
        .from("trip_versions")
        .update({ is_active: true })
        .eq("id", versionId)
        .eq("user_id", user.id);
      setVersions(prev => prev.map(v => ({ ...v, is_active: v.id === versionId })));
      toast({ title: "✅ Version set as active!" });
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title="📊 Compare Versions" subtitle="Side-by-side itinerary comparison">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/my-trips")} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to My Trips
        </Button>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : versions.length < 2 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">You need at least 2 versions to compare.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/my-trips")}>
              Go to My Trips
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <TripVersionCompare versions={versions} onChoose={handleChoose} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
