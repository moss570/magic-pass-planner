import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DiffItem {
  activity: string;
  before: string;
  after: string;
  status: 'moved' | 'dropped' | 'unchanged' | 'new';
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (block: {
    type: string;
    startTime: string;
    durationMinutes: number;
    label: string;
    notes: string;
  }) => void;
  diffPreview: DiffItem[] | null;
  onApplyDiff: () => void;
  onCancelDiff: () => void;
  loading: boolean;
}

const BLOCK_TYPES = [
  { value: 'attraction', label: '🎢 Attraction' },
  { value: 'restaurant', label: '🍽️ Restaurant' },
  { value: 'bathroom', label: '🚻 Bathroom' },
  { value: 'snack', label: '🍿 Snack' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'photo', label: '📸 Photo' },
  { value: 'rest', label: '☀️ Rest' },
  { value: 'other', label: '📍 Other' },
];

export default function AddBlockModal({
  open, onOpenChange, onSave, diffPreview, onApplyDiff, onCancelDiff, loading
}: Props) {
  const [type, setType] = useState('other');
  const [startTime, setStartTime] = useState('12:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    onSave({
      type,
      startTime,
      durationMinutes,
      label: label || BLOCK_TYPES.find(b => b.value === type)?.label.slice(2) || 'Custom Block',
      notes,
    });
  };

  // Diff preview mode
  if (diffPreview) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Changes</DialogTitle>
            <DialogDescription>
              Your custom block will shift some items. Review the changes below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="font-semibold text-muted-foreground pb-1 border-b border-border">Before</div>
            <div className="font-semibold text-muted-foreground pb-1 border-b border-border">After</div>
            {diffPreview.map((d, i) => (
              <>
                <div key={`b-${i}`} className={`py-1 ${d.status === 'dropped' ? 'text-red-400 line-through' : d.status === 'new' ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
                  {d.status === 'new' ? '—' : `${d.before} ${d.activity}`}
                </div>
                <div key={`a-${i}`} className={`py-1 ${d.status === 'dropped' ? 'text-red-400 line-through' : d.status === 'new' ? 'text-green-400' : d.status === 'moved' ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                  {d.status === 'dropped' ? 'Dropped' : `${d.after} ${d.activity}`}
                  {d.status === 'moved' && <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-yellow-500/15">shifted</span>}
                  {d.status === 'new' && <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-green-500/15">new</span>}
                </div>
              </>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onCancelDiff}>Cancel</Button>
            <Button className="flex-1" onClick={onApplyDiff} disabled={loading}>
              {loading ? 'Applying...' : 'Apply Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Custom Block</DialogTitle>
          <DialogDescription>
            Insert a custom activity into your day. The rest of the itinerary will re-calculate around it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BLOCK_TYPES.map(bt => (
                  <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Activity Name</label>
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Dole Whip break" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Start Time</label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Duration (min)</label>
              <Input type="number" min={5} max={240} value={durationMinutes} onChange={e => setDurationMinutes(parseInt(e.target.value) || 30)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes..." rows={2} />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={loading}>
              {loading ? 'Calculating...' : 'Preview Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
