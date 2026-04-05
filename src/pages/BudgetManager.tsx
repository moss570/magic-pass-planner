import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Receipt, Users, DollarSign, TrendingUp, Trash2,
  ChevronDown, ChevronUp, ArrowRight
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
      .select("id, name, parks, start_date, estimated_total")
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

      // Load expenses
      const expResp = await fetch(`${SUPABASE_URL}/functions/v1/social?action=expenses&tripId=${trip.id}`, { headers: getHeaders() });
      const expData = await expResp.json();
      setExpenses(expData.expenses || []);
      setSettleUp(expData.settleUp || []);
      setTotalShared(expData.totalShared || 0);
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
        selectTrip(selectedTrip); // Refresh
      }
    } catch {
      toast({ title: "Failed to save expense", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const budget = selectedTrip?.estimated_total || 6500;
  const remaining = budget - totalSpent;

  if (loading && trips.length === 0) {
    return (
      <DashboardLayout title="💰 Budget Manager" subtitle="Track your Disney trip expenses">
        <div className="text-center py-16">
          <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm font-semibold text-foreground mb-2">No trips yet</p>
          <p className="text-xs text-muted-foreground mb-6">Create a trip in Trip Planner to start tracking expenses</p>
          <Link to="/trip-planner" className="px-6 py-2.5 rounded-xl font-bold text-sm text-[var(--background)] inline-block" style={{ background: "#F5C842" }}>
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
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors border ${selectedTrip?.id === trip.id ? "bg-primary text-[var(--background)] border-primary" : "border-white/10 text-muted-foreground hover:border-white/20"}`}>
                {trip.name}
              </button>
            ))}
          </div>
        )}

        {/* Budget overview */}
        {selectedTrip && (
          <div className="rounded-xl p-5 border border-white/8" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Total Trip Budget (from Trip Planner)</p>
                <p className="text-3xl font-black text-foreground">${budget.toLocaleString()}</p>
              </div>
              <Link to="/trip-planner" className="text-xs text-primary hover:underline flex items-center gap-1">
                Adjust <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3 mb-3">
              <div className="h-3 rounded-full transition-all" style={{ width: `${Math.min(100, (totalSpent/budget)*100)}%`, background: totalSpent > budget ? "#F43F5E" : "#F5C842" }} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Spent", value: `$${totalSpent.toLocaleString()}`, color: "text-foreground" },
                { label: "Remaining", value: `$${Math.max(0, remaining).toLocaleString()}`, color: remaining >= 0 ? "text-green-400" : "text-red-400" },
                { label: "Shared Total", value: `$${totalShared.toLocaleString()}`, color: "text-primary" },
              ].map(s => (
                <div key={s.label} className="text-center p-2 rounded-lg bg-white/5">
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settle Up */}
        {settleUp.length > 0 && (
          <div className="rounded-xl p-4 border border-primary/20 bg-primary/5">
            <p className="text-xs font-bold text-primary mb-3">💸 Settle Up Summary</p>
            <div className="space-y-2">
              {settleUp.map(s => (
                <div key={s.memberId} className="flex justify-between items-center">
                  <span className="text-sm text-foreground">{s.name}</span>
                  <span className={`text-sm font-bold ${s.balance > 0 ? "text-green-400" : "text-red-400"}`}>
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
            className="w-full py-3 rounded-xl font-bold text-sm text-[var(--background)] flex items-center justify-center gap-2"
            style={{ background: "#F5C842" }}>
            <Plus className="w-4 h-4" /> Log New Expense
          </button>
        </div>

        {showAddExpense && (
          <div className="rounded-xl p-5 border border-white/10" style={{ background: "var(--card)" }}>
            <h3 className="text-sm font-bold text-foreground mb-4">Add Expense</h3>
            <div className="space-y-3">
              {/* Description */}
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (e.g. Be Our Guest dinner)"
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--muted)] border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ minHeight: 44 }} />

              {/* Amount */}
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount ($)"
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--muted)] border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ minHeight: 44 }} />

              {/* Expense Type */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Type</p>
                <div className="flex gap-2">
                  <button onClick={() => setExpenseType("personal")}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all ${expenseType === "personal" ? "bg-primary text-[var(--background)] border-primary" : "border-white/10 text-muted-foreground"}`}>
                    👤 Personal (just me)
                  </button>
                  <button onClick={() => setExpenseType("shared")}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all ${expenseType === "shared" ? "bg-primary text-[var(--background)] border-primary" : "border-white/10 text-muted-foreground"}`}>
                    👥 Shared (split it)
                  </button>
                </div>
                {expenseType === "personal" && <p className="text-xs text-muted-foreground mt-1">This expense is yours — it won't affect the group settle-up</p>}
                {expenseType === "shared" && <p className="text-xs text-muted-foreground mt-1">This will be split among selected group members</p>}
              </div>

              {/* Category */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Category</p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.value} onClick={() => setCategory(cat.value)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium text-left border transition-all ${category === cat.value ? "bg-primary/15 border-primary/50 text-primary" : "border-white/8 text-muted-foreground hover:border-white/15"}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid by (for shared expenses) */}
              {expenseType === "shared" && members.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Who paid?</p>
                  <select value={paidByMember} onChange={e => setPaidByMember(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[var(--muted)] border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ minHeight: 44 }}>
                    <option value="">Select person...</option>
                    {members.filter(m => m.is_splitting_expenses).map(m => (
                      <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button onClick={addExpense} disabled={saving || !desc || !amount}
                className="w-full py-2.5 rounded-xl font-bold text-sm text-[var(--background)] disabled:opacity-50"
                style={{ background: "#F5C842" }}>
                {saving ? "Saving..." : "Add Expense"}
              </button>
            </div>
          </div>
        )}

        {/* Expense list */}
        {expenses.length > 0 ? (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">All Expenses ({expenses.length})</p>
            <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "var(--card)" }}>
              {expenses.map((exp, i) => {
                const cat = CATEGORIES.find(c => c.value === exp.category);
                const paidBy = members.find(m => m.id === exp.paid_by_member_id);
                return (
                  <div key={exp.id} className={`flex items-center justify-between px-4 py-3 ${i < expenses.length - 1 ? "border-b border-white/5" : ""}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{cat?.label.split(" ")[0] || "📦"}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{exp.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${exp.expense_type === "shared" ? "bg-green-500/15 text-green-400" : "bg-white/8 text-muted-foreground"}`}>
                            {exp.expense_type === "shared" ? "👥 Shared" : "👤 Personal"}
                          </span>
                          {paidBy && <span className="text-xs text-muted-foreground">Paid by {paidBy.first_name}</span>}
                          <span className="text-xs text-muted-foreground">{exp.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-foreground">${parseFloat(exp.amount).toFixed(2)}</p>
                  </div>
                );
              })}
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
          <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "var(--card)" }}>
            <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">Travel Party ({members.length})</p>
              <Link to={`/trip-planner`} className="text-xs text-primary hover:underline">Manage →</Link>
            </div>
            {members.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-muted-foreground">No members added yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add trip members in Trip Planner to split expenses</p>
              </div>
            ) : members.map((m, i) => (
              <div key={m.id} className={`flex items-center justify-between px-4 py-3 ${i < members.length - 1 ? "border-b border-white/5" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {m.first_name[0]}{m.last_name?.[0] || ""}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.first_name} {m.last_name}</p>
                    <p className="text-xs text-muted-foreground">{m.is_adult ? "Adult" : "Child"} · {m.status}</p>
                  </div>
                </div>
                {m.is_splitting_expenses && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">Splitting</span>}
              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
