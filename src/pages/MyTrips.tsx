import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Trash2, Pencil, Eye, Plus, GitCompare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Itinerary Summary Component ──
function ItinerarySummary({ itinerary }: { itinerary: any }) {
  try {
    const days = Array.isArray(itinerary) ? itinerary : [];
    if (days.length === 0) return <p className="text-xs text-muted-foreground italic">Itinerary saved ✅</p>;

    // Validate structure
    if (!days[0]?.date && !days[0]?.park) {
      return <p className="text-xs text-muted-foreground italic">Itinerary saved ✅</p>;
    }

    return (
      <div className="space-y-3">
        {days.map((day: any, i: number) => (
          <div key={i}>
            <p className="text-xs font-bold text-foreground mb-1">
              {day.parkEmoji || "📍"} {day.date ? new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : `Day ${i + 1}`} — {day.park || "Park"}
            </p>
            {day.highlights?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {day.highlights.slice(0, 4).map((h: string, j: number) => (
                  <span key={j} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">✨ {h}</span>
                ))}
              </div>
            )}
            {Array.isArray(day.items) && day.items.length > 0 ? (
              <div className="space-y-0.5 ml-1">
                {day.items.slice(0, 10).map((item: any, j: number) => (
                  <div key={j} className="flex gap-2 text-xs">
                    <span className="w-14 shrink-0 text-muted-foreground">{item.time || ""}</span>
                    <span className="text-foreground flex-1">{item.activity || item.name || ""}</span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">{item.badge}</span>
                    )}
                  </div>
                ))}
                {day.items.length > 10 && (
                  <p className="text-[10px] text-muted-foreground ml-16">+{day.items.length - 10} more activities</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground ml-1">No activities listed</p>
            )}
          </div>
        ))}
      </div>
    );
  } catch {
    return <p className="text-xs text-muted-foreground italic">Itinerary saved ✅</p>;
  }
}

const MyTrips = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryTrip, setSummaryTrip] = useState<any | null>(null);
  const [versionCounts, setVersionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    supabase
      .from("saved_trips")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const tripsData = data || [];
        setTrips(tripsData);
        setLoading(false);

        // Fetch version counts
        if (tripsData.length > 0) {
          const tripIds = tripsData.map((t: any) => t.id);
          supabase
            .from("trip_versions")
            .select("trip_id")
            .in("trip_id", tripIds)
            .then(({ data: versions }) => {
              const counts: Record<string, number> = {};
              (versions || []).forEach((v: any) => {
                counts[v.trip_id] = (counts[v.trip_id] || 0) + 1;
              });
              setVersionCounts(counts);
            });
        }
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

  const upcoming = trips.filter((t) => !isPast(t.end_date));
  const past = trips.filter((t) => isPast(t.end_date));

  return (
    <DashboardLayout title="🎒 My Trips" subtitle="View, manage, and compare your saved trip plans">
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
          {upcoming.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">🏰 Upcoming Trips</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.map((trip) => (
                  <TripCard key={trip.id} trip={trip} past={false} onDelete={handleDelete} onView={setSummaryTrip} navigate={navigate} versionCount={versionCounts[trip.id] || 0} />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">🌍 Past Trips</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {past.map((trip) => (
                  <TripCard key={trip.id} trip={trip} past={true} onDelete={handleDelete} onView={setSummaryTrip} navigate={navigate} versionCount={versionCounts[trip.id] || 0} />
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
                  <div className="bg-muted/50 rounded-lg p-3">
                    <ItinerarySummary itinerary={summaryTrip.itinerary} />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

function TripCard({ trip, past, onDelete, onView, navigate, versionCount }: {
  trip: any;
  past: boolean;
  onDelete: (id: string) => void;
  onView: (trip: any) => void;
  navigate: ReturnType<typeof useNavigate>;
  versionCount: number;
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
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-foreground">
          {past ? "🌍" : "🏰"} {trip.name}
        </p>
        {versionCount >= 2 && (
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {versionCount} versions
          </Badge>
        )}
      </div>
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
      <div className="flex flex-wrap gap-2 pt-1">
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
        {versionCount >= 2 && (
          <Button variant="outline" size="sm" className="border-secondary/30 text-secondary-foreground hover:bg-secondary/10 text-xs" onClick={() => navigate("/trip-compare", { state: { tripId: trip.id } })}>
            <GitCompare className="w-3 h-3 mr-1" /> Compare
          </Button>
        )}
        <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs" onClick={() => onDelete(trip.id)}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default MyTrips;
