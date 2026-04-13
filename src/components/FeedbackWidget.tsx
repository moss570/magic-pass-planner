import { useState } from "react";
import { MessageSquarePlus, Bug, Lightbulb, MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const TYPES = [
  { value: "bug", label: "Bug Report", icon: Bug, color: "text-red-400" },
  { value: "feature", label: "Feature Request", icon: Lightbulb, color: "text-yellow-400" },
  { value: "general", label: "General", icon: MessageCircle, color: "text-blue-400" },
] as const;

export default function FeedbackWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in both title and description");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await (supabase.from("beta_feedback" as any).insert({
        user_id: user.id,
        user_email: user.email,
        type,
        title: title.trim().slice(0, 200),
        description: description.trim().slice(0, 5000),
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      }) as any);
      if (error) throw error;
      toast.success("Thanks for your feedback! 🎉");
      setOpen(false);
      setTitle("");
      setDescription("");
      setType("bug");
    } catch {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="w-5 h-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-primary" />
              Send Feedback
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-colors ${
                    type === t.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <t.icon className={`w-4 h-4 ${type === t.value ? "text-primary" : t.color}`} />
                  {t.label}
                </button>
              ))}
            </div>

            <Input
              placeholder="Brief title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
            />

            <Textarea
              placeholder={type === "bug" ? "What happened? What did you expect?" : "Describe your idea or feedback..."}
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
            />

            <p className="text-[11px] text-muted-foreground">
              Your current page URL and browser info will be included automatically.
            </p>

            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Submit Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
