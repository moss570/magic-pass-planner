import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BrandPassSwitcher from "./BrandPassSwitcher";
import { BrandScope } from "@/lib/brandScope";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pause, X, ExternalLink } from "lucide-react";
import CompassButton from "@/components/CompassButton";

const HotelDealAlertsSection = () => {
  const { user } = useAuth();
  const [brand, setBrand] = useState<BrandScope | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [hotels, setHotels] = useState<any[]>([]);

  // Form state
  const [hotelName, setHotelName] = useState("");
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [targetType, setTargetType] = useState<"discount" | "rate">("discount");
  const [targetValue, setTargetValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("ap_hotel_alerts" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAlerts((data as any[]) || []);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    // Load hotels for autocomplete filtered by brand
    supabase
      .from("off_property_hotels")
      .select("id, name")
      .order("name")
      .then(({ data }) => setHotels(data || []));
  }, [brand]);

  const handleCreate = async () => {
    if (!user || !brand || !hotelName || !checkIn || !checkOut || !targetValue) return;
    setSaving(true);
    const { error } = await supabase.from("ap_hotel_alerts" as any).insert({
      user_id: user.id,
      brand_id: brand.id,
      hotel_id: hotelId,
      hotel_name: hotelName,
      check_in: checkIn,
      check_out: checkOut,
      adults,
      children,
      target_discount_percent: targetType === "discount" ? parseInt(targetValue) : null,
      target_max_rate: targetType === "rate" ? parseFloat(targetValue) : null,
      status: "watching",
    } as any);

    if (error) {
      toast.error("Failed to create alert");
    } else {
      toast.success("Hotel alert created!");
      setShowCreate(false);
      // Refresh
      const { data } = await supabase.from("ap_hotel_alerts" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setAlerts((data as any[]) || []);
    }
    setSaving(false);
  };

  const handleCancel = async (id: string) => {
    await supabase.from("ap_hotel_alerts" as any).update({ status: "cancelled" } as any).eq("id", id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));
    toast.success("Alert cancelled");
  };

  const watchingAlerts = alerts.filter((a) => a.status === "watching" || a.status === "found");

  return (
    <div className="rounded-xl bg-card gold-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm md:text-base font-bold text-foreground">🏨 AP Hotel Deal Alerts</h2>
        <Button size="sm" className="text-xs gap-1" onClick={() => setShowCreate(true)}>
          <Plus className="w-3 h-3" /> Create Alert
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">We watch for passholder room discounts — you get alerted instantly</p>

      <div className="mb-4">
        <BrandPassSwitcher onBrandChange={setBrand} selectedBrandId={brand?.id} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-muted/20 rounded-lg animate-pulse" />)}
        </div>
      ) : watchingAlerts.length === 0 ? (
        <div className="rounded-xl bg-muted/20 border border-primary/10 p-6 text-center">
          <p className="text-sm text-muted-foreground">No active hotel alerts. Create one to start watching for AP-exclusive rates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {watchingAlerts.map((a) => (
            <div key={a.id} className={`rounded-lg p-3 border ${a.status === "found" ? "bg-green-500/5 border-green-500/20" : "bg-muted/20 border-primary/5"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">
                    {a.status === "found" ? "🟢 FOUND" : "👀 WATCHING"} — {a.hotel_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {a.check_in} → {a.check_out} · {a.adults} adults{a.children > 0 ? `, ${a.children} children` : ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Target: {a.target_discount_percent ? `${a.target_discount_percent}% off` : `≤$${a.target_max_rate}/night`}
                    {a.current_best_rate ? ` · Current best: $${a.current_best_rate}/night` : ""}
                  </p>
                  {a.last_checked_at && (
                    <p className="text-[10px] text-muted-foreground/60">Last checked: {new Date(a.last_checked_at).toLocaleString()}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {a.status === "found" && (
                    <Button size="sm" className="text-xs gap-1">
                      <ExternalLink className="w-3 h-3" /> Book Now
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => handleCancel(a.id)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Alert Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Hotel Alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Hotel Name</label>
              <Input value={hotelName} onChange={(e) => setHotelName(e.target.value)} placeholder="e.g. Port Orleans Riverside" className="text-sm" list="hotel-list" />
              <datalist id="hotel-list">
                {hotels.map((h) => <option key={h.id} value={h.name} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Check In</label>
                <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Check Out</label>
                <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Adults</label>
                <Input type="number" value={adults} onChange={(e) => setAdults(parseInt(e.target.value) || 2)} min={1} className="text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Children</label>
                <Input type="number" value={children} onChange={(e) => setChildren(parseInt(e.target.value) || 0)} min={0} className="text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Target</label>
              <div className="flex gap-2">
                <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                  <SelectTrigger className="w-36 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">% Discount</SelectItem>
                    <SelectItem value="rate">Max Rate</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder={targetType === "discount" ? "e.g. 25" : "e.g. 199"} className="text-sm" />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={saving || !hotelName || !checkIn || !checkOut || !targetValue} className="w-full">
              {saving ? "Creating..." : "Create Alert"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HotelDealAlertsSection;
