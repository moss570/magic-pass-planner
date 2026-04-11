import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Hotel, Plane, Utensils, Ticket, Car, HelpCircle } from "lucide-react";

const TYPE_ICONS: Record<string, any> = {
  hotel: Hotel, flight: Plane, dining: Utensils,
  tickets: Ticket, car: Car, other: HelpCircle,
};

const TYPE_LABELS: Record<string, string> = {
  hotel: "Hotel", flight: "Flight", dining: "Dining",
  tickets: "Tickets", car: "Car Rental", other: "Other",
};

interface ParseResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parsed: any;
  confidence: number;
  onConfirm: (edited: any) => void;
  onReject: () => void;
}

export default function ParseResultModal({
  open, onOpenChange, parsed, confidence, onConfirm, onReject,
}: ParseResultModalProps) {
  const [edited, setEdited] = useState(parsed || {});
  const Icon = TYPE_ICONS[edited.type] || HelpCircle;

  const update = (key: string, value: any) => setEdited((p: any) => ({ ...p, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            Confirm {TYPE_LABELS[edited.type] || "Booking"} Details
          </DialogTitle>
          <DialogDescription>
            Review and edit the parsed reservation details before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center gap-2">
            <Badge variant={confidence >= 0.6 ? "default" : "destructive"}>
              {Math.round(confidence * 100)}% confidence
            </Badge>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Type</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={edited.type || "other"}
              onChange={(e) => update("type", e.target.value)}
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {edited.type === "flight" ? "Airline" : edited.type === "car" ? "Company" : "Property"}
            </label>
            <Input
              value={edited.property_or_airline || edited.car_company || ""}
              onChange={(e) => update("property_or_airline", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Confirmation #</label>
            <Input
              value={edited.confirmation_number || ""}
              onChange={(e) => update("confirmation_number", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                {edited.type === "hotel" ? "Check-in" : "Depart"}
              </label>
              <Input
                type="date"
                value={edited.check_in || ""}
                onChange={(e) => update("check_in", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                {edited.type === "hotel" ? "Check-out" : "Return"}
              </label>
              <Input
                type="date"
                value={edited.check_out || ""}
                onChange={(e) => update("check_out", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Guests</label>
              <Input
                type="number"
                value={edited.guests || ""}
                onChange={(e) => update("guests", parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Price ($)</label>
              <Input
                type="number"
                value={edited.price || ""}
                onChange={(e) => update("price", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onReject}>Reject</Button>
          <Button onClick={() => onConfirm(edited)}>Confirm & Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
