import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ShoppingBag, IceCream, Camera, Sparkles, Plus, Search, Trash2, Edit2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isFeatureEnabled } from "@/lib/featureFlags";
import MerchFormModal from "@/components/admin/MerchFormModal";
import SnackFormModal from "@/components/admin/SnackFormModal";
import PhotoPassFormModal from "@/components/admin/PhotoPassFormModal";
import SpecialEventFormModal from "@/components/admin/SpecialEventFormModal";

const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net"];
const PARKS = ["magic-kingdom", "epcot", "hollywood-studios", "animal-kingdom", "typhoon-lagoon", "blizzard-beach"];
const PARK_LABELS: Record<string, string> = {
  "magic-kingdom": "Magic Kingdom", epcot: "EPCOT", "hollywood-studios": "Hollywood Studios",
  "animal-kingdom": "Animal Kingdom", "typhoon-lagoon": "Typhoon Lagoon", "blizzard-beach": "Blizzard Beach",
};

export default function ParkContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState("merchandise");
  const [parkFilter, setParkFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Data states
  const [merch, setMerch] = useState<any[]>([]);
  const [snacks, setSnacks] = useState<any[]>([]);
  const [photopass, setPhotopass] = useState<any[]>([]);
  const [specialEvents, setSpecialEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [merchModal, setMerchModal] = useState<any>(null);
  const [snackModal, setSnackModal] = useState<any>(null);
  const [photoModal, setPhotoModal] = useState<any>(null);
  const [eventModal, setEventModal] = useState<any>(null);
  const [showMerchModal, setShowMerchModal] = useState(false);
  const [showSnackModal, setShowSnackModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) { navigate("/dashboard"); return; }
    if (!isFeatureEnabled("parkContentCms")) { navigate("/admin"); return; }
    loadData(tab);
  }, [user, tab]);

  const loadData = async (t: string) => {
    setLoading(true);
    try {
      if (t === "merchandise") {
        const { data } = await supabase.from("merchandise").select("*").order("created_at", { ascending: false });
        setMerch(data || []);
      } else if (t === "snacks") {
        const { data } = await supabase.from("snacks").select("*").order("created_at", { ascending: false });
        setSnacks(data || []);
      } else if (t === "photopass") {
        const { data } = await supabase.from("photopass_locations").select("*").order("created_at", { ascending: false });
        setPhotopass(data || []);
      } else if (t === "special_events") {
        const { data } = await supabase.from("special_events").select("*").order("created_at", { ascending: false });
        setSpecialEvents(data || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const deleteItem = async (table: string, id: string) => {
    if (!confirm("Delete this item?")) return;
    await (supabase.from(table as any).delete() as any).eq("id", id);
    toast({ title: "Item deleted" });
    loadData(tab);
  };

  const isExpired = (item: any) => {
    if (!item.valid_to) return false;
    return new Date(item.valid_to) < new Date();
  };

  const filterByPark = (items: any[]) => items.filter(i => {
    if (parkFilter !== "all" && i.park_id !== parkFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (i.name || "").toLowerCase().includes(term) || (i.land || "").toLowerCase().includes(term) || (i.location || "").toLowerCase().includes(term);
    }
    return true;
  });

  if (!user || !ADMIN_EMAILS.includes(user.email || "")) return null;

  const renderFilters = () => (
    <div className="flex flex-wrap gap-2 items-center mb-4">
      <button onClick={() => setParkFilter("all")}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${parkFilter === "all" ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:text-foreground"}`}>All</button>
      {PARKS.map(p => (
        <button key={p} onClick={() => setParkFilter(p)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${parkFilter === p ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:text-foreground"}`}>
          {PARK_LABELS[p]}
        </button>
      ))}
      <div className="ml-auto relative">
        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
        <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-8 w-48 text-xs" />
      </div>
    </div>
  );

  const renderTable = (items: any[], tableName: string, onEdit: (item: any) => void, showValidTo = false) => (
    <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "var(--card)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8">
            <th className="text-left px-4 py-3 text-xs font-semibold text-primary">Image</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-primary">Name</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-primary">Land</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-primary">Location</th>
            {showValidTo && <th className="text-left px-4 py-3 text-xs font-semibold text-primary">Valid Through</th>}
            <th className="text-center px-4 py-3 text-xs font-semibold text-primary">Status</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-primary">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                {item.image_url ? <img src={item.image_url} className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-white/5" />}
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{PARK_LABELS[item.park_id] || item.park_id}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{item.land}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{item.location || "—"}</td>
              {showValidTo && <td className="px-4 py-3 text-muted-foreground text-xs">{item.valid_to || "—"}</td>}
              <td className="px-4 py-3 text-center">
                {isExpired(item) ? <Badge variant="destructive" className="text-xs">Expired</Badge> :
                  item.is_limited ? <Badge className="bg-amber-500/20 text-amber-400 text-xs">Limited</Badge> :
                    <Badge className="bg-green-500/20 text-green-400 text-xs">Active</Badge>}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(item)}><Edit2 className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteItem(tableName, item.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={showValidTo ? 7 : 6} className="text-center py-8 text-muted-foreground">No items found</td></tr>}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#080E1E" }}>
      <div className="px-4 md:px-8 pt-6 pb-4 border-b" style={{ borderColor: "rgba(245,200,66,0.15)", background: "#0D1230" }}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Park Content CMS</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Manage merchandise, snacks, PhotoPass, special events</p>
          </div>
          <a href="/admin/command-center" className="text-xs text-primary hover:underline">← Command Center</a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-5">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-white/5">
              <TabsTrigger value="merchandise" className="text-xs"><ShoppingBag className="w-3.5 h-3.5 mr-1" />Merchandise</TabsTrigger>
              <TabsTrigger value="snacks" className="text-xs"><IceCream className="w-3.5 h-3.5 mr-1" />Snacks</TabsTrigger>
              <TabsTrigger value="photopass" className="text-xs"><Camera className="w-3.5 h-3.5 mr-1" />PhotoPass</TabsTrigger>
              <TabsTrigger value="special_events" className="text-xs"><Sparkles className="w-3.5 h-3.5 mr-1" />Special Events</TabsTrigger>
            </TabsList>
            <Button size="sm" onClick={() => {
              if (tab === "merchandise") { setMerchModal(null); setShowMerchModal(true); }
              else if (tab === "snacks") { setSnackModal(null); setShowSnackModal(true); }
              else if (tab === "photopass") { setPhotoModal(null); setShowPhotoModal(true); }
              else if (tab === "special_events") { setEventModal(null); setShowEventModal(true); }
            }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          </div>

          {renderFilters()}

          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              <TabsContent value="merchandise">
                {renderTable(filterByPark(merch), "merchandise", i => { setMerchModal(i); setShowMerchModal(true); }, true)}
              </TabsContent>
              <TabsContent value="snacks">
                {renderTable(filterByPark(snacks), "snacks", i => { setSnackModal(i); setShowSnackModal(true); })}
              </TabsContent>
              <TabsContent value="photopass">
                {renderTable(filterByPark(photopass), "photopass_locations", i => { setPhotoModal(i); setShowPhotoModal(true); })}
              </TabsContent>
              <TabsContent value="special_events">
                {renderTable(filterByPark(specialEvents), "special_events", i => { setEventModal(i); setShowEventModal(true); })}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {showMerchModal && <MerchFormModal item={merchModal} onClose={() => setShowMerchModal(false)} onSaved={() => { setShowMerchModal(false); loadData("merchandise"); }} />}
      {showSnackModal && <SnackFormModal item={snackModal} onClose={() => setShowSnackModal(false)} onSaved={() => { setShowSnackModal(false); loadData("snacks"); }} />}
      {showPhotoModal && <PhotoPassFormModal item={photoModal} onClose={() => setShowPhotoModal(false)} onSaved={() => { setShowPhotoModal(false); loadData("photopass"); }} />}
      {showEventModal && <SpecialEventFormModal item={eventModal} onClose={() => setShowEventModal(false)} onSaved={() => { setShowEventModal(false); loadData("special_events"); }} />}
    </div>
  );
}
