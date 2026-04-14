import { useState, useEffect, useRef, useMemo } from "react";
import { Gift, Upload, Mail, Code, Eye, RotateCcw, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

const SUPABASE_ANON = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";

// Template registry (same as Admin.tsx)
type TemplateName = "vip_invite" | "beta_welcome" | "beta_update";

const TEMPLATE_REGISTRY: Record<TemplateName, { label: string; storageKey: string; placeholders: string; defaultHtml: string }> = {
  vip_invite: {
    label: "🎁 VIP Invite", storageKey: "vip_email_template", placeholders: "{{first_name}}, {{signup_url}}",
    defaultHtml: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#080E1E;font-family:'Segoe UI',Arial,sans-serif;"><div style="max-width:500px;margin:20px auto;background:#111827;border-radius:16px;overflow:hidden;"><div style="background:linear-gradient(135deg,#080E1E,#0D1230);padding:32px;text-align:center;border-bottom:2px solid #F5C842;"><p style="color:#F5C842;font-size:24px;font-weight:bold;margin:0;">🏰 Magic Pass Plus</p></div><div style="padding:32px;"><p style="color:#F5C842;font-size:18px;font-weight:bold;margin:0 0 16px 0;">🎁 You've been invited!</p><p style="color:#F9FAFB;font-size:15px;margin:0 0 12px 0;">Hi {{first_name}},</p><p style="color:#9CA3AF;font-size:14px;line-height:1.6;">You've been personally invited to join Magic Pass Plus as a VIP Member — Free Forever.</p><a href="{{signup_url}}" style="display:block;background:#F5C842;color:#080E1E;text-decoration:none;padding:16px;border-radius:10px;font-size:16px;font-weight:bold;text-align:center;margin:24px 0;">🏰 Claim Your Free VIP Account →</a></div></div></body></html>`,
  },
  beta_welcome: {
    label: "🧪 Beta Welcome", storageKey: "beta_welcome_template", placeholders: "{{first_name}}, {{app_url}}",
    defaultHtml: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#080E1E;font-family:'Segoe UI',Arial,sans-serif;"><div style="max-width:500px;margin:20px auto;background:#111827;border-radius:16px;overflow:hidden;"><div style="background:linear-gradient(135deg,#080E1E,#0D1230);padding:32px;text-align:center;border-bottom:2px solid #F5C842;"><p style="color:#F5C842;font-size:24px;font-weight:bold;margin:0;">🏰 Magic Pass Plus</p></div><div style="padding:32px;"><p style="color:#F5C842;font-size:18px;font-weight:bold;">🧪 Welcome to the Beta!</p><p style="color:#F9FAFB;font-size:15px;">Hi {{first_name}},</p><p style="color:#9CA3AF;font-size:14px;line-height:1.6;">Thank you for joining the beta program!</p><a href="{{app_url}}" style="display:block;background:#F5C842;color:#080E1E;text-decoration:none;padding:16px;border-radius:10px;font-size:16px;font-weight:bold;text-align:center;margin:24px 0;">🏰 Open Magic Pass Plus →</a></div></div></body></html>`,
  },
  beta_update: {
    label: "📢 Beta Update", storageKey: "beta_update_template", placeholders: "{{first_name}}, {{app_url}}",
    defaultHtml: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#080E1E;font-family:'Segoe UI',Arial,sans-serif;"><div style="max-width:500px;margin:20px auto;background:#111827;border-radius:16px;overflow:hidden;"><div style="background:linear-gradient(135deg,#080E1E,#0D1230);padding:32px;text-align:center;border-bottom:2px solid #F5C842;"><p style="color:#F5C842;font-size:24px;font-weight:bold;margin:0;">🏰 Magic Pass Plus</p></div><div style="padding:32px;"><p style="color:#F5C842;font-size:18px;font-weight:bold;">📢 What's New</p><p style="color:#F9FAFB;font-size:15px;">Hi {{first_name}},</p><p style="color:#9CA3AF;font-size:14px;line-height:1.6;">Here's what we've been working on based on your feedback.</p><a href="{{app_url}}" style="display:block;background:#F5C842;color:#080E1E;text-decoration:none;padding:16px;border-radius:10px;font-size:16px;font-weight:bold;text-align:center;margin:24px 0;">🏰 Check It Out →</a></div></div></body></html>`,
  },
};

export default function VipInvites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vips, setVips] = useState<any[]>([]);
  const [vipEmail, setVipEmail] = useState("");
  const [vipFirstName, setVipFirstName] = useState("");
  const [vipLastName, setVipLastName] = useState("");
  const [vipReason, setVipReason] = useState("");
  const [vipNotes, setVipNotes] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  // Bulk import
  type BulkRow = { email: string; first_name: string; last_name: string; status: "pending" | "sending" | "sent" | "failed" | "skipped"; error?: string };
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkType, setBulkType] = useState<"beta_tester" | "vip">("beta_tester");
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  // Templates
  const [activeTemplate, setActiveTemplate] = useState<TemplateName>("vip_invite");
  const [emailTemplate, setEmailTemplate] = useState(() => localStorage.getItem(TEMPLATE_REGISTRY.vip_invite.storageKey) || TEMPLATE_REGISTRY.vip_invite.defaultHtml);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templatePreviewMode, setTemplatePreviewMode] = useState<"code" | "preview">("code");

  const switchTemplate = (name: TemplateName) => {
    setActiveTemplate(name);
    const reg = TEMPLATE_REGISTRY[name];
    setEmailTemplate(localStorage.getItem(reg.storageKey) || reg.defaultHtml);
  };
  const saveTemplate = () => { localStorage.setItem(TEMPLATE_REGISTRY[activeTemplate].storageKey, emailTemplate); toast({ title: `✅ ${TEMPLATE_REGISTRY[activeTemplate].label} template saved` }); };
  const resetTemplate = () => { const reg = TEMPLATE_REGISTRY[activeTemplate]; setEmailTemplate(reg.defaultHtml); localStorage.removeItem(reg.storageKey); toast({ title: "Template reset to default" }); };
  const getTemplateHtml = (name: TemplateName) => { const reg = TEMPLATE_REGISTRY[name]; return localStorage.getItem(reg.storageKey) || reg.defaultHtml; };

  const previewHtml = useMemo(() => emailTemplate
    .replace(/\{\{first_name\}\}/g, "Jane")
    .replace(/\{\{signup_url\}\}/g, "https://magicpassplus.com/signup?vip=demo123")
    .replace(/\{\{app_url\}\}/g, "https://magicpassplus.com/dashboard"), [emailTemplate]);

  const loadVips = async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const resp = await fetch(`https://wknelhrmgspuztehetpa.supabase.co/functions/v1/vip-invite?action=list`, {
        headers: { "Authorization": `Bearer ${token}`, "x-client-authorization": `Bearer ${token}`, "apikey": SUPABASE_ANON },
      });
      const data = await resp.json();
      setVips(data.vips || []);
    } catch (err) { console.error("Failed to load VIPs:", err); }
  };

  useEffect(() => { loadVips(); }, []);

  const sendVipInvite = async () => {
    if (!vipEmail) return;
    setSendingInvite(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const resp = await fetch(`https://wknelhrmgspuztehetpa.supabase.co/functions/v1/vip-invite?action=invite`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "x-client-authorization": `Bearer ${token}`, "apikey": SUPABASE_ANON, "Content-Type": "application/json" },
        body: JSON.stringify({ email: vipEmail, first_name: vipFirstName, last_name: vipLastName, reason: vipReason, notes: vipNotes, template_name: activeTemplate, custom_html: getTemplateHtml(activeTemplate) !== TEMPLATE_REGISTRY[activeTemplate].defaultHtml ? getTemplateHtml(activeTemplate) : undefined }),
      });
      const data = await resp.json();
      if (data.success) {
        toast({ title: `✅ VIP invite sent to ${vipEmail}` });
        setVipEmail(""); setVipFirstName(""); setVipLastName(""); setVipReason(""); setVipNotes("");
        loadVips();
      } else toast({ title: "Failed", description: data.error, variant: "destructive" });
    } catch { toast({ title: "Error sending invite", variant: "destructive" }); }
    finally { setSendingInvite(false); }
  };

  const revokeVip = async (vip: any) => {
    if (!confirm(`Revoke VIP access for ${vip.email}?`)) return;
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    await fetch(`https://wknelhrmgspuztehetpa.supabase.co/functions/v1/vip-invite?action=revoke`, {
      method: "POST", headers: { "Authorization": `Bearer ${token}`, "x-client-authorization": `Bearer ${token}`, "apikey": SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ vip_id: vip.id }),
    });
    toast({ title: `VIP access revoked for ${vip.email}` }); loadVips();
  };

  const deleteVip = async (vip: any) => {
    if (!confirm(`DELETE account for ${vip.email}? This cannot be undone.`)) return;
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    await fetch(`https://wknelhrmgspuztehetpa.supabase.co/functions/v1/vip-invite?action=delete`, {
      method: "POST", headers: { "Authorization": `Bearer ${token}`, "x-client-authorization": `Bearer ${token}`, "apikey": SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ vip_id: vip.id }),
    });
    toast({ title: `Account deleted for ${vip.email}` }); loadVips();
  };

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Gift className="w-5 h-5 text-primary" /> VIP Invites & Email Templates</h1>

        {/* Invite Form */}
        <div className="rounded-xl p-5 border border-border/50 bg-card">
          <h2 className="text-sm font-bold text-foreground mb-4">🎁 Send VIP Invite</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <input type="email" placeholder="Email address *" value={vipEmail} onChange={e => setVipEmail(e.target.value)} className="px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm text-foreground focus:outline-none" />
            <input placeholder="First name" value={vipFirstName} onChange={e => setVipFirstName(e.target.value)} className="px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm text-foreground focus:outline-none" />
            <input placeholder="Last name" value={vipLastName} onChange={e => setVipLastName(e.target.value)} className="px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm text-foreground focus:outline-none" />
            <input placeholder="Reason" value={vipReason} onChange={e => setVipReason(e.target.value)} className="px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm text-foreground focus:outline-none" />
            <input placeholder="Internal notes (optional)" value={vipNotes} onChange={e => setVipNotes(e.target.value)} className="px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm text-foreground focus:outline-none md:col-span-2" />
          </div>
          <button onClick={sendVipInvite} disabled={sendingInvite || !vipEmail} className="px-6 py-2.5 rounded-lg font-bold text-sm bg-primary text-primary-foreground disabled:opacity-50">
            {sendingInvite ? "Sending..." : "🎁 Send VIP Invite"}
          </button>
        </div>

        {/* Bulk CSV Import */}
        <div className="rounded-xl p-5 border border-border/50 bg-card">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /> Bulk Import</h3>
          <p className="text-xs text-muted-foreground mb-3">Upload CSV: <code className="text-primary">email, first_name, last_name</code></p>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <select value={bulkType} onChange={e => setBulkType(e.target.value as any)} className="text-xs px-3 py-2 rounded-lg border border-border/50 bg-muted/30 text-foreground">
              <option value="beta_tester">Beta Tester (1 year)</option>
              <option value="vip">VIP Free Forever</option>
            </select>
            <input ref={bulkFileRef} type="file" accept=".csv" className="text-xs text-muted-foreground file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary"
              onChange={(e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const text = ev.target?.result as string;
                  const lines = text.split(/\r?\n/).filter(l => l.trim());
                  if (lines.length < 2) { toast({ title: "CSV must have header + data", variant: "destructive" }); return; }
                  const header = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""));
                  const emailIdx = header.indexOf("email"); const fnIdx = header.indexOf("first_name"); const lnIdx = header.indexOf("last_name");
                  if (emailIdx === -1) { toast({ title: "CSV must have 'email' column", variant: "destructive" }); return; }
                  const rows: BulkRow[] = [];
                  for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
                    const email = cols[emailIdx]?.toLowerCase().trim();
                    if (!email || !email.includes("@")) continue;
                    rows.push({ email, first_name: fnIdx >= 0 ? cols[fnIdx] || "" : "", last_name: lnIdx >= 0 ? cols[lnIdx] || "" : "", status: "pending" });
                  }
                  setBulkRows(rows); setBulkProgress(0);
                  toast({ title: `✅ Parsed ${rows.length} rows` });
                };
                reader.readAsText(file);
              }} />
          </div>
          {bulkRows.length > 0 && (
            <>
              <div className="overflow-x-auto max-h-48 overflow-y-auto mb-3 rounded-lg border border-border/50">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card"><tr className="border-b border-border/50">
                    <th className="text-left px-3 py-2 text-primary">#</th><th className="text-left px-3 py-2 text-primary">Email</th><th className="text-left px-3 py-2 text-primary">Name</th><th className="text-left px-3 py-2 text-primary">Status</th>
                  </tr></thead>
                  <tbody>{bulkRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/30"><td className="px-3 py-1.5 text-muted-foreground">{i+1}</td><td className="px-3 py-1.5 text-foreground">{row.email}</td><td className="px-3 py-1.5 text-muted-foreground">{row.first_name} {row.last_name}</td>
                    <td className="px-3 py-1.5"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${row.status === "sent" ? "bg-green-500/20 text-green-400" : row.status === "failed" ? "bg-red-500/20 text-red-400" : "bg-muted/50 text-muted-foreground"}`}>{row.status}</span></td></tr>
                  ))}</tbody>
                </table>
              </div>
              {bulkSending && <div className="mb-3"><div className="w-full h-2 rounded-full bg-muted/50 overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${(bulkProgress / bulkRows.length) * 100}%` }} /></div></div>}
              <button onClick={async () => {
                setBulkSending(true);
                const token = (await supabase.auth.getSession()).data.session?.access_token;
                let sent = 0, failed = 0, skipped = 0;
                for (let i = 0; i < bulkRows.length; i++) {
                  const row = bulkRows[i]; if (row.status === "sent" || row.status === "skipped") { setBulkProgress(i+1); continue; }
                  setBulkRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: "sending" } : r));
                  try {
                    const resp = await fetch(`https://wknelhrmgspuztehetpa.supabase.co/functions/v1/vip-invite?action=invite`, {
                      method: "POST", headers: { "Authorization": `Bearer ${token}`, "x-client-authorization": `Bearer ${token}`, "apikey": SUPABASE_ANON, "Content-Type": "application/json" },
                      body: JSON.stringify({ email: row.email, first_name: row.first_name, last_name: row.last_name, reason: bulkType === "beta_tester" ? "Beta tester invite" : "VIP invite", type: bulkType }),
                    });
                    const data = await resp.json();
                    if (data.success) { if (data.skipped) { setBulkRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: "skipped" } : r)); skipped++; } else { setBulkRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: "sent" } : r)); sent++; } }
                    else { setBulkRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: "failed", error: data.error } : r)); failed++; }
                  } catch { setBulkRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: "failed", error: "Network error" } : r)); failed++; }
                  setBulkProgress(i+1);
                  if (i < bulkRows.length - 1) await new Promise(r => setTimeout(r, 500));
                }
                setBulkSending(false); toast({ title: `✅ Done: ${sent} sent, ${skipped} skipped, ${failed} failed` }); loadVips();
              }} disabled={bulkSending} className="px-5 py-2.5 rounded-lg font-bold text-sm bg-primary text-primary-foreground disabled:opacity-50">
                {bulkSending ? `Sending ${bulkProgress}/${bulkRows.length}...` : `📧 Send ${bulkRows.length} Invites`}
              </button>
            </>
          )}
        </div>

        {/* Email Template Editor */}
        <div className="rounded-xl p-5 border border-border/50 bg-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> Email Template Editor</h3>
            <button onClick={() => setShowTemplateEditor(!showTemplateEditor)} className="text-xs text-primary hover:text-primary/80 underline">
              {showTemplateEditor ? "Hide Editor" : "Edit Template"}
            </button>
          </div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {(Object.keys(TEMPLATE_REGISTRY) as TemplateName[]).map(name => (
              <button key={name} onClick={() => switchTemplate(name)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${activeTemplate === name ? "border-primary/60 bg-primary/15 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground"}`}>
                {TEMPLATE_REGISTRY[name].label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-3">Placeholders: <code className="text-primary">{TEMPLATE_REGISTRY[activeTemplate].placeholders}</code></p>
          {showTemplateEditor && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setTemplatePreviewMode("code")} className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border ${templatePreviewMode === "code" ? "border-primary/40 bg-primary/10 text-primary" : "border-border/50 text-muted-foreground"}`}><Code className="w-3 h-3" /> HTML</button>
                <button onClick={() => setTemplatePreviewMode("preview")} className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border ${templatePreviewMode === "preview" ? "border-primary/40 bg-primary/10 text-primary" : "border-border/50 text-muted-foreground"}`}><Eye className="w-3 h-3" /> Preview</button>
                <div className="flex-1" />
                <button onClick={resetTemplate} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Reset</button>
              </div>
              {templatePreviewMode === "code" ? (
                <textarea value={emailTemplate} onChange={e => setEmailTemplate(e.target.value)} rows={20}
                  className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border/50 text-xs text-foreground font-mono focus:outline-none resize-y" spellCheck={false} />
              ) : (
                <div className="rounded-lg border border-border/50 overflow-hidden bg-white" style={{ minHeight: 400 }}>
                  <iframe srcDoc={previewHtml} className="w-full border-0" style={{ height: 500 }} title="Email Preview" sandbox="" />
                </div>
              )}
              <div className="flex items-center gap-3 mt-3">
                <button onClick={saveTemplate} className="px-5 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground">💾 Save Template</button>
                <span className="text-xs text-muted-foreground">Saved locally</span>
              </div>
            </>
          )}
        </div>

        {/* VIP List */}
        <div className="rounded-xl p-5 border border-border/50 bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground">VIP Accounts ({vips.length})</h2>
            <button onClick={loadVips} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
          </div>
          {vips.length === 0 ? <p className="text-sm text-muted-foreground">No VIP accounts yet</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border/50">
                  <th className="text-left px-3 py-2 text-xs text-primary">Email</th>
                  <th className="text-left px-3 py-2 text-xs text-primary">Name</th>
                  <th className="text-left px-3 py-2 text-xs text-primary">Reason</th>
                  <th className="text-left px-3 py-2 text-xs text-primary">Status</th>
                  <th className="text-left px-3 py-2 text-xs text-primary">Actions</th>
                </tr></thead>
                <tbody>
                  {vips.map((vip, i) => (
                    <tr key={vip.id} className={i < vips.length - 1 ? "border-b border-border/30" : ""}>
                      <td className="px-3 py-2 text-foreground text-xs">{vip.email}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{vip.first_name} {vip.last_name}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{vip.reason || "—"}</td>
                      <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${vip.status === "active" ? "bg-green-500/20 text-green-400" : vip.status === "revoked" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{vip.status}</span></td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          {vip.status !== "revoked" && <button onClick={() => revokeVip(vip)} className="text-xs text-yellow-400 hover:text-yellow-300">Revoke</button>}
                          <button onClick={async () => {
                            const newVal = !vip.is_game_developer;
                            setVips(prev => prev.map(v => v.id === vip.id ? { ...v, is_game_developer: newVal } : v));
                            const { error } = await supabase.from("vip_accounts").update({ is_game_developer: newVal }).eq("id", vip.id);
                            if (!error) toast({ title: newVal ? "🎮 Dev enabled!" : "🎮 Dev disabled" });
                            else { setVips(prev => prev.map(v => v.id === vip.id ? { ...v, is_game_developer: !newVal } : v)); toast({ title: "Failed", variant: "destructive" }); }
                          }} className={`text-xs font-semibold px-2 py-1 rounded border ${vip.is_game_developer ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-blue-500/30 bg-blue-500/10 text-blue-400"}`}>
                            {vip.is_game_developer ? "🎮 Dev ON ✓" : "🎮 Make Dev"}
                          </button>
                          <button onClick={() => deleteVip(vip)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
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
    </AdminLayout>
  );
}
