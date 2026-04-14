import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Search, Download, Upload, Edit2, Check, X, ChevronUp, ChevronDown, Trash2, Plus, Mail, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";

const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net"];

type Lead = {
  id: string;
  email: string;
  first_name: string | null;
  signup_type: string;
  marketing_consent: boolean;
  consent_timestamp: string | null;
  source: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  unsubscribed_at: string | null;
  ip_address: string | null;
};

type SortKey = "email" | "first_name" | "signup_type" | "status" | "created_at" | "source";
type SortDir = "asc" | "desc";

export default function EarlyAccessLeads() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "updates" | "beta_tester">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "unsubscribed">("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [editing, setEditing] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // Send email state
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [sendTemplate, setSendTemplate] = useState<string>("beta_welcome");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [sendingEmails, setSendingEmails] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);

  // Adding single lead
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", first_name: "", signup_type: "updates" as string, source: "admin_import" });

  useEffect(() => {
    if (!authLoading) {
      if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
        navigate("/dashboard");
      } else {
        loadLeads();
      }
    }
  }, [user, authLoading]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("launch_signups")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLeads((data as Lead[]) || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load leads", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sorted = useMemo(() => {
    let filtered = leads.filter(l => {
      if (filterType !== "all" && l.signup_type !== filterType) return false;
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return l.email.toLowerCase().includes(q) || (l.first_name || "").toLowerCase().includes(q) || (l.source || "").toLowerCase().includes(q);
      }
      return true;
    });
    filtered.sort((a, b) => {
      const av = (a[sortKey] || "") as string;
      const bv = (b[sortKey] || "") as string;
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return filtered;
  }, [leads, search, filterType, filterStatus, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  const startEdit = (lead: Lead) => {
    setEditing(lead);
    setEditForm({ email: lead.email, first_name: lead.first_name, signup_type: lead.signup_type, status: lead.status, source: lead.source });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const typeChanged = editForm.signup_type !== editing.signup_type;
    if (typeChanged) {
      const { data: existing } = await supabase
        .from("launch_signups")
        .select("id")
        .eq("email", editForm.email)
        .eq("signup_type", editForm.signup_type)
        .neq("id", editing.id)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from("launch_signups").delete().eq("id", editing.id);
        if (error) {
          toast({ title: "Merge failed", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Lead merged — duplicate removed" });
          setEditing(null);
          loadLeads();
        }
        return;
      }
    }
    const { error } = await supabase.from("launch_signups").update({
      email: editForm.email,
      first_name: editForm.first_name,
      signup_type: editForm.signup_type,
      status: editForm.status,
      source: editForm.source,
      updated_at: new Date().toISOString(),
    }).eq("id", editing.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Lead updated" });
      setEditing(null);
      loadLeads();
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Delete this lead permanently?")) return;
    const { error } = await supabase.from("launch_signups").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Lead deleted" }); loadLeads(); }
  };

  const addLead = async () => {
    if (!addForm.email) { toast({ title: "Email is required", variant: "destructive" }); return; }
    const { error } = await supabase.from("launch_signups").insert({
      email: addForm.email.trim().toLowerCase(),
      first_name: addForm.first_name.trim() || null,
      signup_type: addForm.signup_type,
      marketing_consent: true,
      consent_timestamp: new Date().toISOString(),
      source: addForm.source || "admin_import",
      status: "active",
    });
    if (error) {
      toast({ title: "Failed to add", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Lead added" });
      setShowAdd(false);
      setAddForm({ email: "", first_name: "", signup_type: "updates", source: "admin_import" });
      loadLeads();
    }
  };

  // CSV Export
  const exportCSV = () => {
    const header = "email,first_name,signup_type,status,source,marketing_consent,created_at\n";
    const rows = sorted.map(l =>
      `"${l.email}","${l.first_name || ""}","${l.signup_type}","${l.status}","${l.source || ""}","${l.marketing_consent}","${l.created_at}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `early-access-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `✅ Exported ${sorted.length} leads` });
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === sorted.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(sorted.map(l => l.id)));
    }
  };

  const sendEmailToSelected = async () => {
    const targets = sorted.filter(l => selectedLeads.has(l.id) && l.status === "active" && l.marketing_consent);
    if (targets.length === 0) {
      toast({ title: "No eligible leads selected", description: "Leads must be active with marketing consent", variant: "destructive" });
      return;
    }
    if (!confirm(`Send "${sendTemplate}" email to ${targets.length} leads?`)) return;

    setSendingEmails(true);
    setSendProgress(0);
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const storageKeyMap: Record<string, string> = { vip_invite: "vip_email_template", beta_welcome: "beta_welcome_template", beta_update: "beta_update_template", free_month: "free_month_template" };
    const templateHtml = localStorage.getItem(storageKeyMap[sendTemplate] || sendTemplate);

    let sent = 0, failed = 0;
    for (let i = 0; i < targets.length; i++) {
      const lead = targets[i];
      try {
        const resp = await fetch(`https://wknelhrmgspuztehetpa.supabase.co/functions/v1/vip-invite?action=invite`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "x-client-authorization": `Bearer ${token}`,
            "apikey": "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: lead.email,
            first_name: lead.first_name || "Disney Fan",
            type: sendTemplate === "vip_invite" ? "vip" : sendTemplate === "free_month" ? "free_month" : "beta_tester",
            reason: "Beta tester from early access list",
            template_name: sendTemplate,
            custom_html: templateHtml || undefined,
          }),
        });
        const data = await resp.json();
        if (data.success) sent++;
        else failed++;
      } catch {
        failed++;
      }
      setSendProgress(i + 1);
      if (i < targets.length - 1) await new Promise(r => setTimeout(r, 500));
    }
    setSendingEmails(false);
    setSelectedLeads(new Set());
    toast({ title: `✅ Sent ${sent} emails`, description: failed > 0 ? `${failed} failed` : undefined });
  };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    const headerLine = lines[0].toLowerCase();
    const hasHeader = headerLine.includes("email");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    let imported = 0;
    let skipped = 0;
    for (const line of dataLines) {
      const cols = line.split(",").map(c => c.replace(/"/g, "").trim());
      const email = cols[0]?.toLowerCase();
      if (!email || !email.includes("@")) { skipped++; continue; }
      const first_name = cols[1] || null;
      const signup_type = cols[2] === "beta_tester" ? "beta_tester" : "updates";

      const { error } = await supabase.from("launch_signups").upsert({
        email,
        first_name,
        signup_type,
        marketing_consent: true,
        consent_timestamp: new Date().toISOString(),
        source: "csv_import",
        status: "active",
      }, { onConflict: "email,signup_type" });

      if (!error) imported++;
      else skipped++;
    }

    toast({ title: `✅ Imported ${imported} leads`, description: skipped > 0 ? `${skipped} skipped (duplicates or invalid)` : undefined });
    loadLeads();
    if (fileRef.current) fileRef.current.value = "";
  };

  const stats = useMemo(() => ({
    total: leads.length,
    active: leads.filter(l => l.status === "active").length,
    beta: leads.filter(l => l.signup_type === "beta_tester").length,
    updates: leads.filter(l => l.signup_type === "updates").length,
    unsubscribed: leads.filter(l => l.status === "unsubscribed").length,
  }), [leads]);

  if (authLoading || !user || !ADMIN_EMAILS.includes(user.email || "")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout>
    <div className="pb-12">
      <div className="px-4 md:px-8 pt-6 pb-4 border-b border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">📋 Early Access Leads</h1>
          </div>
          <p className="text-xs text-muted-foreground">Manage launch signups and beta tester applications</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Leads", value: stats.total, color: "text-foreground" },
            { label: "Active", value: stats.active, color: "text-green-400" },
            { label: "Beta Testers", value: stats.beta, color: "text-blue-400" },
            { label: "Updates Only", value: stats.updates, color: "text-primary" },
            { label: "Unsubscribed", value: stats.unsubscribed, color: "text-red-400" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 border" style={{ background: "#111827", borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search email, name, source…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-[#111827] border-white/10"
            />
          </div>

          <select value={filterType} onChange={e => setFilterType(e.target.value as any)}
            className="rounded-lg px-3 py-2 text-xs font-medium bg-[#111827] border border-white/10 text-foreground">
            <option value="all">All Types</option>
            <option value="updates">Updates</option>
            <option value="beta_tester">Beta Tester</option>
          </select>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
            className="rounded-lg px-3 py-2 text-xs font-medium bg-[#111827] border border-white/10 text-foreground">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>

          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)} className="gap-1">
            <Plus className="w-3 h-3" /> Add
          </Button>

          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="gap-1">
            <Upload className="w-3 h-3" /> Import CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />

          <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1">
            <Download className="w-3 h-3" /> Export CSV
          </Button>

          <Button size="sm" variant="outline" onClick={() => setShowSendEmail(!showSendEmail)} className="gap-1">
            <Mail className="w-3 h-3" /> Send Email
          </Button>
        </div>

        {/* Send Email Panel */}
        {showSendEmail && (
          <div className="rounded-xl p-4 border space-y-3" style={{ background: "#111827", borderColor: "rgba(59,130,246,0.3)" }}>
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-400" /> Send Email to Selected Leads
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={sendTemplate} onValueChange={(v) => setSendTemplate(v)}>
                <SelectTrigger className="w-[200px] bg-muted/30 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beta_welcome">🧪 Beta Welcome</SelectItem>
                  <SelectItem value="beta_update">📢 Beta Update</SelectItem>
                  <SelectItem value="vip_invite">🎁 VIP Invite</SelectItem>
                  <SelectItem value="free_month">🎉 One Month Free</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                {selectedLeads.size} selected · {sorted.filter(l => selectedLeads.has(l.id) && l.status === "active" && l.marketing_consent).length} eligible
              </span>
              <Button size="sm" onClick={sendEmailToSelected} disabled={sendingEmails || selectedLeads.size === 0} className="gap-1">
                <Send className="w-3 h-3" /> {sendingEmails ? `Sending ${sendProgress}...` : "Send"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowSendEmail(false); setSelectedLeads(new Set()); }}>Cancel</Button>
            </div>
            {sendingEmails && (
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(sendProgress / selectedLeads.size) * 100}%` }} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              💡 Edit templates in <a href="/admin/vip" className="text-primary underline">VIP Invites → Email Template Editor</a>. Only active leads with marketing consent will receive emails.
            </p>
          </div>
        )}

        {/* Add form */}
        {showAdd && (
          <div className="rounded-xl p-4 border space-y-3" style={{ background: "#111827", borderColor: "rgba(245,200,66,0.2)" }}>
            <p className="text-sm font-semibold text-foreground">Add Single Lead</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input placeholder="Email *" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} className="bg-[#0c1225] border-white/10" />
              <Input placeholder="First name" value={addForm.first_name} onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))} className="bg-[#0c1225] border-white/10" />
              <select value={addForm.signup_type} onChange={e => setAddForm(f => ({ ...f, signup_type: e.target.value }))} className="rounded-lg px-3 py-2 text-sm bg-[#0c1225] border border-white/10 text-foreground">
                <option value="updates">Updates</option>
                <option value="beta_tester">Beta Tester</option>
              </select>
              <div className="flex gap-2">
                <Button size="sm" onClick={addLead}>Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#111827" }}>
                    {showSendEmail && (
                      <th className="px-3 py-3 w-8">
                        <input type="checkbox" checked={selectedLeads.size === sorted.length && sorted.length > 0}
                          onChange={toggleSelectAll} className="accent-primary" />
                      </th>
                    )}
                    {([
                      ["email", "Email"],
                      ["first_name", "Name"],
                      ["signup_type", "Type"],
                      ["status", "Status"],
                      ["source", "Source"],
                      ["created_at", "Signed Up"],
                    ] as [SortKey, string][]).map(([key, label]) => (
                      <th key={key} onClick={() => toggleSort(key)}
                        className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap">
                        <span className="flex items-center gap-1">{label} <SortIcon col={key} /></span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Consent</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr><td colSpan={showSendEmail ? 9 : 8} className="text-center py-12 text-muted-foreground">No leads found</td></tr>
                  ) : sorted.map(lead => (
                    <tr key={lead.id} className={`border-t border-white/5 hover:bg-white/[0.02] ${selectedLeads.has(lead.id) ? "bg-blue-500/5" : ""}`}>
                      {showSendEmail && (
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={selectedLeads.has(lead.id)}
                            onChange={() => toggleSelectLead(lead.id)} className="accent-primary" />
                        </td>
                      )}
                      {editing?.id === lead.id ? (
                        <>
                          <td className="px-4 py-2">
                            <Input value={editForm.email || ""} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="h-8 text-xs bg-[#0c1225] border-white/10" />
                          </td>
                          <td className="px-4 py-2">
                            <Input value={editForm.first_name || ""} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} className="h-8 text-xs bg-[#0c1225] border-white/10" />
                          </td>
                          <td className="px-4 py-2">
                            <select value={editForm.signup_type} onChange={e => setEditForm(f => ({ ...f, signup_type: e.target.value }))} className="h-8 rounded px-2 text-xs bg-[#0c1225] border border-white/10 text-foreground">
                              <option value="updates">Updates</option>
                              <option value="beta_tester">Beta Tester</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="h-8 rounded px-2 text-xs bg-[#0c1225] border border-white/10 text-foreground">
                              <option value="active">Active</option>
                              <option value="unsubscribed">Unsubscribed</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <Input value={editForm.source || ""} onChange={e => setEditForm(f => ({ ...f, source: e.target.value }))} className="h-8 text-xs bg-[#0c1225] border-white/10" />
                          </td>
                          <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-xs">{lead.marketing_consent ? "✅" : "❌"}</td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={saveEdit} className="p-1 rounded hover:bg-green-500/20 text-green-400"><Check className="w-4 h-4" /></button>
                              <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-red-500/20 text-red-400"><X className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-xs text-foreground font-mono">{lead.email}</td>
                          <td className="px-4 py-3 text-xs text-foreground">{lead.first_name || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${lead.signup_type === "beta_tester" ? "bg-blue-500/20 text-blue-400" : "bg-primary/20 text-primary"}`}>
                              {lead.signup_type === "beta_tester" ? "🧪 Beta" : "🚀 Updates"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${lead.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{lead.source || "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-xs">{lead.marketing_consent ? "✅" : "❌"}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => startEdit(lead)} className="p-1 rounded hover:bg-primary/20 text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => deleteLead(lead.id)} className="p-1 rounded hover:bg-red-500/20 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-white/5 text-xs text-muted-foreground" style={{ background: "#111827" }}>
              Showing {sorted.length} of {leads.length} leads
            </div>
          </div>
        )}
      </div>
    </div>
    </AdminLayout>
  );
}
