import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, X, Ticket } from "lucide-react";

interface BrandPassesSectionProps {
  userId: string;
}

const BrandPassesSection = ({ userId }: BrandPassesSectionProps) => {
  const [brands, setBrands] = useState<any[]>([]);
  const [passes, setPasses] = useState<any[]>([]);
  const [userPasses, setUserPasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [selectedPassId, setSelectedPassId] = useState("");
  const [expDate, setExpDate] = useState("");

  useEffect(() => {
    Promise.all([
      supabase.from("park_brands" as any).select("*").order("active", { ascending: false }),
      supabase.from("park_passes" as any).select("*"),
      supabase.from("user_park_passes").select("*").eq("user_id", userId),
    ]).then(([brandsRes, passesRes, userPassesRes]) => {
      setBrands((brandsRes.data as any[]) || []);
      setPasses((passesRes.data as any[]) || []);
      setUserPasses((userPassesRes.data as any[]) || []);
      setLoading(false);
    });
  }, [userId]);

  const addPass = async () => {
    if (!selectedPassId) return;
    const { error } = await supabase.from("user_park_passes").insert({
      user_id: userId,
      pass_id: selectedPassId,
      expiration_date: expDate || null,
      is_active: true,
    });
    if (!error) {
      const { data } = await supabase.from("user_park_passes").select("*").eq("user_id", userId);
      setUserPasses(data || []);
      toast.success("Pass added");
    }
    setAddingFor(null);
    setSelectedPassId("");
    setExpDate("");
  };

  const removePass = async (id: string) => {
    await supabase.from("user_park_passes").delete().eq("id", id);
    setUserPasses((prev) => prev.filter((p) => p.id !== id));
    toast.success("Pass removed");
  };

  const getPassDetails = (passId: string) => passes.find((p) => p.id === passId);
  const getBrandPasses = (brandId: string) => passes.filter((p) => p.brand_id === brandId);
  const getUserPassesForBrand = (brandId: string) => {
    const brandPassIds = getBrandPasses(brandId).map((p) => p.id);
    return userPasses.filter((up) => brandPassIds.includes(up.pass_id));
  };

  if (loading) return <div className="h-20 bg-muted/20 rounded-xl animate-pulse" />;

  return (
    <Card className="border-primary/20 bg-card/80 mb-6 overflow-hidden">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-base md:text-lg">🎟️ Park Brand Passes</CardTitle>
        <CardDescription>You can hold passes for multiple parks. Each will unlock its brand-specific discounts, alerts, and calculator options.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
        {brands.map((brand) => {
          const brandUserPasses = getUserPassesForBrand(brand.id);
          const availablePasses = getBrandPasses(brand.id).filter(
            (p: any) => !brandUserPasses.some((up) => up.pass_id === p.id)
          );

          return (
            <div key={brand.id} className={`rounded-xl border p-4 ${brand.active ? "border-primary/20" : "border-muted/20 opacity-60"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">{brand.name}</h3>
                  {!brand.active && <Badge variant="outline" className="text-[9px]">Coming Soon</Badge>}
                </div>
                {brand.active && availablePasses.length > 0 && (
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setAddingFor(addingFor === brand.id ? null : brand.id)}>
                    <Plus className="w-3 h-3" /> Add Pass
                  </Button>
                )}
              </div>

              {addingFor === brand.id && (
                <div className="flex gap-2 items-end mb-3">
                  <div className="flex-1">
                    <Select value={selectedPassId} onValueChange={setSelectedPassId}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Select pass tier" /></SelectTrigger>
                      <SelectContent>
                        {availablePasses.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="text-sm w-36" placeholder="Exp. date" />
                  <Button size="sm" onClick={addPass} disabled={!selectedPassId}>Add</Button>
                </div>
              )}

              {brandUserPasses.length === 0 ? (
                <p className="text-xs text-muted-foreground">{brand.active ? "No passes added for this brand." : "Available when this brand launches."}</p>
              ) : (
                <div className="space-y-2">
                  {brandUserPasses.map((up) => {
                    const pass = getPassDetails(up.pass_id);
                    const expired = up.expiration_date && new Date(up.expiration_date) < new Date();
                    return (
                      <div key={up.id} className={`flex items-center gap-3 p-2 rounded-lg border ${expired ? "bg-red-500/5 border-red-500/20" : "bg-primary/5 border-primary/10"}`}>
                        <Ticket className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">{pass?.display_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {pass?.blockout_summary}
                            {up.expiration_date && (
                              <span className={expired ? " text-red-400" : ""}>
                                {" · "}{expired ? "Expired" : "Expires"}: {new Date(up.expiration_date).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removePass(up.id)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default BrandPassesSection;
