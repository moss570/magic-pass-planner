import { useState, useEffect } from "react";
import { Smartphone, Plus, Search, Edit2, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

export default function LineMindWords() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [words, setWords] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newWord, setNewWord] = useState({ word: "", category: "characters" });
  const [editingWord, setEditingWord] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    const { data } = await (supabase.from("headsup_words" as any).select("*") as any).order("category").order("word");
    setWords(data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = words.filter(w => {
    const matchSearch = !search || w.word.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || w.category === category;
    return matchSearch && matchCat;
  });

  const catCounts: Record<string, number> = {};
  words.forEach(w => { catCounts[w.category] = (catCounts[w.category] || 0) + 1; });

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Smartphone className="w-5 h-5 text-primary" /> Line Mind Words</h1>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search words..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/50 text-sm text-foreground bg-card focus:outline-none" />
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 rounded-lg border border-border/50 text-sm text-foreground bg-card">
            <option value="all">All Categories</option>
            {["characters","rides","food","movies","parks","general"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setShowAdd(s => !s)} className="px-4 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Add Word
          </button>
        </div>

        {showAdd && (
          <div className="rounded-xl p-5 border border-primary/20 bg-card">
            <p className="text-sm font-bold text-foreground mb-4">➕ New Line Mind Word</p>
            <div className="flex gap-3 mb-3">
              <input value={newWord.word} onChange={e => setNewWord(w => ({...w, word: e.target.value}))} placeholder="Disney word or phrase *"
                className="flex-1 px-3 py-2.5 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30 focus:outline-none" />
              <select value={newWord.category} onChange={e => setNewWord(w => ({...w, category: e.target.value}))}
                className="px-3 py-2.5 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30">
                {["characters","rides","food","movies","parks","general"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg border border-border/50 text-sm text-muted-foreground">Cancel</button>
              <button onClick={async () => {
                if (!newWord.word.trim()) { toast({ title: "Enter a word", variant: "destructive" }); return; }
                const { error } = await (supabase.from("headsup_words" as any).insert({ word: newWord.word.trim(), category: newWord.category, is_active: true }) as any);
                if (!error) { toast({ title: "✅ Word added!" }); setShowAdd(false); setNewWord({ word: "", category: "characters" }); loadData(); }
                else toast({ title: "Failed", description: error.message, variant: "destructive" });
              }} className="flex-1 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground">Add Word</button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(catCounts).map(([cat, count]) => (
            <span key={cat} className="px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground">{cat}: {count}</span>
          ))}
          <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary font-semibold">Total: {words.length}</span>
        </div>

        <div className="rounded-xl overflow-hidden border border-border/50 bg-card">
          <div className="px-4 py-3 border-b border-border/50"><p className="text-xs font-bold text-foreground">Words ({filtered.length})</p></div>
          <div className="divide-y divide-border/30" style={{ maxHeight: 600, overflowY: "auto" }}>
            {filtered.map(w => (
              <div key={w.id} className="px-4 py-3">
                {editingWord?.id === w.id ? (
                  <div className="flex gap-2 items-center">
                    <input value={editingWord.word} onChange={e => setEditingWord((ew: any) => ({...ew, word: e.target.value}))}
                      className="flex-1 px-2 py-1.5 rounded border border-border/50 text-sm text-foreground bg-muted/30 focus:outline-none" />
                    <select value={editingWord.category} onChange={e => setEditingWord((ew: any) => ({...ew, category: e.target.value}))}
                      className="px-2 py-1.5 rounded border border-border/50 text-xs text-foreground bg-muted/30">
                      {["characters","rides","food","movies","parks","general"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={async () => {
                      await (supabase.from("headsup_words" as any).update({ word: editingWord.word, category: editingWord.category }) as any).eq("id", editingWord.id);
                      toast({ title: "✅ Word updated" }); setEditingWord(null); loadData();
                    }} className="px-3 py-1.5 rounded text-xs font-bold bg-primary text-primary-foreground">Save</button>
                    <button onClick={() => setEditingWord(null)} className="px-2 py-1.5 rounded text-xs text-muted-foreground border border-border/50">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{w.word}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">{w.category}</span>
                      {!w.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Inactive</span>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={async () => {
                        await (supabase.from("headsup_words" as any).update({ is_active: !w.is_active }) as any).eq("id", w.id); loadData();
                      }} className={`text-xs px-2 py-1 rounded-full font-semibold ${w.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{w.is_active ? "On" : "Off"}</button>
                      <button onClick={() => setEditingWord({...w})} className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => {
                        if (!confirm("Delete this word?")) return;
                        await (supabase.from("headsup_words" as any).delete() as any).eq("id", w.id);
                        toast({ title: "Word deleted" }); loadData();
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
