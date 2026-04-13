import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Rocket, FlaskConical } from "lucide-react";

interface LaunchSignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SignupType = "updates" | "beta_tester";

const LaunchSignupModal = ({ open, onOpenChange }: LaunchSignupModalProps) => {
  const [signupType, setSignupType] = useState<SignupType>("updates");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid || !marketingConsent) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("launch_signups" as any).insert({
        email: email.trim().toLowerCase(),
        first_name: firstName.trim() || null,
        signup_type: signupType,
        marketing_consent: true,
        consent_timestamp: new Date().toISOString(),
        source: "homepage",
      } as any);

      if (error) {
        if (error.code === "23505") {
          toast.error("You've already signed up! We'll be in touch soon.");
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      // Reset on close
      setTimeout(() => {
        setSubmitted(false);
        setEmail("");
        setFirstName("");
        setMarketingConsent(false);
        setSignupType("updates");
      }, 300);
    }
    onOpenChange(val);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🎉</div>
            <DialogHeader>
              <DialogTitle className="text-2xl">You're on the list!</DialogTitle>
              <DialogDescription className="mt-2">
                {signupType === "beta_tester"
                  ? "Thanks for applying to be a Beta Tester! We'll review your application and reach out soon."
                  : "Thanks for signing up! We'll send you updates as we get closer to launch."}
              </DialogDescription>
            </DialogHeader>
            <p className="text-xs text-muted-foreground mt-4">
              You can unsubscribe at any time. We respect your privacy and will never share your email.
            </p>
            <Button onClick={() => handleClose(false)} className="mt-6">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Get Early Access</DialogTitle>
          <DialogDescription>
            Sign up for launch updates or apply to be a Beta Tester and get early access to all features.
          </DialogDescription>
        </DialogHeader>

        {/* Type selector */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            type="button"
            onClick={() => setSignupType("updates")}
            className={`rounded-lg border-2 p-3 text-center transition-all ${
              signupType === "updates"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/40"
            }`}
          >
            <Rocket className="w-5 h-5 mx-auto mb-1 text-primary" />
            <span className="text-sm font-semibold">Launch Updates</span>
          </button>
          <button
            type="button"
            onClick={() => setSignupType("beta_tester")}
            className={`rounded-lg border-2 p-3 text-center transition-all ${
              signupType === "beta_tester"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/40"
            }`}
          >
            <FlaskConical className="w-5 h-5 mx-auto mb-1 text-primary" />
            <span className="text-sm font-semibold">Beta Tester</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="signup-first-name">First Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="signup-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value.slice(0, 50))}
              placeholder="First name"
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="signup-email">Email <span className="text-destructive">*</span></Label>
            <Input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value.slice(0, 255))}
              placeholder="you@example.com"
              maxLength={255}
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="signup-consent"
              checked={marketingConsent}
              onCheckedChange={(v) => setMarketingConsent(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="signup-consent" className="text-xs text-muted-foreground leading-snug cursor-pointer">
              I agree to receive email communications from Magic Pass Plus about product updates, launch news, and beta testing opportunities. You can unsubscribe at any time. We will never sell or share your email address.{" "}
              <a href="/privacy-policy" target="_blank" className="underline text-primary">Privacy Policy</a>
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!emailValid || !marketingConsent || submitting}
          >
            {submitting ? "Submitting…" : signupType === "beta_tester" ? "Apply for Beta Access" : "Get Launch Updates"}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">
            We respect your inbox. No spam, ever. Unsubscribe anytime.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LaunchSignupModal;
