import { cn } from "@/lib/utils";

export interface ParkOption {
  id: string;
  label: string;
  emoji: string;
}

const WDW_PARKS: ParkOption[] = [
  { id: "magic-kingdom", label: "Magic Kingdom", emoji: "🏰" },
  { id: "epcot", label: "EPCOT", emoji: "🌐" },
  { id: "hollywood-studios", label: "Hollywood Studios", emoji: "🎬" },
  { id: "animal-kingdom", label: "Animal Kingdom", emoji: "🌿" },
];

interface Props {
  parkGroup?: "wdw"; // extend with "universal" | "seaworld" later
  selected: string;
  onSelect: (parkId: string) => void;
}

export default function ParkSelectorChips({ parkGroup = "wdw", selected, onSelect }: Props) {
  const parks = parkGroup === "wdw" ? WDW_PARKS : WDW_PARKS;

  return (
    <div className="flex flex-wrap gap-2">
      {parks.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border",
            selected === p.id
              ? "bg-primary text-primary-foreground border-primary"
              : "border-primary/30 text-muted-foreground hover:border-primary hover:text-foreground"
          )}
        >
          {p.emoji} {p.label}
        </button>
      ))}
    </div>
  );
}
