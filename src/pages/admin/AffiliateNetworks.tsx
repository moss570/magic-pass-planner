import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Network, ToggleLeft, ToggleRight, Search, Plus, Trash2, TestTube, Edit2, ExternalLink, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { isFeatureEnabled } from "@/lib/featureFlags";
import AffiliateNetworkDrawer from "@/components/admin/AffiliateNetworkDrawer";
import AdminLayout from "@/components/admin/AdminLayout";

const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net"];
const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const CATEGORIES = ["all", "flights", "hotels", "tickets", "rental_cars", "activities", "insurance"];

export default function AffiliateNetworks() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [networks, setNetworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<any>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) { navigate("/dashboard"); return; }
    if (!isFeatureEnabled("affiliateNetworks")) { navigate("/admin"); return; }
    loadNetworks();
  }, [user]);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
    "x-client-authorization": `Bearer ${session?.access_token}`,
    "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  });

  const loadNetworks = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/affiliate-networks-crud?action=list`, { headers: getHeaders() });
      const data = await resp.json();
      setNetworks(data.networks || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const toggleNetwork = async (id: string, enabled: boolean) => {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/affiliate-networks-crud?action=toggle`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ id, is_enabled: enabled }),
      });
      setNetworks(prev => prev.map(n => n.id === id ? { ...n, is_enabled: enabled } : n));
      toast({ title: enabled ? "✅ Network enabled" : "Network disabled" });
    } catch { toast({ title: "Toggle failed", variant: "destructive" }); }
  };

  const testConnection = async (id: string) => {
    setTestingId(id);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/affiliate-test-connection`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ networkId: id }),
      });
      
      // ✅ Handle both success and error response codes
      if (!resp.ok) {
        toast({ title: `⚠️ HTTP ${resp.status} — Check network auth`, variant: "destructive" });
        setTestingId(null);
        return;
      }
      
      const data = await resp.json();
      
      setNetworks(prev => prev.map(n => n.id === id ? {
        ...n, last_test_status: data.status, last_test_at: new Date().toISOString(),
        last_test_error: data.error || null,
      } : n));
      
      // ✅ Enhanced message with redirect info
      if (data.status === "success") {
        const msg = data.finalUrl && data.finalUrl !== data.baseUrl 
          ? `✅ Connected (redirected to ${new URL(data.finalUrl).hostname})`
          : "✅ Connection successful";
        toast({ title: msg });
      } else if (data.isTimeout) {
        toast({ title: `⏱️ ${data.error || "Timeout"}`, variant: "destructive" });
      } else {
        toast({ title: `❌ ${data.error || "Connection failed"}`, variant: "destructive" });
      }
    } catch (err) { 
      toast({ title: `Network error: ${err instanceof Error ? err.message : "Unknown"}`, variant: "destructive" }); 
    }
    finally { setTestingId(null); }
  };

  const deleteNetwork = async (id: string) => {
    if (!confirm("Delete this affiliate network?")) return;
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/affiliate-networks-crud?action=delete`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ id }),
      });
      setNetworks(prev => prev.filter(n => n.id !== id));
      toast({ title: "Network deleted" });
    } catch { toast({ title: "Delete failed", variant: "destructive" }); }
  };

  const filtered = networks.filter(n => {
    if (categoryFilter !== "all" && n.category !== categoryFilter) return false;
    if (searchTerm && !n.display_name.toLowerCase().includes(searchTerm.toLowerCase()) && !n.slug.includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (!user || !ADMIN_EMAILS.includes(user.email || "")) return null;

  return (
    <div className="min-h-screen" style={{ background: "#080E1E" }}>
      <div className="px-4 md:px-8 pt-6 pb-4 border-b" style={{ borderColor: "rgba(245,200,66,0.15)", background: "#0D1230" }}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Affiliate Networks</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Manage booking affiliate partners & deeplinks</p>
          </div>
          <div className="flex gap-2">
            <a href="/admin/command-center" className="text-xs text-primary hover:underline">← Command Center</a>
            <Button size="sm" onClick={() => { setEditingNetwork(null); setDrawerOpen(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Network
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-5 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${categoryFilter === cat ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:text-foreground"}`}>
              {cat === "all" ? "All" : cat.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
          <div className="ml-auto relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 h-8 w-48 text-xs" />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "var(--card)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-primary">Network</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-primary">Category</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-primary">Enabled</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-primary">Priority</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-primary">Last Test</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(n => (
                  <tr key={n.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {n.logo_url ? <img src={n.logo_url} className="w-6 h-6 rounded" /> : <Network className="w-4 h-4 text-muted-foreground" />}
                        <div>
                          <p className="font-medium text-foreground">{n.display_name}</p>
                          <p className="text-xs text-muted-foreground">{n.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{n.category.replace("_", " ")}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleNetwork(n.id, !n.is_enabled)}>
                        {n.is_enabled
                          ? <ToggleRight className="w-6 h-6 text-green-400 mx-auto" />
                          : <ToggleLeft className="w-6 h-6 text-muted-foreground mx-auto" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{n.priority}</td>
                    <td className="px-4 py-3 text-center">
                      {n.last_test_status === "success" && <Badge className="bg-green-500/20 text-green-400 text-xs">✓ OK</Badge>}
                      {n.last_test_status === "failed" && <Badge variant="destructive" className="text-xs">✗ Failed</Badge>}
                      {n.last_test_status === "untested" && <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingNetwork(n); setDrawerOpen(true); }}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => testConnection(n.id)} disabled={testingId === n.id}>
                          <TestTube className={`w-3.5 h-3.5 ${testingId === n.id ? "animate-pulse" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteNetwork(n.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No networks found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {drawerOpen && (
        <AffiliateNetworkDrawer
          network={editingNetwork}
          onClose={() => { setDrawerOpen(false); setEditingNetwork(null); }}
          onSaved={() => { setDrawerOpen(false); setEditingNetwork(null); loadNetworks(); }}
        />
      )}
    </div>
  );
}
