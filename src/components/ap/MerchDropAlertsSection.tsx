import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BrandPassSwitcher from "./BrandPassSwitcher";
import { BrandScope } from "@/lib/brandScope";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Bell, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MerchDropAlertsSection = () => {
  const { user } = useAuth();
  const [brand, setBrand] = useState<BrandScope | null>(null);
  const [drops, setDrops] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [keywords, setKeywords] = useState("");

  useEffect(() => {
    if (!brand) return;
    setLoading(true);
    Promise.all([
      supabase.from("ap_merch_drops" as any).select("*").eq("brand_id", brand.id).is("retired_at", null).order("release_date", { ascending: true }),
      user ? supabase.from("ap_merch_alerts" as any).select("*").eq("user_id", user.id).eq("brand_id", brand.id).eq("status", "active") : Promise.resolve({ data: [] }),
    ]).then(([dropsRes, alertsRes]) => {
      setDrops((dropsRes.data as any[]) || []);
      setAlerts((alertsRes.data as any[]) || []);
      setLoading(false);
    });
  }, [brand, user]);

  const handleAlertDrop = async (drop: any) => {
    if (!user || !brand) return;
    const { error } = await supabase.from("ap_merch_alerts" as any).insert({
      user_id: user.id,
      brand_id: brand.id,
      drop_id: drop.id,
      status: "active",
    } as any);
    if (error) {
      toast.error("Failed to create alert");
    } else {
      toast.success(`Alert set for ${drop.name}`);
      const { data } = await supabase.from("ap_merch_alerts" as any).select("*").eq("user_id", user.id).eq("brand_id", brand.id).eq("status", "active");
      setAlerts((data as any[]) || []);
    }
  };

  const handleKeywordAlert = async () => {
    if (!user || !brand || !keywords.trim()) return;
    const kw = keywords.split(",").map((k) => k.trim()).filter(Boolean);
    const { error } = await supabase.from("ap_merch_alerts" as any).insert({
      user_id: user.id,
      brand_id: brand.id,
      keywords: kw,
      status: "active",
    } as any);
    if (error) {
      toast.error("Failed to create keyword alert");
    } else {
      toast.success("Keyword alert created!");
      setShowKeywordModal(false);
      setKeywords("");
      const { data } = await supabase.from("ap_merch_alerts" as any).select("*").eq("user_id", user.id).eq("brand_id", brand.id).eq("status", "active");
      setAlerts((data as any[]) || []);
    }
  };

  const handleCancelAlert = async (id: string) => {
    await supabase.from("ap_merch_alerts" as any).update({ status: "cancelled" } as any).eq("id", id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    toast.success("Alert cancelled");
  };

  const isAlerted = (dropId: string) => alerts.some((a) => a.drop_id === dropId);
  const upcomingDrops = drops.filter((d) => !d.release_date || new Date(d.release_date) > new Date());
  const recentDrops = drops.filter((d) => d.release_date && new Date(d.release_date) <= new Date());

  return (
    <div className="rounded-xl bg-card gold-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm md:text-base font-bold text-foreground">🛍️ AP Merchandise Drop Alerts</h2>
        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setShowKeywordModal(true)}>
          <Plus className="w-3 h-3" /> Keyword Watch
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Limited edition drops sell out in minutes — be first</p>

      <div className="mb-4">
        <BrandPassSwitcher onBrandChange={setBrand} selectedBrandId={brand?.id} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Upcoming Drops */}
          {upcomingDrops.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Upcoming Drops</p>
              <div className="space-y-2">
                {upcomingDrops.map((drop) => (
                  <div key={drop.id} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">{drop.name}</p>
                      <p className="text-[10px] text-muted-foreground">{drop.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {drop.release_date && (
                          <span className="text-[10px] text-primary font-semibold">
                            📅 {new Date(drop.release_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                        {drop.price_msrp && <span className="text-[10px] text-muted-foreground">${drop.price_msrp}</span>}
                        {drop.is_limited && <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-red-500/30 text-red-400">Limited</Badge>}
                        {(drop.tags || []).slice(0, 2).map((t: string) => (
                          <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0">{t}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isAlerted(drop.id) ? "outline" : "default"}
                      className="text-xs gap-1 shrink-0"
                      onClick={() => !isAlerted(drop.id) && handleAlertDrop(drop)}
                      disabled={isAlerted(drop.id)}
                    >
                      <Bell className="w-3 h-3" /> {isAlerted(drop.id) ? "Alerted" : "Alert Me"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Drops */}
          {recentDrops.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Releases</p>
              <div className="space-y-2">
                {recentDrops.slice(0, 3).map((drop) => (
                  <div key={drop.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-primary/5 opacity-80">
                    <span className="text-sm">✅</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{drop.name}</p>
                      <p className="text-[10px] text-muted-foreground">Released {new Date(drop.release_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Alerts */}
          {alerts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">My Alerts</p>
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-primary/10">
                    <Bell className="w-3.5 h-3.5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      {a.drop_id ? (
                        <p className="text-xs text-foreground">Watching specific drop</p>
                      ) : (
                        <p className="text-xs text-foreground">Keywords: {(a.keywords || []).join(", ")}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleCancelAlert(a.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {drops.length === 0 && alerts.length === 0 && (
            <div className="rounded-xl bg-muted/20 border border-primary/10 p-6 text-center">
              <p className="text-sm text-muted-foreground">No upcoming drops yet. Set up keyword alerts to be notified when new drops are announced.</p>
            </div>
          )}
        </>
      )}

      {/* Keyword Alert Modal */}
      <Dialog open={showKeywordModal} onOpenChange={setShowKeywordModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Keyword Watch Alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Enter keywords separated by commas. You'll be notified when any new drop matches.</p>
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder='e.g. Loungefly, Spirit Jersey, Star Wars' className="text-sm" />
            <Button onClick={handleKeywordAlert} disabled={!keywords.trim()} className="w-full">Create Keyword Alert</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MerchDropAlertsSection;
