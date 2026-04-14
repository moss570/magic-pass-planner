import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Hotel, Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net"];
const CATEGORIES = ["Budget-Friendly", "Family Suites", "Close to Parks"];

interface CuratedHotel {
  id: string;
  name: string;
  price_range: string;
  distance_miles: number;
  amenities: string[];
  best_for: string;
  category: string;
  default_target_price: number;
  booking_search_url: string;
  is_active: boolean;
}

export default function CuratedHotels() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hotels, setHotels] = useState<CuratedHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CuratedHotel>>({
    name: "", price_range: "", distance_miles: 0, amenities: [], best_for: "",
    category: "Budget-Friendly", default_target_price: 100, booking_search_url: "", is_active: true,
  });

  useEffect(() => {
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) { navigate("/dashboard"); return; }
    loadHotels();
  }, [user]);

  const loadHotels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("curated_hotels").select("*").order("category").order("name");
      if (error) throw error;
      setHotels(data || []);
    } catch (err) { console.error(err); toast({ title: "Failed to load hotels", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const saveHotel = async () => {
    if (!formData.name || !formData.booking_search_url) { toast({ title: "Name and URL required", variant: "destructive" }); return; }

    try {
      if (editingId) {
        const { error } = await supabase.from("curated_hotels").update(formData).eq("id", editingId);
        if (error) throw error;
        toast({ title: "✅ Hotel updated" });
      } else {
        const { error } = await supabase.from("curated_hotels").insert([formData]);
        if (error) throw error;
        toast({ title: "✅ Hotel added" });
      }
      setShowForm(false); setEditingId(null); setFormData({ name: "", price_range: "", distance_miles: 0, amenities: [], best_for: "", category: "Budget-Friendly", default_target_price: 100, booking_search_url: "", is_active: true }); loadHotels();
    } catch (err) { toast({ title: "Save failed", variant: "destructive" }); }
  };

  const deleteHotel = async (id: string) => {
    if (!confirm("Delete this hotel?")) return;
    try {
      const { error } = await supabase.from("curated_hotels").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "✅ Hotel deleted" });
      loadHotels();
    } catch (err) { toast({ title: "Delete failed", variant: "destructive" }); }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await supabase.from("curated_hotels").update({ is_active: !active }).eq("id", id);
      setHotels(prev => prev.map(h => h.id === id ? { ...h, is_active: !active } : h));
      toast({ title: !active ? "✅ Activated" : "✅ Deactivated" });
    } catch (err) { toast({ title: "Toggle failed", variant: "destructive" }); }
  };

  const startEdit = (hotel: CuratedHotel) => {
    setEditingId(hotel.id);
    setFormData({ ...hotel });
    setShowForm(true);
  };

  if (!user || !ADMIN_EMAILS.includes(user.email || "")) return null;

  return (
    <div className="min-h-screen" style={{ background: "#080E1E" }}>
      <div className="px-4 md:px-8 pt-6 pb-4 border-b" style={{ borderColor: "rgba(245,200,66,0.15)", background: "#0D1230" }}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Hotel className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Curated Hotels</h1>
          </div>
          <div className="flex gap-2">
            <a href="/admin/command-center" className="text-xs text-primary hover:underline">← Command Center</a>
            <Button size="sm" onClick={() => { setEditingId(null); setFormData({ name: "", price_range: "", distance_miles: 0, amenities: [], best_for: "", category: "Budget-Friendly", default_target_price: 100, booking_search_url: "", is_active: true }); setShowForm(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Hotel
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        {showForm && (
          <div className="rounded-xl border border-white/10 bg-card p-6 mb-6">
            <h2 className="text-lg font-bold text-foreground mb-4">{editingId ? "Edit Hotel" : "Add Hotel"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Hotel name" value={formData.name || ""} onChange={e => setFormData({ ...formData, name: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
              <input placeholder="Price range (e.g., $80-110)" value={formData.price_range || ""} onChange={e => setFormData({ ...formData, price_range: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
              <input placeholder="Distance (miles)" type="number" value={formData.distance_miles || 0} onChange={e => setFormData({ ...formData, distance_miles: Number(e.target.value) })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
              <select value={formData.category || "Budget-Friendly"} onChange={e => setFormData({ ...formData, category: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input placeholder="Target price ($)" type="number" value={formData.default_target_price || 0} onChange={e => setFormData({ ...formData, default_target_price: Number(e.target.value) })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
              <input placeholder="Best for (e.g., Families on budget)" value={formData.best_for || ""} onChange={e => setFormData({ ...formData, best_for: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
              <input placeholder="Booking URL" value={formData.booking_search_url || ""} onChange={e => setFormData({ ...formData, booking_search_url: e.target.value })} className="col-span-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
              <input placeholder="Amenities (comma-separated)" value={(formData.amenities || []).join(", ")} onChange={e => setFormData({ ...formData, amenities: e.target.value.split(",").map(a => a.trim()) })} className="col-span-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={saveHotel} className="bg-primary text-primary-foreground">Save Hotel</Button>
              <Button onClick={() => setShowForm(false)} variant="ghost">Cancel</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "var(--card)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-primary">Hotel</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-primary">Category</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-primary">Distance</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-primary">Target Price</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-primary">Active</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map(h => (
                  <tr key={h.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3"><div><p className="font-medium text-foreground">{h.name}</p><p className="text-xs text-muted-foreground">{h.best_for}</p></div></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{h.category}</td>
                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">{h.distance_miles}mi</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-primary">${h.default_target_price}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(h.id, h.is_active)}>
                        {h.is_active
                          ? <ToggleRight className="w-5 h-5 text-green-400 mx-auto" />
                          : <ToggleLeft className="w-5 h-5 text-muted-foreground mx-auto" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(h)}><Edit2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteHotel(h.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
