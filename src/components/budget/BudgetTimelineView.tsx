import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import AutoExpenseRow from "./AutoExpenseRow";

const CATEGORIES = [
  { value: "tickets", label: "🎟️ Tickets & Passes" },
  { value: "hotel", label: "🏨 Hotel" },
  { value: "dining", label: "🍽️ Dining" },
  { value: "lightning-lane", label: "⚡ Lightning Lane" },
  { value: "merchandise", label: "🛍️ Merchandise" },
  { value: "transportation", label: "🚗 Transportation" },
  { value: "misc", label: "📦 Misc / Extras" },
];

interface BudgetTimelineViewProps {
  expenses: any[];
  members: any[];
  onSelectPayer: (expenseId: string, payerId: string) => void;
  onDelete: (expenseId: string) => void;
  onUnlink: (expenseId: string) => void;
}

export default function BudgetTimelineView({ expenses, members, onSelectPayer, onDelete, onUnlink }: BudgetTimelineViewProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Group by date
  const byDate: Record<string, any[]> = {};
  expenses.forEach(exp => {
    const date = exp.date || "Unknown";
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(exp);
  });

  const sortedDates = Object.keys(byDate).sort();
  let runningTotal = 0;

  // Auto-expand days that have expenses
  const toggleDay = (date: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {sortedDates.map(date => {
        const dayExpenses = byDate[date];
        const dayTotal = dayExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
        runningTotal += dayTotal;
        const isExpanded = expandedDays.has(date);

        const formattedDate = date !== "Unknown"
          ? new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
          : "Unknown Date";

        return (
          <div key={date} className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "var(--card)" }}>
            <button
              onClick={() => toggleDay(date)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-sm font-semibold text-foreground">{formattedDate}</span>
                <span className="text-[10px] text-muted-foreground">{dayExpenses.length} item{dayExpenses.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-foreground">${dayTotal.toFixed(2)}</span>
                <span className="text-[10px] text-muted-foreground">Running: ${runningTotal.toFixed(2)}</span>
              </div>
            </button>
            {isExpanded && dayExpenses.map((exp: any, i: number) => (
              <AutoExpenseRow
                key={exp.id}
                expense={exp}
                members={members}
                isLast={i === dayExpenses.length - 1}
                onSelectPayer={onSelectPayer}
                onDelete={onDelete}
                onUnlink={onUnlink}
              />
            ))}
          </div>
        );
      })}
      {sortedDates.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No expenses to display in timeline</p>
      )}
    </div>
  );
}
