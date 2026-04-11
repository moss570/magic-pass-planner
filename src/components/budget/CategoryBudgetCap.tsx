import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const CATEGORIES = [
  { value: "tickets", label: "🎟️ Tickets & Passes" },
  { value: "hotel", label: "🏨 Hotel" },
  { value: "dining", label: "🍽️ Dining" },
  { value: "lightning-lane", label: "⚡ Lightning Lane" },
  { value: "merchandise", label: "🛍️ Merchandise" },
  { value: "transportation", label: "🚗 Transportation" },
  { value: "misc", label: "📦 Misc / Extras" },
];

interface CategoryBudgetCapProps {
  categoryCaps: Record<string, number>;
  categorySpend: Record<string, number>;
  onUpdateCap: (category: string, cap: number | null) => void;
}

export default function CategoryBudgetCap({ categoryCaps, categorySpend, onUpdateCap }: CategoryBudgetCapProps) {
  const [editingCat, setEditingCat] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-white/8 p-4 space-y-3" style={{ background: "var(--card)" }}>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category Budget Caps</p>
      {CATEGORIES.map(cat => {
        const cap = categoryCaps[cat.value] || 0;
        const spent = categorySpend[cat.value] || 0;
        const pct = cap > 0 ? (spent / cap) * 100 : 0;
        const isOver80 = pct >= 80 && pct < 100;
        const isOver100 = pct >= 100;

        return (
          <div key={cat.value} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground">{cat.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">${spent.toLocaleString()}</span>
                {cap > 0 && <span className="text-[10px] text-muted-foreground">/ ${cap.toLocaleString()}</span>}
                {editingCat === cat.value ? (
                  <Input
                    type="number"
                    className="w-20 h-6 text-xs"
                    placeholder="Cap $"
                    defaultValue={cap || ""}
                    autoFocus
                    onBlur={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      onUpdateCap(cat.value, val);
                      setEditingCat(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                  />
                ) : (
                  <button
                    onClick={() => setEditingCat(cat.value)}
                    className="text-[10px] text-primary hover:underline"
                  >
                    {cap > 0 ? "Edit" : "Set cap"}
                  </button>
                )}
              </div>
            </div>
            {cap > 0 && (
              <Progress
                value={Math.min(100, pct)}
                className={`h-1.5 ${isOver100 ? "[&>div]:bg-red-500" : isOver80 ? "[&>div]:bg-amber-500" : "[&>div]:bg-green-500"}`}
              />
            )}
            {isOver100 && <p className="text-[10px] text-red-400 font-semibold">⚠️ Over budget by ${(spent - cap).toLocaleString()}</p>}
            {isOver80 && !isOver100 && <p className="text-[10px] text-amber-400">Approaching cap ({Math.round(pct)}%)</p>}
          </div>
        );
      })}
    </div>
  );
}
