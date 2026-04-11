import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PARKS = [
  { id: "magic-kingdom", label: "Magic Kingdom" }, { id: "epcot", label: "EPCOT" },
  { id: "hollywood-studios", label: "Hollywood Studios" }, { id: "animal-kingdom", label: "Animal Kingdom" },
  { id: "typhoon-lagoon", label: "Typhoon Lagoon" }, { id: "blizzard-beach", label: "Blizzard Beach" },
];

interface Props { item: any | null; onClose: () => void; onSaved: () => void; }

export default function MerchFormModal({ item, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const isNew = !item;
  const [form, setForm] = useState({
    name: item?.name || "", park_id: item?.park_id || "magic-kingdom", land: item?.land || "",
    location: item?.location || "", description: item?.description || "", image_url: item?.image_url || "",
    is_limited: item?.is_limited || false, tags: (item?.tags || []).join(", "),
    valid_from: item?.valid_from || "", valid_to: item?.valid_to || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name || !form.land || !form.location) { toast({ title: "Name, land, and location required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const record: any = {
        name: form.name, park_id: form.park_id, land: form.land, location: form.location,
        description: form.description || null, image_url: form.image_url || null,
        is_limited: form.is_limited, tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        valid_from: form.valid_from || null, valid_to: form.valid_to || null,
        updated_at: new Date().toISOString(),
      };
      if (isNew) {
        const { error } = await supabase.from("merchandise").insert(record);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("merchandise").update(record).eq("id", item.id);
        if (error) throw error;
      }
      toast({ title: isNew ? "✅ Merchandise added" : "✅ Merchandise updated" });
      onSaved();
    } catch (err: any) { toast({ title: "Save failed", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card rounded-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground">{isNew ? "Add Merchandise" : "Edit Merchandise"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Park</Label>
            <Select value={form.park_id} onValueChange={v => setForm({ ...form, park_id: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{PARKS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Land</Label><Input value={form.land} onChange={e => setForm({ ...form, land: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} /></div>
          <div><Label className="text-xs">Image URL</Label><Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Valid From</Label><Input type="date" value={form.valid_from} onChange={e => setForm({ ...form, valid_from: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Valid To</Label><Input type="date" value={form.valid_to} onChange={e => setForm({ ...form, valid_to: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label className="text-xs">Tags (comma-separated)</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="mt-1" /></div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_limited} onCheckedChange={v => setForm({ ...form, is_limited: v })} />
            <Label className="text-xs">Limited Edition</Label>
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="w-full">{saving ? "Saving..." : isNew ? "Add Merchandise" : "Save Changes"}</Button>
      </div>
    </div>
  );
}
