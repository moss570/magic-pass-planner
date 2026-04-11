import { X } from "lucide-react";

interface Nudge {
  id: string;
  type: 'restroom' | 'meal' | 'special_event';
  message: string;
  afterItemIndex: number;
  suggestion?: string;
  bookingUrl?: string;
}

interface Props {
  nudges: Nudge[];
  dismissedNudges: string[];
  onDismiss: (nudgeId: string) => void;
}

const nudgeBg: Record<string, string> = {
  restroom: 'border-blue-500/20 bg-blue-500/5',
  meal: 'border-orange-500/20 bg-orange-500/5',
  special_event: 'border-purple-500/20 bg-purple-500/5',
};

export default function NudgeBanner({ nudges, dismissedNudges, onDismiss }: Props) {
  const visible = nudges.filter(n => !dismissedNudges.includes(n.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-3">
      {visible.map(nudge => (
        <div key={nudge.id} className={`flex items-start gap-2 p-3 rounded-xl border ${nudgeBg[nudge.type] || 'border-border bg-muted/30'}`}>
          <p className="text-xs text-foreground flex-1">{nudge.message}</p>
          {nudge.bookingUrl && (
            <a
              href={nudge.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs px-2 py-1 rounded border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
            >
              Book →
            </a>
          )}
          <button
            onClick={() => onDismiss(nudge.id)}
            className="shrink-0 p-1 rounded-sm hover:bg-muted transition-colors"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      ))}
    </div>
  );
}
