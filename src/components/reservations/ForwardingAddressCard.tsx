import { useState } from "react";
import { Copy, Check, RefreshCw, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ForwardingAddressCardProps {
  token: string;
  userId: string;
  onTokenRotated: (newToken: string) => void;
}

export default function ForwardingAddressCard({ token, userId, onTokenRotated }: ForwardingAddressCardProps) {
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const { toast } = useToast();

  const fullAddress = `trips+${token}@inbox.magicpassplus.com`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Forwarding address copied to clipboard." });
  };

  const handleRotate = async () => {
    setRotating(true);
    try {
      // Generate new token client-side (16 chars)
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
      let newToken = "";
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      for (let i = 0; i < 16; i++) newToken += chars[arr[i] % chars.length];

      const { error } = await supabase
        .from("users_profile" as any)
        .update({
          forwarding_token: newToken,
          forwarding_token_rotated_at: new Date().toISOString(),
        } as any)
        .eq("id", userId);

      if (error) throw error;
      onTokenRotated(newToken);
      toast({ title: "Address rotated", description: "Your old forwarding address is now invalid." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRotating(false);
    }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Your Forwarding Address</CardTitle>
        </div>
        <CardDescription>
          Forward hotel, flight, dining, or ticket confirmations to this address. They'll appear here automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 rounded-lg bg-muted p-3 font-mono text-sm break-all">
          <span className="flex-1">{fullAddress}</span>
          <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={handleRotate} disabled={rotating}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${rotating ? "animate-spin" : ""}`} />
            Rotate address
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
