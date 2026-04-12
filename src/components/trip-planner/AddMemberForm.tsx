import { useState } from "react";
import { Loader2, Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";

interface Props {
  tripId: string | null;
  onMemberAdded: (member: { firstName: string; lastName: string; email: string; isAdult: boolean; isSplitting: boolean }) => void;
}

export default function AddMemberForm({ tripId, onMemberAdded }: Props) {
  const { session } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSplitting, setIsSplitting] = useState(true);
  const [sending, setSending] = useState(false);

  const canSubmit = firstName.trim() && lastName.trim() && email.trim() && email.includes("@");

  const handleSubmit = async () => {
    if (!canSubmit || !session) return;
    setSending(true);
    try {
      if (tripId) {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/travel-party-invite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "x-client-authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            tripId,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
          }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Failed to send invite");
        toast({ title: "📧 Invite sent!", description: `${firstName} will receive an email with a discount code.` });
      }

      onMemberAdded({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        isAdult: true,
        isSplitting,
      });

      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setIsSplitting(true);
      setShowForm(false);
    } catch (err) {
      toast({
        title: "Failed to send invite",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full py-3 px-4 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors text-left space-y-1"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <UserPlus className="w-4 h-4" /> Invite Friend to Plan This Trip
        </div>
        <p className="text-xs text-muted-foreground leading-snug">
          Your friend will be able to receive alerts, follow budget, participate in polls and other features depending on which subscription tier they have.
        </p>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border p-4 space-y-3 bg-muted">
      <p className="text-xs text-muted-foreground">
        Travel party members must be adults with their own account. Add children in the party size count above.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name *"
          className="text-xs h-9"
        />
        <Input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name *"
          className="text-xs h-9"
        />
      </div>
      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email (required)"
        type="email"
        className="text-xs h-9"
      />
      <Input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone (optional, for SMS invite)"
        type="tel"
        className="text-xs h-9"
      />
      <button
        onClick={() => setIsSplitting((s) => !s)}
        className={`w-full py-1.5 rounded-lg text-xs font-semibold border transition-all ${
          isSplitting
            ? "bg-green-500/20 text-green-400 border-green-500/30"
            : "border-border text-muted-foreground"
        }`}
      >
        {isSplitting ? "✅ Splitting expenses" : "❌ Not splitting expenses"}
      </button>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => setShowForm(false)}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="flex-1 text-xs"
          disabled={!canSubmit || sending}
          onClick={handleSubmit}
        >
          {sending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Send className="w-3.5 h-3.5 mr-1" /> Send Invite
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
