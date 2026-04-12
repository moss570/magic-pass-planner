import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Trash2, Pencil, Eye, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MyTrips = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryTrip, setSummaryTrip] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("saved_trips")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTrips(data || []);
        setLoading(false);
      });
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_trips").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete trip");
    } else {
      setTrips((prev) => prev.filter((t) => t.id !== id));
      toast.success("Trip deleted");
    }
  };

  const isPast = (endDate: string | null) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start) return "";
    const s = new Date(start);
    const e = end ? new Date(end) : null;
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    if (e) return `${s.toLocaleDateString("en-US", opts)}–${e.toLocaleDateString("en-US", opts)}`;
    return s.toLocaleDateString("en-US", opts);
  };

  const partySize = (t: any) => (t.adults || 0) + (t.children || 0);

  const upcoming = trips.filter((t) => !isPast(t.end_date));
  const past = trips.filter((t) => isPast(t.end_date));

  return (
    <DashboardLayout title="🎒 My Trips" subtitle="View, manage, and compare your saved trip plans">
      {/* Create New Trip */}
      <div className="mb-6">
        <Button onClick={() => navigate("/trip-planner")} className="text-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Create New Trip
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading trips…
        </div>
      ) : trips.length === 0 ? (
        <Card className="border-primary/20 bg-card/80">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground text-sm mb-4">No saved trips yet. Start planning your magical adventure!</p>
            <Button onClick={() => navigate("/trip-planner")}>
              <Plus className="w-4 h-4 mr-1.5" /> Plan Your First Trip
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Upcoming Trips */}
          {upcoming.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">🏰 Upcoming Trips</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.map((trip) => (
                  <TripCard key={trip.id} trip={trip} past={false} onDelete={handleDelete} onView={setSummaryTrip} navigate={navigate} />
                ))}
              </div>
            </div>
          )}

          {/* Past Trips */}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">🌍 Past Trips</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {past.map((trip) => (
                  <TripCard key={trip.id} trip={trip} past={true} onDelete={handleDelete} onView={setSummaryTrip} navigate={navigate} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Summary Dialog */}
      <Dialog open={!!summaryTrip} onOpenChange={(open) => !open && setSummaryTrip(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">📋 {summaryTrip?.name}</DialogTitle>
          </DialogHeader>
          {summaryTrip && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Parks:</span> <span className="text-foreground">{summaryTrip.parks?.join(", ") || "—"}</span></div>
                <div><span className="text-muted-foreground">Dates:</span> <span className="text-foreground">{formatDateRange(summaryTrip.start_date, summaryTrip.end_date) || "—"}</span></div>
                <div><span className="text-muted-foreground">Adults:</span> <span className="text-foreground">{summaryTrip.adults ?? 0}</span></div>
                <div><span className="text-muted-foreground">Children:</span> <span className="text-foreground">{summaryTrip.children ?? 0}</span></div>
                <div><span className="text-muted-foreground">Budget:</span> <span className="text-foreground">${summaryTrip.budget?.toLocaleString() ?? "—"}</span></div>
                <div><span className="text-muted-foreground">Est. Total:</span> <span className="text-foreground">${summaryTrip.estimated_total?.toLocaleString() ?? "—"}</span></div>
                <div><span className="text-muted-foreground">LL Option:</span> <span className="text-foreground">{summaryTrip.ll_option || "—"}</span></div>
                <div><span className="text-muted-foreground">Ride Pref:</span> <span className="text-foreground">{summaryTrip.ride_preference || "—"}</span></div>
              </div>
              {summaryTrip.special_notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                  <p className="text-xs text-foreground bg-muted/50 rounded-lg p-2">{summaryTrip.special_notes}</p>
                </div>
              )}
              {summaryTrip.itinerary && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Itinerary:</p>
                  <pre className="text-[10px] text-foreground bg-muted/50 rounded-lg p-2 overflow-x-auto max-h-60 whitespace-pre-wrap">
                    {typeof summaryTrip.itinerary === "string" ? summaryTrip.itinerary : JSON.stringify(summaryTrip.itinerary, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

function TripCard({ trip, past, onDelete, onView, navigate }: {
  trip: any;
  past: boolean;
  onDelete: (id: string) => void;
  onView: (trip: any) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start) return "";
    const s = new Date(start);
    const e = end ? new Date(end) : null;
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    if (e) return `${s.toLocaleDateString("en-US", opts)}–${e.toLocaleDateString("en-US", opts)}`;
    return s.toLocaleDateString("en-US", opts);
  };
  const partySize = (trip.adults || 0) + (trip.children || 0);

  return (
    <div className={`rounded-xl border p-4 space-y-2 ${past ? "border-primary/10 bg-muted/30 opacity-80" : "border-primary/25 bg-card/80"}`}>
      <p className="text-sm font-bold text-foreground">
        {past ? "🌍" : "🏰"} {trip.name}
      </p>
      <p className="text-xs text-muted-foreground">
        {trip.parks?.join(", ") || "No parks"} · {formatDateRange(trip.start_date, trip.end_date)}
        {partySize > 0 ? ` · Party of ${partySize}` : ""}
      </p>
      {trip.ll_option && (
        <span className="text-[10px] bg-primary/15 text-primary font-semibold px-2 py-0.5 rounded-full">
          {trip.ll_option === "multi" ? "LL Multi Pass" : trip.ll_option === "individual" ? "Individual LL" : trip.ll_option}
        </span>
      )}
      {past && <span className="text-[10px] text-green-400 font-semibold block">Completed ✅</span>}
      <div className="flex gap-2 pt-1">
        {past ? (
          <Button variant="outline" size="sm" className="border-muted text-muted-foreground hover:text-foreground text-xs" onClick={() => onView(trip)}>
            <Eye className="w-3 h-3 mr-1" /> View Summary
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 text-xs" onClick={() => navigate("/trip-planner", { state: { tripId: trip.id } })}>
              <Pencil className="w-3 h-3 mr-1" /> Edit
            </Button>
            <Button size="sm" className="text-xs" onClick={() => onView(trip)}>
              <Eye className="w-3 h-3 mr-1" /> View Summary
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs" onClick={() => onDelete(trip.id)}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default MyTrips;
