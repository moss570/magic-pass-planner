import { useState, useEffect } from "react";
import { Globe, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

export default function NewsSources() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newsSources, setNewsSources] = useState<any[]>([]);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState({ name: "", url: "", category: "disney_deals", notes: "", scrape_frequency: "daily" });

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase.from("news_sources").select("*").order("category").order("name");
    setNewsSources(data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> News Sources</h1>
            <p className="text-xs text-muted-foreground">Sources checked for Disney deals and news</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={() => setShowAddSource(s => !s)} className="px-4 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Source
            </button>
          </div>
        </div>

        {showAddSource && (
          <div className="rounded-xl p-4 border border-primary/20 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input value={newSource.name} onChange={e => setNewSource(s => ({...s, name: e.target.value}))} placeholder="Source name *"
                className="px-3 py-2.5 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30 focus:outline-none" />
              <input value={newSource.url} onChange={e => setNewSource(s => ({...s, url: e.target.value}))} placeholder="URL *"
                className="px-3 py-2.5 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30 focus:outline-none" />
              <select value={newSource.category} onChange={e => setNewSource(s => ({...s, category: e.target.value}))}
                className="px-3 py-2.5 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30">
                {["disney_deals","disney_news","ap_exclusive","dining","orlando_attractions","entertainment"].map(c => <option key={c} value={c}>{c.replace("_"," ")}</option>)}
              </select>
              <select value={newSource.scrape_frequency} onChange={e => setNewSource(s => ({...s, scrape_frequency: e.target.value}))}
                className="px-3 py-2.5 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30">
                {["realtime","daily","weekly"].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <input value={newSource.notes} onChange={e => setNewSource(s => ({...s, notes: e.target.value}))} placeholder="Notes (optional)"
              className="w-full px-3 py-2.5 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30 mb-3 focus:outline-none" />
            <button onClick={async () => {
              if (!newSource.name || !newSource.url) return;
              await supabase.from("news_sources").insert(newSource);
              toast({ title: "✅ Source added!" }); setShowAddSource(false);
              setNewSource({ name: "", url: "", category: "disney_deals", notes: "", scrape_frequency: "daily" }); loadData();
            }} className="px-6 py-2.5 rounded-lg font-bold text-sm bg-primary text-primary-foreground">Add Source</button>
          </div>
        )}

        <div className="rounded-xl overflow-hidden border border-border/50 bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs text-primary">Source</th>
                <th className="text-left px-4 py-3 text-xs text-primary hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs text-primary hidden md:table-cell">Frequency</th>
                <th className="text-left px-4 py-3 text-xs text-primary hidden lg:table-cell">Last Checked</th>
                <th className="px-4 py-3 text-xs text-primary">Active</th>
              </tr>
            </thead>
            <tbody>
              {newsSources.map((src, i) => (
                <tr key={src.id} className={i < newsSources.length - 1 ? "border-b border-border/30" : ""}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{src.name}</p>
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block max-w-xs">{src.url}</a>
                    {src.notes && <p className="text-xs text-muted-foreground">{src.notes}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground capitalize">{src.category?.replace("_"," ")}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{src.scrape_frequency}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{src.last_scraped ? new Date(src.last_scraped).toLocaleString() : "Never"}</td>
                  <td className="px-4 py-3">
                    <button onClick={async () => {
                      await supabase.from("news_sources").update({ is_active: !src.is_active }).eq("id", src.id); loadData();
                    }} className={`text-xs px-2.5 py-1 rounded-full font-semibold ${src.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {src.is_active ? "✅ On" : "❌ Off"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
