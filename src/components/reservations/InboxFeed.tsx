import { Hotel, Plane, Utensils, Ticket, Car, HelpCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const TYPE_ICONS: Record<string, any> = {
  hotel: Hotel, flight: Plane, dining: Utensils,
  tickets: Ticket, car: Car, other: HelpCircle,
};

const STATUS_COLORS: Record<string, string> = {
  pending_review: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-green-500/20 text-green-400",
  failed: "bg-destructive/20 text-destructive",
  duplicate: "bg-muted text-muted-foreground",
};

interface InboxItem {
  id: string;
  type: string;
  status: string;
  confirmation_number: string | null;
  sender_email: string | null;
  parsed: any;
  created_at: string;
  source: string;
}

interface InboxFeedProps {
  items: InboxItem[];
  onReparse: (id: string) => void;
  reparsing: string | null;
}

export default function InboxFeed({ items, onReparse, reparsing }: InboxFeedProps) {
  if (!items.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No reservations yet. Paste or forward a confirmation to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const Icon = TYPE_ICONS[item.type || "other"] || HelpCircle;
        const parsed = item.parsed || {};
        return (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {parsed.property_or_airline || parsed.dining_restaurant || parsed.car_company || "Unknown"}
                      </span>
                      <Badge className={STATUS_COLORS[item.status] || "bg-muted"}>
                        {item.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.source === "forward" ? "📧 Email" : item.source === "manual_upload" ? "📄 Upload" : "📋 Paste"}
                      </Badge>
                    </div>
                    {item.confirmation_number && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Conf: {item.confirmation_number}
                      </p>
                    )}
                    {(parsed.check_in || parsed.depart_date) && (
                      <p className="text-xs text-muted-foreground">
                        {parsed.check_in || parsed.depart_date}
                        {(parsed.check_out || parsed.return_date) && ` → ${parsed.check_out || parsed.return_date}`}
                      </p>
                    )}
                    {parsed.price && (
                      <p className="text-xs text-muted-foreground">${parsed.price}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(item.created_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                </div>
                {item.status === "failed" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReparse(item.id)}
                    disabled={reparsing === item.id}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${reparsing === item.id ? "animate-spin" : ""}`} />
                    Reparse
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
