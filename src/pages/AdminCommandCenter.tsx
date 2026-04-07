import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gamepad2, MessageSquare, Image, HelpCircle, Shield, RefreshCw,
  Edit2, Trash2, Check, X, Send, Eye, Archive, ChevronDown, ChevronUp,
  TrendingUp, Clock, Users, Star, Plus, Search
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net"];
const SUPABASE_ANON = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";
const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";

type Tab = "games" | "trivia" | "photos" | "messages";

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

  const filteredTrivia = triviaQuestions.filter(q =>
    !triviaSearch || q.question.toLowerCase().includes(triviaSearch.toLowerCase()) || q.category?.includes(triviaSearch.toLowerCase())
  );

  const TABS: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: "games", label: "Game Analytics", icon: Gamepad2 },
    { id: "trivia", label: "Trivia Questions", icon: HelpCircle, badge: triviaQuestions.filter(q => q.is_active).length },
    { id: "photos", label: "Photo Review", icon: Image, badge: pendingPhotos.length },
    { id: "messages", label: "User Messages", icon: MessageSquare, badge: messages.filter(m => m.status === "unread").length },
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
      </div>
    </div>
  );
}
