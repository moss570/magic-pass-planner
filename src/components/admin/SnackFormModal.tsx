import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PARKS = [
  { id: "magic-kingdom", label: "Magic Kingdom" }, { id: "epcot", label: "EPCOT" },
  { id: "hollywood-studios", label: "Hollywood Studios" }, { id: "animal-kingdom", label: "Animal Kingdom" },
  { id: "typhoon-lagoon", label: "Typhoon Lagoon" }, { id: "blizzard-beach", label: "Blizzard Beach" },
];

interface Props { item: any | null; onClose: () => void; onSaved: () => void; }

export default function SnackFormModal({ item, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const isNew = !item;
  const [form, setForm] = useState({
    name: item?.name || "", park_id: item?.park_id || "magic-kingdom", land: item?.land || "",
    location: item?.location || "", image_url: item?.image_url || "",
    price: item?.price?.toString() || "", dietary_flags: (item?.dietary_flags || []).join(", "),
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name || !form.land || !form.location) { toast({ title: "Name, land, and location required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const record: any = {
        name: form.name, park_id: form.park_id, land: form.land, location: form.location,
        image_url: form.image_url || null, price: form.price ? parseFloat(form.price) : null,
        dietary_flags: form.dietary_flags ? form.dietary_flags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        updated_at: new Date().toISOString(),
      };
      if (isNew) {
        const { error } = await supabase.from("snacks").insert(record);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("snacks").update(record).eq("id", item.id);
        if (error) throw error;
      }
      toast({ title: isNew ? "✅ Snack added" : "✅ Snack updated" });
      onSaved();
    } catch (err: any) { toast({ title: "Save failed", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card rounded-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground">{isNew ? "Add Snack" : "Edit Snack"}</h2>
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
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Price ($)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Image URL</Label><Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label className="text-xs">Dietary Flags (comma-separated)</Label><Input value={form.dietary_flags} onChange={e => setForm({ ...form, dietary_flags: e.target.value })} placeholder="e.g. vegan, gluten-free" className="mt-1" /></div>
        </div>
        <Button onClick={save} disabled={saving} className="w-full">{saving ? "Saving..." : isNew ? "Add Snack" : "Save Changes"}</Button>
      </div>
    </div>
  );
}
