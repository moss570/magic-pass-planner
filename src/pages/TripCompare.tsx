import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import TripVersionCompare from "@/components/trip-planner/TripVersionCompare";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import type { TripVersion } from "@/components/trip-planner/VersionSwitcher";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbmVsaHJtZ3NwdXp0ZWhldHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzcyNzgsImV4cCI6MjA5MDgxMzI3OH0.vjT4Iun32HsCfoO7nVnfzLBnJy-Lye6N9ZryBbWuAjo";

export default function TripCompare() {
  const { tripId } = useParams();
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [versions, setVersions] = useState<TripVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
    "x-client-authorization": `Bearer ${session?.access_token}`,
    "apikey": SUPABASE_ANON,
  });

  useEffect(() => {
    if (!session || !tripId) return;
    (async () => {
      try {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/trips?action=list-versions&trip_id=${tripId}`, { headers: getHeaders() });
        const data = await resp.json();
        setVersions(data.versions || []);
      } catch { toast({ title: "Failed to load versions", variant: "destructive" }); }
      finally { setLoading(false); }
    })();
  }, [session, tripId]);

  const handleChoose = async (versionId: string) => {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/trips?action=update-version`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ id: versionId, is_active: true }),
      });
      setVersions(prev => prev.map(v => ({ ...v, is_active: v.id === versionId })));
      toast({ title: "✅ Version set as active!" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  return (
    <DashboardLayout title="📊 Compare Versions" subtitle="Side-by-side itinerary comparison">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/trip-planner")} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Trip Planner
        </Button>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : versions.length < 2 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">You need at least 2 versions to compare.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/trip-planner")}>
              Go to Trip Planner
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
