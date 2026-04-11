import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, X, CreditCard, Loader2 } from "lucide-react";

interface CreditCardsSectionProps {
  userId: string;
}

const membershipTypes = [
  { value: "tables_in_wonderland", label: "Tables in Wonderland", emoji: "🍽️" },
  { value: "dvc", label: "DVC Membership", emoji: "🏰" },
  { value: "aaa", label: "AAA Member", emoji: "🚗" },
  { value: "costco_travel", label: "Costco Travel", emoji: "🛒" },
  { value: "military", label: "Military Salute", emoji: "🎖️" },
];

const CreditCardsSection = ({ userId }: CreditCardsSectionProps) => {
  const [allCards, setAllCards] = useState<any[]>([]);
  const [userCards, setUserCards] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [showMembershipAdd, setShowMembershipAdd] = useState(false);
  const [newMembershipType, setNewMembershipType] = useState("");
  const [newMembershipExp, setNewMembershipExp] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("credit_cards" as any).select("*").order("issuer"),
      supabase.from("user_credit_cards").select("*").eq("user_id", userId),
      supabase.from("user_memberships" as any).select("*").eq("user_id", userId),
    ]).then(([cardsRes, userCardsRes, memRes]) => {
      setAllCards((cardsRes.data as any[]) || []);
      setUserCards((userCardsRes.data as any[]) || []);
      setMemberships((memRes.data as any[]) || []);
      setLoading(false);
    });
  }, [userId]);

  const addCard = async (cardId: string) => {
    if (userCards.some((uc) => uc.card_id === cardId)) return;
    setSaving(true);
    const { error } = await supabase.from("user_credit_cards").insert({
      user_id: userId,
      card_id: cardId,
      is_primary: userCards.length === 0,
    });
    if (!error) {
      const { data } = await supabase.from("user_credit_cards").select("*").eq("user_id", userId);
      setUserCards(data || []);
      toast.success("Card added");
    }
    setSaving(false);
    setShowSearch(false);
    setSearch("");
  };

  const removeCard = async (id: string) => {
    await supabase.from("user_credit_cards").delete().eq("id", id);
    setUserCards((prev) => prev.filter((c) => c.id !== id));
    toast.success("Card removed");
  };

  const togglePrimary = async (id: string) => {
    // Set all to non-primary, then set this one
    for (const uc of userCards) {
      if (uc.id !== id && uc.is_primary) {
        await supabase.from("user_credit_cards").update({ is_primary: false }).eq("id", uc.id);
      }
    }
    await supabase.from("user_credit_cards").update({ is_primary: true }).eq("id", id);
    setUserCards((prev) => prev.map((c) => ({ ...c, is_primary: c.id === id })));
  };

  const addMembership = async () => {
    if (!newMembershipType) return;
    setSaving(true);
    await supabase.from("user_memberships" as any).insert({
      user_id: userId,
      membership_type: newMembershipType,
      expiration_date: newMembershipExp || null,
      is_active: true,
    } as any);
    const { data } = await supabase.from("user_memberships" as any).select("*").eq("user_id", userId);
    setMemberships((data as any[]) || []);
    setShowMembershipAdd(false);
    setNewMembershipType("");
    setNewMembershipExp("");
    setSaving(false);
    toast.success("Membership added");
  };

  const removeMembership = async (id: string) => {
    await supabase.from("user_memberships" as any).delete().eq("id", id);
    setMemberships((prev) => prev.filter((m) => m.id !== id));
    toast.success("Membership removed");
  };

  const filteredCards = search
    ? allCards.filter((c) => `${c.issuer} ${c.name}`.toLowerCase().includes(search.toLowerCase()))
    : allCards;

  const getCardDetails = (cardId: string) => allCards.find((c) => c.id === cardId);

  if (loading) return <div className="h-20 bg-muted/20 rounded-xl animate-pulse" />;

  return (
    <Card className="border-primary/20 bg-card/80 mb-6 overflow-hidden">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-base md:text-lg">💳 Credit Cards & Memberships</CardTitle>
        <CardDescription>Used by the Stacking Calculator and discount matching</CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
        {/* User's Cards */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">My Cards</p>
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setShowSearch(!showSearch)}>
              <Plus className="w-3 h-3" /> Add Card
            </Button>
          </div>

          {showSearch && (
            <div className="mb-3 space-y-2">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by issuer or card name..." className="text-sm" autoFocus />
              <div className="max-h-40 overflow-y-auto rounded-lg border border-primary/10">
                {filteredCards.filter((c) => !userCards.some((uc) => uc.card_id === c.id)).map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left px-3 py-2 hover:bg-muted/30 text-sm border-b border-primary/5 last:border-0 flex justify-between items-center"
                    onClick={() => addCard(c.id)}
                  >
                    <span><strong>{c.issuer}</strong> {c.name}</span>
                    <span className="text-[10px] text-muted-foreground">{c.reward_type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {userCards.length === 0 ? (
            <p className="text-xs text-muted-foreground">No cards added yet.</p>
          ) : (
            <div className="space-y-2">
              {userCards.map((uc) => {
                const card = getCardDetails(uc.card_id);
                return (
                  <div key={uc.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 border border-primary/5">
                    <CreditCard className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{card?.issuer} {card?.name}</p>
                      <p className="text-[10px] text-muted-foreground">{card?.notes}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Switch checked={uc.is_primary} onCheckedChange={() => togglePrimary(uc.id)} />
                        <span className="text-[10px] text-muted-foreground">Primary</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeCard(uc.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Memberships */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Memberships</p>
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setShowMembershipAdd(!showMembershipAdd)}>
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>

          {showMembershipAdd && (
            <div className="mb-3 flex gap-2 items-end">
              <div className="flex-1">
                <Select value={newMembershipType} onValueChange={setNewMembershipType}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select membership" /></SelectTrigger>
                  <SelectContent>
                    {membershipTypes.filter((t) => !memberships.some((m) => m.membership_type === t.value)).map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input type="date" value={newMembershipExp} onChange={(e) => setNewMembershipExp(e.target.value)} className="text-sm w-36" placeholder="Exp. date" />
              <Button size="sm" onClick={addMembership} disabled={!newMembershipType || saving}>Add</Button>
            </div>
          )}

          {memberships.length === 0 ? (
            <p className="text-xs text-muted-foreground">No memberships added.</p>
          ) : (
            <div className="space-y-2">
              {memberships.map((m) => {
                const type = membershipTypes.find((t) => t.value === m.membership_type);
                const expired = m.expiration_date && new Date(m.expiration_date) < new Date();
                return (
                  <div key={m.id} className={`flex items-center gap-3 p-2 rounded-lg border ${expired ? "bg-red-500/5 border-red-500/20" : "bg-muted/20 border-primary/5"}`}>
                    <span className="text-sm">{type?.emoji || "✓"}</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">{type?.label || m.membership_type}</p>
                      {m.expiration_date && (
                        <p className={`text-[10px] ${expired ? "text-red-400" : "text-muted-foreground"}`}>
                          {expired ? "Expired" : "Expires"}: {new Date(m.expiration_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeMembership(m.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditCardsSection;
