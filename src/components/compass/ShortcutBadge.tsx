import { DoorOpen } from "lucide-react";

interface ShortcutBadgeProps {
  throughBuilding?: string;
  compact?: boolean;
}

const ShortcutBadge = ({ throughBuilding, compact = false }: ShortcutBadgeProps) => (
  <span className={`inline-flex items-center gap-1 rounded-full border border-secondary/40 bg-secondary/10 text-secondary font-semibold ${
    compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
  }`}>
    <DoorOpen className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
    {throughBuilding ? `Shortcut through ${throughBuilding}` : "Shortcut"}
  </span>
);

export default ShortcutBadge;
