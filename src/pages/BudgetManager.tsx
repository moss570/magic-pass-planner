import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Download } from "lucide-react";

const categories = [
  { emoji: "🎟️", label: "Tickets & Passes", spent: 1200, budget: 1500, color: "bg-primary" },
  { emoji: "🏨", label: "Hotel", spent: 892, budget: 1200, color: "bg-primary" },
  { emoji: "🍽️", label: "Dining", spent: 330, budget: 900, color: "bg-green-500" },
  { emoji: "⚡", label: "Lightning Lane", spent: 0, budget: 300, color: "bg-muted-foreground/40" },
  { emoji: "🛍️", label: "Merchandise", spent: 162, budget: 400, color: "bg-green-500" },
  { emoji: "🎡", label: "Extras / Misc", spent: 263, budget: 200, color: "bg-destructive" },
  { emoji: "🚗", label: "Transportation", spent: 0, budget: 200, color: "bg-muted-foreground/40" },
];

const tips = [
  { title: "🎁 Buy your remaining dining spend as Sam's Club gift cards", desc: "You have $570 left in your dining budget. Buying at Sam's Club saves ~$8.55. Stack with your credit card for an extra $11.40 back.", savings: "Save ~$20" },
  { title: "⚡ Skip individual Lightning Lane — use Multi Pass instead", desc: "For a party of 5, individual LL ($22/person) adds up fast. LLMP at $15-24/person covers more rides with better value.", savings: "Save up to $35" },
  { title: "🍽️ Swap one table service meal for quick service", desc: "One Columbia Harbour House meal (~$20/person) vs. one table service (~$55/person) for a party of 5 saves $175.", savings: "Save $175" },
  { title: "🏨 AP hotel rate alert active for your dates", desc: "A passholder rate of $189/night is available for May 13-16 vs. your current rate of $267/night.", savings: "Save $234" },
];

const expenses = [
  { desc: "Park tickets (4 day tickets)", amount: "$1,200.00", paidBy: "Brandon", split: "All 5", date: "May 1", category: "Tickets" },
  { desc: "Be Our Guest breakfast", amount: "$187.50", paidBy: "Sarah", split: "All 5", date: "May 20", category: "Dining" },
  { desc: "Souvenir run — gift shop", amount: "$94.00", paidBy: "Brandon", split: "All 5", date: "May 20", category: "Merchandise" },
  { desc: "Jake's Lightning Lane (individual)", amount: "$22.00", paidBy: "Jake", split: "Jake only", date: "May 20", category: "Lightning Lane" },
  { desc: "Columbia Harbour House lunch", amount: "$143.00", paidBy: "Emma", split: "All 5", date: "May 20", category: "Dining" },
  { desc: "Mickey ears (kids)", amount: "$68.00", paidBy: "Brandon", split: "Emma, Jake", date: "May 20", category: "Merchandise" },
];

const filterOptions = ["All", "Tickets", "Dining", "Hotel", "Merchandise", "Misc"];

const categoryColors: Record<string, string> = {
  Tickets: "bg-primary/20 text-primary",
  Dining: "bg-blue-500/20 text-blue-400",
  Hotel: "bg-purple-500/20 text-purple-400",
  Merchandise: "bg-pink-500/20 text-pink-400",
  "Lightning Lane": "bg-yellow-500/20 text-yellow-400",
  Misc: "bg-muted text-muted-foreground",
};

const BudgetManager = () => {
  const [filter, setFilter] = useState("All");
  const totalSpent = 1847;
  const totalBudget = 6500;

  const filtered = filter === "All" ? expenses : expenses.filter(e => e.category.toLowerCase().includes(filter.toLowerCase()));

  return (
    <DashboardLayout title="💰 Budget Manager" subtitle="Know exactly what your Disney trip will cost — and how to cut it by $500">
      {/* Trip integration banner */}
      <div className="rounded-xl p-4 border border-primary/20 bg-primary/5 mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">💡 Connect to your Trip Planner</p>
          <p className="text-xs text-muted-foreground mt-0.5">Generate a trip in Trip Planner to automatically populate your budget breakdown with real estimates</p>
        </div>
        <Link to="/trip-planner" className="shrink-0 px-4 py-2 rounded-lg text-xs font-bold text-[#080E1E] ml-4" style={{ background: "#F5C842" }}>
          Open Trip Planner →
        </Link>
      </div>
      {/* Section 1: Budget Overview */}
      <Card className="border-primary/30 bg-card/80 mb-6 overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Total Trip Budget</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl md:text-4xl font-bold text-foreground">$6,500</span>
                <button className="p-1 rounded border border-primary/30 text-primary hover:bg-primary/10"><Pencil className="w-3.5 h-3.5" /></button>
              </div>
              <div className="mt-3">
                <Progress value={(totalSpent / totalBudget) * 100} className="h-3 bg-muted" />
                <p className="text-[10px] text-muted-foreground mt-1">${totalSpent.toLocaleString()} of ${totalBudget.toLocaleString()} spent</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:w-[340px]">
              <div className="rounded-lg border border-primary/15 bg-[#0D1230]/60 p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Spent So Far</p>
                <p className="text-lg font-bold text-primary">$1,847</p>
              </div>
              <div className="rounded-lg border border-primary/15 bg-[#0D1230]/60 p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Remaining</p>
                <p className="text-lg font-bold text-green-400">$4,653</p>
              </div>
              <div className="rounded-lg border border-primary/15 bg-[#0D1230]/60 p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Est. Final Cost</p>
                <p className="text-lg font-bold text-foreground">$5,920</p>
              </div>
              <div className="rounded-lg border border-primary/15 bg-[#0D1230]/60 p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Projected Savings</p>
                <p className="text-lg font-bold text-green-400">✅ $580</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend message */}
      <div className="rounded-lg border-l-4 border-green-500 bg-green-500/10 p-3 mb-6">
        <p className="text-xs text-green-400 font-medium">✅ You're trending $580 under budget. At your current spending pace, you'll finish the trip with money to spare.</p>
      </div>

      {/* Section 2: Category Breakdown + Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-9 gap-4 md:gap-6 mb-6">
        {/* Spending by Category */}
        <Card className="lg:col-span-5 border-primary/20 bg-card/80 overflow-hidden">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-3">
            {categories.map((c) => {
              const pct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
              const isOver = pct > 100;
              const barColor = isOver ? "bg-destructive" : pct === 0 ? "bg-muted-foreground/30" : pct < 50 ? "bg-green-500" : "bg-primary";
              return (
                <div key={c.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{c.emoji} {c.label}</span>
                    <span className={`font-semibold ${isOver ? "text-destructive" : "text-foreground"}`}>${c.spent} / ${c.budget} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 mt-2">
              <p className="text-xs text-destructive font-medium">⚠️ Extras/Misc is 31% over budget ($63 over). Consider tracking these purchases more carefully.</p>
            </div>
          </CardContent>
        </Card>

        {/* AI Tips */}
        <Card className="lg:col-span-4 border-primary/20 bg-card/80 overflow-hidden">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">💡 Clark's Savings Recommendations</CardTitle>
            <CardDescription>Personalized for your trip</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-3">
            {tips.map((tip, i) => (
              <div key={i} className="rounded-lg border-l-4 border-primary bg-[#0D1230]/60 p-3 space-y-1">
                <p className="text-sm font-semibold text-foreground">{tip.title}</p>
                <p className="text-xs text-muted-foreground">{tip.desc}</p>
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 mt-1">{tip.savings}</span>
              </div>
            ))}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
              <p className="text-sm font-bold text-primary">💰 Apply all recommendations: potential additional savings of $464</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Log Expense */}
      <Card className="border-primary/20 bg-card/80 mb-6 overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">➕ Log a New Expense</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <Input placeholder="Description" className="bg-background/50 border-primary/20 text-sm" />
            <Input type="number" placeholder="$0.00" className="bg-background/50 border-primary/20 text-sm" />
            <Select><SelectTrigger className="bg-background/50 border-primary/20 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {["Tickets", "Hotel", "Dining", "Lightning Lane", "Merchandise", "Transportation", "Misc"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" className="bg-background/50 border-primary/20 text-sm" />
            <Button className="text-xs">Add to Budget</Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Expense History */}
      <Card className="border-primary/20 bg-card/80 overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base md:text-lg">📋 All Expenses</CardTitle>
            <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 text-xs w-fit"><Download className="w-3.5 h-3.5 mr-1" /> Export to CSV</Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <div className="flex flex-wrap gap-2 mb-4">
            {filterOptions.map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{f}</button>
            ))}
          </div>
          <div className="overflow-x-auto max-w-full">
            <Table className="min-w-[500px]">
              <TableHeader><TableRow className="border-primary/10">
                <TableHead className="text-xs">Description</TableHead><TableHead className="text-xs">Amount</TableHead><TableHead className="text-xs">Category</TableHead><TableHead className="text-xs">Paid By</TableHead><TableHead className="text-xs">Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((e, i) => (
                  <TableRow key={i} className="border-primary/10">
                    <TableCell className="text-xs font-medium text-foreground">{e.desc}</TableCell>
                    <TableCell className="text-xs text-primary font-semibold">{e.amount}</TableCell>
                    <TableCell><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColors[e.category] || "bg-muted text-muted-foreground"}`}>{e.category}</span></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.paidBy}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.date}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-primary/10">
                  <TableCell className="text-xs font-bold text-primary">Total</TableCell>
                  <TableCell className="text-xs font-bold text-primary">$1,847.50</TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default BudgetManager;
