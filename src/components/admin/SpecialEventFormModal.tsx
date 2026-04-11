import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PARKS = [
  { id: "magic-kingdom", label: "Magic Kingdom" }, { id: "epcot", label: "EPCOT" },
  { id: "hollywood-studios", label: "Hollywood Studios" }, { id: "animal-kingdom", label: "Animal Kingdom" },
  { id: "typhoon-lagoon", label: "Typhoon Lagoon" }, { id: "blizzard-beach", label: "Blizzard Beach" },
];
const CATEGORIES = ["tour", "fireworks_party", "dessert_party", "character_experience", "behind_the_scenes", "seasonal", "other"];

interface Props { item: any | null; onClose: () => void; onSaved: () => void; }

export default function SpecialEventFormModal({ item, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const isNew = !item;
  const [form, setForm] = useState({
    name: item?.name || "", park_id: item?.park_id || "magic-kingdom",
    category: item?.category || "tour", description: item?.description || "",
    duration_min: item?.duration_min?.toString() || "60",
    price_per_person: item?.price_per_person?.toString() || "",
    booking_url: item?.booking_url || "", availability_note: item?.availability_note || "",
    image_url: item?.image_url || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name) { toast({ title: "Name required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const record: any = {
        name: form.name, park_id: form.park_id, category: form.category,
        description: form.description || null, duration_min: parseInt(form.duration_min) || 60,
        price_per_person: form.price_per_person ? parseFloat(form.price_per_person) : null,
        booking_url: form.booking_url || null, availability_note: form.availability_note || null,
        image_url: form.image_url || null, updated_at: new Date().toISOString(),
      };
      if (isNew) {
        const { error } = await (supabase.from("special_events" as any).insert(record) as any);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("special_events" as any).update(record) as any).eq("id", item.id);
        if (error) throw error;
      }
      toast({ title: isNew ? "✅ Special event added" : "✅ Special event updated" });
      onSaved();
    } catch (err: any) { toast({ title: "Save failed", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card rounded-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground">{isNew ? "Add Special Event" : "Edit Special Event"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Park</Label>
              <Select value={form.park_id} onValueChange={v => setForm({ ...form, park_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PARKS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Duration (min)</Label><Input type="number" value={form.duration_min} onChange={e => setForm({ ...form, duration_min: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Price per Person ($)</Label><Input type="number" step="0.01" value={form.price_per_person} onChange={e => setForm({ ...form, price_per_person: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label className="text-xs">Booking URL</Label><Input value={form.booking_url} onChange={e => setForm({ ...form, booking_url: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Availability Note</Label><Input value={form.availability_note} onChange={e => setForm({ ...form, availability_note: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Image URL</Label><Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="mt-1" /></div>
        </div>
        <Button onClick={save} disabled={saving} className="w-full">{saving ? "Saving..." : isNew ? "Add Event" : "Save Changes"}</Button>
      </div>
    </div>
  );
}
