import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import CompassButton from "@/components/CompassButton";
import PassingPointsAccordion from "./PassingPointsAccordion";
import StoppingHereModal from "./StoppingHereModal";
import AddBlockModal from "./AddBlockModal";
import NudgeBanner from "./NudgeBanner";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  walkMinutes?: number;
  waitMinutes?: number;
  rideMinutes?: number;
  durationMinutes?: number;
  alternativeDining?: string[];
  passingPoints?: any[];
  isDuplicate?: boolean;
  firstScheduledDay?: number;
  locked?: boolean;
  dropped?: boolean;
}

interface Nudge {
  id: string;
  type: 'restroom' | 'meal' | 'special_event';
  message: string;
  afterItemIndex: number;
  suggestion?: string;
  bookingUrl?: string;
}

interface DayPlan {
  date: string;
  park: string;
  parkEmoji: string;
  crowdLevel: number;
  items: ItineraryItem[];
  summary: string;
  highlights: string[];
  nudges?: Nudge[];
}

interface DiffItem {
  activity: string;
  before: string;
  after: string;
  status: 'moved' | 'dropped' | 'unchanged' | 'new';
}

interface Props {
  plan: DayPlan;
  dayNum: number;
  dayIndex: number;
  tripId?: string | null;
  onDayUpdated: (dayIndex: number, newPlan: DayPlan) => void;
  getHeaders: () => Record<string, string>;
  supabaseUrl: string;
  walkingSpeedKmh: number;
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
  "ride": "🎢", "dining": "🍽️", "show": "🎭", "break": "☀️",
  "rope-drop": "🏃", "transport": "🚌", "stop": "📌",
  "snack": "🍿", "shopping": "🛍️", "photo": "📸",
  "bathroom": "🚻", "rest": "☀️", "other": "📍",
};

const crowdLabel = (level: number) => {
  if (level <= 3) return { text: "Low", color: "text-green-400", bg: "bg-green-500/20" };
  if (level <= 5) return { text: "Moderate", color: "text-yellow-400", bg: "bg-yellow-500/20" };
  if (level <= 7) return { text: "Busy", color: "text-orange-400", bg: "bg-orange-500/20" };
  return { text: "Very Busy", color: "text-red-400", bg: "bg-red-500/20" };
};

export default function ItineraryCard({
  plan, dayNum, dayIndex, tripId, onDayUpdated, getHeaders, supabaseUrl, walkingSpeedKmh
}: Props) {
  const [expanded, setExpanded] = useState(dayNum === 1);
  const [stoppingPoint, setStoppingPoint] = useState<any>(null);
  const [stoppingItemIndex, setStoppingItemIndex] = useState(0);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [diffPreview, setDiffPreview] = useState<DiffItem[] | null>(null);
  const [pendingDay, setPendingDay] = useState<DayPlan | null>(null);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [dismissedNudges, setDismissedNudges] = useState<string[]>([]);
  const { toast } = useToast();

  const crowd = crowdLabel(plan.crowdLevel);
  const dateFormatted = new Date(plan.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric"
  });

  const recalculate = async (lockedBlocks: any[]) => {
    setRecalcLoading(true);
    try {
      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-trip-planner-recalculate`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          tripId,
          dayIndex,
          currentDay: plan,
          lockedBlocks,
          userPreferences: { walkingSpeedKmh },
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Recalculation failed");
      return data;
    } catch (err) {
      toast({ title: "Recalculation failed", description: err instanceof Error ? err.message : "Please try again", variant: "destructive" });
      return null;
    } finally {
      setRecalcLoading(false);
    }
  };

  const handleStoppingHere = (point: any, itemIndex: number) => {
    setStoppingPoint(point);
    setStoppingItemIndex(itemIndex);
  };

  const confirmStop = async (durationMinutes: number) => {
    setStoppingPoint(null);

    // Optimistically insert
    const newItem: ItineraryItem = {
      time: plan.items[stoppingItemIndex]?.time || "12:00 PM",
      activity: `Stop — ${stoppingPoint.label}`,
      type: 'stop',
      tip: `Taking ${durationMinutes} min at ${stoppingPoint.label}`,
      priority: 'must-do',
      locked: true,
      durationMinutes: durationMinutes,
      walkMinutes: 0,
      waitMinutes: 0,
    };

    const updatedItems = [...plan.items];
    updatedItems.splice(stoppingItemIndex + 1, 0, newItem);
    onDayUpdated(dayIndex, { ...plan, items: updatedItems });

    // Call recalculate
    const result = await recalculate([{
      itemIndex: stoppingItemIndex + 1,
      startTime: plan.items[stoppingItemIndex]?.time?.replace(/ (AM|PM)/i, '') || "12:00",
      durationMinutes,
      label: `Stop — ${stoppingPoint.label}`,
    }]);

    if (result?.day) {
      onDayUpdated(dayIndex, result.day);
      const shifted = result.itemsShifted || 0;
      toast({
        title: "✅ Itinerary updated",
        description: shifted > 0 ? `${shifted} item${shifted > 1 ? 's' : ''} shifted later.` : "No other items affected.",
      });
    }
  };

  const handleAddBlock = async (block: {
    type: string; startTime: string; durationMinutes: number; label: string; notes: string;
  }) => {
    const result = await recalculate([{
      itemIndex: plan.items.length,
      startTime: block.startTime,
      durationMinutes: block.durationMinutes,
      label: block.label,
    }]);

    if (result?.day) {
      // Build diff
      const diff: DiffItem[] = [];
      const origItems = plan.items;
      const newItems = result.day.items;

      // New block
      diff.push({
        activity: block.label,
        before: '—',
        after: block.startTime,
        status: 'new',
      });

      // Compare original items
      for (const orig of origItems) {
        const match = newItems.find((ni: any) => ni.activity === orig.activity);
        if (!match) {
          diff.push({ activity: orig.activity, before: orig.time, after: '—', status: 'dropped' });
        } else if (match.dropped) {
          diff.push({ activity: orig.activity, before: orig.time, after: '—', status: 'dropped' });
        } else if (match.time !== orig.time) {
          diff.push({ activity: orig.activity, before: orig.time, after: match.time, status: 'moved' });
        } else {
          diff.push({ activity: orig.activity, before: orig.time, after: match.time, status: 'unchanged' });
        }
      }

      setDiffPreview(diff);
      setPendingDay(result.day);
    }
  };

  const applyDiff = () => {
    if (pendingDay) {
      onDayUpdated(dayIndex, pendingDay);
      toast({ title: "✅ Changes applied" });
    }
    setDiffPreview(null);
    setPendingDay(null);
    setAddBlockOpen(false);
  };

  const cancelDiff = () => {
    setDiffPreview(null);
    setPendingDay(null);
  };

  const dismissNudge = (nudgeId: string) => {
    setDismissedNudges(prev => [...prev, nudgeId]);
  };

  const handleRemoveItem = async (itemIndex: number) => {
    const updatedItems = plan.items.filter((_, i) => i !== itemIndex);
    const updatedPlan = { ...plan, items: updatedItems };
    onDayUpdated(dayIndex, updatedPlan);

    const lockedBlocks = updatedItems
      .map((item, i) => item.locked ? { itemIndex: i, startTime: item.time, durationMinutes: item.durationMinutes || 30, label: item.activity } : null)
      .filter(Boolean);

    const result = await recalculate(lockedBlocks as any[]);
    if (result?.day) {
      onDayUpdated(dayIndex, result.day);
      toast({ title: "✅ Item removed and schedule updated" });
    }
  };

  const getAlternatives = (item: ItineraryItem): string[] => {
    const typeAlts: Record<string, string[]> = {
      ride: ["Space Mountain", "Big Thunder Mountain", "Splash Mountain", "Pirates of the Caribbean", "Haunted Mansion", "Jungle Cruise", "Seven Dwarfs Mine Train", "Buzz Lightyear", "Tomorrowland Speedway"],
      dining: ["Columbia Harbour House", "Cosmic Ray's", "Pecos Bill", "The Plaza Restaurant", "Skipper Canteen", "Liberty Tree Tavern", "Be Our Guest", "Casey's Corner"],
      show: ["Carousel of Progress", "Country Bear Jamboree", "Enchanted Tiki Room", "Mickey's PhilharMagic", "Monsters Inc. Laugh Floor"],
      snack: ["Aloha Isle", "Storybook Treats", "Sleepy Hollow", "Main Street Bakery"],
    };
    const alts = typeAlts[item.type] || typeAlts['ride'] || [];
    return alts.filter(a => a !== item.activity).slice(0, 4);
  };

  const handleReplaceItem = async (itemIndex: number, newActivity: string) => {
    const updatedItems = [...plan.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      activity: newActivity,
      tip: `Swapped to ${newActivity}`,
    };
    const updatedPlan = { ...plan, items: updatedItems };
    onDayUpdated(dayIndex, updatedPlan);

    const lockedBlocks = [{
      itemIndex,
      startTime: updatedItems[itemIndex].time,
      durationMinutes: updatedItems[itemIndex].durationMinutes || 30,
      label: newActivity,
    }];

    const result = await recalculate(lockedBlocks);
    if (result?.day) {
      onDayUpdated(dayIndex, result.day);
      toast({ title: "✅ Item replaced and schedule updated" });
    }
  };

  return (
    <>
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

            {/* Nudges */}
            {plan.nudges && plan.nudges.length > 0 && (
              <div className="px-5">
                <NudgeBanner nudges={plan.nudges} dismissedNudges={dismissedNudges} onDismiss={dismissNudge} />
              </div>
            )}

            <div className="px-5 pb-4">
              <div className="relative">
                <div className="absolute left-[22px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-3">
                  {plan.items.map((item, i) => (
                    <div key={i} className={`flex gap-3 relative ${item.dropped ? 'opacity-40' : ''}`}>
                      <div className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 z-10 text-base ${
                        item.locked ? 'bg-primary/10 border-primary/30' : 'bg-muted border-border'
                      }`}>
                        {typeIcons[item.type] || "📍"}
                      </div>
                      <div className={`flex-1 rounded-xl p-3 border transition-colors ${
                        item.dropped ? 'border-red-500/30 bg-red-500/5' :
                        item.locked ? 'border-primary/30 bg-primary/5' :
                        item.priority === "must-do" ? "border-primary/30 bg-primary/5" :
                        "border-border bg-muted/30"
                      }`}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <p className="text-xs text-muted-foreground">{item.time}</p>
                            <p className="text-sm font-semibold text-foreground leading-tight">{item.activity}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.locked && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">📌 Locked</span>
                            )}
                            {item.dropped && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold">Dropped</span>
                            )}
                            {item.wait !== undefined && item.wait > 0 && (
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

                        {item.isDuplicate && (
                          <div className="flex items-center gap-1.5 mt-1 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-semibold">
                              ⚠️ Already scheduled Day {item.firstScheduledDay}
                            </span>
                          </div>
                        )}

                        {((item.walkMinutes || 0) > 0 || (item.waitMinutes || 0) > 0) && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
                            {(item.walkMinutes || 0) > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">🚶 {item.walkMinutes} min walk</span>
                            )}
                            {(item.waitMinutes || 0) > 0 && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${(item.waitMinutes || 0) <= 15 ? "bg-green-500/15 text-green-400" : (item.waitMinutes || 0) <= 45 ? "bg-yellow-500/15 text-yellow-400" : "bg-red-500/15 text-red-400"}`}>
                                ⏱️ {item.waitMinutes} min wait
                              </span>
                            )}
                            {(item.rideMinutes || 0) > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">🎢 {item.rideMinutes} min ride</span>
                            )}
                            {(item.durationMinutes || 0) > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Total: ~{item.durationMinutes} min</span>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground leading-relaxed">{item.tip}</p>

                        {item.alternativeDining && item.alternativeDining.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">Also nearby: {item.alternativeDining.join(", ")}</p>
                        )}

                        {/* Passing Points Accordion */}
                        {item.passingPoints && item.passingPoints.length > 0 && (
                          <PassingPointsAccordion
                            passingPoints={item.passingPoints}
                            onStoppingHere={(pp) => handleStoppingHere(pp, i)}
                          />
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

              {/* Add Block Button */}
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => setAddBlockOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Block
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <StoppingHereModal
        open={!!stoppingPoint}
        onOpenChange={(open) => { if (!open) setStoppingPoint(null); }}
        point={stoppingPoint}
        onConfirm={confirmStop}
      />

      <AddBlockModal
        open={addBlockOpen}
        onOpenChange={setAddBlockOpen}
        onSave={handleAddBlock}
        diffPreview={diffPreview}
        onApplyDiff={applyDiff}
        onCancelDiff={cancelDiff}
        loading={recalcLoading}
      />
    </>
  );
}
