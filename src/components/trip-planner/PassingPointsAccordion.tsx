import { useState } from "react";
import { ChevronDown, ChevronUp, Camera, ShoppingBag, UtensilsCrossed, Bath } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PassingPoint {
  type: string;
  label: string;
  nodeId?: string;
  detourSeconds?: number;
  image_url?: string;
  description?: string;
  is_magic_shot?: boolean;
  is_limited?: boolean;
  family_restroom?: boolean;
  nursing_room?: boolean;
  price?: number;
  dietary_flags?: string[];
}

interface Props {
  passingPoints: PassingPoint[];
  onStoppingHere: (point: PassingPoint) => void;
}

const SECTIONS = [
  { key: 'snack', label: 'Snacks Nearby', emoji: '🍿', icon: UtensilsCrossed },
  { key: 'merch', label: 'Must-Not-Miss Merch', emoji: '🛍️', icon: ShoppingBag },
  { key: 'photopass', label: 'PhotoPass Opportunities', emoji: '📸', icon: Camera },
  { key: 'restroom', label: 'Restrooms', emoji: '🚻', icon: Bath },
] as const;

export default function PassingPointsAccordion({ passingPoints, onStoppingHere }: Props) {
  const [open, setOpen] = useState(false);
  const [restroomOpen, setRestroomOpen] = useState(false);

  if (!passingPoints || passingPoints.length === 0) return null;

  const grouped: Record<string, PassingPoint[]> = {};
  for (const pp of passingPoints) {
    const key = pp.type || 'other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(pp);
  }

  const hasContent = SECTIONS.some(s => (grouped[s.key]?.length || 0) > 0);
  if (!hasContent) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        <span className="font-medium">You'll pass these on the way — want to stop?</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted">
          {passingPoints.length}
        </span>
      </button>

      {open && (
        <div className="mt-2 space-y-3 pl-1">
          {SECTIONS.map(section => {
            const items = grouped[section.key];
            if (!items || items.length === 0) return null;

            // Restrooms are collapsed by default
            if (section.key === 'restroom') {
              return (
                <div key={section.key}>
                  <button
                    onClick={() => setRestroomOpen(!restroomOpen)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground mb-1"
                  >
                    <span>{section.emoji}</span> {section.label} ({items.length})
                    {restroomOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {restroomOpen && (
                    <div className="space-y-1">
                      {items.map((pp, j) => (
                        <div key={j} className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground py-1 px-2 rounded bg-muted/30">
                          <span>
                            🚻 {pp.label}
                            {pp.family_restroom && <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-blue-500/15 text-blue-400">Family</span>}
                            {pp.nursing_room && <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-pink-500/15 text-pink-400">Nursing</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={section.key}>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1">
                  {section.emoji} {section.label}
                </p>
                <div className="space-y-1.5">
                  {items.map((pp, j) => (
                    <div key={j} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{pp.label}</p>
                        {pp.description && (
                          <p className="text-[10px] text-muted-foreground truncate">{pp.description}</p>
                        )}
                        <div className="flex items-center gap-1 mt-0.5">
                          {pp.is_limited && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold">Limited</span>
                          )}
                          {pp.is_magic_shot && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-purple-500/15 text-purple-400 font-semibold">Magic Shot</span>
                          )}
                          {pp.price != null && (
                            <span className="text-[10px] text-muted-foreground">${pp.price}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 h-7 text-[10px] px-2"
                        onClick={() => onStoppingHere(pp)}
                      >
                        I'm stopping here
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
