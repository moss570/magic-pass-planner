import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bug, Lightbulb, MessageCircle, AlertTriangle, CheckCircle, Eye, Clock, X, ChevronDown, ChevronUp, Search } from "lucide-react";
import { toast } from "sonner";

type FeedbackItem = {
  id: string; user_email: string; type: string; title: string; description: string;
  page_url: string; status: string; admin_notes: string | null; created_at: string;
};

type ErrorGroup = {
  error_message: string; count: number; latest: string; latest_stack: string | null;
  page_url: string; component_name: string | null;
};

export default function BetaFeedbackPanel() {
  const [view, setView] = useState<"feedback" | "errors">("feedback");
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [errors, setErrors] = useState<ErrorGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});

  useEffect(() => { load(); }, [view]);

  const load = async () => {
    setLoading(true);
    if (view === "feedback") {
      const { data } = await (supabase.from("beta_feedback" as any).select("*") as any).order("created_at", { ascending: false }).limit(200);
      setFeedback((data || []) as FeedbackItem[]);
    } else {
      const { data } = await (supabase.from("client_error_log" as any).select("*") as any).order("created_at", { ascending: false }).limit(500);
      const groups: Record<string, ErrorGroup> = {};
      for (const e of (data || []) as any[]) {
        const key = e.error_message?.slice(0, 200) || "unknown";
        if (!groups[key]) {
          groups[key] = { error_message: key, count: 0, latest: e.created_at, latest_stack: e.error_stack, page_url: e.page_url, component_name: e.component_name };
        }
        groups[key].count++;
        if (e.created_at > groups[key].latest) {
          groups[key].latest = e.created_at;
          groups[key].latest_stack = e.error_stack;
          groups[key].page_url = e.page_url;
        }
      }
      setErrors(Object.values(groups).sort((a, b) => b.count - a.count));
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await (supabase.from("beta_feedback" as any).update({ status }) as any).eq("id", id);
    setFeedback(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    toast.success(`Status updated to ${status}`);
  };

  const saveNotes = async (id: string) => {
    const notes = editNotes[id] ?? "";
    await (supabase.from("beta_feedback" as any).update({ admin_notes: notes }) as any).eq("id", id);
    setFeedback(prev => prev.map(f => f.id === id ? { ...f, admin_notes: notes } : f));
    toast.success("Notes saved");
  };

  const typeIcon = (t: string) => t === "bug" ? <Bug className="w-3.5 h-3.5 text-red-400" /> : t === "feature" ? <Lightbulb className="w-3.5 h-3.5 text-yellow-400" /> : <MessageCircle className="w-3.5 h-3.5 text-blue-400" />;
  const statusColor = (s: string) => s === "new" ? "bg-blue-500/20 text-blue-400" : s === "reviewing" ? "bg-yellow-500/20 text-yellow-400" : s === "resolved" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground";

  const filtered = feedback.filter(f => {
    if (filterType !== "all" && f.type !== filterType) return false;
    if (filterStatus !== "all" && f.status !== filterStatus) return false;
    if (search && !f.title.toLowerCase().includes(search.toLowerCase()) && !f.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: feedback.length,
    newCount: feedback.filter(f => f.status === "new").length,
    bugs: feedback.filter(f => f.type === "bug" && f.status !== "resolved").length,
    errorsToday: errors.filter(e => new Date(e.latest).toDateString() === new Date().toDateString()).reduce((a, b) => a + b.count, 0),
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Feedback", value: stats.total, icon: MessageCircle },
          { label: "New / Unread", value: stats.newCount, icon: Clock },
          { label: "Open Bugs", value: stats.bugs, icon: Bug },
          { label: "Errors Today", value: stats.errorsToday, icon: AlertTriangle },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><s.icon className="w-3.5 h-3.5" />{s.label}</div>
            <div className="text-xl font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button onClick={() => setView("feedback")} className={`px-4 py-2 text-xs font-semibold rounded-t ${view === "feedback" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}>
          Feedback ({feedback.length})
        </button>
        <button onClick={() => setView("errors")} className={`px-4 py-2 text-xs font-semibold rounded-t ${view === "errors" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}>
          Error Log ({errors.reduce((a, b) => a + b.count, 0)})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : view === "feedback" ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search feedback..." className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-muted/30 border border-white/10 text-foreground placeholder:text-muted-foreground" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="text-xs px-3 py-2 rounded-lg bg-muted/30 border border-white/10 text-foreground">
              <option value="all">All Types</option>
              <option value="bug">Bugs</option>
              <option value="feature">Features</option>
              <option value="general">General</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-xs px-3 py-2 rounded-lg bg-muted/30 border border-white/10 text-foreground">
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="wont_fix">Won't Fix</option>
            </select>
          </div>

          {/* List */}
          <div className="space-y-2">
            {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No feedback yet</p>}
            {filtered.map(f => (
              <div key={f.id} className="rounded-lg border border-white/10" style={{ background: "rgba(255,255,255,0.02)" }}>
                <button onClick={() => setExpandedId(expandedId === f.id ? null : f.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                  {typeIcon(f.type)}
                  <span className="flex-1 text-sm font-medium text-foreground truncate">{f.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColor(f.status)}`}>{f.status}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</span>
                  {expandedId === f.id ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
                {expandedId === f.id && (
                  <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                    <p className="text-xs text-muted-foreground">{f.user_email} · {f.page_url}</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{f.description}</p>
                    <div className="flex gap-2 flex-wrap">
                      {["new", "reviewing", "resolved", "wont_fix"].map(s => (
                        <button key={s} onClick={() => updateStatus(f.id, s)} className={`text-[10px] px-2.5 py-1 rounded-full font-semibold transition-colors ${f.status === s ? statusColor(s) : "bg-muted/30 text-muted-foreground hover:text-foreground"}`}>
                          {s.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                    <div>
                      <textarea
                        value={editNotes[f.id] ?? f.admin_notes ?? ""}
                        onChange={e => setEditNotes({ ...editNotes, [f.id]: e.target.value })}
                        placeholder="Admin notes..."
                        rows={2}
                        className="w-full text-xs p-2 rounded bg-muted/30 border border-white/10 text-foreground placeholder:text-muted-foreground"
                      />
                      <button onClick={() => saveNotes(f.id)} className="mt-1 text-[10px] text-primary font-semibold hover:underline">Save Notes</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Errors view */
        <div className="space-y-2">
          {errors.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No errors logged</p>}
          {errors.map((e, i) => (
            <div key={i} className="rounded-lg border border-white/10" style={{ background: "rgba(255,255,255,0.02)" }}>
              <button onClick={() => setExpandedError(expandedError === e.error_message ? null : e.error_message)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="flex-1 text-xs font-mono text-foreground truncate">{e.error_message}</span>
                <span className="text-xs font-bold text-red-400">{e.count}×</span>
                <span className="text-[10px] text-muted-foreground">{new Date(e.latest).toLocaleDateString()}</span>
                {expandedError === e.error_message ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              {expandedError === e.error_message && (
                <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                  <p className="text-[10px] text-muted-foreground">Page: {e.page_url}{e.component_name ? ` · Component: ${e.component_name}` : ""}</p>
                  {e.latest_stack && (
                    <pre className="text-[10px] text-red-300/70 bg-black/30 rounded p-2 overflow-x-auto max-h-40 overflow-y-auto">{e.latest_stack}</pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
