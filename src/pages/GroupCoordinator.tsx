import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users, Map, Bell, DollarSign, Vote, Plus, Check, X, Calendar,
  Clock, MapPin, ChevronDown, ChevronUp, UserPlus, Send
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CompassButton from "@/components/CompassButton";
import { useSubscription } from "@/hooks/useSubscription";
import { FeatureGate } from "@/components/FeatureGate";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const SUPABASE_ANON = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";

export default function GroupCoordinator() {
  const { session } = useAuth();
  const { toast } = useToast();
  const { access } = useSubscription();
  const isReadOnly = access.groupCoordinator === 'read_only';
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [settleUp, setSettleUp] = useState<any[]>([]);
  const [diningAlerts, setDiningAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"itinerary" | "expenses" | "dining" | "members">("itinerary");

  // Poll state
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [showPollForm, setShowPollForm] = useState(false);
  const [polls, setPolls] = useState<any[]>([]);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
    "x-client-authorization": `Bearer ${session?.access_token}`,
    "apikey": SUPABASE_ANON,
  });

  useEffect(() => {
    if (!session) return;
    supabase.from("saved_trips")
      .select("id, name, parks, start_date, end_date, itinerary, estimated_total")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setTrips(data || []);
        if (data && data.length > 0) loadTrip(data[0]);
        else setLoading(false);
      });
  }, [session]);

  const loadTrip = async (trip: any) => {
    setSelectedTrip(trip);
    setLoading(true);
    try {
      const [membResp, expResp, alertsResp] = await Promise.all([
        fetch(`${SUPABASE_URL}/functions/v1/social?action=trip-members&tripId=${trip.id}`, { headers: getHeaders() }),
        fetch(`${SUPABASE_URL}/functions/v1/social?action=expenses&tripId=${trip.id}`, { headers: getHeaders() }),
        supabase.from("dining_alerts").select("*, restaurant:restaurants(name, location)").eq("user_id", session!.user.id).in("status", ["watching", "found"]).limit(5),
      ]);

      const [membData, expData] = await Promise.all([membResp.json(), expResp.json()]);
      setMembers(membData.members || []);
      setExpenses(expData.expenses || []);
      setSettleUp(expData.settleUp || []);
      setDiningAlerts(alertsResp.data || []);

      // Get first day itinerary from trip
      if (trip.itinerary && trip.itinerary[0]?.items) {
        setItinerary(trip.itinerary[0].items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createPoll = () => {
    if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) return;
    const newPoll = {
      id: Date.now(),
      question: pollQuestion,
      options: pollOptions.filter(o => o.trim()).map(opt => ({ text: opt, votes: 0 })),
      votes: {} as Record<string, string>,
      closed: false,
    };
    setPolls(prev => [newPoll, ...prev]);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowPollForm(false);
    toast({ title: "📊 Poll created!" });
  };

  const vote = (pollId: number, optionIdx: number) => {
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId) return p;
      const alreadyVoted = p.votes[session?.user.id || ""];
      const updatedOptions = p.options.map((opt: any, i: number) => ({
        ...opt,
        votes: alreadyVoted === String(i)
          ? opt.votes - 1
          : i === optionIdx ? opt.votes + 1 : opt.votes,
      }));
      return { ...p, options: updatedOptions, votes: { ...p.votes, [session?.user.id || ""]: String(optionIdx) } };
    }));
  };

  if (!session) return (
    <DashboardLayout title="👨‍👩‍👧 Group Coordinator" subtitle="Plan together, stay in sync">
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">Please log in to use Group Coordinator</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="👨‍👩‍👧 Group Coordinator" subtitle={selectedTrip ? `${selectedTrip.name} — ${selectedTrip.start_date}` : "Plan together, stay in sync"}>
      <FeatureGate hasAccess={access.groupCoordinator !== false} featureName="Group Coordinator" requiredPlan="90 Day Magic Pass Planner">
      <div className="space-y-5">
        {isReadOnly && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
            📋 You're viewing this trip as a guest (read-only). Upgrade to edit.
          </div>
        )}
        {/* No trips CTA */}
        {!loading && trips.length === 0 && (
          <div className="text-center py-16">
            <Map className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-semibold text-foreground mb-2">No trips yet</p>
            <p className="text-xs text-muted-foreground mb-6">Create a trip in Trip Planner to coordinate with your group</p>
            <Link to="/trip-planner" className="px-6 py-2.5 rounded-xl font-bold text-sm text-[var(--background)] inline-block" style={{ background: "#F5C842" }}>
              Plan a Trip →
            </Link>
          </div>
        )}

        {trips.length > 0 && (
          <>
            {/* Trip selector */}
            {trips.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {trips.map(trip => (
                  <button key={trip.id} onClick={() => loadTrip(trip)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors ${selectedTrip?.id === trip.id ? "bg-primary text-[var(--background)] border-primary" : "border-white/10 text-muted-foreground"}`}>
                    {trip.name}
                  </button>
                ))}
              </div>
            )}

            {/* Group members summary */}
            {members.length > 0 && (
              <div className="rounded-xl p-4 border border-white/8" style={{ background: "var(--card)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-foreground">Travel Party ({members.length})</p>
                  <Link to="/trip-planner" className="text-xs text-primary hover:underline">Manage →</Link>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/8 border border-white/10">
                      <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                        {m.first_name[0]}
                      </div>
                      <span className="text-xs font-medium text-foreground">{m.first_name}</span>
                      <span className={`text-xs px-1 rounded ${m.status === "joined" ? "text-green-400" : "text-yellow-400"}`}>
                        {m.status === "joined" ? "✅" : "⏳"}
                      </span>
                    </div>
                  ))}
                  <Link to="/trip-planner" className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-dashed border-white/20 text-xs text-muted-foreground hover:border-primary/40">
                    <Plus className="w-3 h-3" /> Add
                  </Link>
                </div>
              </div>
            )}

            {members.length === 0 && (
              <div className="rounded-xl p-4 border border-dashed border-white/15 text-center">
                <UserPlus className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-2">No group members yet</p>
                <Link to="/trip-planner" className="text-xs text-primary hover:underline">Add people to your trip in Trip Planner →</Link>
              </div>
            )}

            {/* Section tabs */}
            <div className="flex gap-1 border-b border-white/10">
              {[
                { id: "itinerary", label: "📅 Itinerary" },
                { id: "expenses", label: "💸 Expenses" },
                { id: "dining", label: "🍽️ Dining Alerts" },
                { id: "members", label: "🗳️ Polls" },
              ].map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id as any)}
                  className={`px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${activeSection === s.id ? "text-primary border-b-2 border-primary -mb-px" : "text-muted-foreground"}`}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Itinerary */}
            {activeSection === "itinerary" && (
              <div>
                {loading ? (
                  <div className="text-center py-8"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" /></div>
                ) : itinerary.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-xs text-muted-foreground">No itinerary yet</p>
                    <Link to="/trip-planner" className="text-xs text-primary hover:underline mt-1 block">Generate one in Trip Planner →</Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedTrip?.itinerary?.[0] && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{selectedTrip.itinerary[0].parkEmoji}</span>
                        <p className="text-sm font-bold text-foreground">{selectedTrip.itinerary[0].park} — {selectedTrip.itinerary[0].date}</p>
                      </div>
                    )}
                    {itinerary.slice(0, 10).map((item: any, i: number) => (
                      <div key={i} className="rounded-xl p-3 border border-white/8 flex gap-3" style={{ background: "var(--card)" }}>
                        <div>
                          <p className="text-xs text-muted-foreground font-mono">{item.time}</p>
                          <p className="text-sm font-semibold text-foreground leading-tight mt-0.5">{item.activity}</p>
                          {item.badge && <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${item.priority === "must-do" ? "bg-primary/20 text-primary" : "bg-white/8 text-muted-foreground"}`}>{item.badge}</span>}
                        </div>
                        {item.location && (
                          <div className="ml-auto shrink-0">
                            <CompassButton destination={item.location} context={item.land || ""} size="inline" />
                          </div>
                        )}
                      </div>
                    ))}
                    <Link to="/trip-planner" className="block text-center text-xs text-primary hover:underline py-2">View full itinerary →</Link>
                  </div>
                )}
              </div>
            )}

            {/* Expenses */}
            {activeSection === "expenses" && (
              <div className="space-y-4">
                {settleUp.length > 0 && (
                  <div className="rounded-xl p-4 border border-primary/20 bg-primary/5">
                    <p className="text-xs font-bold text-primary mb-2">💸 Settle Up</p>
                    {settleUp.map(s => (
                      <div key={s.memberId} className="flex justify-between text-sm">
                        <span className="text-foreground">{s.name}</span>
                        <span className={s.balance > 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                          {s.balance > 0 ? `+$${s.balance.toFixed(2)}` : `-$${Math.abs(s.balance).toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {expenses.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-xs text-muted-foreground">No expenses logged</p>
                    <Link to="/budget-manager" className="text-xs text-primary hover:underline block mt-1">Go to Budget Manager →</Link>
                  </div>
                ) : (
                  <div>
                    {expenses.map((exp, i) => (
                      <div key={exp.id} className={`flex justify-between px-3 py-2.5 ${i < expenses.length - 1 ? "border-b border-white/5" : ""}`}>
                        <div>
                          <p className="text-sm text-foreground">{exp.description}</p>
                          <p className="text-xs text-muted-foreground">{exp.expense_type === "shared" ? "👥 Shared" : "👤 Personal"} · {exp.date}</p>
                        </div>
                        <p className="text-sm font-bold text-foreground">${parseFloat(exp.amount).toFixed(2)}</p>
                      </div>
                    ))}
                    <Link to="/budget-manager" className="block text-center text-xs text-primary hover:underline py-3">Log expense in Budget Manager →</Link>
                  </div>
                )}
              </div>
            )}

            {/* Dining Alerts */}
            {activeSection === "dining" && (
              <div>
                {diningAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-xs text-muted-foreground">No dining alerts active</p>
                    <Link to="/dining-alerts" className="text-xs text-primary hover:underline block mt-1">Set up dining alerts →</Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {diningAlerts.map(alert => (
                      <div key={alert.id} className="rounded-xl p-3 border border-white/8 flex items-center justify-between" style={{ background: "var(--card)" }}>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{alert.restaurant?.name}</p>
                          <p className="text-xs text-muted-foreground">{alert.alert_date} · Party of {alert.party_size}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${alert.status === "found" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                          {alert.status === "found" ? "AVAILABLE!" : "Watching..."}
                        </span>
                      </div>
                    ))}
                    <Link to="/dining-alerts" className="block text-center text-xs text-primary hover:underline py-2">Manage dining alerts →</Link>
                  </div>
                )}
              </div>
            )}

            {/* Polls */}
            {activeSection === "members" && (
              <div className="space-y-4">
                <button onClick={() => setShowPollForm(s => !s)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-[var(--background)] flex items-center justify-center gap-2"
                  style={{ background: "#F5C842" }}>
                  <Plus className="w-4 h-4" /> Create Group Poll
                </button>

                {showPollForm && (
                  <div className="rounded-xl p-4 border border-white/10" style={{ background: "var(--card)" }}>
                    <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="Poll question (e.g. Which park on Day 2?)"
                      className="w-full px-3 py-2.5 rounded-lg bg-[var(--muted)] border border-white/10 text-sm text-foreground mb-3 focus:outline-none focus:border-primary/40" />
                    {pollOptions.map((opt, i) => (
                      <input key={i} value={opt} onChange={e => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }}
                        placeholder={`Option ${i + 1}`}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--muted)] border border-white/10 text-sm text-foreground mb-2 focus:outline-none focus:border-primary/40" />
                    ))}
                    <button onClick={() => setPollOptions(p => [...p, ""])} className="text-xs text-primary hover:underline mb-3 block">+ Add option</button>
                    <button onClick={createPoll} className="w-full py-2 rounded-xl font-bold text-sm text-[var(--background)]" style={{ background: "#F5C842" }}>Create Poll</button>
                  </div>
                )}

                {polls.length === 0 && !showPollForm && (
                  <div className="text-center py-8">
                    <Vote className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-xs text-muted-foreground">No polls yet — create one to decide as a group!</p>
                    <p className="text-xs text-muted-foreground mt-1">Example: "Which park on Day 2?" or "Where should we eat lunch?"</p>
                  </div>
                )}

                {polls.map(poll => {
                  const totalVotes = poll.options.reduce((s: number, o: any) => s + o.votes, 0);
                  const myVote = poll.votes[session?.user.id || ""];
                  return (
                    <div key={poll.id} className="rounded-xl p-4 border border-white/8" style={{ background: "var(--card)" }}>
                      <p className="text-sm font-bold text-foreground mb-3">🗳️ {poll.question}</p>
                      <div className="space-y-2 mb-2">
                        {poll.options.map((opt: any, i: number) => {
                          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                          const isLeading = opt.votes === Math.max(...poll.options.map((o: any) => o.votes)) && opt.votes > 0;
                          return (
                            <button key={i} onClick={() => vote(poll.id, i)} className="w-full text-left">
                              <div className={`p-2.5 rounded-lg border transition-colors ${myVote === String(i) ? "border-primary/50 bg-primary/10" : "border-white/8 hover:border-white/15"}`}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className={myVote === String(i) ? "text-primary font-semibold" : "text-foreground"}>{opt.text}</span>
                                  <span className="text-muted-foreground">{opt.votes} vote{opt.votes !== 1 ? "s" : ""} {isLeading && "🏆"}</span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-1.5">
                                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: isLeading ? "#F5C842" : "#7C3AED" }} />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">{totalVotes} total vote{totalVotes !== 1 ? "s" : ""}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
