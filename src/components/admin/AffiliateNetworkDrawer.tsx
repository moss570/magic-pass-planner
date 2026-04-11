import { useState } from "react";
import { X, Eye, EyeOff, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const CATEGORIES = ["flights", "hotels", "tickets", "rental_cars", "activities", "insurance"];
const AUTH_TYPES = ["api_key", "oauth", "basic", "bearer", "none"];
const CREDENTIAL_FIELDS = [
  { key: "api_key_enc", label: "API Key" },
  { key: "api_secret_enc", label: "API Secret" },
];

interface Props {
  network: any | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function AffiliateNetworkDrawer({ network, onClose, onSaved }: Props) {
  const { session } = useAuth();
  const { toast } = useToast();
  const isNew = !network;
  const [form, setForm] = useState<any>(network || {
    display_name: "", slug: "", category: "hotels", priority: 100, is_enabled: false,
    sandbox_mode: true, auth_type: "api_key", affiliate_id: "", base_url: "",
    deeplink_template: "", sub_id_pattern: "mpp-{tripId}-{userId}", tracking_pixel_url: "",
    commission_rate_display: "", cookie_window_days: 30, payout_currency: "USD", notes: "",
    api_key_enc: "", api_secret_enc: "",
    oauth_client_id: "", oauth_client_secret_enc: "", oauth_redirect_uri: "",
  });
  const [saving, setSaving] = useState(false);
  const [revealField, setRevealField] = useState<string | null>(null);
  const [revealValue, setRevealValue] = useState<string>("");
  const [passwordPrompt, setPasswordPrompt] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
    "x-client-authorization": `Bearer ${session?.access_token}`,
    "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  });

  const handleSlug = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
    setForm((f: any) => ({ ...f, display_name: name, slug }));
  };

  const save = async () => {
    if (!form.display_name || !form.slug || !form.category) {
      toast({ title: "Name, slug, and category required", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const action = isNew ? "create" : "update";
      const body = isNew ? { ...form } : { ...form, id: network.id };
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/affiliate-networks-crud?action=${action}`, {
        method: "POST", headers: getHeaders(), body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      toast({ title: isNew ? "✅ Network created" : "✅ Network updated" });
      onSaved();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const revealCredential = async (field: string) => {
    setPasswordPrompt(field);
  };

  const submitReveal = async () => {
    if (!passwordPrompt || !password) return;
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/affiliate-reveal-credential`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ networkId: network.id, field: passwordPrompt, password }),
      });
      const data = await resp.json();
      if (data.error) { toast({ title: data.error, variant: "destructive" }); return; }
      setRevealField(passwordPrompt);
      setRevealValue(data.value || "");
      setPasswordPrompt(null);
      setPassword("");
      // Auto-hide after 30 seconds
      setTimeout(() => { setRevealField(null); setRevealValue(""); }, 30000);
    } catch { toast({ title: "Reveal failed", variant: "destructive" }); }
  };

  // Deeplink preview
  const previewDeeplink = (form.deeplink_template || "")
    .replace("{affiliate_id}", form.affiliate_id || "YOUR_ID")
    .replace("{sub_id}", "mpp-trip123-user456")
    .replace("{checkIn}", "2026-06-01")
    .replace("{checkOut}", "2026-06-05")
    .replace("{origin}", "JFK")
    .replace("{destination}", "MCO")
    .replace("{adults}", "2")
    .replace("{children}", "1")
    .replace("{depart_date}", "2026-06-01")
    .replace("{return_date}", "2026-06-05")
    .replace("{base_url}", form.base_url || "");

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="ml-auto w-full max-w-lg bg-card border-l border-white/10 overflow-y-auto relative z-10">
        <div className="sticky top-0 bg-card border-b border-white/10 px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{isNew ? "Add Network" : `Edit: ${form.display_name}`}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="px-5 py-4 space-y-6">
          {/* Basics */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Basics</h3>
            <div>
              <Label className="text-xs">Display Name</Label>
              <Input value={form.display_name} onChange={e => handleSlug(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Slug</Label>
              <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Priority (lower = first)</Label>
                <Input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 100 })} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.sandbox_mode} onCheckedChange={v => setForm({ ...form, sandbox_mode: v })} />
              <Label className="text-xs">Sandbox Mode</Label>
            </div>
          </section>

          {/* Credentials */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Credentials</h3>
            <div>
              <Label className="text-xs">Auth Type</Label>
              <Select value={form.auth_type} onValueChange={v => setForm({ ...form, auth_type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUTH_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Affiliate ID</Label>
              <Input value={form.affiliate_id || ""} onChange={e => setForm({ ...form, affiliate_id: e.target.value })} className="mt-1" />
            </div>
            {CREDENTIAL_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type={revealField === key ? "text" : "password"}
                    value={revealField === key ? revealValue : (form[key] || "")}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="flex-1"
                  />
                  {!isNew && (
                    <Button variant="outline" size="sm" onClick={() => revealCredential(key)}>
                      {revealField === key ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {form.auth_type === "oauth" && (
              <>
                <div>
                  <Label className="text-xs">OAuth Client ID</Label>
                  <Input value={form.oauth_client_id || ""} onChange={e => setForm({ ...form, oauth_client_id: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">OAuth Redirect URI</Label>
                  <Input value={form.oauth_redirect_uri || ""} onChange={e => setForm({ ...form, oauth_redirect_uri: e.target.value })} className="mt-1" />
                </div>
              </>
            )}
          </section>

          {/* Deeplink & Tracking */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Deeplink & Tracking</h3>
            <div>
              <Label className="text-xs">Base URL</Label>
              <Input value={form.base_url || ""} onChange={e => setForm({ ...form, base_url: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Deeplink Template</Label>
              <Textarea value={form.deeplink_template || ""} onChange={e => setForm({ ...form, deeplink_template: e.target.value })} className="mt-1 text-xs" rows={3} />
              <p className="text-[10px] text-muted-foreground mt-1">Tokens: {"{affiliate_id} {sub_id} {checkIn} {checkOut} {origin} {destination} {adults} {children} {tripId} {userId}"}</p>
            </div>
            {previewDeeplink && (
              <div className="p-2 rounded bg-white/5 text-[10px] text-muted-foreground break-all">
                <span className="text-primary font-semibold">Preview:</span> {previewDeeplink}
              </div>
            )}
            <div>
              <Label className="text-xs">Sub-ID Pattern</Label>
              <Input value={form.sub_id_pattern || ""} onChange={e => setForm({ ...form, sub_id_pattern: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Tracking Pixel URL</Label>
              <Input value={form.tracking_pixel_url || ""} onChange={e => setForm({ ...form, tracking_pixel_url: e.target.value })} className="mt-1" />
            </div>
          </section>

          {/* Webhook */}
          {!isNew && (
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Webhook</h3>
              <div>
                <Label className="text-xs">Webhook URL (auto-generated)</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={form.webhook_url || ""} readOnly className="flex-1 text-xs" />
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(form.webhook_url || ""); toast({ title: "Copied!" }); }}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* Commission */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Commission Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Commission Rate</Label>
                <Input value={form.commission_rate_display || ""} onChange={e => setForm({ ...form, commission_rate_display: e.target.value })} placeholder="e.g. 4–6%" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Cookie Window (days)</Label>
                <Input type="number" value={form.cookie_window_days || ""} onChange={e => setForm({ ...form, cookie_window_days: parseInt(e.target.value) || null })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={2} />
            </div>
          </section>

          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? "Saving..." : isNew ? "Create Network" : "Save Changes"}
          </Button>
        </div>

        {/* Password prompt modal */}
        {passwordPrompt && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
            <div className="bg-card rounded-xl p-6 w-80 space-y-3">
              <h3 className="font-bold text-foreground">Re-enter your password</h3>
              <p className="text-xs text-muted-foreground">Required to reveal credentials. Value will be visible for 30 seconds.</p>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your admin password" autoFocus />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setPasswordPrompt(null); setPassword(""); }} className="flex-1">Cancel</Button>
                <Button onClick={submitReveal} className="flex-1">Reveal</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
