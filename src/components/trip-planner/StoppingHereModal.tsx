import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PassingPoint {
  type: string;
  label: string;
  description?: string;
  image_url?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  point: PassingPoint | null;
  onConfirm: (durationMinutes: number) => void;
}

const DURATION_OPTIONS = [5, 10, 15, 30];

export default function StoppingHereModal({ open, onOpenChange, point, onConfirm }: Props) {
  const [duration, setDuration] = useState(15);
  const [custom, setCustom] = useState(false);

  if (!point) return null;

  const typeEmoji = point.type === 'snack' ? '🍿' : point.type === 'merch' ? '🛍️' : point.type === 'photopass' ? '📸' : '🚻';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">{typeEmoji}</span>
            {point.label}
          </DialogTitle>
          <DialogDescription>
            {point.description || `Adding a stop for ${point.label}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">How long will you spend?</p>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => { setDuration(d); setCustom(false); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    !custom && duration === d
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {d} min
                </button>
              ))}
              <button
                onClick={() => setCustom(true)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  custom
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Custom
              </button>
            </div>
            {custom && (
              <div className="mt-2">
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={duration}
                  onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 15))}
                  className="w-24"
                  placeholder="Minutes"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={() => onConfirm(duration)}>
              Insert Stop
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
