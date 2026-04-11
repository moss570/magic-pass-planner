import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Unlink } from "lucide-react";

const CATEGORIES = [
  { value: "tickets", label: "🎟️ Tickets & Passes", color: "bg-primary/20 text-primary" },
  { value: "hotel", label: "🏨 Hotel", color: "bg-purple-500/20 text-purple-400" },
  { value: "dining", label: "🍽️ Dining", color: "bg-orange-500/20 text-orange-400" },
  { value: "lightning-lane", label: "⚡ Lightning Lane", color: "bg-yellow-500/20 text-yellow-400" },
  { value: "merchandise", label: "🛍️ Merchandise", color: "bg-pink-500/20 text-pink-400" },
  { value: "transportation", label: "🚗 Transportation", color: "bg-blue-500/20 text-blue-400" },
  { value: "misc", label: "📦 Misc / Extras", color: "bg-muted text-muted-foreground" },
];

const SOURCE_LABELS: Record<string, string> = {
  "reservations-inbox": "From Reservations Inbox",
  "hotel-alert": "From Hotel Alert",
  "airfare-alert": "From Airfare Alert",
  "trip-planner": "From Trip Planner",
  "auto": "Auto-added",
};

interface AutoExpenseRowProps {
  expense: any;
  members: any[];
  isLast: boolean;
  onSelectPayer: (expenseId: string, payerId: string) => void;
  onDelete: (expenseId: string) => void;
  onUnlink: (expenseId: string) => void;
}

export default function AutoExpenseRow({ expense, members, isLast, onSelectPayer, onDelete, onUnlink }: AutoExpenseRowProps) {
  const cat = CATEGORIES.find(c => c.value === expense.category);
  const isAuto = expense.source === "auto" || expense.sourceRef;
  const sourceLabel = SOURCE_LABELS[expense.sourceRef?.split(":")[0] || expense.source] || "Auto-added";

  return (
    <div className={`flex items-center justify-between px-4 py-3 ${!isLast ? "border-b border-white/5" : ""}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-lg shrink-0">{cat?.label.split(" ")[0] || "📦"}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{expense.description}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {isAuto && (
              <>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-primary/15 text-primary border-0">Auto</Badge>
                <span className="text-[10px] text-muted-foreground">{sourceLabel}</span>
              </>
            )}
            <span className="text-[10px] text-muted-foreground">{expense.date}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isAuto && !expense.paidByUserId && members.length > 0 && (
          <Select value={expense.paidByUserId || ""} onValueChange={(v) => onSelectPayer(expense.id, v)}>
            <SelectTrigger className="h-7 text-[10px] w-24 border-amber-500/40 bg-amber-500/10">
              <SelectValue placeholder="Payer?" />
            </SelectTrigger>
            <SelectContent>
              {members.filter(m => m.is_splitting_expenses).map(m => (
                <SelectItem key={m.id} value={m.id} className="text-xs">{m.first_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <p className="text-sm font-bold text-foreground">${parseFloat(expense.amount).toFixed(2)}</p>
        <div className="flex gap-0.5">
          {isAuto && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUnlink(expense.id)} title="Unlink from source">
              <Unlink className="w-3 h-3" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(expense.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
