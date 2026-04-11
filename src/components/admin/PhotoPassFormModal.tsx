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

export default function PhotoPassFormModal({ item, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const isNew = !item;
  const [form, setForm] = useState({
    park_id: item?.park_id || "magic-kingdom", land: item?.land || "",
    description: item?.description || "", is_magic_shot: item?.is_magic_shot || false,
    lat: item?.lat?.toString() || "", lng: item?.lng?.toString() || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.land) { toast({ title: "Land required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const record: any = {
        park_id: form.park_id, land: form.land, description: form.description || null,
        is_magic_shot: form.is_magic_shot,
        lat: form.lat ? parseFloat(form.lat) : null, lng: form.lng ? parseFloat(form.lng) : null,
        updated_at: new Date().toISOString(),
      };
      if (isNew) {
        const { error } = await supabase.from("photopass_locations").insert(record);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("photopass_locations").update(record).eq("id", item.id);
        if (error) throw error;
      }
      toast({ title: isNew ? "✅ PhotoPass location added" : "✅ PhotoPass location updated" });
      onSaved();
    } catch (err: any) { toast({ title: "Save failed", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground">{isNew ? "Add PhotoPass Location" : "Edit PhotoPass Location"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div><Label className="text-xs">Park</Label>
            <Select value={form.park_id} onValueChange={v => setForm({ ...form, park_id: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{PARKS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Land</Label><Input value={form.land} onChange={e => setForm({ ...form, land: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Latitude</Label><Input type="number" step="any" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Longitude</Label><Input type="number" step="any" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_magic_shot} onCheckedChange={v => setForm({ ...form, is_magic_shot: v })} />
            <Label className="text-xs">Magic Shot Location</Label>
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="w-full">{saving ? "Saving..." : isNew ? "Add Location" : "Save Changes"}</Button>
      </div>
    </div>
  );
}
