import { useState, useEffect } from "react";
import { HelpCircle, X, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FeatureTipProps {
  id: string;            // unique tip ID e.g. "trip-planner-dates"
  title: string;
  body: string;
  position?: "top" | "bottom";
  showOnce?: boolean;    // default true — show once, remember in profile
  accent?: string;       // color
}

export function FeatureTip({ id, title, body, position = "bottom", showOnce = true, accent = "#F0B429" }: FeatureTipProps) {
  const { session } = useAuth();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed this tip
    const key = `magic-pass:tip-${id}`;
    if (localStorage.getItem(key)) { setDismissed(true); return; }
  }, [id]);

  const dismiss = async () => {
    setVisible(false);
    if (showOnce) {
      localStorage.setItem(`magic-pass:tip-${id}`, "1");
      if (session) {
        const { data } = await supabase.from("users_profile").select("feature_tips_seen").eq("id", session.user.id).single();
        const seen = data?.feature_tips_seen || [];
        await supabase.from("users_profile").update({ feature_tips_seen: [...seen, id] }).eq("id", session.user.id);
      }
    }
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setVisible(v => !v)}
        className="w-5 h-5 rounded-full flex items-center justify-center transition-colors"
        style={{ background: `${accent}20`, color: accent }}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {visible && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setVisible(false)} />
          <div className={`absolute z-50 w-64 rounded-xl p-4 shadow-xl ${position === "top" ? "bottom-7 left-0" : "top-7 left-0"}`}
            style={{ background: "#111827", border: `1px solid ${accent}30` }}>
            {/* Arrow */}
            <div className={`absolute w-3 h-3 rotate-45 ${position === "top" ? "-bottom-1.5 left-4" : "-top-1.5 left-4"}`}
              style={{ background: "#111827", borderLeft: position === "top" ? "none" : `1px solid ${accent}30`, borderTop: position === "top" ? "none" : `1px solid ${accent}30` }} />
            
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xs font-bold" style={{ color: accent }}>{title}</p>
              <button onClick={dismiss} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
            <button onClick={dismiss} className="text-xs mt-2 font-semibold flex items-center gap-1" style={{ color: accent }}>
              Got it <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Inline contextual tip bar (for empty states or first visit)
export function TipBar({ icon, title, body, cta, onCta, accent = "#F0B429" }: {
  icon: string; title: string; body: string; cta?: string; onCta?: () => void; accent?: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="rounded-xl p-4 border flex items-start gap-3" style={{ background: `${accent}08`, borderColor: `${accent}25` }}>
      <span className="text-2xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold mb-0.5" style={{ color: accent }}>{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
        {cta && onCta && (
          <button onClick={onCta} className="text-xs font-semibold mt-1.5 flex items-center gap-1" style={{ color: accent }}>
            {cta} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
