import { useState, useEffect } from "react";
import { Laugh, Plus, Search, Edit2, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

export default function HaaaaPrompts() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ prompt: "", real_answer: "", category: "general", difficulty: "medium" });
  const [editingPrompt, setEditingPrompt] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    const { data } = await (supabase.from("haaaa_prompts" as any).select("*") as any).order("category").order("prompt");
    setPrompts(data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = prompts.filter(p => {
    const matchSearch = !search || p.prompt.toLowerCase().includes(search.toLowerCase()) || p.real_answer.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || p.category === category;
    return matchSearch && matchCat;
  });

  const catCounts: Record<string, number> = {};
  prompts.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Laugh className="w-5 h-5 text-primary" /> Haaaa!! Prompts</h1>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search prompts..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/50 text-sm text-foreground bg-card focus:outline-none" />
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 rounded-lg border border-border/50 text-sm text-foreground bg-card">
            <option value="all">All Categories</option>
            {["characters","rides","parks","history","movies","star_wars","pixar","food","general"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setShowAdd(s => !s)} className="px-4 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Add Prompt
          </button>
        </div>

        {showAdd && (
          <div className="rounded-xl p-5 border border-primary/20 bg-card">
            <p className="text-sm font-bold text-foreground mb-4">➕ New Haaaa!! Prompt</p>
            <div className="space-y-3">
              <textarea value={newPrompt.prompt} onChange={e => setNewPrompt(p => ({...p, prompt: e.target.value}))} placeholder="Prompt question *" rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30 focus:outline-none resize-none" />
              <input value={newPrompt.real_answer} onChange={e => setNewPrompt(p => ({...p, real_answer: e.target.value}))} placeholder="Real answer *"
                className="w-full px-3 py-2.5 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30 focus:outline-none" />
              <div className="flex gap-2">
                <select value={newPrompt.category} onChange={e => setNewPrompt(p => ({...p, category: e.target.value}))}
                  className="flex-1 px-3 py-2 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30">
                  {["general","characters","rides","parks","history","movies","star_wars","pixar","food"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={newPrompt.difficulty} onChange={e => setNewPrompt(p => ({...p, difficulty: e.target.value}))}
                  className="flex-1 px-3 py-2 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30">
                  {["easy","medium","hard"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg border border-border/50 text-sm text-muted-foreground">Cancel</button>
                <button onClick={async () => {
                  if (!newPrompt.prompt.trim() || !newPrompt.real_answer.trim()) { toast({ title: "Fill in prompt and answer", variant: "destructive" }); return; }
                  const { error } = await (supabase.from("haaaa_prompts" as any).insert({ ...newPrompt, is_active: true }) as any);
                  if (!error) { toast({ title: "✅ Prompt added!" }); setShowAdd(false); setNewPrompt({ prompt: "", real_answer: "", category: "general", difficulty: "medium" }); loadData(); }
                  else toast({ title: "Failed", description: error.message, variant: "destructive" });
                }} className="flex-1 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground">Add Prompt</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(catCounts).map(([cat, count]) => (
            <span key={cat} className="px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground">{cat}: {count}</span>
          ))}
          <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary font-semibold">Total: {prompts.length}</span>
        </div>

        <div className="rounded-xl overflow-hidden border border-border/50 bg-card">
          <div className="px-4 py-3 border-b border-border/50"><p className="text-xs font-bold text-foreground">Prompts ({filtered.length})</p></div>
          <div className="divide-y divide-border/30" style={{ maxHeight: 600, overflowY: "auto" }}>
            {filtered.map(p => (
              <div key={p.id} className="px-4 py-3">
                {editingPrompt?.id === p.id ? (
                  <div className="space-y-2">
                    <textarea value={editingPrompt.prompt} onChange={e => setEditingPrompt((ep: any) => ({...ep, prompt: e.target.value}))} rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30 focus:outline-none resize-none" />
                    <input value={editingPrompt.real_answer} onChange={e => setEditingPrompt((ep: any) => ({...ep, real_answer: e.target.value}))}
                      className="w-full px-3 py-2 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30 focus:outline-none" />
                    <div className="flex gap-2">
                      <select value={editingPrompt.category} onChange={e => setEditingPrompt((ep: any) => ({...ep, category: e.target.value}))}
                        className="flex-1 px-2 py-1.5 rounded border border-border/50 text-xs text-foreground bg-muted/30">
                        {["general","characters","rides","parks","history","movies","star_wars","pixar","food"].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select value={editingPrompt.difficulty} onChange={e => setEditingPrompt((ep: any) => ({...ep, difficulty: e.target.value}))}
                        className="flex-1 px-2 py-1.5 rounded border border-border/50 text-xs text-foreground bg-muted/30">
                        {["easy","medium","hard"].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        await (supabase.from("haaaa_prompts" as any).update({ prompt: editingPrompt.prompt, real_answer: editingPrompt.real_answer, category: editingPrompt.category, difficulty: editingPrompt.difficulty }) as any).eq("id", editingPrompt.id);
                        toast({ title: "✅ Prompt updated" }); setEditingPrompt(null); loadData();
                      }} className="px-3 py-1.5 rounded text-xs font-bold bg-primary text-primary-foreground">Save</button>
                      <button onClick={() => setEditingPrompt(null)} className="px-3 py-1.5 rounded text-xs text-muted-foreground border border-border/50">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground leading-snug">{p.prompt}</p>
                      <p className="text-xs text-green-400 font-semibold mt-0.5">✓ {p.real_answer}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{p.category}</span>
                        <span className={`text-xs ${p.difficulty === "hard" ? "text-red-400" : p.difficulty === "medium" ? "text-yellow-400" : "text-green-400"}`}>{p.difficulty}</span>
                        {!p.is_active && <span className="text-xs text-red-400">Inactive</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={async () => {
                        await (supabase.from("haaaa_prompts" as any).update({ is_active: !p.is_active }) as any).eq("id", p.id); loadData();
                      }} className={`text-xs px-2 py-1 rounded-full font-semibold ${p.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{p.is_active ? "On" : "Off"}</button>
                      <button onClick={() => setEditingPrompt({...p})} className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => {
                        if (!confirm("Delete this prompt?")) return;
                        await (supabase.from("haaaa_prompts" as any).delete() as any).eq("id", p.id);
                        toast({ title: "Prompt deleted" }); loadData();
                      }} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
