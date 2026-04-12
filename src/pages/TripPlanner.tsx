import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Castle, RefreshCw, Calendar, Users, Minus, Plus, Sparkles,
  ChevronDown, ChevronUp, MapPin, Clock, Utensils, Star, AlertTriangle,
  Save, Share2, Printer, Bell, FolderOpen, Trash2, Copy, Check
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import CompassButton from "@/components/CompassButton";
import ItineraryCard from "@/components/trip-planner/ItineraryCard";
import HotelSuggestions from "@/components/trip-planner/HotelSuggestions";
import { useAuth } from "@/contexts/AuthContext";
import { TipBar } from "@/components/FeatureTip";
import { useToast } from "@/hooks/use-toast";
import { isFeatureEnabled } from "@/lib/featureFlags";
import VersionSwitcher, { type TripVersion } from "@/components/trip-planner/VersionSwitcher";

// Wizard components
import Stepper from "@/components/trip-planner/Stepper";
import StepBasics from "@/components/trip-planner/steps/StepBasics";
import StepParty from "@/components/trip-planner/steps/StepParty";
import StepParksDates from "@/components/trip-planner/steps/StepParksDates";
import StepMustDos from "@/components/trip-planner/steps/StepMustDos";
import StepMealPlanning from "@/components/trip-planner/steps/StepMealPlanning";
import StepTransportLodging from "@/components/trip-planner/steps/StepTransportLodging";
import StepLightningLaneTickets from "@/components/trip-planner/steps/StepLightningLaneTickets";
import StepReview from "@/components/trip-planner/steps/StepReview";
import { loadDraft, saveDraft, clearDraft, getDefaultDraft, type TripDraft, type TripMode } from "@/lib/tripDraft";
import { toParkId } from "@/lib/parkContent";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const SUPABASE_ANON = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";

// ── Old form constants (kept for legacy path) ──
const PARKS_LEGACY = [
  "Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom",
  "Disney Springs", "🌊 Typhoon Lagoon", "❄️ Blizzard Beach"
];

const RIDE_PREFS = [
  { label: "🎢 Thrill Seeker", value: "thrill" },
  { label: "🎠 Family Friendly", value: "family" },
  { label: "👶 Little Ones First", value: "little" },
  { label: "⚖️ Mix of Everything", value: "mix" },
];

const LL_OPTIONS_LEGACY = [
  { label: "Individual Lightning Lane", value: "individual" },
  { label: "Lightning Lane Multi Pass", value: "multi" },
  { label: "None", value: "none" },
];

// ── Shared types ──
interface ItineraryItem {
  time: string;
  activity: string;
  type: string;
  badge?: string;
  tip: string;
  wait?: number;
  location?: string;
  land?: string;
  priority: string;
}

interface DayPlan {
  date: string;
  park: string;
  parkEmoji: string;
  crowdLevel: number;
  items: ItineraryItem[];
  summary: string;
  highlights: string[];
}

const badgeColors: Record<string, string> = {
  "Rope Drop": "bg-primary/20 text-primary",
  "Lightning Lane": "bg-yellow-500/20 text-yellow-400",
  "Dining": "bg-orange-500/20 text-orange-400",
  "Quick Service": "bg-blue-500/20 text-blue-400",
  "Show": "bg-purple-500/20 text-purple-400",
  "Fireworks": "bg-purple-500/20 text-purple-400",
  "Break": "bg-muted text-muted-foreground",
};

const typeIcons: Record<string, string> = {
  "ride": "🎢",
  "dining": "🍽️",
  "show": "🎭",
  "break": "☀️",
  "rope-drop": "🏃",
  "transport": "🚌",
};

const crowdLabel = (level: number) => {
  if (level <= 3) return { text: "Low", color: "text-green-400", bg: "bg-green-500/20" };
  if (level <= 5) return { text: "Moderate", color: "text-yellow-400", bg: "bg-yellow-500/20" };
  if (level <= 7) return { text: "Busy", color: "text-orange-400", bg: "bg-orange-500/20" };
  return { text: "Very Busy", color: "text-red-400", bg: "bg-red-500/20" };
};

// ── DayCard (shared between old and new) ──
function DayCard({ plan, dayNum }: { plan: DayPlan; dayNum: number }) {
  const [expanded, setExpanded] = useState(dayNum === 1);
  const crowd = crowdLabel(plan.crowdLevel);
  const dateFormatted = new Date(plan.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">{plan.parkEmoji}</div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-foreground">Day {dayNum} — {plan.park}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${crowd.bg} ${crowd.color}`}>
                {crowd.text} Crowds
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{dateFormatted}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div>
          <div className="px-5 pb-3 flex flex-wrap gap-1.5">
            {plan.highlights.map((h, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">✨ {h}</span>
            ))}
          </div>

          <div className="px-5 pb-4">
            <div className="relative">
              <div className="absolute left-[22px] top-2 bottom-2 w-px bg-border" />
              <div className="space-y-3">
                {plan.items.map((item, i) => (
                  <div key={i} className="flex gap-3 relative">
                    <div className="w-11 h-11 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 z-10 text-base">
                      {typeIcons[item.type] || "📍"}
                    </div>
                    <div className={`flex-1 rounded-xl p-3 border transition-colors ${item.priority === "must-do" ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="text-xs text-muted-foreground">{item.time}</p>
                          <p className="text-sm font-semibold text-foreground leading-tight">{item.activity}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.wait !== undefined && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.wait <= 15 ? "bg-green-500/20 text-green-400" : item.wait <= 30 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                              {item.wait} min
                            </span>
                          )}
                          {item.badge && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColors[item.badge] || "bg-muted text-muted-foreground"}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                      {(item as any).isDuplicate && (
                        <div className="flex items-center gap-1.5 mt-1 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-semibold">
                            ⚠️ Already scheduled Day {(item as any).firstScheduledDay}
                          </span>
                        </div>
                      )}
                      {((item as any).walkMinutes > 0 || (item as any).waitMinutes > 0) && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
                          {(item as any).walkMinutes > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">🚶 {(item as any).walkMinutes} min walk</span>
                          )}
                          {(item as any).waitMinutes > 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${(item as any).waitMinutes <= 15 ? "bg-green-500/15 text-green-400" : (item as any).waitMinutes <= 45 ? "bg-yellow-500/15 text-yellow-400" : "bg-red-500/15 text-red-400"}`}>
                              ⏱️ {(item as any).waitMinutes} min wait
                            </span>
                          )}
                          {(item as any).rideMinutes > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">🎢 {(item as any).rideMinutes} min ride</span>
                          )}
                          {(item as any).durationMinutes > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Total: ~{(item as any).durationMinutes} min</span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.tip}</p>
                      {(item as any).alternativeDining?.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">Also nearby: {(item as any).alternativeDining.join(", ")}</p>
                      )}
                      {/* Passing points */}
                      {(item as any).passingPoints?.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {(item as any).passingPoints.map((pp: any, j: number) => (
                            <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {pp.type === 'restroom' ? '🚻' : pp.type === 'snack' ? '🍿' : pp.type === 'merch' ? '🛍️' : '📸'} {pp.label}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.location && (
                        <div className="mt-2">
                          <CompassButton destination={item.location} context={item.land || plan.park} size="inline" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Results View (shared) ──
function ResultsView({
  plans, estimatedTotal, budget, budgetBreakdown, ticketInfo, hotelRecs, diningRecs,
  hotelNightlyBudget, tripCoverage, nonParkSuggestions, resortStay, parkHopper,
  onSave, saving, savedTripId, onShare, shareUrl, copied, onExportPDF, onSyncDining, onRegenerate, generating,
  onDayUpdated, getHeaders, supabaseUrl, walkingSpeedKmh, tripId,
  lodging, startDate, endDate, adults, children,
}: {
  plans: DayPlan[];
  estimatedTotal: number | null;
  budget: number;
  budgetBreakdown: Record<string, number> | null;
  ticketInfo: any;
  hotelRecs: any[];
  diningRecs: Record<string, any[]>;
  hotelNightlyBudget: number | null;
  tripCoverage: any;
  nonParkSuggestions: any[];
  resortStay: boolean;
  parkHopper: boolean;
  onSave: () => void;
  saving: boolean;
  savedTripId: string | null;
  onShare: () => void;
  shareUrl: string | null;
  copied: boolean;
  onExportPDF: () => void;
  onSyncDining: () => void;
  onRegenerate: () => void;
  generating: boolean;
  onDayUpdated: (dayIndex: number, newPlan: DayPlan) => void;
  getHeaders: () => Record<string, string>;
  supabaseUrl: string;
  walkingSpeedKmh: number;
  tripId?: string | null;
  lodging?: string;
  startDate?: string;
  endDate?: string;
  adults?: number;
  children?: number;
}) {
  const useEnhancedCards = isFeatureEnabled('itineraryCardEnhancements');
  return (
    <div className="space-y-4">
      {/* Trip Summary */}
      <div className="rounded-xl p-4 border border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">Your {plans.length}-Day Adventure</h2>
            {resortStay && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">✨ Early Entry</span>}
            {parkHopper && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-semibold">🏃 Park Hopper</span>}
          </div>
          <button onClick={onRegenerate} disabled={generating}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} /> Regenerate
          </button>
        </div>
        {estimatedTotal != null && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Estimated total</span>
                <span className={`text-sm font-bold ${estimatedTotal <= budget ? "text-green-400" : "text-red-400"}`}>
                  ${estimatedTotal.toLocaleString()} {estimatedTotal <= budget ? "✅" : `⚠️ $${(estimatedTotal - budget).toLocaleString()} over`}
                </span>
              </div>
              {budgetBreakdown && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(budgetBreakdown).map(([key, val]) => (
                    <div key={key} className="text-center p-2 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-xs font-bold text-foreground">${(val as number).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {ticketInfo && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                <p className="text-xs font-bold text-primary mb-2">🎟️ Ticket Recommendation</p>
                <p className="text-sm font-semibold text-foreground">{ticketInfo.recommendation}</p>
                {ticketInfo.options?.map((opt: string, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground mt-1">{opt}</p>
                ))}
              </div>
            )}

            {hotelRecs.length > 0 && (
              <div>
                <p className="text-xs font-bold text-primary mb-2">🏨 Hotel Recommendations {hotelNightlyBudget ? `(~$${hotelNightlyBudget}/night budget)` : ""}</p>
                <div className="space-y-2">
                  {hotelRecs.map((hotel: any, i: number) => (
                    <div key={i} className={`p-3 rounded-xl border ${i === 0 ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{hotel.name}</p>
                            {i === 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">Best Match</span>}
                          </div>
                          <p className="text-xs text-primary font-semibold">{hotel.priceRange}/night</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">{hotel.tier}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{hotel.bestFor}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {hotel.amenities?.map((a: string) => (
                          <span key={a} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{a}</span>
                        ))}
                      </div>
                      {!resortStay && isFeatureEnabled('hotelAlerts') && (
                        <div className="flex gap-2 mt-2">
                          <a href={`/hotel-alerts`} className="text-xs px-3 py-1.5 rounded-lg border border-primary/40 text-primary font-semibold hover:bg-primary/10 transition-colors">
                            🔔 Create Hotel Alert
                          </a>
                          <a href={hotel.bookingUrl || "#"} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground font-medium hover:text-foreground transition-colors">
                            Book / More Info →
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(diningRecs).length > 0 && (
              <div>
                <p className="text-xs font-bold text-primary mb-2">🍽️ Dining Recommendations</p>
                {Object.entries(diningRecs).map(([park, recs]: [string, any[]]) => (
                  <div key={park} className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">{park}</p>
                    <div className="space-y-1.5">
                      {recs.map((rec: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg border border-border bg-muted/30">
                          <p className="text-xs font-semibold text-foreground">{rec.name}</p>
                          <p className="text-xs text-muted-foreground">{rec.type} · {rec.priceRange}</p>
                          <p className="text-xs text-muted-foreground mt-1">{rec.why}</p>
                          <p className="text-xs text-yellow-400 mt-1">⏰ {rec.reservationTips}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Off-site hotel suggestions — hide for day trips */}
      {!resortStay && lodging !== 'disney-resort' && draft.mode !== 'day-trip' && (
        <HotelSuggestions
          lodging={lodging || ''}
          startDate={startDate || ''}
          endDate={endDate || ''}
          adults={adults || 2}
          children={children || 0}
        />
      )}

      {plans.map((plan, i) => (
        useEnhancedCards ? (
          <ItineraryCard
            key={i}
            plan={plan}
            dayNum={i + 1}
            dayIndex={i}
            tripId={tripId}
            onDayUpdated={onDayUpdated}
            getHeaders={getHeaders}
            supabaseUrl={supabaseUrl}
            walkingSpeedKmh={walkingSpeedKmh}
          />
        ) : (
          <DayCard key={i} plan={plan} dayNum={i + 1} />
        )
      ))}

      {tripCoverage && tripCoverage.totalAttractionsScheduled > 0 && (
        <div className="rounded-xl p-4 border border-green-500/20 bg-green-500/5">
          <p className="text-xs font-bold text-green-400 mb-2">✅ Trip Coverage — {tripCoverage.totalAttractionsScheduled} attractions</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(tripCoverage.attractionsByDay || {}).map(([attraction, info]: [string, any]) => (
              <span key={attraction} className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                Day {info.day}: {attraction.length > 20 ? attraction.substring(0, 20) + "…" : attraction}
              </span>
            ))}
          </div>
        </div>
      )}

      {nonParkSuggestions.length > 0 && (
        <div className="rounded-xl p-4 border border-secondary/30 bg-secondary/5">
          <p className="text-xs font-bold text-secondary mb-3">🗺️ Non-Park Day Suggestions</p>
          <div className="space-y-2">
            {nonParkSuggestions.map((sug: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{sug.name}</p>
                    <p className="text-xs text-muted-foreground">{sug.distance}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sug.why}</p>
                  </div>
                  <a href={sug.link} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 text-xs px-2 py-1 rounded border border-primary/40 text-primary hover:bg-primary/10 transition-colors">
                    Learn More →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button onClick={onSave} disabled={saving}
          className="py-2.5 rounded-xl border border-primary/40 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60">
          <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : savedTripId ? "Update Trip" : "Save Trip"}
        </button>
        <button onClick={onShare}
          className="py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:border-primary/20 transition-colors flex items-center justify-center gap-1.5">
          {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied!</span></> : <><Share2 className="w-3.5 h-3.5" /> Share Trip</>}
        </button>
        <button onClick={onSyncDining}
          className="py-2.5 rounded-xl border border-orange-500/30 text-sm font-semibold text-orange-400 hover:bg-orange-500/10 transition-colors flex items-center justify-center gap-1.5">
          <Bell className="w-3.5 h-3.5" /> Create Dining Alerts
        </button>
        <button onClick={onExportPDF}
          className="py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:border-primary/20 transition-colors flex items-center justify-center gap-1.5">
          <Printer className="w-3.5 h-3.5" /> Export PDF
        </button>
      </div>
      {shareUrl && (
        <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-2">
          <p className="text-xs text-muted-foreground flex-1 truncate">{shareUrl}</p>
          <button onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="shrink-0 text-xs text-primary font-semibold hover:underline flex items-center gap-1">
            <Copy className="w-3 h-3" /> Copy
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function TripPlanner() {
  const useWizard = isFeatureEnabled('tripPlannerWizardV2');

  if (useWizard) return <TripPlannerWizard />;
  return <TripPlannerLegacy />;
}

// ══════════════════════════════════════════════════════════════════════════════
// V2 WIZARD
// ══════════════════════════════════════════════════════════════════════════════

function TripPlannerWizard() {
  const { session, user } = useAuth();
  const { toast } = useToast();
  const userId = user?.id || 'anon';

  // Mode selection state — null means user hasn't chosen yet
  const [modeSelected, setModeSelected] = useState<boolean>(false);

  // Draft state
  const [draft, setDraft] = useState<TripDraft>(getDefaultDraft);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [step, setStep] = useState(0);

  // Results state
  const [generating, setGenerating] = useState(false);
  const [plans, setPlans] = useState<DayPlan[]>([]);
  const [estimatedTotal, setEstimatedTotal] = useState<number | null>(null);
  const [budgetBreakdown, setBudgetBreakdown] = useState<Record<string, number> | null>(null);
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [ticketInfo, setTicketInfo] = useState<any>(null);
  const [hotelRecs, setHotelRecs] = useState<any[]>([]);
  const [diningRecs, setDiningRecs] = useState<Record<string, any[]>>({});
  const [hotelNightlyBudget, setHotelNightlyBudget] = useState<number | null>(null);
  const [tripCoverage, setTripCoverage] = useState<any>(null);
  const [nonParkSuggestions, setNonParkSuggestions] = useState<any[]>([]);

  // Version state
  const [versions, setVersions] = useState<TripVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const navigate = useNavigate();
  const useVersions = isFeatureEnabled('itineraryVersions');

  // Load versions when trip is saved
  const loadVersions = useCallback(async (tripId: string) => {
    if (!session || !useVersions) return;
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/trips?action=list-versions&trip_id=${tripId}`, { headers: getHeaders() });
      const data = await resp.json();
      setVersions(data.versions || []);
      const active = (data.versions || []).find((v: TripVersion) => v.is_active);
      if (active) setActiveVersionId(active.id);
    } catch {}
  }, [session, useVersions]);

  // Save current results as a version
  const saveAsVersion = useCallback(async (tripId: string, versionName?: string) => {
    if (!session || !useVersions) return;
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/trips?action=create-version`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({
          trip_id: tripId,
          name: versionName,
          inputs: {
            selectedParks: draft.selectedParks, startDate: draft.startDate, endDate: draft.endDate,
            adults: draft.adults, children: draft.children, ages: draft.ages,
            ridePreference: draft.ridePreference, budget: draft.budget, llOption: draft.llOption,
            parkHopper: draft.parkHopper, lodging: draft.lodging, mustDoAttractions: draft.mustDoAttractions,
          },
          plans,
          totals: { estimatedTotal, budgetBreakdown },
          warnings: [],
        }),
      });
      const data = await resp.json();
      if (data.error) { toast({ title: data.error, variant: "destructive" }); return; }
      await loadVersions(tripId);
    } catch {}
  }, [session, useVersions, draft, plans, estimatedTotal, budgetBreakdown]);

  const switchVersion = (v: TripVersion) => {
    setActiveVersionId(v.id);
    setPlans(v.plans || []);
    setEstimatedTotal(v.totals?.estimatedTotal || null);
    setBudgetBreakdown(v.totals?.budgetBreakdown || null);
  };

  const handleDuplicateVersion = async () => {
    if (!savedTripId) return;
    await saveAsVersion(savedTripId, `Version ${versions.length + 1}`);
    toast({ title: "✨ Version duplicated! Edit inputs and regenerate." });
  };

  const handleRenameVersion = async (versionId: string, newName: string) => {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/trips?action=update-version`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ id: versionId, name: newName }),
      });
      setVersions(prev => prev.map(v => v.id === versionId ? { ...v, name: newName } : v));
    } catch {}
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!savedTripId) return;
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/trips?action=delete-version`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ id: versionId }),
      });
      const data = await resp.json();
      if (data.error) { toast({ title: data.error, variant: "destructive" }); return; }
      await loadVersions(savedTripId);
      // Switch to first remaining if we deleted current
      if (versionId === activeVersionId) {
        const remaining = versions.filter(v => v.id !== versionId);
        if (remaining[0]) switchVersion(remaining[0]);
      }
    } catch {}
  };

  const handleSetActiveVersion = async (versionId: string) => {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/trips?action=update-version`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ id: versionId, is_active: true }),
      });
      setVersions(prev => prev.map(v => ({ ...v, is_active: v.id === versionId })));
      setActiveVersionId(versionId);
      toast({ title: "✅ Active version updated" });
    } catch {}
  };

  // Check for existing draft on mount
  useEffect(() => {
    const existing = loadDraft(userId);
    if (existing) {
      setShowResumeBanner(true);
    }
  }, [userId]);

  // Handle prefill from Best Days to Go or other sources
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefillDates = params.get("prefillDates");
    const prefillParks = params.get("prefillParks") || params.get("prefillPark");
    const prefillMode = params.get("mode") as TripMode | null;
    const prefillParkHopper = params.get("parkHopper") === "true";

    if (prefillDates || prefillMode) {
      const dates = prefillDates ? prefillDates.split(",").filter(Boolean).sort() : [];
      const parkNames: Record<string, string> = {
        "magic-kingdom": "Magic Kingdom",
        "epcot": "EPCOT",
        "hollywood-studios": "Hollywood Studios",
        "animal-kingdom": "Animal Kingdom",
      };
      const patch: Partial<TripDraft> = {};

      if (prefillMode === 'day-trip' || prefillMode === 'vacation') {
        patch.mode = prefillMode;
        if (prefillMode === 'day-trip') {
          patch.budget = 500;
        }
      }

      if (dates.length > 0) {
        patch.startDate = dates[0];
        patch.endDate = dates[dates.length - 1];
      }

      if (prefillParks) {
        const parkIds = prefillParks.split(",").filter(Boolean);
        patch.selectedParks = parkIds.map(id => parkNames[id] || id);
      }

      if (prefillParkHopper) {
        patch.parkHopper = true;
      }

      setDraft(prev => ({ ...prev, ...patch }));
      setShowResumeBanner(false);
      setModeSelected(true);

      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const resumeDraft = () => {
    const existing = loadDraft(userId);
    if (existing) {
      setDraft(existing);
      setStep(existing.currentStep || 0);
      setModeSelected(true);
    }
    setShowResumeBanner(false);
  };

  const startFresh = () => {
    clearDraft(userId);
    setDraft(getDefaultDraft());
    setStep(0);
    setShowResumeBanner(false);
  };

  const updateDraft = useCallback((patch: Partial<TripDraft>) => {
    setDraft(prev => {
      const next = { ...prev, ...patch };
      saveDraft(userId, { ...next, currentStep: step });
      return next;
    });
  }, [userId, step]);

  const goToStep = (s: number) => {
    setStep(s);
    saveDraft(userId, { ...draft, currentStep: s });
  };

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
    "x-client-authorization": `Bearer ${session?.access_token}`,
    "apikey": SUPABASE_ANON,
  });

  // Derive non-park days from assignments
  const nonParkDayCount = draft.parkDayAssignments.filter(a => a.parkId === null).length;

  const generateItinerary = async () => {
    if (!session) { toast({ title: "Please log in", variant: "destructive" }); return; }
    setGenerating(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ai-trip-planner`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          mode: draft.mode,
          hasAnnualPass: draft.hasAnnualPass,
          parks: draft.selectedParks,
          startDate: draft.startDate,
          endDate: draft.endDate || draft.startDate,
          adults: draft.adults,
          children: draft.children,
          ages: draft.ages,
          ridePreference: draft.ridePreference,
          budget: draft.budget,
          llOption: draft.llOption,
          specialNotes: draft.specialNotes,
          parkHopper: draft.parkHopper,
          resortStay: draft.mode === 'day-trip' ? false : draft.lodging === 'disney-resort',
          nonParkDays: draft.mode === 'day-trip' ? 0 : nonParkDayCount,
          mustDoAttractions: draft.mustDoAttractions,
          walkingSpeedKmh: draft.walkingSpeedKmh,
          mealPlanPreferences: draft.mealPlanPreferences,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Generation failed");

      setPlans(data.plans);
      setEstimatedTotal(data.estimatedTotal);
      setBudgetBreakdown(data.budgetBreakdown);
      setTicketInfo(data.ticketInfo || null);
      setHotelRecs(data.hotelRecommendations || []);
      setDiningRecs(data.diningRecommendations || {});
      setTripCoverage(data.tripCoverage || null);
      setNonParkSuggestions(data.nonParkSuggestions || []);
      setHotelNightlyBudget(data.hotelNightlyBudget || null);
      setGenerated(true);
      toast({ title: "✨ Itinerary generated!", description: `${data.numDays}-day plan ready` });
      clearDraft(userId);

      // Auto-save
      if (session) {
        try {
          const saveResp = await fetch(`${SUPABASE_URL}/functions/v1/trips?action=save`, {
            method: "POST", headers: getHeaders(),
            body: JSON.stringify({
              id: savedTripId || undefined,
              name: draft.tripName || `${draft.selectedParks[0]} Trip — ${draft.startDate}`,
              parks: draft.selectedParks, start_date: draft.startDate,
              end_date: draft.endDate || draft.startDate,
              adults: draft.adults, children: draft.children, ages: draft.ages,
              ride_preference: draft.ridePreference, budget: draft.budget,
              ll_option: draft.llOption, special_notes: draft.specialNotes,
              itinerary: data.plans, estimated_total: data.estimatedTotal,
            }),
          });
          const saveData = await saveResp.json();
          const newTripId = saveData.trip?.id;
          if (newTripId) setSavedTripId(newTripId);

          // Invite members
          if (newTripId && draft.tripMembers.length > 0) {
            for (const member of draft.tripMembers) {
              try {
                await fetch(`${SUPABASE_URL}/functions/v1/social?action=add-trip-member`, {
                  method: "POST", headers: getHeaders(),
                  body: JSON.stringify({
                    tripId: newTripId, firstName: member.firstName,
                    lastName: member.lastName, email: member.email || null,
                    isAdult: member.isAdult, isSplittingExpenses: member.isSplitting,
                  }),
                });
              } catch {}
            }
            toast({ title: `📧 Invites sent to ${draft.tripMembers.length} member(s)!` });
          }

          // Auto-save as version 1
          if (useVersions && newTripId) {
            await saveAsVersion(newTripId, "Version 1");
          }
        } catch {}
      }
    } catch (err) {
      toast({ title: "Failed to generate", description: err instanceof Error ? err.message : "Please try again", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const saveTrip = async () => {
    if (!session || !plans.length) return;
    setSaving(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/trips?action=save`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({
          id: savedTripId || undefined,
          name: draft.tripName || `${draft.selectedParks[0]} Trip — ${draft.startDate}`,
          parks: draft.selectedParks, start_date: draft.startDate,
          end_date: draft.endDate || draft.startDate,
          adults: draft.adults, children: draft.children, ages: draft.ages,
          ride_preference: draft.ridePreference, budget: draft.budget,
          ll_option: draft.llOption, special_notes: draft.specialNotes,
          itinerary: plans, estimated_total: estimatedTotal,
        }),
      });
      const data = await resp.json();
      if (data.trip) { setSavedTripId(data.trip.id); toast({ title: "✅ Trip saved!" }); }
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const shareTrip = async () => {
    if (!savedTripId) { await saveTrip(); return; }
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/trips?action=share`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ id: savedTripId }) });
      const data = await resp.json();
      if (data.shareUrl) { setShareUrl(data.shareUrl); await navigator.clipboard.writeText(data.shareUrl).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 3000); toast({ title: "🔗 Share link copied!" }); }
    } catch { toast({ title: "Share failed", variant: "destructive" }); }
  };

  const syncDiningAlerts = async () => {
    if (!session || !plans.length) return;
    let count = 0;
    for (const plan of plans) {
      const diningItems = plan.items.filter(item => item.type === "dining" && item.location);
      for (const item of diningItems) {
        if (!item.location) continue;
        try {
          const searchResp = await fetch(`${SUPABASE_URL}/functions/v1/dining-alerts?action=restaurants&search=${encodeURIComponent(item.location)}`, { headers: getHeaders() });
          const searchData = await searchResp.json();
          const restaurant = searchData.restaurants?.[0];
          if (restaurant) {
            await fetch(`${SUPABASE_URL}/functions/v1/dining-alerts?action=create`, {
              method: "POST", headers: getHeaders(),
              body: JSON.stringify({ restaurant_id: restaurant.id, alert_date: plan.date, party_size: draft.adults + draft.children, meal_periods: ["Any"], alert_email: true }),
            });
            count++;
          }
        } catch {}
      }
    }
    toast({ title: count > 0 ? `🍽️ ${count} dining alert${count > 1 ? "s" : ""} created!` : "No new alerts needed" });
  };

  // If results are generated, show results view
  if (generated && plans.length > 0) {
    const handleDayUpdated = (dayIndex: number, newPlan: DayPlan) => {
      setPlans(prev => prev.map((p, i) => i === dayIndex ? newPlan : p));
    };

    return (
      <DashboardLayout title="🗺️ Trip Planner" subtitle="Your personalized itinerary">
        {useVersions && savedTripId && versions.length > 0 && (
          <div className="mb-4">
            <VersionSwitcher
              versions={versions}
              activeVersionId={activeVersionId}
              onSwitch={switchVersion}
              onDuplicate={handleDuplicateVersion}
              onRename={handleRenameVersion}
              onDelete={handleDeleteVersion}
              onSetActive={handleSetActiveVersion}
              onCompare={() => navigate(`/trip/${savedTripId}/compare`)}
              disabled={generating}
            />
          </div>
        )}
        <ResultsView
          plans={plans} estimatedTotal={estimatedTotal} budget={draft.budget}
          budgetBreakdown={budgetBreakdown} ticketInfo={ticketInfo} hotelRecs={hotelRecs}
          diningRecs={diningRecs} hotelNightlyBudget={hotelNightlyBudget}
          tripCoverage={tripCoverage} nonParkSuggestions={nonParkSuggestions}
          resortStay={draft.lodging === 'disney-resort'} parkHopper={draft.parkHopper}
          onSave={saveTrip} saving={saving} savedTripId={savedTripId}
          onShare={shareTrip} shareUrl={shareUrl} copied={copied}
          onExportPDF={() => { window.print(); toast({ title: "📄 Print dialog opened" }); }}
          onSyncDining={syncDiningAlerts}
          onRegenerate={generateItinerary} generating={generating}
          onDayUpdated={handleDayUpdated}
          getHeaders={getHeaders}
          supabaseUrl={SUPABASE_URL}
          walkingSpeedKmh={draft.walkingSpeedKmh}
          tripId={savedTripId}
          lodging={draft.lodging}
          startDate={draft.startDate}
          endDate={draft.endDate}
          adults={draft.adults}
          children={draft.children}
        />
      </DashboardLayout>
    );
  }

  const selectMode = (mode: TripMode) => {
    setDraft(prev => ({
      ...prev,
      mode,
      budget: mode === 'day-trip' ? 500 : 6500,
      endDate: mode === 'day-trip' ? prev.startDate : prev.endDate,
    }));
    setModeSelected(true);
    setStep(0);
  };

  // Day trip step mapping: 0=Basics, 1=Party, 2=Parks, 3=Must-Dos, 4=Review
  // Vacation step mapping: 0=Basics, 1=Party, 2=Parks, 3=Must-Dos, 4=Meals, 5=Transport, 6=LL, 7=Review
  const isDayTrip = draft.mode === 'day-trip';

  const getNextStep = (current: number): number => {
    if (isDayTrip && current === 3) return 4; // Must-Dos -> Review (skip Meals + Transport + LL)
    return current + 1;
  };

  const getPrevStep = (current: number): number => {
    if (isDayTrip && current === 4) return 3; // Review -> Must-Dos
    return current - 1;
  };

  const totalSteps = isDayTrip ? 5 : 8;
  const isReviewStep = isDayTrip ? step === 4 : step === 7;

  // Mode selection screen
  if (!modeSelected && !showResumeBanner) {
    return (
      <DashboardLayout title="🗺️ Trip Planner" subtitle="How are you visiting the parks?">
        <div className="space-y-4 max-w-lg mx-auto py-8">
          <button
            onClick={() => selectMode('vacation')}
            className="w-full rounded-xl border-2 border-primary/20 hover:border-primary/50 bg-card p-6 text-left transition-all hover:shadow-lg group"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">🏰</span>
              <div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">Vacation Planner</h3>
                <p className="text-xs text-muted-foreground mt-1">Multi-day trips with hotels, transportation, airfare & full budget planning</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {['Hotels', 'Airfare', 'Transport', 'Multi-Park', 'Full Budget'].map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => selectMode('day-trip')}
            className="w-full rounded-xl border-2 border-primary/20 hover:border-primary/50 bg-card p-6 text-left transition-all hover:shadow-lg group"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">☀️</span>
              <div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">Day Trip Itinerary</h3>
                <p className="text-xs text-muted-foreground mt-1">Single-day park visit — no hotel, no airfare, streamlined budget</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {['1 Day', 'AP Friendly', 'Park Hopper', 'Quick Budget'].map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isDayTrip ? "☀️ Day Trip Planner" : "🗺️ Trip Planner"} subtitle={isDayTrip ? "Plan your perfect park day" : "Plan your perfect trip step by step"}>
      <div className="space-y-4">
        {/* Mode badge + change */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isDayTrip ? 'bg-yellow-500/15 text-yellow-400' : 'bg-primary/15 text-primary'}`}>
            {isDayTrip ? '☀️ Day Trip' : '🏰 Vacation'}
          </span>
          <button
            onClick={() => { setModeSelected(false); setStep(0); }}
            className="text-[10px] text-muted-foreground hover:text-foreground underline"
          >
            Change mode
          </button>
        </div>

        {/* Resume banner */}
        {showResumeBanner && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">📋 Resume your draft trip?</p>
              <p className="text-xs text-muted-foreground">You have an unfinished trip plan saved</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={resumeDraft} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground">Resume</button>
              <button onClick={startFresh} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:bg-muted">Start Fresh</button>
            </div>
          </div>
        )}

        {/* Stepper */}
        <Stepper currentStep={step} onStepClick={goToStep} mode={draft.mode} />

        {/* Step content */}
        <div className="rounded-xl border border-border p-5 bg-card">
          {isDayTrip ? (
            <>
              {step === 0 && <StepBasics draft={draft} onChange={updateDraft} onContinue={() => goToStep(1)} />}
              {step === 1 && <StepParty draft={draft} onChange={updateDraft} onContinue={() => goToStep(2)} onBack={() => goToStep(0)} tripId={savedTripId} />}
              {step === 2 && <StepParksDates draft={draft} onChange={updateDraft} onContinue={() => goToStep(3)} onBack={() => goToStep(1)} />}
              {step === 3 && <StepMustDos draft={draft} onChange={updateDraft} onContinue={() => goToStep(4)} onBack={() => goToStep(2)} />}
              {step === 4 && <StepReview draft={draft} onBack={() => goToStep(3)} onGenerate={generateItinerary} generating={generating} />}
            </>
          ) : (
            <>
              {step === 0 && <StepBasics draft={draft} onChange={updateDraft} onContinue={() => goToStep(1)} />}
              {step === 1 && <StepParty draft={draft} onChange={updateDraft} onContinue={() => goToStep(2)} onBack={() => goToStep(0)} tripId={savedTripId} />}
              {step === 2 && <StepParksDates draft={draft} onChange={updateDraft} onContinue={() => goToStep(3)} onBack={() => goToStep(1)} />}
              {step === 3 && <StepMustDos draft={draft} onChange={updateDraft} onContinue={() => goToStep(4)} onBack={() => goToStep(2)} />}
              {step === 4 && <StepMealPlanning draft={draft} onChange={updateDraft} onContinue={() => goToStep(5)} onBack={() => goToStep(3)} />}
              {step === 5 && <StepTransportLodging draft={draft} onChange={updateDraft} onContinue={() => goToStep(6)} onBack={() => goToStep(4)} />}
              {step === 6 && <StepLightningLaneTickets draft={draft} onChange={updateDraft} onContinue={() => goToStep(7)} onBack={() => goToStep(5)} />}
              {step === 7 && <StepReview draft={draft} onBack={() => goToStep(6)} onGenerate={generateItinerary} generating={generating} />}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LEGACY FORM (feature flag off)
// ══════════════════════════════════════════════════════════════════════════════

function TripPlannerLegacy() {
  const { session } = useAuth();
  const { toast } = useToast();

  const [selectedParks, setSelectedParks] = useState<string[]>(["Magic Kingdom"]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [ages, setAges] = useState("");
  const [ridePreference, setRidePreference] = useState("mix");
  const [budget, setBudget] = useState(6500);
  const [llOption, setLlOption] = useState("multi");
  const [parkHopper, setParkHopper] = useState(false);
  const [resortStay, setResortStay] = useState(false);
  const [nonParkDays, setNonParkDays] = useState(0);
  const [tripMembers, setTripMembers] = useState<Array<{firstName: string; lastName: string; email: string; isAdult: boolean; isSplitting: boolean}>>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberFirstName, setMemberFirstName] = useState("");
  const [memberLastName, setMemberLastName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberIsAdult, setMemberIsAdult] = useState(true);
  const [memberIsSplitting, setMemberIsSplitting] = useState(true);
  const [specialNotes, setSpecialNotes] = useState("");

  const [generating, setGenerating] = useState(false);
  const [plans, setPlans] = useState<DayPlan[]>([]);
  const [estimatedTotal, setEstimatedTotal] = useState<number | null>(null);
  const [budgetBreakdown, setBudgetBreakdown] = useState<Record<string, number> | null>(null);
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [ticketInfo, setTicketInfo] = useState<any>(null);
  const [hotelRecs, setHotelRecs] = useState<any[]>([]);
  const [diningRecs, setDiningRecs] = useState<Record<string, any[]>>({});
  const [hotelNightlyBudget, setHotelNightlyBudget] = useState<number | null>(null);
  const [tripCoverage, setTripCoverage] = useState<any>(null);
  const [nonParkSuggestions, setNonParkSuggestions] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [savedTrips, setSavedTrips] = useState<any[]>([]);
  const [showSavedTrips, setShowSavedTrips] = useState(false);

  const togglePark = (park: string) => setSelectedParks(prev => prev.includes(park) ? prev.filter(p => p !== park) : [...prev, park]);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
    "x-client-authorization": `Bearer ${session?.access_token}`,
    "apikey": SUPABASE_ANON,
  });

  const saveTrip = async () => {
    if (!session || !plans.length) return;
    setSaving(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/trips?action=save`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ id: savedTripId || undefined, name: `${selectedParks[0]} Trip — ${startDate}`, parks: selectedParks, start_date: startDate, end_date: endDate || startDate, adults, children, ages, ride_preference: ridePreference, budget, ll_option: llOption, special_notes: specialNotes, itinerary: plans, estimated_total: estimatedTotal }),
      });
      const data = await resp.json();
      if (data.trip) { setSavedTripId(data.trip.id); toast({ title: "✅ Trip saved!" }); }
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const shareTrip = async () => {
    if (!savedTripId) { await saveTrip(); return; }
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/trips?action=share`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ id: savedTripId }) });
      const data = await resp.json();
      if (data.shareUrl) { setShareUrl(data.shareUrl); await navigator.clipboard.writeText(data.shareUrl).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 3000); toast({ title: "🔗 Share link copied!" }); }
    } catch { toast({ title: "Share failed", variant: "destructive" }); }
  };

  const syncDiningAlerts = async () => {
    if (!session || !plans.length) return;
    let count = 0;
    for (const plan of plans) {
      for (const item of plan.items.filter(i => i.type === "dining" && i.location)) {
        try {
          const searchResp = await fetch(`${SUPABASE_URL}/functions/v1/dining-alerts?action=restaurants&search=${encodeURIComponent(item.location!)}`, { headers: getHeaders() });
          const searchData = await searchResp.json();
          const restaurant = searchData.restaurants?.[0];
          if (restaurant) {
            await fetch(`${SUPABASE_URL}/functions/v1/dining-alerts?action=create`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ restaurant_id: restaurant.id, alert_date: plan.date, party_size: adults + children, meal_periods: ["Any"], alert_email: true }) });
            count++;
          }
        } catch {}
      }
    }
    toast({ title: count > 0 ? `🍽️ ${count} dining alert${count > 1 ? "s" : ""} created!` : "No new alerts needed" });
  };

  const loadSavedTrips = async () => {
    if (!session) return;
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/trips?action=list`, { headers: getHeaders() });
      const data = await resp.json();
      setSavedTrips(data.trips || []);
      setShowSavedTrips(true);
    } catch {}
  };

  const loadTrip = async (tripId: string) => {
    if (!session) return;
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/trips?action=load&id=${tripId}`, { headers: getHeaders() });
      const data = await resp.json();
      const trip = data.trip;
      if (trip) {
        setSelectedParks(trip.parks || []); setStartDate(trip.start_date || ""); setEndDate(trip.end_date || "");
        setAdults(trip.adults || 2); setChildren(trip.children || 0); setAges(trip.ages || "");
        setRidePreference(trip.ride_preference || "mix"); setBudget(trip.budget || 6500);
        setLlOption(trip.ll_option || "multi"); setSpecialNotes(trip.special_notes || "");
        if (trip.itinerary) { setPlans(trip.itinerary); setGenerated(true); }
        setEstimatedTotal(trip.estimated_total); setSavedTripId(trip.id); setShowSavedTrips(false);
        toast({ title: "Trip loaded!" });
      }
    } catch {}
  };

  const addTripMember = () => {
    if (!memberFirstName || !memberLastName) return;
    if (memberIsAdult && !memberEmail) { toast({ title: "Email required for adults", variant: "destructive" }); return; }
    setTripMembers(prev => [...prev, { firstName: memberFirstName, lastName: memberLastName, email: memberEmail, isAdult: memberIsAdult, isSplitting: memberIsSplitting }]);
    setMemberFirstName(""); setMemberLastName(""); setMemberEmail(""); setMemberIsAdult(true); setMemberIsSplitting(true); setShowAddMember(false);
  };

  const generateItinerary = async () => {
    if (!selectedParks.length) { toast({ title: "Select at least one park", variant: "destructive" }); return; }
    if (!startDate) { toast({ title: "Select your travel dates", variant: "destructive" }); return; }
    if (!session) { toast({ title: "Please log in", variant: "destructive" }); return; }
    setGenerating(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ai-trip-planner`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ parks: selectedParks, startDate, endDate: endDate || startDate, adults, children, ages, ridePreference, budget, llOption, specialNotes, parkHopper, resortStay, nonParkDays }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Generation failed");
      setPlans(data.plans); setEstimatedTotal(data.estimatedTotal); setBudgetBreakdown(data.budgetBreakdown);
      setTicketInfo(data.ticketInfo || null); setHotelRecs(data.hotelRecommendations || []);
      setDiningRecs(data.diningRecommendations || {}); setTripCoverage(data.tripCoverage || null);
      setNonParkSuggestions(data.nonParkSuggestions || []); setHotelNightlyBudget(data.hotelNightlyBudget || null);
      setGenerated(true); toast({ title: "✨ Itinerary generated!", description: `${data.numDays}-day plan ready` });

      // Auto-save
      try {
        const saveResp = await fetch(`${SUPABASE_URL}/functions/v1/trips?action=save`, {
          method: "POST", headers: getHeaders(),
          body: JSON.stringify({ id: savedTripId || undefined, name: `${selectedParks[0]} Trip — ${startDate}`, parks: selectedParks, start_date: startDate, end_date: endDate || startDate, adults, children, ages, ride_preference: ridePreference, budget, ll_option: llOption, special_notes: specialNotes, itinerary: data.plans, estimated_total: data.estimatedTotal }),
        });
        const saveData = await saveResp.json();
        const newTripId = saveData.trip?.id;
        if (newTripId) setSavedTripId(newTripId);
        if (newTripId && tripMembers.length > 0) {
          for (const member of tripMembers) {
            try { await fetch(`${SUPABASE_URL}/functions/v1/social?action=add-trip-member`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ tripId: newTripId, firstName: member.firstName, lastName: member.lastName, email: member.email || null, isAdult: member.isAdult, isSplittingExpenses: member.isSplitting }) }); } catch {}
          }
          toast({ title: `📧 Invites sent to ${tripMembers.length} member(s)!` });
        }
      } catch {}
    } catch (err) {
      toast({ title: "Failed to generate", description: err instanceof Error ? err.message : "Please try again", variant: "destructive" });
    } finally { setGenerating(false); }
  };

  return (
    <DashboardLayout title="🗺️ Trip Planner" subtitle="AI-powered itineraries tailored to your group">
      <div className="space-y-6">
        <div className="rounded-xl border border-border p-5 bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground">Plan Your Trip</h2>
            {session && (
              <button onClick={loadSavedTrips} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                <FolderOpen className="w-3.5 h-3.5" /> Saved Trips
              </button>
            )}
          </div>
          {showSavedTrips && savedTrips.length > 0 && (
            <div className="mb-4 rounded-xl border border-border overflow-hidden bg-muted">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                <p className="text-xs font-semibold text-foreground">Your Saved Trips</p>
                <button onClick={() => setShowSavedTrips(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
              </div>
              {savedTrips.map((trip: any) => (
                <button key={trip.id} onClick={() => loadTrip(trip.id)} className="w-full flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-background/30 text-left transition-colors">
                  <div><p className="text-sm font-medium text-foreground">{trip.name}</p><p className="text-xs text-muted-foreground">{trip.parks?.join(", ")} · {trip.start_date}</p></div>
                  <span className="text-xs text-primary">Load →</span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-5">
            {/* Parks */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Which park(s)?</label>
              <div className="flex flex-wrap gap-2">
                {PARKS_LEGACY.map(park => (
                  <button key={park} onClick={() => togglePark(park)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${selectedParks.includes(park) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>{park}</button>
                ))}
              </div>
            </div>
            {/* Dates */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Travel Dates</label>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground mb-1">Start</p><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ minHeight: 44 }} /></div>
                <div><p className="text-xs text-muted-foreground mb-1">End</p><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate || new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ minHeight: 44 }} /></div>
              </div>
            </div>
            {/* Party */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Party Size</label>
              <div className="grid grid-cols-2 gap-3">
                {[{ label: "Adults", value: adults, set: setAdults }, { label: "Children", value: children, set: setChildren }].map(row => (
                  <div key={row.label} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 border border-border">
                    <span className="text-sm text-foreground">{row.label}</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => row.set(Math.max(0, row.value - 1))} className="w-7 h-7 rounded-md bg-background/50 flex items-center justify-center text-foreground hover:bg-background text-lg leading-none">−</button>
                      <span className="text-sm font-bold text-primary w-4 text-center">{row.value}</span>
                      <button onClick={() => row.set(row.value + 1)} className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-lg leading-none font-bold">+</button>
                    </div>
                  </div>
                ))}
              </div>
              {children > 0 && <input type="text" placeholder="Children's ages (e.g. 8, 6, 3)" value={ages} onChange={e => setAges(e.target.value)} className="mt-2 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40" />}
            </div>
            {/* Ride pref */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Ride Preference</label>
              <div className="grid grid-cols-2 gap-2">
                {RIDE_PREFS.map(p => (<button key={p.value} onClick={() => setRidePreference(p.value)} className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors text-center border ${ridePreference === p.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{p.label}</button>))}
              </div>
            </div>
            {/* Budget */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Budget — <span className="text-primary">${budget.toLocaleString()}</span></label>
              <input type="range" min={1000} max={15000} step={500} value={budget} onChange={e => setBudget(parseInt(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>$1,000</span><span>$15,000</span></div>
            </div>
            {/* LL */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Lightning Lane</label>
              <div className="flex gap-2">{LL_OPTIONS_LEGACY.map(opt => (<button key={opt.value} onClick={() => setLlOption(opt.value)} className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-colors text-center border ${llOption === opt.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{opt.label}</button>))}</div>
            </div>
            {/* Park Hopper */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Park Hopper Pass</label>
              <div className="flex gap-2">
                <button onClick={() => setParkHopper(false)} className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${!parkHopper ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>No Park Hopper</button>
                <button onClick={() => setParkHopper(true)} className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${parkHopper ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>✅ Yes (+$65/person)</button>
              </div>
              {parkHopper && <p className="text-xs text-muted-foreground mt-1">You can visit multiple parks in one day!</p>}
            </div>
            {/* Resort */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Disney Resort?</label>
              <div className="flex gap-2">
                <button onClick={() => setResortStay(false)} className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${!resortStay ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>Off-Site / Not Sure</button>
                <button onClick={() => setResortStay(true)} className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${resortStay ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>✅ Disney Resort</button>
              </div>
              {resortStay && <p className="text-xs text-primary mt-1">✨ Early Entry: 30 min before park open</p>}
            </div>
            {/* Non-Park Days */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Non-Park Days: <span className="text-primary">{nonParkDays}</span></label>
              <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 border border-border">
                <button onClick={() => setNonParkDays(Math.max(0, nonParkDays - 1))} className="w-7 h-7 rounded-md bg-background/50 flex items-center justify-center text-lg leading-none hover:bg-background">−</button>
                <span className="flex-1 text-center text-sm font-semibold text-foreground">{nonParkDays} day{nonParkDays !== 1 ? "s" : ""}</span>
                <button onClick={() => setNonParkDays(nonParkDays + 1)} className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-lg leading-none font-bold text-primary-foreground">+</button>
              </div>
            </div>
            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Special Notes</label>
              <textarea value={specialNotes} onChange={e => setSpecialNotes(e.target.value)} rows={2} placeholder="e.g. celebrating a birthday, must ride Tron..." className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none" />
            </div>
            {/* Members */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Travel Party Members</label>
                <button onClick={() => setShowAddMember(s => !s)} className="text-xs text-primary hover:underline">+ Add Person</button>
              </div>
              {tripMembers.length > 0 && (
                <div className="space-y-1.5 mb-3">{tripMembers.map((m, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/30 border border-border">
                    <div><span className="text-xs font-medium text-foreground">{m.firstName} {m.lastName}</span><span className="text-xs text-muted-foreground ml-2">{m.isAdult ? "Adult" : "Child"}{m.isSplitting ? " · splitting" : ""}</span></div>
                    <button onClick={() => setTripMembers(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive text-xs">✕</button>
                  </div>
                ))}</div>
              )}
              {showAddMember && (
                <div className="rounded-xl border border-border p-4 space-y-3 bg-muted">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={memberFirstName} onChange={e => setMemberFirstName(e.target.value)} placeholder="First name *" className="px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary/40" />
                    <input value={memberLastName} onChange={e => setMemberLastName(e.target.value)} placeholder="Last name *" className="px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary/40" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setMemberIsAdult(true)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${memberIsAdult ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>👤 Adult</button>
                    <button onClick={() => setMemberIsAdult(false)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${!memberIsAdult ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>👶 Child</button>
                  </div>
                  {memberIsAdult && <input value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="Email (required for adults)" type="email" className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary/40" />}
                  {memberIsAdult && (
                    <button onClick={() => setMemberIsSplitting(s => !s)} className={`w-full py-1.5 rounded-lg text-xs font-semibold border transition-all ${memberIsSplitting ? "bg-green-500/20 text-green-400 border-green-500/30" : "border-border text-muted-foreground"}`}>
                      {memberIsSplitting ? "✅ Splitting expenses" : "❌ Not splitting expenses"}
                    </button>
                  )}
                  <button onClick={addTripMember} className="w-full py-2 rounded-lg text-xs font-bold text-primary-foreground bg-primary">Add to Trip</button>
                </div>
              )}
            </div>

            <button onClick={generateItinerary} disabled={generating || !selectedParks.length || !startDate}
              className="w-full py-3.5 rounded-xl font-bold text-primary-foreground bg-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {generating ? (<><span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" /> Generating...</>) : (<><Sparkles className="w-4 h-4" /> ✨ Generate My Itinerary</>)}
            </button>
          </div>
        </div>

        {generated && plans.length > 0 && (
          <ResultsView
            plans={plans} estimatedTotal={estimatedTotal} budget={budget}
            budgetBreakdown={budgetBreakdown} ticketInfo={ticketInfo} hotelRecs={hotelRecs}
            diningRecs={diningRecs} hotelNightlyBudget={hotelNightlyBudget}
            tripCoverage={tripCoverage} nonParkSuggestions={nonParkSuggestions}
            resortStay={resortStay} parkHopper={parkHopper}
            onSave={saveTrip} saving={saving} savedTripId={savedTripId}
            onShare={shareTrip} shareUrl={shareUrl} copied={copied}
            onExportPDF={() => { window.print(); toast({ title: "📄 Print dialog opened" }); }}
            onSyncDining={syncDiningAlerts}
            onRegenerate={generateItinerary} generating={generating}
            onDayUpdated={(dayIndex, newPlan) => setPlans(prev => prev.map((p, i) => i === dayIndex ? newPlan : p))}
            getHeaders={getHeaders}
            supabaseUrl={SUPABASE_URL}
            walkingSpeedKmh={2.5}
            tripId={savedTripId}
          />
        )}

        {!generated && (
          <div className="rounded-xl p-10 text-center border border-dashed border-border bg-card">
            <Castle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">Your personalized itinerary will appear here</p>
            <p className="text-xs text-muted-foreground">Fill in your trip details above and hit Generate</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
