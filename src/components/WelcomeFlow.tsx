import { useState } from "react";
import { Castle, Map, Bell, Zap, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SLIDES = [
  {
    icon: "🏰",
    color: "#F5C842",
    title: "Welcome to Magic Pass Plus!",
    subtitle: "Your complete Disney World command center",
    body: "Plan smarter, save more, and enjoy every minute. Here's how to get the most out of Magic Pass Plus.",
    tip: null,
  },
  {
    icon: "🗺️",
    color: "#7C3AED",
    title: "Start with Trip Planner",
    subtitle: "Build your perfect Disney day in seconds",
    body: "Select your parks, dates, party size, and preferences. Our AI generates a fully optimized day-by-day itinerary — complete with walk times, wait times, and Lightning Lane strategy.",
    tip: "💡 Tip: Set your budget and we'll recommend the right hotel tier and ticket type.",
  },
  {
    icon: "🍽️",
    color: "#F43F5E",
    title: "Set Dining Alerts",
    subtitle: "Never miss a hard-to-get reservation",
    body: "We watch 24/7 and alert you the instant a reservation opens at Be Our Guest, Space 220, or any Disney restaurant. Get notified by email, SMS, or push.",
    tip: "💡 Tip: Set alerts early — popular restaurants like Be Our Guest book up 60 days out.",
  },
  {
    icon: "⚡",
    color: "#10B981",
    title: "Live Park Mode",
    subtitle: "Real-time intelligence while you're in the parks",
    body: "See live wait times updated every 60 seconds, get ride alerts when lines drop, and use our fireworks timing calculator to ride AND see the show.",
    tip: "💡 Tip: Enable GPS for walk time estimates and compass navigation between attractions.",
  },
  {
    icon: "🎁",
    color: "#F59E0B",
    title: "Save $300+ Before You Go",
    subtitle: "Disney gift card deals + savings calculator",
    body: "Track discounted Disney gift cards at Sam's Club, Target, Costco, and more. Stack savings with your credit card cashback for maximum Disney dollars.",
    tip: "💡 Tip: Sam's Club regularly sells $500 Disney cards for $484.98 — that's real money.",
  },
];

interface WelcomeFlowProps {
  onComplete: () => void;
}

export default function WelcomeFlow({ onComplete }: WelcomeFlowProps) {
  const { session } = useAuth();
  const [slide, setSlide] = useState(0);
  const [completing, setCompleting] = useState(false);

  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide];

  const complete = async () => {
    setCompleting(true);
    if (session) {
      await supabase.from("users_profile").update({ has_seen_welcome: true }).eq("id", session.user.id);
    }
    localStorage.setItem("magic-pass:welcome-seen", "true");
    onComplete();
  };

  const next = () => {
    if (isLast) { complete(); return; }
    setSlide(s => s + 1);
  };

  const skip = () => complete();

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center" style={{ background: "rgba(8,14,30,0.92)", backdropFilter: "blur(8px)" }}>
      <div className="w-full md:max-w-md rounded-t-3xl md:rounded-3xl overflow-hidden" style={{ background: "#111827" }}>
        {/* Progress dots */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === slide ? "w-6" : "w-1.5"}`}
                style={{ background: i <= slide ? current.color : "rgba(255,255,255,0.15)" }} />
            ))}
          </div>
          <button onClick={skip} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            Skip <X className="w-3 h-3" />
          </button>
        </div>

        {/* Slide content */}
        <div className="px-6 py-5">
          {/* Icon */}
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl mb-5 mx-auto"
            style={{ background: `${current.color}20`, border: `2px solid ${current.color}40` }}>
            {current.icon}
          </div>

          {/* Text */}
          <h2 className="text-xl font-black text-foreground text-center mb-1">{current.title}</h2>
          <p className="text-sm text-muted-foreground text-center mb-4" style={{ color: current.color }}>{current.subtitle}</p>
          <p className="text-sm text-muted-foreground text-center leading-relaxed mb-4">{current.body}</p>

          {/* Tip */}
          {current.tip && (
            <div className="px-4 py-3 rounded-xl mb-4" style={{ background: `${current.color}10`, border: `1px solid ${current.color}25` }}>
              <p className="text-xs text-foreground leading-relaxed">{current.tip}</p>
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="px-6 pb-8">
          <button onClick={next} disabled={completing}
            className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-98"
            style={{ background: current.color, color: "#080E1E" }}>
            {completing ? "Getting started..." : isLast ? "🚀 Let's Go!" : <>Next <ChevronRight className="w-5 h-5" /></>}
          </button>
          {!isLast && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              {slide + 1} of {SLIDES.length}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
