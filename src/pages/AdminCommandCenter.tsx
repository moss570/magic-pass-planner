import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gamepad2, MessageSquare, Image, HelpCircle, Shield, RefreshCw, Globe,
  Edit2, Trash2, Check, X, Send, Eye, Archive, ChevronDown, ChevronUp,
  TrendingUp, Clock, Users, Star, Plus, Search, Calendar, Activity, AlertTriangle, Play,
  Smartphone, Laugh
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net"];
const SUPABASE_ANON = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";
const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";

type Tab = "games" | "trivia" | "photos" | "messages" | "events" | "health" | "sources" | "linemind" | "haaaa";

export default function AdminCommandCenter() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("games");
  const [loading, setLoading] = useState(false);

  // Games data
  const [gameStats, setGameStats] = useState<any[]>([]);

  // Trivia data
  const [triviaQuestions, setTriviaQuestions] = useState<any[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [triviaSearch, setTriviaSearch] = useState("");
  const [showAddTrivia, setShowAddTrivia] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ question: "", options: ["","","",""], correct_answer: 0, category: "general", difficulty: "medium", park: "" });

  // Photos data
  const [pendingPhotos, setPendingPhotos] = useState<any[]>([]);
  const [approvedPhotos, setApprovedPhotos] = useState<any[]>([]);

  // Messages data
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Events data
  const [beaconEvents, setBeaconEvents] = useState<any[]>([]);
  const [newsSources, setNewsSources] = useState<any[]>([]);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState({ name: "", url: "", category: "disney_deals", notes: "", scrape_frequency: "daily" });
  const [eventRsvps, setEventRsvps] = useState<Record<string, any[]>>({});
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({ title: "", emoji: "🎪", type: "experience", park: "Magic Kingdom", location: "", event_date: "", event_time: "", description: "", badge: "Event", badge_color: "bg-primary/20 text-primary" });

  // System Health data
  const [healthData, setHealthData] = useState<{
    diningAlerts: any[]; eventAlerts: any[]; diningNotifs: any[]; eventNotifs: any[];
    recentDiningErrors: number; recentEventErrors: number;
  }>({ diningAlerts: [], eventAlerts: [], diningNotifs: [], eventNotifs: [], recentDiningErrors: 0, recentEventErrors: 0 });
  const [diagResults, setDiagResults] = useState<any[]>([]);
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagProgress, setDiagProgress] = useState("");

  // Line Mind data
  const [lineMindWords, setLineMindWords] = useState<any[]>([]);
  const [lineMindSearch, setLineMindSearch] = useState("");
  const [lineMindCategory, setLineMindCategory] = useState("all");
  const [showAddWord, setShowAddWord] = useState(false);
  const [newWord, setNewWord] = useState({ word: "", category: "characters" });
  const [editingWord, setEditingWord] = useState<any>(null);

  useEffect(() => {
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      navigate("/dashboard");
      return;
    }
    loadTab(tab);
  }, [tab, user]);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
    "x-client-authorization": `Bearer ${session?.access_token}`,
    "apikey": SUPABASE_ANON,
  });

  const loadTab = async (t: Tab) => {
    setLoading(true);
    try {
      if (t === "games") {
        // Get game session stats
        const { data } = await (supabase.from("game_sessions" as any)
          .select("game_id, game_name, score, duration_seconds, completed, created_at") as any)
          .order("created_at", { ascending: false })
          .limit(500);
        
        // Aggregate by game
        const stats: Record<string, any> = {};
        (data || []).forEach(s => {
          if (!stats[s.game_id]) stats[s.game_id] = { game_id: s.game_id, game_name: s.game_name || s.game_id, plays: 0, completions: 0, totalScore: 0, totalDuration: 0 };
          stats[s.game_id].plays++;
          if (s.completed) stats[s.game_id].completions++;
          stats[s.game_id].totalScore += s.score || 0;
          stats[s.game_id].totalDuration += s.duration_seconds || 0;
        });
        
        setGameStats(Object.values(stats).map((s: any) => ({
          ...s,
          avgScore: s.plays > 0 ? Math.round(s.totalScore / s.plays) : 0,
          avgDuration: s.plays > 0 ? Math.round(s.totalDuration / s.plays) : 0,
          completionRate: s.plays > 0 ? Math.round((s.completions / s.plays) * 100) : 0,
        })));
      }

      if (t === "trivia") {
        const { data } = await supabase.from("trivia_questions").select("*").order("category").order("difficulty");
        setTriviaQuestions(data || []);
      }

      if (t === "photos") {
        const [pending, approved] = await Promise.all([
          supabase.from("game_content").select("*").eq("status", "pending").order("created_at", { ascending: false }),
          supabase.from("game_content").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(20),
        ]);
        setPendingPhotos(pending.data || []);
        setApprovedPhotos(approved.data || []);
      }

      if (t === "messages") {
        const { data } = await (supabase.from("user_messages" as any).select("*") as any).order("created_at", { ascending: false }).limit(50);
        setMessages(data || []);
      }

      if (t === "sources") {
        const { data: src } = await supabase.from("news_sources").select("*").order("category").order("name");
        setNewsSources(src || []);
      }

      if (t === "linemind") {
        const { data } = await (supabase.from("headsup_words" as any).select("*") as any).order("category").order("word");
        setLineMindWords(data || []);
      }
      if (t === "events") {
        const { data: events } = await (supabase.from("beacon_events" as any).select("*") as any).order("created_at", { ascending: false });
        setBeaconEvents(events || []);
        // Load RSVPs for all events
        const rsvpMap: Record<string, any[]> = {};
        for (const evt of (events || [])) {
          const { data: rsvps } = await (supabase.from("beacon_rsvps" as any).select("*") as any).eq("event_id", evt.id);
          // Get user profiles for each RSVP
          const enriched = await Promise.all((rsvps || []).map(async (r: any) => {
            const { data: profile } = await supabase.from("users_profile").select("first_name, last_name, email").eq("id", r.user_id).single();
            return { ...r, first_name: profile?.first_name, last_name: profile?.last_name, email: profile?.email };
          }));
          rsvpMap[evt.id] = enriched;
        }
        setEventRsvps(rsvpMap);
      }

      if (t === "health") {
        const [dAlerts, eAlerts, dNotifs, eNotifs] = await Promise.all([
          supabase.from("dining_alerts").select("id, status, last_checked_at, check_count, restaurant_id, alert_date").order("created_at", { ascending: false }).limit(50),
          supabase.from("event_alerts").select("id, status, last_checked_at, check_count, event_name, alert_date").order("created_at", { ascending: false }).limit(50),
          supabase.from("dining_notifications").select("id, delivery_status, sent_at, restaurant_name, notification_type, created_at").order("created_at", { ascending: false }).limit(50),
          supabase.from("event_notifications").select("id, delivery_status, sent_at, event_name, notification_type, created_at").order("created_at", { ascending: false }).limit(50),
        ]);
        const diningNotifs = dNotifs.data || [];
        const eventNotifs = eNotifs.data || [];
        setHealthData({
          diningAlerts: dAlerts.data || [],
          eventAlerts: eAlerts.data || [],
          diningNotifs,
          eventNotifs,
          recentDiningErrors: diningNotifs.filter(n => n.delivery_status === "failed").length,
          recentEventErrors: eventNotifs.filter(n => n.delivery_status === "failed").length,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateTriviaQuestion = async (q: any) => {
    const { error } = await supabase.from("trivia_questions").update({
      question: q.question, options: q.options, correct_answer: q.correct_answer,
      category: q.category, difficulty: q.difficulty, park: q.park || null,
    }).eq("id", q.id);
    if (!error) { toast({ title: "✅ Question updated" }); setEditingQuestion(null); loadTab("trivia"); }
    else toast({ title: "Update failed", description: error.message, variant: "destructive" });
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await supabase.from("trivia_questions").update({ is_active: false }).eq("id", id);
    toast({ title: "Question removed" });
    loadTab("trivia");
  };

  const addQuestion = async () => {
    if (!newQuestion.question.trim() || newQuestion.options.filter(o => o.trim()).length < 4) {
      toast({ title: "Fill in question and all 4 options", variant: "destructive" }); return;
    }
    const { error } = await supabase.from("trivia_questions").insert({
      question: newQuestion.question.trim(),
      options: newQuestion.options.map(o => o.trim()),
      correct_answer: newQuestion.correct_answer,
      category: newQuestion.category,
      difficulty: newQuestion.difficulty,
      park: newQuestion.park || null,
      is_active: true,
    });
    if (!error) {
      toast({ title: "✅ Question added!" });
      setShowAddTrivia(false);
      setNewQuestion({ question: "", options: ["","","",""], correct_answer: 0, category: "general", difficulty: "medium", park: "" });
      loadTab("trivia");
    }
  };

  const reviewPhoto = async (id: string, status: "approved" | "rejected") => {
    await supabase.from("game_content").update({ status }).eq("id", id);
    toast({ title: status === "approved" ? "✅ Photo approved!" : "❌ Photo rejected" });
    loadTab("photos");
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    setSendingReply(true);
    try {
      // Send reply via edge function (keeps API key server-side)
      await fetch(`https://wknelhrmgspuztehetpa.supabase.co/functions/v1/admin-reply-email`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          to: selectedMessage.user_email,
          name: selectedMessage.user_name,
          subject: `Re: ${selectedMessage.subject}`,
          replyText,
          originalMessage: selectedMessage.message,
        }),
      });
      await (supabase.from("user_messages" as any).update({
        admin_reply: replyText,
        replied_at: new Date().toISOString(),
        replied_by: user?.email || "admin",
        status: "replied",
      }) as any).eq("id", selectedMessage.id);
      toast({ title: "✅ Reply sent!" });
      setReplyText("");
      setSelectedMessage(null);
      loadTab("messages");
    } catch { toast({ title: "Send failed", variant: "destructive" }); }
    finally { setSendingReply(false); }
  };

  // Event CRUD
  const saveEvent = async (isNew: boolean) => {
    const evt = isNew ? newEvent : editingEvent;
    if (!evt.title || !evt.park || !evt.location || !evt.event_date || !evt.event_time) {
      toast({ title: "Fill in all required fields", variant: "destructive" }); return;
    }
    if (isNew) {
      const { error } = await (supabase.from("beacon_events" as any).insert({ ...evt, created_by: user?.id }) as any);
      if (!error) { toast({ title: "✅ Event created!" }); setShowAddEvent(false); setNewEvent({ title: "", emoji: "🎪", type: "experience", park: "Magic Kingdom", location: "", event_date: "", event_time: "", description: "", badge: "Event", badge_color: "bg-primary/20 text-primary" }); loadTab("events"); }
      else toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      const { error } = await (supabase.from("beacon_events" as any).update({ title: evt.title, emoji: evt.emoji, type: evt.type, park: evt.park, location: evt.location, event_date: evt.event_date, event_time: evt.event_time, description: evt.description, badge: evt.badge, badge_color: evt.badge_color, is_active: evt.is_active, updated_at: new Date().toISOString() }) as any).eq("id", evt.id);
      if (!error) { toast({ title: "✅ Event updated!" }); setEditingEvent(null); loadTab("events"); }
      else toast({ title: "Failed", description: error.message, variant: "destructive" });
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event and all RSVPs?")) return;
    await (supabase.from("beacon_events" as any).delete() as any).eq("id", id);
    toast({ title: "Event deleted" }); loadTab("events");
  };

  const filteredTrivia = triviaQuestions.filter(q =>
    !triviaSearch || q.question.toLowerCase().includes(triviaSearch.toLowerCase()) || q.category?.includes(triviaSearch.toLowerCase())
  );

  const runDiagnosticBatch = async () => {
    setDiagRunning(true);
    setDiagResults([]);
    setDiagProgress("Starting diagnostic batch...");
    let offset = 0;
    const allResults: any[] = [];
    try {
      while (true) {
        setDiagProgress(`Processing events ${offset + 1}–${offset + 5}...`);
        const res = await fetch(`${SUPABASE_URL}/functions/v1/diagnose-events`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ offset, limit: 5, autoUpdate: true }),
        });
        const data = await res.json();
        if (data.error) { setDiagProgress(`Error: ${data.error}`); break; }
        if (data.done || !data.results || data.results.length === 0) { break; }
        allResults.push(...data.results);
        setDiagResults([...allResults]);
        if (!data.hasMore) break;
        offset = data.nextOffset;
      }
      setDiagProgress(`Done — ${allResults.length} events checked`);
    } catch (err) {
      setDiagProgress(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setDiagRunning(false);
  };

  const TABS: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: "health", label: "System Health", icon: Activity },
    { id: "events", label: "Beacon Events", icon: Calendar, badge: beaconEvents.filter(e => e.is_active).length },
    { id: "games", label: "Game Analytics", icon: Gamepad2 },
    { id: "trivia", label: "Trivia Questions", icon: HelpCircle, badge: triviaQuestions.filter(q => q.is_active).length },
    { id: "photos", label: "Photo Review", icon: Image, badge: pendingPhotos.length },
    { id: "messages", label: "User Messages", icon: MessageSquare, badge: messages.filter(m => m.status === "unread").length },
    { id: "sources", label: "News Sources", icon: Globe },
    { id: "linemind", label: "Line Mind Words", icon: Smartphone },
  ];

  if (!user || !ADMIN_EMAILS.includes(user.email || "")) return null;

  return (
    <div className="min-h-screen" style={{ background: "#080E1E" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-4 border-b" style={{ borderColor: "rgba(245,200,66,0.15)", background: "#0D1230" }}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Admin Command Center</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Magic Pass Plus · Admin Access Only</p>
          </div>
          <a href="/admin" className="text-xs text-primary hover:underline">← Main Admin</a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-5">
        {/* Tab bar */}
        <div className="flex gap-1 border-b border-white/10 mb-5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors relative ${tab === t.id ? "text-primary border-b-2 border-primary -mb-px" : "text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {(t.badge || 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[#080E1E] text-[9px] font-black flex items-center justify-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
          <button onClick={() => loadTab(tab)} disabled={loading} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-3 py-2.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {/* ── SYSTEM HEALTH ────────────────────────────────── */}
        {tab === "health" && (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "Active Dining Alerts",
                  value: healthData.diningAlerts.filter(a => a.status === "watching").length,
                  total: healthData.diningAlerts.length,
                  color: "text-blue-400",
                },
                {
                  label: "Active Event Alerts",
                  value: healthData.eventAlerts.filter(a => a.status === "watching").length,
                  total: healthData.eventAlerts.length,
                  color: "text-purple-400",
                },
                {
                  label: "Dining Notif Failures",
                  value: healthData.recentDiningErrors,
                  total: healthData.diningNotifs.length,
                  color: healthData.recentDiningErrors > 0 ? "text-red-400" : "text-green-400",
                },
                {
                  label: "Event Notif Failures",
                  value: healthData.recentEventErrors,
                  total: healthData.eventNotifs.length,
                  color: healthData.recentEventErrors > 0 ? "text-red-400" : "text-green-400",
                },
              ].map((c, i) => (
                <div key={i} className="rounded-xl border border-white/10 p-4" style={{ background: "#111827" }}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{c.label}</p>
                  <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
                  <p className="text-[10px] text-muted-foreground">of {c.total} total</p>
                </div>
              ))}
            </div>

            {/* Railway Poller Status */}
            <div className="rounded-xl border border-white/10 p-5" style={{ background: "#111827" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <p className="text-sm font-bold text-foreground">Railway Poller Status</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg p-3 border border-white/5" style={{ background: "#0D1230" }}>
                  <p className="text-muted-foreground mb-1">Last Dining Check</p>
                  {(() => {
                    const lastChecked = healthData.diningAlerts.filter(a => a.last_checked_at).sort((a, b) => new Date(b.last_checked_at).getTime() - new Date(a.last_checked_at).getTime())[0];
                    if (!lastChecked) return <p className="text-foreground">No checks yet</p>;
                    const ago = Math.round((Date.now() - new Date(lastChecked.last_checked_at).getTime()) / 60000);
                    return <p className={`font-semibold ${ago > 15 ? "text-red-400" : "text-green-400"}`}>{ago} min ago</p>;
                  })()}
                </div>
                <div className="rounded-lg p-3 border border-white/5" style={{ background: "#0D1230" }}>
                  <p className="text-muted-foreground mb-1">Last Event Check</p>
                  {(() => {
                    const lastChecked = healthData.eventAlerts.filter(a => a.last_checked_at).sort((a, b) => new Date(b.last_checked_at).getTime() - new Date(a.last_checked_at).getTime())[0];
                    if (!lastChecked) return <p className="text-foreground">No checks yet</p>;
                    const ago = Math.round((Date.now() - new Date(lastChecked.last_checked_at).getTime()) / 60000);
                    return <p className={`font-semibold ${ago > 15 ? "text-red-400" : "text-green-400"}`}>{ago} min ago</p>;
                  })()}
                </div>
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="rounded-xl border border-white/10 p-5" style={{ background: "#111827" }}>
              <p className="text-sm font-bold text-foreground mb-3">📬 Recent Notifications</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Dining ({healthData.diningNotifs.length})</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {healthData.diningNotifs.slice(0, 10).map(n => (
                      <div key={n.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded" style={{ background: "#0D1230" }}>
                        <span className="text-foreground truncate flex-1">{n.restaurant_name || "Unknown"}</span>
                        <span className={`font-semibold ml-2 ${n.delivery_status === "sent" ? "text-green-400" : n.delivery_status === "failed" ? "text-red-400" : "text-yellow-400"}`}>
                          {n.delivery_status}
                        </span>
                      </div>
                    ))}
                    {healthData.diningNotifs.length === 0 && <p className="text-xs text-muted-foreground">No notifications</p>}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Events ({healthData.eventNotifs.length})</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {healthData.eventNotifs.slice(0, 10).map(n => (
                      <div key={n.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded" style={{ background: "#0D1230" }}>
                        <span className="text-foreground truncate flex-1">{n.event_name || "Unknown"}</span>
                        <span className={`font-semibold ml-2 ${n.delivery_status === "sent" ? "text-green-400" : n.delivery_status === "failed" ? "text-red-400" : "text-yellow-400"}`}>
                          {n.delivery_status}
                        </span>
                      </div>
                    ))}
                    {healthData.eventNotifs.length === 0 && <p className="text-xs text-muted-foreground">No notifications</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Batch Runner */}
            <div className="rounded-xl border border-white/10 p-5" style={{ background: "#111827" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-foreground">🔬 Event Template Diagnostics</p>
                  <p className="text-xs text-muted-foreground">Run a batch diagnostic to check if Disney event page templates have changed</p>
                </div>
                <button
                  onClick={runDiagnosticBatch}
                  disabled={diagRunning}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm text-[#080E1E] disabled:opacity-50"
                  style={{ background: "#F5C842" }}
                >
                  {diagRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  {diagRunning ? "Running..." : "Run Diagnostics"}
                </button>
              </div>
              {diagProgress && (
                <p className={`text-xs mb-3 ${diagProgress.startsWith("Error") ? "text-red-400" : "text-primary"} font-medium`}>
                  {diagProgress}
                </p>
              )}
              {diagResults.length > 0 && (
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-2 py-1.5">
                    <span>Event</span><span>Status</span><span>Scrapable</span><span>Updated</span>
                  </div>
                  {diagResults.map((r, i) => (
                    <div key={i} className="grid grid-cols-[1fr_80px_80px_80px] gap-2 text-xs px-2 py-1.5 rounded" style={{ background: "#0D1230" }}>
                      <span className="text-foreground truncate" title={r.url}>{r.event_name}</span>
                      <span className={r.ok ? "text-green-400" : "text-red-400"}>{r.ok ? "✅ OK" : "❌ Fail"}</span>
                      <span className={r.scrapable ? "text-green-400" : "text-yellow-400"}>{r.scrapable ? "Yes" : "No"}</span>
                      <span className={r.dbUpdated ? "text-primary" : "text-muted-foreground"}>{r.dbUpdated ? "✏️ Yes" : "—"}</span>
                    </div>
                  ))}
                  <div className="flex gap-4 text-xs text-muted-foreground pt-2 px-2">
                    <span>✅ OK: {diagResults.filter(r => r.ok).length}</span>
                    <span>❌ Failed: {diagResults.filter(r => !r.ok).length}</span>
                    <span>Scrapable: {diagResults.filter(r => r.scrapable).length}</span>
                    <span>DB Updated: {diagResults.filter(r => r.dbUpdated).length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BEACON EVENTS ────────────────────────────────── */}
        {tab === "events" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Create and manage Magic Beacon community events. Users RSVP from the Events tab.</p>
              <button onClick={() => setShowAddEvent(!showAddEvent)}
                className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg font-bold text-[#080E1E]" style={{ background: "#F5C842" }}>
                <Plus className="w-3.5 h-3.5" /> New Event
              </button>
            </div>

            {/* Add / Edit Form */}
            {(showAddEvent || editingEvent) && (() => {
              const evt = editingEvent || newEvent;
              const setEvt = (updates: any) => editingEvent ? setEditingEvent({ ...editingEvent, ...updates }) : setNewEvent({ ...newEvent, ...updates });
              const PARKS = ["Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom", "Magic Kingdom Resorts", "Disney Springs"];
              const BADGE_OPTIONS = [
                { badge: "Trading Event", color: "bg-purple-500/20 text-purple-400" },
                { badge: "Ride Marathon", color: "bg-red-500/20 text-red-400" },
                { badge: "Foodie Trail", color: "bg-yellow-500/20 text-yellow-400" },
                { badge: "Photo Walk", color: "bg-orange-500/20 text-orange-400" },
                { badge: "Meetup", color: "bg-blue-500/20 text-blue-400" },
                { badge: "Event", color: "bg-primary/20 text-primary" },
              ];
              return (
                <div className="rounded-xl p-5 border border-primary/20" style={{ background: "#111827" }}>
                  <p className="text-sm font-bold text-foreground mb-4">{editingEvent ? "✏️ Edit Event" : "🎪 Create New Event"}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input placeholder="Event title *" value={evt.title} onChange={e => setEvt({ title: e.target.value })}
                      className="px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ background: "#0D1230" }} />
                    <input placeholder="Emoji (e.g. 🃏)" value={evt.emoji} onChange={e => setEvt({ emoji: e.target.value })} maxLength={4}
                      className="px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ background: "#0D1230" }} />
                    <select value={evt.park} onChange={e => setEvt({ park: e.target.value })}
                      className="px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ background: "#0D1230" }}>
                      {PARKS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input placeholder="Location (e.g. CommuniCore Plaza) *" value={evt.location} onChange={e => setEvt({ location: e.target.value })}
                      className="px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ background: "#0D1230" }} />
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Event Date *</label>
                      <input 
                        type="date" 
                        value={evt.event_date} 
                        onChange={e => setEvt({ event_date: e.target.value })}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                        style={{ background: "#0D1230", minHeight: 44, colorScheme: "dark" }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Start Time *</label>
                        <input 
                          type="time" 
                          value={evt.event_time?.split(" – ")[0]?.replace(/[AP]M/, "").trim().replace(/(\d+):(\d+)/, (m, h, min) => {
                            const hour = parseInt(h);
                            const isPm = evt.event_time?.split(" – ")[0]?.includes("PM");
                            return `${String(isPm && hour !== 12 ? hour + 12 : !isPm && hour === 12 ? 0 : hour).padStart(2, "0")}:${min}`;
                          }) || ""}
                          onChange={e => {
                            const [h, m] = e.target.value.split(":");
                            const hour = parseInt(h);
                            const ampm = hour >= 12 ? "PM" : "AM";
                            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                            const startStr = `${displayHour}:${m} ${ampm}`;
                            const existingEnd = evt.event_time?.split(" – ")[1] || "";
                            setEvt({ event_time: existingEnd ? `${startStr} – ${existingEnd}` : startStr });
                          }}
                          className="w-full px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                          style={{ background: "#0D1230", minHeight: 44, colorScheme: "dark" }}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">End Time</label>
                        <input 
                          type="time"
                          onChange={e => {
                            const [h, m] = e.target.value.split(":");
                            const hour = parseInt(h);
                            const ampm = hour >= 12 ? "PM" : "AM";
                            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                            const endStr = `${displayHour}:${m} ${ampm}`;
                            const existingStart = evt.event_time?.split(" – ")[0] || "";
                            setEvt({ event_time: existingStart ? `${existingStart} – ${endStr}` : endStr });
                          }}
                          className="w-full px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                          style={{ background: "#0D1230", minHeight: 44, colorScheme: "dark" }}
                        />
                      </div>
                    </div>
                    {evt.event_time && (
                      <p className="text-xs text-primary mt-1">📅 Preview: {evt.event_date ? new Date(evt.event_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "No date"} · {evt.event_time}</p>
                    )}
                  </div>
                  <textarea placeholder="Description..." value={evt.description} onChange={e => setEvt({ description: e.target.value })} rows={3}
                    className="w-full px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40 resize-none mb-3" style={{ background: "#0D1230" }} />
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Badge Style</p>
                    <div className="flex flex-wrap gap-2">
                      {BADGE_OPTIONS.map(b => (
                        <button key={b.badge} onClick={() => setEvt({ badge: b.badge, badge_color: b.color })}
                          className={`text-xs px-3 py-1.5 rounded-full font-semibold ${b.color} ${evt.badge === b.badge ? "ring-2 ring-primary" : ""}`}>
                          {b.badge}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEvent(!editingEvent)}
                      className="px-5 py-2.5 rounded-lg font-bold text-sm text-[#080E1E]" style={{ background: "#F5C842" }}>
                      {editingEvent ? "Save Changes" : "Create Event"}
                    </button>
                    <button onClick={() => { setShowAddEvent(false); setEditingEvent(null); }}
                      className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground border border-white/10 hover:text-foreground">
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Event List */}
            {beaconEvents.length === 0 ? (
              <div className="rounded-xl p-8 text-center border border-white/8" style={{ background: "#111827" }}>
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">No events yet</p>
                <p className="text-xs text-muted-foreground">Create your first community event above</p>
              </div>
            ) : (
              beaconEvents.map(evt => {
                const rsvps = eventRsvps[evt.id] || [];
                return (
                  <div key={evt.id} className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "#111827" }}>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${evt.badge_color}`}>{evt.badge}</span>
                            {!evt.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Inactive</span>}
                          </div>
                          <p className="text-base font-black text-foreground">{evt.emoji} {evt.title}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => setEditingEvent({ ...evt })} className="text-xs text-primary hover:underline">Edit</button>
                          <button onClick={() => deleteEvent(evt.id)} className="text-xs text-red-400 hover:underline">Delete</button>
                        </div>
                      </div>
                      <p className="text-xs text-primary mb-0.5">📍 {evt.park} · {evt.location}</p>
                      <p className="text-xs text-muted-foreground mb-0.5">📅 {evt.event_date}</p>
                      <p className="text-xs text-muted-foreground mb-2">🕐 {evt.event_time}</p>
                      {evt.description && <p className="text-xs text-muted-foreground leading-relaxed mb-3">{evt.description}</p>}

                      {/* RSVPs */}
                      <div className="border-t border-white/8 pt-3">
                        <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          {rsvps.length} RSVP{rsvps.length !== 1 ? "s" : ""}
                        </p>
                        {rsvps.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No RSVPs yet</p>
                        ) : (
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {rsvps.map((r: any) => (
                              <div key={r.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5 text-xs">
                                <span className="text-foreground">{r.first_name || "Unknown"} {r.last_name || ""}</span>
                                <span className="text-muted-foreground">{r.email || "—"}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── GAME ANALYTICS ───────────────────────────────── */}
        {tab === "games" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Games are logged when users start a session. Install the game session tracker in LivePark to start collecting data.</p>
            {gameStats.length === 0 ? (
              <div className="rounded-xl p-8 text-center border border-white/8" style={{ background: "#111827" }}>
                <Gamepad2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">No game sessions yet</p>
                <p className="text-xs text-muted-foreground">Data will appear once users start playing games</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameStats.map(g => (
                  <div key={g.game_id} className="rounded-xl p-5 border border-white/8" style={{ background: "#111827" }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-foreground">{g.game_name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">{g.plays} plays</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Avg Score", value: g.avgScore.toLocaleString(), icon: TrendingUp },
                        { label: "Avg Time", value: `${Math.round(g.avgDuration / 60)}m`, icon: Clock },
                        { label: "Completion", value: `${g.completionRate}%`, icon: Users },
                      ].map(s => (
                        <div key={s.label} className="text-center p-2 rounded-lg bg-white/5">
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <p className="text-sm font-bold text-foreground">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TRIVIA QUESTIONS ──────────────────────────────── */}
        {tab === "trivia" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={triviaSearch} onChange={e => setTriviaSearch(e.target.value)} placeholder="Search questions..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                  style={{ background: "#111827" }} />
              </div>
              <button onClick={() => setShowAddTrivia(s => !s)}
                className="px-4 py-2 rounded-lg font-bold text-sm text-[#080E1E] flex items-center gap-2 shrink-0"
                style={{ background: "#F5C842" }}>
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>

            {/* Add question form */}
            {showAddTrivia && (
              <div className="rounded-xl p-5 border border-primary/20" style={{ background: "#111827" }}>
                <p className="text-sm font-bold text-foreground mb-4">➕ New Trivia Question</p>
                <div className="space-y-3">
                  <textarea value={newQuestion.question} onChange={e => setNewQuestion(q => ({...q, question: e.target.value}))}
                    placeholder="Question text *" rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40 resize-none"
                    style={{ background: "#0D1230" }} />
                  {newQuestion.options.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <button onClick={() => setNewQuestion(q => ({...q, correct_answer: i}))}
                        className={`w-8 h-8 rounded-full shrink-0 border-2 flex items-center justify-center text-xs font-bold ${newQuestion.correct_answer === i ? "border-green-500 bg-green-500/20 text-green-400" : "border-white/20 text-muted-foreground"}`}>
                        {i + 1}
                      </button>
                      <input value={opt} onChange={e => { const o = [...newQuestion.options]; o[i] = e.target.value; setNewQuestion(q => ({...q, options: o})); }}
                        placeholder={`Option ${i+1}${newQuestion.correct_answer === i ? " ✓ correct" : ""}`}
                        className="flex-1 px-3 py-2 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                        style={{ background: "#0D1230", borderColor: newQuestion.correct_answer === i ? "rgba(34,197,94,0.4)" : undefined }} />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <select value={newQuestion.category} onChange={e => setNewQuestion(q => ({...q, category: e.target.value}))}
                      className="flex-1 px-3 py-2 rounded-lg border border-white/10 text-sm text-foreground" style={{ background: "#0D1230" }}>
                      {["general","history","rides","dining","characters","movies","resorts","facts","shows"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={newQuestion.difficulty} onChange={e => setNewQuestion(q => ({...q, difficulty: e.target.value}))}
                      className="flex-1 px-3 py-2 rounded-lg border border-white/10 text-sm text-foreground" style={{ background: "#0D1230" }}>
                      {["easy","medium","hard"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input value={newQuestion.park} onChange={e => setNewQuestion(q => ({...q, park: e.target.value}))}
                      placeholder="Park (optional)"
                      className="flex-1 px-3 py-2 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none" style={{ background: "#0D1230" }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddTrivia(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-sm text-muted-foreground">Cancel</button>
                    <button onClick={addQuestion} className="flex-1 py-2 rounded-lg font-bold text-sm text-[#080E1E]" style={{ background: "#F5C842" }}>Add Question</button>
                  </div>
                </div>
              </div>
            )}

            {/* Questions list */}
            <div className="rounded-xl overflow-hidden border border-white/8" style={{ background: "#111827" }}>
              <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">Trivia Questions ({filteredTrivia.length} of {triviaQuestions.length})</p>
              </div>
              <div className="divide-y divide-white/5" style={{ maxHeight: 600, overflowY: "auto" }}>
                {filteredTrivia.map(q => (
                  <div key={q.id} className="px-4 py-3">
                    {editingQuestion?.id === q.id ? (
                      <div className="space-y-2">
                        <textarea value={editingQuestion.question} onChange={e => setEditingQuestion((eq: any) => ({...eq, question: e.target.value}))} rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-white/10 text-sm text-foreground bg-[#0D1230] focus:outline-none resize-none" />
                        {editingQuestion.options.map((opt: string, i: number) => (
                          <div key={i} className="flex gap-2">
                            <button onClick={() => setEditingQuestion((eq: any) => ({...eq, correct_answer: i}))}
                              className={`w-6 h-6 rounded-full shrink-0 text-xs font-bold border ${editingQuestion.correct_answer === i ? "border-green-500 bg-green-500/20 text-green-400" : "border-white/20 text-muted-foreground"}`}>
                              {i+1}
                            </button>
                            <input value={opt} onChange={e => { const o = [...editingQuestion.options]; o[i] = e.target.value; setEditingQuestion((eq: any) => ({...eq, options: o})); }}
                              className="flex-1 px-2 py-1 rounded border border-white/10 text-xs text-foreground bg-[#0D1230] focus:outline-none" />
                          </div>
                        ))}
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => updateTriviaQuestion(editingQuestion)} className="px-3 py-1.5 rounded text-xs font-bold text-[#080E1E]" style={{ background: "#F5C842" }}>Save</button>
                          <button onClick={() => setEditingQuestion(null)} className="px-3 py-1.5 rounded text-xs text-muted-foreground border border-white/10">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground leading-snug">{q.question}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {q.options?.map((opt: string, i: number) => (
                              <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${i === q.correct_answer ? "bg-green-500/20 text-green-400 font-semibold" : "bg-white/8 text-muted-foreground"}`}>
                                {i === q.correct_answer ? "✓ " : ""}{opt}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{q.category}</span>
                            <span className={`text-xs ${q.difficulty === "hard" ? "text-red-400" : q.difficulty === "medium" ? "text-yellow-400" : "text-green-400"}`}>{q.difficulty}</span>
                            {q.park && <span className="text-xs text-primary">{q.park}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => setEditingQuestion({...q})} className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteQuestion(q.id)} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PHOTO REVIEW ──────────────────────────────────── */}
        {tab === "photos" && (
          <div className="space-y-5">
            {/* Pending */}
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                ⏳ Pending Review ({pendingPhotos.length})
              </p>
              {pendingPhotos.length === 0 ? (
                <div className="text-center py-8 rounded-xl border border-white/8" style={{ background: "#111827" }}>
                  <p className="text-xs text-muted-foreground">No photos pending review</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingPhotos.map(photo => (
                    <div key={photo.id} className="rounded-xl overflow-hidden border border-yellow-500/30" style={{ background: "#111827" }}>
                      {photo.image_url && <img src={photo.image_url} className="w-full object-cover" style={{ maxHeight: 200 }} alt={photo.title} onError={e => (e.currentTarget.style.display='none')} />}
                      <div className="p-4">
                        <p className="text-sm font-bold text-foreground">{photo.title}</p>
                        <p className="text-xs text-muted-foreground mb-1">{photo.game_type === "where_am_i" ? "📸 Where Am I?" : "🔍 Scavenger Hunt"} · {photo.park}</p>
                        {photo.clue_description && <p className="text-xs text-muted-foreground italic mb-1">"{photo.clue_description}"</p>}
                        {photo.multiple_choice && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {photo.multiple_choice.map((opt: string, i: number) => (
                              <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${i === photo.correct_answer ? "bg-green-500/20 text-green-400 font-semibold" : "bg-white/8 text-muted-foreground"}`}>
                                {i === photo.correct_answer ? "✓ " : ""}{opt}
                              </span>
                            ))}
                          </div>
                        )}
                        {photo.gps_lat && <p className="text-xs text-muted-foreground mb-2">📍 GPS: {photo.gps_lat?.toFixed(4)}, {photo.gps_lng?.toFixed(4)}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => reviewPhoto(photo.id, "approved")}
                            className="flex-1 py-2 rounded-lg font-bold text-sm text-[#080E1E] flex items-center justify-center gap-1"
                            style={{ background: "#22c55e" }}>
                            <Check className="w-4 h-4" /> Approve
                          </button>
                          <button onClick={() => reviewPhoto(photo.id, "rejected")}
                            className="flex-1 py-2 rounded-lg font-bold text-sm border border-red-500/30 text-red-400 flex items-center justify-center gap-1 hover:bg-red-500/10">
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approved */}
            <div>
              <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3">✅ Live in Games ({approvedPhotos.length})</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {approvedPhotos.map(photo => (
                  <div key={photo.id} className="rounded-xl overflow-hidden border border-white/8" style={{ background: "#111827" }}>
                    {photo.image_url && <img src={photo.image_url} className="w-full object-cover" style={{ aspectRatio: "1", objectFit: "cover" }} alt={photo.title} onError={e => (e.currentTarget.style.display='none')} />}
                    <div className="p-2">
                      <p className="text-xs font-medium text-foreground truncate">{photo.title}</p>
                      <p className="text-xs text-muted-foreground">{photo.park}</p>
                      <button onClick={() => reviewPhoto(photo.id, "rejected")} className="text-xs text-red-400 hover:underline mt-1">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── USER MESSAGES ─────────────────────────────────── */}
        {tab === "messages" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ minHeight: 500 }}>
            {/* Message list */}
            <div className="rounded-xl overflow-hidden border border-white/8" style={{ background: "#111827" }}>
              <div className="px-4 py-3 border-b border-white/8">
                <p className="text-xs font-bold text-foreground">Messages ({messages.length})</p>
              </div>
              <div style={{ maxHeight: 500, overflowY: "auto" }}>
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No messages yet</p>
                  </div>
                ) : messages.map((msg, i) => (
                  <button key={msg.id} onClick={() => { setSelectedMessage(msg); setReplyText(""); }}
                    className={`w-full text-left px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/5 ${selectedMessage?.id === msg.id ? "bg-primary/10" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground truncate">{msg.user_name || msg.user_email}</p>
                          {msg.status === "unread" && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{msg.subject}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5 italic">"{msg.message}"</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleDateString()}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${msg.status === "replied" ? "bg-green-500/20 text-green-400" : msg.status === "unread" ? "bg-primary/20 text-primary" : "bg-white/8 text-muted-foreground"}`}>
                          {msg.status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reply panel */}
            <div className="rounded-xl border border-white/8" style={{ background: "#111827" }}>
              {!selectedMessage ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-xs text-muted-foreground">Select a message to read and reply</p>
                </div>
              ) : (
                <div className="p-4 flex flex-col h-full">
                  <div className="mb-4 pb-4 border-b border-white/8">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-foreground">{selectedMessage.user_name}</p>
                        <p className="text-xs text-primary">{selectedMessage.user_email}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{selectedMessage.subject} · {new Date(selectedMessage.created_at).toLocaleString()}</p>
                      </div>
                      <button onClick={async () => {
                        await (supabase.from("user_messages" as any).update({ status: "archived" }) as any).eq("id", selectedMessage.id);
                        setSelectedMessage(null); loadTab("messages");
                      }} className="text-muted-foreground hover:text-foreground p-1.5">
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="rounded-lg p-3 mb-4 flex-1" style={{ background: "#0D1230" }}>
                    <p className="text-sm text-foreground leading-relaxed">{selectedMessage.message}</p>
                  </div>
                  {selectedMessage.admin_reply && (
                    <div className="rounded-lg p-3 mb-3 border border-green-500/20 bg-green-500/5">
                      <p className="text-xs text-green-400 font-semibold mb-1">Your previous reply:</p>
                      <p className="text-xs text-muted-foreground">{selectedMessage.admin_reply}</p>
                    </div>
                  )}
                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={4}
                    placeholder="Type your reply..."
                    className="w-full px-3 py-2 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40 resize-none mb-3"
                    style={{ background: "#0D1230" }} />
                  <button onClick={sendReply} disabled={sendingReply || !replyText.trim()}
                    className="w-full py-2.5 rounded-xl font-bold text-sm text-[#080E1E] disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: "#F5C842" }}>
                    <Send className="w-4 h-4" /> {sendingReply ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SOURCES TAB */}
        {tab === "sources" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Intelligence Sources ({newsSources.length})</p>
                <p className="text-xs text-muted-foreground">Sources Clark checks 5x daily for Disney deals and news</p>
              </div>
              <button onClick={() => setShowAddSource(s => !s)}
                className="px-4 py-2 rounded-lg font-bold text-sm text-[#080E1E] flex items-center gap-2"
                style={{ background: "#F5C842" }}>
                + Add Source
              </button>
            </div>
            {showAddSource && (
              <div className="rounded-xl p-4 border border-primary/20" style={{ background: "#111827" }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input value={newSource.name} onChange={e => setNewSource(s => ({...s, name: e.target.value}))} placeholder="Source name *"
                    className="px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ background: "#0D1230" }} />
                  <input value={newSource.url} onChange={e => setNewSource(s => ({...s, url: e.target.value}))} placeholder="URL * (https://...)"
                    className="px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40" style={{ background: "#0D1230" }} />
                  <select value={newSource.category} onChange={e => setNewSource(s => ({...s, category: e.target.value}))}
                    className="px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground" style={{ background: "#0D1230" }}>
                    {["disney_deals","disney_news","ap_exclusive","dining","orlando_attractions","entertainment"].map(c => <option key={c} value={c}>{c.replace("_"," ")}</option>)}
                  </select>
                  <select value={newSource.scrape_frequency} onChange={e => setNewSource(s => ({...s, scrape_frequency: e.target.value}))}
                    className="px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground" style={{ background: "#0D1230" }}>
                    {["realtime","daily","weekly"].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <input value={newSource.notes} onChange={e => setNewSource(s => ({...s, notes: e.target.value}))} placeholder="Notes (optional)"
                  className="w-full px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground mb-3 focus:outline-none focus:border-primary/40" style={{ background: "#0D1230" }} />
                <button onClick={async () => {
                  if (!newSource.name || !newSource.url) return;
                  await supabase.from("news_sources").insert(newSource);
                  toast({ title: "✅ Source added!" });
                  setShowAddSource(false);
                  setNewSource({ name: "", url: "", category: "disney_deals", notes: "", scrape_frequency: "daily" });
                  loadTab("sources");
                }} className="px-6 py-2.5 rounded-lg font-bold text-sm text-[#080E1E]" style={{ background: "#F5C842" }}>
                  Add Source
                </button>
              </div>
            )}
            <div className="rounded-xl overflow-hidden border border-white/8" style={{ background: "#111827" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left px-4 py-3 text-xs text-primary">Source</th>
                    <th className="text-left px-4 py-3 text-xs text-primary hidden md:table-cell">Category</th>
                    <th className="text-left px-4 py-3 text-xs text-primary hidden md:table-cell">Frequency</th>
                    <th className="text-left px-4 py-3 text-xs text-primary hidden lg:table-cell">Last Checked</th>
                    <th className="px-4 py-3 text-xs text-primary">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {newsSources.map((src, i) => (
                    <tr key={src.id} className={i < newsSources.length - 1 ? "border-b border-white/5" : ""}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{src.name}</p>
                        <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block max-w-xs">{src.url}</a>
                        {src.notes && <p className="text-xs text-muted-foreground">{src.notes}</p>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground capitalize">{src.category?.replace("_"," ")}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{src.scrape_frequency}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{src.last_scraped ? new Date(src.last_scraped).toLocaleString() : "Never"}</td>
                      <td className="px-4 py-3">
                        <button onClick={async () => {
                          await supabase.from("news_sources").update({ is_active: !src.is_active }).eq("id", src.id);
                          loadTab("sources");
                        }} className={`text-xs px-2.5 py-1 rounded-full font-semibold ${src.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {src.is_active ? "✅ On" : "❌ Off"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── LINE MIND WORDS ──────────────────────────────── */}
        {tab === "linemind" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={lineMindSearch} onChange={e => setLineMindSearch(e.target.value)} placeholder="Search words..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                  style={{ background: "#111827" }} />
              </div>
              <select value={lineMindCategory} onChange={e => setLineMindCategory(e.target.value)}
                className="px-3 py-2 rounded-lg border border-white/10 text-sm text-foreground" style={{ background: "#111827" }}>
                <option value="all">All Categories</option>
                {["characters","rides","food","movies","parks","general"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => setShowAddWord(s => !s)}
                className="px-4 py-2 rounded-lg font-bold text-sm text-[#080E1E] flex items-center gap-2 shrink-0"
                style={{ background: "#F5C842" }}>
                <Plus className="w-4 h-4" /> Add Word
              </button>
            </div>

            {/* Add word form */}
            {showAddWord && (
              <div className="rounded-xl p-5 border border-primary/20" style={{ background: "#111827" }}>
                <p className="text-sm font-bold text-foreground mb-4">➕ New Line Mind Word</p>
                <div className="flex gap-3 mb-3">
                  <input value={newWord.word} onChange={e => setNewWord(w => ({...w, word: e.target.value}))}
                    placeholder="Disney word or phrase *"
                    className="flex-1 px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                    style={{ background: "#0D1230" }} />
                  <select value={newWord.category} onChange={e => setNewWord(w => ({...w, category: e.target.value}))}
                    className="px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground" style={{ background: "#0D1230" }}>
                    {["characters","rides","food","movies","parks","general"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddWord(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-sm text-muted-foreground">Cancel</button>
                  <button onClick={async () => {
                    if (!newWord.word.trim()) { toast({ title: "Enter a word", variant: "destructive" }); return; }
                    const { error } = await (supabase.from("headsup_words" as any).insert({ word: newWord.word.trim(), category: newWord.category, is_active: true }) as any);
                    if (!error) { toast({ title: "✅ Word added!" }); setShowAddWord(false); setNewWord({ word: "", category: "characters" }); loadTab("linemind"); }
                    else toast({ title: "Failed", description: error.message, variant: "destructive" });
                  }} className="flex-1 py-2 rounded-lg font-bold text-sm text-[#080E1E]" style={{ background: "#F5C842" }}>Add Word</button>
                </div>
              </div>
            )}

            {/* Words list */}
            {(() => {
              const filtered = lineMindWords.filter(w => {
                const matchSearch = !lineMindSearch || w.word.toLowerCase().includes(lineMindSearch.toLowerCase());
                const matchCat = lineMindCategory === "all" || w.category === lineMindCategory;
                return matchSearch && matchCat;
              });
              const catCounts: Record<string, number> = {};
              lineMindWords.forEach(w => { catCounts[w.category] = (catCounts[w.category] || 0) + 1; });
              return (
                <>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {Object.entries(catCounts).map(([cat, count]) => (
                      <span key={cat} className="px-2.5 py-1 rounded-full bg-white/8 text-muted-foreground">
                        {cat}: {count}
                      </span>
                    ))}
                    <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary font-semibold">
                      Total: {lineMindWords.length}
                    </span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-white/8" style={{ background: "#111827" }}>
                    <div className="px-4 py-3 border-b border-white/8">
                      <p className="text-xs font-bold text-foreground">Words ({filtered.length})</p>
                    </div>
                    <div className="divide-y divide-white/5" style={{ maxHeight: 600, overflowY: "auto" }}>
                      {filtered.map(w => (
                        <div key={w.id} className="px-4 py-3">
                          {editingWord?.id === w.id ? (
                            <div className="flex gap-2 items-center">
                              <input value={editingWord.word} onChange={e => setEditingWord((ew: any) => ({...ew, word: e.target.value}))}
                                className="flex-1 px-2 py-1.5 rounded border border-white/10 text-sm text-foreground bg-[#0D1230] focus:outline-none" />
                              <select value={editingWord.category} onChange={e => setEditingWord((ew: any) => ({...ew, category: e.target.value}))}
                                className="px-2 py-1.5 rounded border border-white/10 text-xs text-foreground bg-[#0D1230]">
                                {["characters","rides","food","movies","parks","general"].map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <button onClick={async () => {
                                await (supabase.from("headsup_words" as any).update({ word: editingWord.word, category: editingWord.category }) as any).eq("id", editingWord.id);
                                toast({ title: "✅ Word updated" }); setEditingWord(null); loadTab("linemind");
                              }} className="px-3 py-1.5 rounded text-xs font-bold text-[#080E1E]" style={{ background: "#F5C842" }}>Save</button>
                              <button onClick={() => setEditingWord(null)} className="px-2 py-1.5 rounded text-xs text-muted-foreground border border-white/10">✕</button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-sm font-medium text-foreground">{w.word}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-muted-foreground">{w.category}</span>
                                {!w.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Inactive</span>}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button onClick={async () => {
                                  await (supabase.from("headsup_words" as any).update({ is_active: !w.is_active }) as any).eq("id", w.id);
                                  loadTab("linemind");
                                }} className={`text-xs px-2 py-1 rounded-full font-semibold ${w.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                  {w.is_active ? "On" : "Off"}
                                </button>
                                <button onClick={() => setEditingWord({...w})} className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={async () => {
                                  if (!confirm("Delete this word?")) return;
                                  await (supabase.from("headsup_words" as any).delete() as any).eq("id", w.id);
                                  toast({ title: "Word deleted" }); loadTab("linemind");
                                }} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
}
