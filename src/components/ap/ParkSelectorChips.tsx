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

interface SingleSelectProps {
  parkGroup?: "wdw";
  selected: string;
  onSelect: (parkId: string) => void;
  multiSelect?: false;
  selectedMulti?: never;
  onSelectMulti?: never;
}

interface MultiSelectProps {
  parkGroup?: "wdw";
  multiSelect: true;
  selectedMulti: string[];
  onSelectMulti: (parkIds: string[]) => void;
  selected?: never;
  onSelect?: never;
}

type Props = SingleSelectProps | MultiSelectProps;

export default function ParkSelectorChips(props: Props) {
  const { parkGroup = "wdw" } = props;
  const parks = parkGroup === "wdw" ? WDW_PARKS : WDW_PARKS;

  if (props.multiSelect) {
    const { selectedMulti, onSelectMulti } = props;
    const togglePark = (id: string) => {
      if (selectedMulti.includes(id)) {
        onSelectMulti(selectedMulti.filter(p => p !== id));
      } else {
        onSelectMulti([...selectedMulti, id]);
      }
    };

    return (
      <div className="flex flex-wrap gap-2">
        {parks.map((p) => (
          <button
            key={p.id}
            onClick={() => togglePark(p.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border",
              selectedMulti.includes(p.id)
                ? "bg-primary text-primary-foreground border-primary"
                : "border-primary/30 text-muted-foreground hover:border-primary hover:text-foreground"
            )}
          >
            {p.emoji} {p.label}
          </button>
        ))}
        {selectedMulti.length > 1 && (
          <span className="flex items-center text-[10px] text-primary font-semibold bg-primary/10 px-2 py-1 rounded-full">
            🏃 Park Hopper
          </span>
        )}
      </div>
    );
  }

  // Single select mode (default)
  const { selected, onSelect } = props;
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
