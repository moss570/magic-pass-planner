import { useState, useEffect } from "react";
import { Calendar, Plus, Edit2, Trash2, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

export default function BeaconEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [beaconEvents, setBeaconEvents] = useState<any[]>([]);
  const [eventRsvps, setEventRsvps] = useState<Record<string, any[]>>({});
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({ title: "", emoji: "🎪", type: "experience", park: "Magic Kingdom", location: "", event_date: "", event_time: "", description: "", badge: "Event", badge_color: "bg-primary/20 text-primary" });

  const PARKS = ["Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom", "Magic Kingdom Resorts", "Disney Springs"];
  const BADGE_OPTIONS = [
    { badge: "Trading Event", color: "bg-purple-500/20 text-purple-400" },
    { badge: "Ride Marathon", color: "bg-red-500/20 text-red-400" },
    { badge: "Foodie Trail", color: "bg-yellow-500/20 text-yellow-400" },
    { badge: "Photo Walk", color: "bg-orange-500/20 text-orange-400" },
    { badge: "Meetup", color: "bg-blue-500/20 text-blue-400" },
    { badge: "Event", color: "bg-primary/20 text-primary" },
  ];

  const loadData = async () => {
    setLoading(true);
    const { data: events } = await (supabase.from("beacon_events" as any).select("*") as any).order("created_at", { ascending: false });
    setBeaconEvents(events || []);
    const rsvpMap: Record<string, any[]> = {};
    for (const evt of (events || [])) {
      const { data: rsvps } = await (supabase.from("beacon_rsvps" as any).select("*") as any).eq("event_id", evt.id);
      const enriched = await Promise.all((rsvps || []).map(async (r: any) => {
        const { data: profile } = await supabase.from("users_profile").select("first_name, last_name, email").eq("id", r.user_id).single();
        return { ...r, first_name: profile?.first_name, last_name: profile?.last_name, email: profile?.email };
      }));
      rsvpMap[evt.id] = enriched;
    }
    setEventRsvps(rsvpMap);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const saveEvent = async (isNew: boolean) => {
    const evt = isNew ? newEvent : editingEvent;
    if (!evt.title || !evt.park || !evt.location || !evt.event_date || !evt.event_time) {
      toast({ title: "Fill in all required fields", variant: "destructive" }); return;
    }
    if (isNew) {
      const { error } = await (supabase.from("beacon_events" as any).insert({ ...evt, created_by: user?.id }) as any);
      if (!error) { toast({ title: "✅ Event created!" }); setShowAddEvent(false); setNewEvent({ title: "", emoji: "🎪", type: "experience", park: "Magic Kingdom", location: "", event_date: "", event_time: "", description: "", badge: "Event", badge_color: "bg-primary/20 text-primary" }); loadData(); }
      else toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      const { error } = await (supabase.from("beacon_events" as any).update({ title: evt.title, emoji: evt.emoji, type: evt.type, park: evt.park, location: evt.location, event_date: evt.event_date, event_time: evt.event_time, description: evt.description, badge: evt.badge, badge_color: evt.badge_color, is_active: evt.is_active, updated_at: new Date().toISOString() }) as any).eq("id", evt.id);
      if (!error) { toast({ title: "✅ Event updated!" }); setEditingEvent(null); loadData(); }
      else toast({ title: "Failed", description: error.message, variant: "destructive" });
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event and all RSVPs?")) return;
    await (supabase.from("beacon_events" as any).delete() as any).eq("id", id);
    toast({ title: "Event deleted" }); loadData();
  };

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Beacon Events</h1>
          <div className="flex gap-2">
            <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={() => setShowAddEvent(!showAddEvent)} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg font-bold bg-primary text-primary-foreground">
              <Plus className="w-3.5 h-3.5" /> New Event
            </button>
          </div>
        </div>

        {(showAddEvent || editingEvent) && (() => {
          const evt = editingEvent || newEvent;
          const setEvt = (updates: any) => editingEvent ? setEditingEvent({ ...editingEvent, ...updates }) : setNewEvent({ ...newEvent, ...updates });
          return (
            <div className="rounded-xl p-5 border border-primary/20 bg-card">
              <p className="text-sm font-bold text-foreground mb-4">{editingEvent ? "✏️ Edit Event" : "🎪 Create New Event"}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input placeholder="Event title *" value={evt.title} onChange={e => setEvt({ title: e.target.value })} className="px-3 py-2.5 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30 focus:outline-none" />
                <input placeholder="Emoji (e.g. 🃏)" value={evt.emoji} onChange={e => setEvt({ emoji: e.target.value })} maxLength={4} className="px-3 py-2.5 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30 focus:outline-none" />
                <select value={evt.park} onChange={e => setEvt({ park: e.target.value })} className="px-3 py-2.5 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30">
                  {PARKS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input placeholder="Location *" value={evt.location} onChange={e => setEvt({ location: e.target.value })} className="px-3 py-2.5 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30 focus:outline-none" />
                <input type="date" value={evt.event_date} onChange={e => setEvt({ event_date: e.target.value })} min={new Date().toISOString().split("T")[0]} className="px-3 py-2.5 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30" style={{ colorScheme: "dark" }} />
                <input type="time" onChange={e => {
                  const [h, m] = e.target.value.split(":");
                  const hour = parseInt(h); const ampm = hour >= 12 ? "PM" : "AM";
                  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                  setEvt({ event_time: `${displayHour}:${m} ${ampm}` });
                }} className="px-3 py-2.5 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30" style={{ colorScheme: "dark" }} />
              </div>
              <textarea placeholder="Description..." value={evt.description} onChange={e => setEvt({ description: e.target.value })} rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30 focus:outline-none resize-none mb-3" />
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Badge Style</p>
                <div className="flex flex-wrap gap-2">
                  {BADGE_OPTIONS.map(b => (
                    <button key={b.badge} onClick={() => setEvt({ badge: b.badge, badge_color: b.color })}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold ${b.color} ${evt.badge === b.badge ? "ring-2 ring-primary" : ""}`}>{b.badge}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowAddEvent(false); setEditingEvent(null); }} className="flex-1 py-2 rounded-lg border border-border/50 text-sm text-muted-foreground">Cancel</button>
                <button onClick={() => saveEvent(!editingEvent)} className="flex-1 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground">{editingEvent ? "Save Changes" : "Create Event"}</button>
              </div>
            </div>
          );
        })()}

        <div className="space-y-3">
          {beaconEvents.map(evt => (
            <div key={evt.id} className="rounded-xl border border-border/50 p-4 bg-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{evt.emoji}</span>
                    <p className="text-sm font-bold text-foreground">{evt.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${evt.badge_color || "bg-primary/20 text-primary"}`}>{evt.badge || "Event"}</span>
                    {!evt.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Inactive</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{evt.park} · {evt.location} · {evt.event_date} · {evt.event_time}</p>
                  {evt.description && <p className="text-xs text-muted-foreground mt-1">{evt.description}</p>}
                  {(eventRsvps[evt.id] || []).length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-primary mb-1">RSVPs ({eventRsvps[evt.id].length})</p>
                      <div className="flex flex-wrap gap-1">
                        {eventRsvps[evt.id].map((r: any) => (
                          <span key={r.id} className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                            {r.first_name || r.email || "Unknown"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditingEvent({...evt})} className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteEvent(evt.id)} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
