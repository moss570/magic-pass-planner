import { useState, useEffect, useCallback } from "react";
import { Upload, FileText, ChevronDown } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ForwardingAddressCard from "@/components/reservations/ForwardingAddressCard";
import ParseResultModal from "@/components/reservations/ParseResultModal";
import InboxFeed from "@/components/reservations/InboxFeed";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";

export default function ReservationsInbox() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [token, setToken] = useState<string>("");
  const [pasteContent, setPasteContent] = useState("");
  const [parsing, setParsing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [reparsing, setReparsing] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [confidence, setConfidence] = useState(0);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  const userId = session?.user?.id;

  // Load forwarding token
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("users_profile" as any)
      .select("forwarding_token")
      .eq("id", userId)
      .single()
      .then(({ data }: any) => {
        if (data?.forwarding_token) setToken(data.forwarding_token);
      });
  }, [userId]);

  // Load inbox items
  const loadItems = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("reservations_inbox" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setItems(data as any[]);
  }, [userId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleParse = async () => {
    if (!pasteContent.trim() || !userId) return;
    setParsing(true);
    try {
      const accessToken = session?.access_token;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/reservations-parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId,
          source: "manual_paste",
          rawContent: pasteContent,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Parse failed");

      if (result.status === "pending_review" || result.confidence < 0.6) {
        setParsedResult(result.parsed);
        setConfidence(result.confidence);
        setModalOpen(true);
      } else {
        toast({ title: "Reservation saved!", description: `${result.parsed?.type || "Booking"} confirmed.` });
        setPasteContent("");
        loadItems();
      }
    } catch (err: any) {
      toast({ title: "Parse failed", description: err.message, variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async (edited: any) => {
    if (!userId) return;
    try {
      // Update the most recent pending_review item
      const latest = items.find(i => i.status === "pending_review");
      if (latest) {
        await supabase
          .from("reservations_inbox" as any)
          .update({
            parsed: edited,
            type: edited.type,
            status: "confirmed",
            confirmation_number: edited.confirmation_number,
            reviewed_by_user_at: new Date().toISOString(),
          } as any)
          .eq("id", latest.id);
      }
      setModalOpen(false);
      setPasteContent("");
      toast({ title: "Reservation confirmed!" });
      loadItems();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleReject = () => {
    setModalOpen(false);
    toast({ title: "Reservation rejected" });
  };

  const handleReparse = async (id: string) => {
    setReparsing(id);
    const item = items.find(i => i.id === id);
    if (!item?.raw_content || !userId) { setReparsing(null); return; }
    try {
      const accessToken = session?.access_token;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/reservations-parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId,
          source: item.source,
          rawContent: item.raw_content,
        }),
      });
      if (!res.ok) throw new Error("Reparse failed");
      toast({ title: "Reparsed successfully" });
      loadItems();
    } catch (err: any) {
      toast({ title: "Reparse failed", description: err.message, variant: "destructive" });
    } finally {
      setReparsing(null);
    }
  };

  const handleFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setParsing(true);
    try {
      // Read file as text (for txt/eml) or upload for PDF
      const text = await file.text();
      const accessToken = session?.access_token;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/reservations-parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId,
          source: "manual_upload",
          rawContent: text.substring(0, 50000),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Parse failed");

      if (result.status === "pending_review" || result.confidence < 0.6) {
        setParsedResult(result.parsed);
        setConfidence(result.confidence);
        setModalOpen(true);
      } else {
        toast({ title: "Reservation saved!", description: `${result.parsed?.type || "Booking"} from file confirmed.` });
        loadItems();
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reservations Inbox</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Forward or paste confirmations to auto-attach to your trip.
          </p>
        </div>

        {token && userId && (
          <ForwardingAddressCard
            token={token}
            userId={userId}
            onTokenRotated={setToken}
          />
        )}

        {/* How it works */}
        <Collapsible open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-sm">
              How it works
              <ChevronDown className={`h-4 w-4 transition-transform ${howItWorksOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card>
              <CardContent className="p-4 text-sm space-y-2 text-muted-foreground">
                <p>Forward any hotel, flight, dining, or ticket confirmation to your unique address. It shows up here within a minute or two and we attach it to your active trip automatically.</p>
                <Collapsible open={setupOpen} onOpenChange={setSetupOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="link" size="sm" className="p-0 h-auto text-primary">
                      Mail client setup instructions
                      <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${setupOpen ? "rotate-180" : ""}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    <p><strong>Gmail:</strong> Open the confirmation → ⋮ menu → Forward → paste your forwarding address.</p>
                    <p><strong>Outlook:</strong> Open the email → Forward → paste the address in To field.</p>
                    <p><strong>Apple Mail:</strong> Open the email → tap Forward → paste the address.</p>
                    <p><strong>Auto-forward tip:</strong> Set up a filter in Gmail (Settings → Filters) to auto-forward emails from travel domains.</p>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Paste + Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Paste or Upload Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Paste your confirmation email text here..."
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              className="min-h-[120px] font-mono text-xs"
            />
            <div className="flex items-center gap-3">
              <Button onClick={handleParse} disabled={parsing || !pasteContent.trim()}>
                {parsing ? "Parsing..." : "Parse Confirmation"}
              </Button>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.eml,.txt,.html"
                  className="hidden"
                  onChange={handleFileDrop}
                />
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-1.5" />
                    Upload File
                  </span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Inbox Feed */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Reservations</h2>
          <InboxFeed items={items} onReparse={handleReparse} reparsing={reparsing} />
        </div>
      </div>

      <ParseResultModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        parsed={parsedResult}
        confidence={confidence}
        onConfirm={handleConfirm}
        onReject={handleReject}
      />
    </DashboardLayout>
  );
}
