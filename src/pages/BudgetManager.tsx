import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Receipt, DollarSign, ArrowRight, Download, AlertTriangle,
  LayoutList, CalendarDays
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AutoExpenseRow from "@/components/budget/AutoExpenseRow";
import CategoryBudgetCap from "@/components/budget/CategoryBudgetCap";
import BudgetTimelineView from "@/components/budget/BudgetTimelineView";
import { isFeatureEnabled } from "@/lib/featureFlags";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const SUPABASE_ANON = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";

const CATEGORIES = [
  { value: "tickets", label: "🎟️ Tickets & Passes", color: "bg-primary/20 text-primary" },
  { value: "hotel", label: "🏨 Hotel", color: "bg-purple-500/20 text-purple-400" },
  { value: "dining", label: "🍽️ Dining", color: "bg-orange-500/20 text-orange-400" },
  { value: "lightning-lane", label: "⚡ Lightning Lane", color: "bg-yellow-500/20 text-yellow-400" },
  { value: "merchandise", label: "🛍️ Merchandise", color: "bg-pink-500/20 text-pink-400" },
  { value: "transportation", label: "🚗 Transportation", color: "bg-blue-500/20 text-blue-400" },
  { value: "misc", label: "📦 Misc / Extras", color: "bg-muted text-muted-foreground" },
];

export default function BudgetManager() {
  const { session } = useAuth();
  const { toast } = useToast();

  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [settleUp, setSettleUp] = useState<any[]>([]);
  const [totalShared, setTotalShared] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"categories" | "timeline">("categories");

  // Version binding
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");

  // Add expense form
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseType, setExpenseType] = useState<"personal" | "shared">("personal");
  const [category, setCategory] = useState("misc");
  const [paidByMember, setPaidByMember] = useState("");
  const [splitWith, setSplitWith] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
    "x-client-authorization": `Bearer ${session?.access_token}`,
    "apikey": SUPABASE_ANON,
  });

  // Load trips
  useEffect(() => {
    if (!session) return;
    supabase.from("saved_trips")
      .select("id, name, parks, start_date, estimated_total, itinerary, category_caps")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setTrips(data || []);
        if (data && data.length > 0) selectTrip(data[0]);
        else setLoading(false);
      });
  }, [session]);

  const selectTrip = async (trip: any) => {
    setSelectedTrip(trip);
    setLoading(true);
    try {
      // Load members
      const membResp = await fetch(`${SUPABASE_URL}/functions/v1/social?action=trip-members&tripId=${trip.id}`, { headers: getHeaders() });
      const membData = await membResp.json();
      setMembers(membData.members || []);

      // Load expenses from social function (manual + split data)
      const expResp = await fetch(`${SUPABASE_URL}/functions/v1/social?action=expenses&tripId=${trip.id}`, { headers: getHeaders() });
      const expData = await expResp.json();

      // Merge auto expenses from itinerary.budgetExpenses
      const autoExpenses = ((trip.itinerary as any)?.budgetExpenses || []);
      const socialExpenses = expData.expenses || [];
      const allExpenses = [...socialExpenses, ...autoExpenses.filter((ae: any) => !socialExpenses.some((se: any) => se.id === ae.id))];
      setExpenses(allExpenses);
      setSettleUp(expData.settleUp || []);
      setTotalShared(expData.totalShared || 0);

      // Load versions if feature enabled
      if (isFeatureEnabled("itineraryVersions")) {
        const verResp = await fetch(`${SUPABASE_URL}/functions/v1/trips?action=list-versions&trip_id=${trip.id}`, { headers: getHeaders() });
        const verData = await verResp.json();
        setVersions(verData.versions || []);
        const active = (verData.versions || []).find((v: any) => v.is_active);
        setSelectedVersionId(active?.id || "");
      }
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async () => {
    if (!desc || !amount || !selectedTrip) return;
    setSaving(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/social?action=add-expense`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          tripId: selectedTrip.id,
          description: desc,
          amount: parseFloat(amount),
          expenseType,
          paidByMemberId: paidByMember || null,
          category,
          splitWith: expenseType === "shared" ? splitWith : [],
          date: new Date().toISOString().split("T")[0],
        }),
      });
      const data = await resp.json();
      if (data.success) {
        toast({ title: "✅ Expense logged" });
        setDesc(""); setAmount(""); setExpenseType("personal"); setCategory("misc");
        setPaidByMember(""); setSplitWith([]);
        setShowAddExpense(false);
        selectTrip(selectedTrip);
      }
    } catch {
      toast({ title: "Failed to save expense", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPayer = async (expenseId: string, payerId: string) => {
    setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, paidByUserId: payerId } : e));
  };

  const handleDeleteExpense = async (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    toast({ title: "Expense removed" });
  };

  const handleUnlinkExpense = (expenseId: string) => {
    setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, source: "manual", sourceRef: null } : e));
    toast({ title: "Expense unlinked from source" });
  };

  const handleUpdateCap = async (cat: string, cap: number | null) => {
    if (!selectedTrip) return;
    const caps = { ...(selectedTrip.category_caps || {}), [cat]: cap || 0 };
    if (!cap) delete caps[cat];
    await supabase.from("saved_trips").update({ category_caps: caps } as any).eq("id", selectedTrip.id);
    setSelectedTrip({ ...selectedTrip, category_caps: caps });
  };

  // Computed values
  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const budget = selectedTrip?.estimated_total || 6500;
  const remaining = budget - totalSpent;

  const categorySpend = useMemo(() => {
    const spend: Record<string, number> = {};
    expenses.forEach(e => {
      spend[e.category] = (spend[e.category] || 0) + Number(e.amount);
    });
    return spend;
  }, [expenses]);

  const autoExpensesMissingPayer = expenses.filter(e => (e.source === "auto" || e.sourceRef) && !e.paidByUserId);

  const exportCSV = () => {
    const rows = [["Date", "Category", "Description", "Amount", "Paid by", "Shared with", "Status"]];
    expenses.forEach(exp => {
      const cat = CATEGORIES.find(c => c.value === exp.category);
      const paidBy = members.find(m => m.id === (exp.paid_by_member_id || exp.paidByUserId));
      rows.push([
        exp.date || "",
        cat?.label || exp.category,
        exp.description,
        Number(exp.amount).toFixed(2),
        paidBy ? `${paidBy.first_name} ${paidBy.last_name || ""}`.trim() : "",
        (exp.splitWith || []).length > 0 ? "Shared" : "Personal",
        exp.source === "auto" ? "Auto" : "Manual",
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-${selectedTrip?.name || "trip"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "📥 CSV exported" });
  };

  if (loading) {
    return (
      <DashboardLayout title="💰 Budget Manager" subtitle="Track your Disney trip expenses">
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading budget data…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (trips.length === 0) {
    return (
      <DashboardLayout title="💰 Budget Manager" subtitle="Track your Disney trip expenses">
        <div className="text-center py-16">
          <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm font-semibold text-foreground mb-2">No trips yet</p>
          <p className="text-xs text-muted-foreground mb-6">Create a trip in Trip Planner to start tracking expenses</p>
          <Link to="/trip-planner" className="px-6 py-2.5 rounded-xl font-bold text-sm text-primary-foreground bg-primary inline-block">
            Create My First Trip →
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="💰 Budget Manager" subtitle={selectedTrip ? `${selectedTrip.name} — ${selectedTrip.start_date}` : "Track your Disney trip expenses"}>
      <div className="space-y-5">

        {/* Trip selector */}
        {trips.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {trips.map(trip => (
              <button key={trip.id} onClick={() => selectTrip(trip)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors border ${selectedTrip?.id === trip.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-border/80"}`}>
                {trip.name}
              </button>
            ))}
          </div>
        )}

        {/* Version + View toggle row */}
        {selectedTrip && (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {versions.length > 0 && (
              <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="All versions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-xs">All versions</SelectItem>
                  {versions.map((v: any) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs">
                      {v.name} {v.is_active ? "✓" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("categories")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "categories" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <LayoutList className="w-3 h-3 inline mr-1" />Categories
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "timeline" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <CalendarDays className="w-3 h-3 inline mr-1" />Timeline
              </button>
            </div>
          </div>
        )}

        {/* Missing payer warning */}
        {autoExpensesMissingPayer.length > 0 && (
          <div className="rounded-xl p-3 border border-amber-500/30 bg-amber-500/10 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300">
              {autoExpensesMissingPayer.length} auto-added expense{autoExpensesMissingPayer.length > 1 ? "s" : ""} missing a payer — assign before splitting.
            </p>
          </div>
        )}

        {/* Budget overview */}
        {selectedTrip && (
          <div className="rounded-xl p-5 border border-border" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Total Trip Budget (from Trip Planner)</p>
                <p className="text-3xl font-black text-foreground">${budget.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={exportCSV}>
                  <Download className="w-3 h-3 mr-1" /> CSV
                </Button>
                <Link to="/trip-planner" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Adjust <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-3 mb-3">
              <div className="h-3 rounded-full transition-all" style={{ width: `${Math.min(100, (totalSpent/budget)*100)}%`, background: totalSpent > budget ? "hsl(var(--destructive))" : "hsl(var(--primary))" }} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Spent", value: `$${totalSpent.toLocaleString()}`, color: "text-foreground" },
                { label: "Remaining", value: `$${Math.max(0, remaining).toLocaleString()}`, color: remaining >= 0 ? "text-green-400" : "text-destructive" },
                { label: "Shared Total", value: `$${totalShared.toLocaleString()}`, color: "text-primary" },
              ].map(s => (
                <div key={s.label} className="text-center p-2 rounded-lg bg-muted">
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Budget Caps */}
        {selectedTrip && viewMode === "categories" && (
          <CategoryBudgetCap
            categoryCaps={(selectedTrip.category_caps as Record<string, number>) || {}}
            categorySpend={categorySpend}
            onUpdateCap={handleUpdateCap}
          />
        )}

        {/* Settle Up */}
        {settleUp.length > 0 && (
          <div className="rounded-xl p-4 border border-primary/20 bg-primary/5">
            <p className="text-xs font-bold text-primary mb-3">💸 Settle Up Summary</p>
            <div className="space-y-2">
              {settleUp.map(s => (
                <div key={s.memberId} className="flex justify-between items-center">
                  <span className="text-sm text-foreground">{s.name}</span>
                  <span className={`text-sm font-bold ${s.balance > 0 ? "text-green-400" : "text-destructive"}`}>
                    {s.balance > 0 ? `+$${s.balance.toFixed(2)} (owed to them)` : `-$${Math.abs(s.balance).toFixed(2)} (owes)`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Expense */}
        <div>
          <button onClick={() => setShowAddExpense(e => !e)}
            className="w-full py-3 rounded-xl font-bold text-sm text-primary-foreground bg-primary flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Log New Expense
          </button>
        </div>

        {showAddExpense && (
          <div className="rounded-xl p-5 border border-border" style={{ background: "var(--card)" }}>
            <h3 className="text-sm font-bold text-foreground mb-4">Add Expense</h3>
            <div className="space-y-3">
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (e.g. Be Our Guest dinner)"
                className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ minHeight: 44 }} />
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount ($)"
                className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ minHeight: 44 }} />

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Type</p>
                <div className="flex gap-2">
                  <button onClick={() => setExpenseType("personal")}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all ${expenseType === "personal" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                    👤 Personal (just me)
                  </button>
                  <button onClick={() => setExpenseType("shared")}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all ${expenseType === "shared" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                    👥 Shared (split it)
                  </button>
                </div>
                {expenseType === "personal" && <p className="text-xs text-muted-foreground mt-1">This expense is yours — it won't affect the group settle-up</p>}
                {expenseType === "shared" && <p className="text-xs text-muted-foreground mt-1">This will be split among selected group members</p>}
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Category</p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.value} onClick={() => setCategory(cat.value)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium text-left border transition-all ${category === cat.value ? "bg-primary/15 border-primary/50 text-primary" : "border-border text-muted-foreground hover:border-border/80"}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {expenseType === "shared" && members.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Who paid?</p>
                  <select value={paidByMember} onChange={e => setPaidByMember(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ minHeight: 44 }}>
                    <option value="">Select person...</option>
                    {members.filter(m => m.is_splitting_expenses).map(m => (
                      <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button onClick={addExpense} disabled={saving || !desc || !amount}
                className="w-full py-2.5 rounded-xl font-bold text-sm text-primary-foreground bg-primary disabled:opacity-50">
                {saving ? "Saving..." : "Add Expense"}
              </button>
            </div>
          </div>
        )}

        {/* Expense list */}
        {viewMode === "timeline" ? (
          <BudgetTimelineView
            expenses={expenses}
            members={members}
            onSelectPayer={handleSelectPayer}
            onDelete={handleDeleteExpense}
            onUnlink={handleUnlinkExpense}
          />
        ) : expenses.length > 0 ? (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">All Expenses ({expenses.length})</p>
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: "var(--card)" }}>
              {expenses.map((exp, i) => (
                <AutoExpenseRow
                  key={exp.id}
                  expense={exp}
                  members={members}
                  isLast={i === expenses.length - 1}
                  onSelectPayer={handleSelectPayer}
                  onDelete={handleDeleteExpense}
                  onUnlink={handleUnlinkExpense}
                />
              ))}
            </div>
          </div>
        ) : selectedTrip ? (
          <div className="text-center py-8">
            <Receipt className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No expenses logged yet</p>
            <p className="text-xs text-muted-foreground">Tap "Log New Expense" to start tracking</p>
          </div>
        ) : null}

        {/* Trip members */}
        {selectedTrip && (
          <div className="rounded-xl border border-border overflow-hidden" style={{ background: "var(--card)" }}>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">Travel Party ({members.length})</p>
              <Link to={`/trip-planner`} className="text-xs text-primary hover:underline">Manage →</Link>
            </div>
            {members.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-muted-foreground">No members added yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add trip members in Trip Planner to split expenses</p>
              </div>
            ) : members.map((m, i) => (
              <div key={m.id} className={`flex items-center justify-between px-4 py-3 ${i < members.length - 1 ? "border-b border-border/50" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {m.first_name?.[0] || "?"}{m.last_name?.[0] || ""}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.first_name} {m.last_name}</p>
                    <p className="text-xs text-muted-foreground">{m.is_adult ? "Adult" : "Child"} · {m.status}</p>
                  </div>
                </div>
                {m.is_splitting_expenses && <Badge variant="secondary" className="text-[10px] bg-green-500/15 text-green-400 border-0">Splitting</Badge>}
              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
