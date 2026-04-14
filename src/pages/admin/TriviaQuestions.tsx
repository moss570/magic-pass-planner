import { useState, useEffect } from "react";
import { HelpCircle, Plus, Search, Edit2, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

export default function TriviaQuestions() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [triviaQuestions, setTriviaQuestions] = useState<any[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [triviaSearch, setTriviaSearch] = useState("");
  const [showAddTrivia, setShowAddTrivia] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ question: "", options: ["","","",""], correct_answer: 0, category: "general", difficulty: "medium", park: "" });

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase.from("trivia_questions").select("*").order("category").order("difficulty");
    setTriviaQuestions(data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const updateTriviaQuestion = async (q: any) => {
    const { error } = await supabase.from("trivia_questions").update({
      question: q.question, options: q.options, correct_answer: q.correct_answer,
      category: q.category, difficulty: q.difficulty, park: q.park || null,
    }).eq("id", q.id);
    if (!error) { toast({ title: "✅ Question updated" }); setEditingQuestion(null); loadData(); }
    else toast({ title: "Update failed", description: error.message, variant: "destructive" });
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await supabase.from("trivia_questions").update({ is_active: false }).eq("id", id);
    toast({ title: "Question removed" }); loadData();
  };

  const addQuestion = async () => {
    if (!newQuestion.question.trim() || newQuestion.options.filter(o => o.trim()).length < 4) {
      toast({ title: "Fill in question and all 4 options", variant: "destructive" }); return;
    }
    const { error } = await supabase.from("trivia_questions").insert({
      question: newQuestion.question.trim(), options: newQuestion.options.map(o => o.trim()),
      correct_answer: newQuestion.correct_answer, category: newQuestion.category,
      difficulty: newQuestion.difficulty, park: newQuestion.park || null, is_active: true,
    });
    if (!error) {
      toast({ title: "✅ Question added!" }); setShowAddTrivia(false);
      setNewQuestion({ question: "", options: ["","","",""], correct_answer: 0, category: "general", difficulty: "medium", park: "" });
      loadData();
    }
  };

  const filteredTrivia = triviaQuestions.filter(q =>
    !triviaSearch || q.question.toLowerCase().includes(triviaSearch.toLowerCase()) || q.category?.includes(triviaSearch.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><HelpCircle className="w-5 h-5 text-primary" /> Trivia Questions</h1>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={triviaSearch} onChange={e => setTriviaSearch(e.target.value)} placeholder="Search questions..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/50 text-sm text-foreground bg-card focus:outline-none focus:border-primary/40" />
          </div>
          <button onClick={() => setShowAddTrivia(s => !s)} className="px-4 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>

        {showAddTrivia && (
          <div className="rounded-xl p-5 border border-primary/20 bg-card">
            <p className="text-sm font-bold text-foreground mb-4">➕ New Trivia Question</p>
            <textarea value={newQuestion.question} onChange={e => setNewQuestion(q => ({...q, question: e.target.value}))}
              placeholder="Question *" rows={2} className="w-full px-3 py-2 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30 focus:outline-none resize-none mb-3" />
            {newQuestion.options.map((opt, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <button onClick={() => setNewQuestion(q => ({...q, correct_answer: i}))}
                  className={`w-7 h-7 rounded-full shrink-0 text-xs font-bold border ${newQuestion.correct_answer === i ? "border-green-500 bg-green-500/20 text-green-400" : "border-border text-muted-foreground"}`}>
                  {i+1}
                </button>
                <input value={opt} onChange={e => { const o = [...newQuestion.options]; o[i] = e.target.value; setNewQuestion(q => ({...q, options: o})); }}
                  placeholder={`Option ${i+1}`} className="flex-1 px-2 py-1.5 rounded border border-border/50 text-xs text-foreground bg-muted/30 focus:outline-none" />
              </div>
            ))}
            <div className="flex gap-2 mb-3">
              <select value={newQuestion.category} onChange={e => setNewQuestion(q => ({...q, category: e.target.value}))}
                className="flex-1 px-3 py-2 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30">
                {["general","characters","rides","parks","history","movies","star_wars","food"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={newQuestion.difficulty} onChange={e => setNewQuestion(q => ({...q, difficulty: e.target.value}))}
                className="flex-1 px-3 py-2 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30">
                {["easy","medium","hard"].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddTrivia(false)} className="flex-1 py-2 rounded-lg border border-border/50 text-sm text-muted-foreground">Cancel</button>
              <button onClick={addQuestion} className="flex-1 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground">Add Question</button>
            </div>
          </div>
        )}

        <div className="rounded-xl overflow-hidden border border-border/50 bg-card">
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-xs font-bold text-foreground">Trivia Questions ({filteredTrivia.length} of {triviaQuestions.length})</p>
          </div>
          <div className="divide-y divide-border/30" style={{ maxHeight: 600, overflowY: "auto" }}>
            {filteredTrivia.map(q => (
              <div key={q.id} className="px-4 py-3">
                {editingQuestion?.id === q.id ? (
                  <div className="space-y-2">
                    <textarea value={editingQuestion.question} onChange={e => setEditingQuestion((eq: any) => ({...eq, question: e.target.value}))} rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30 focus:outline-none resize-none" />
                    {editingQuestion.options.map((opt: string, i: number) => (
                      <div key={i} className="flex gap-2">
                        <button onClick={() => setEditingQuestion((eq: any) => ({...eq, correct_answer: i}))}
                          className={`w-6 h-6 rounded-full shrink-0 text-xs font-bold border ${editingQuestion.correct_answer === i ? "border-green-500 bg-green-500/20 text-green-400" : "border-border text-muted-foreground"}`}>{i+1}</button>
                        <input value={opt} onChange={e => { const o = [...editingQuestion.options]; o[i] = e.target.value; setEditingQuestion((eq: any) => ({...eq, options: o})); }}
                          className="flex-1 px-2 py-1 rounded border border-border/50 text-xs text-foreground bg-muted/30 focus:outline-none" />
                      </div>
                    ))}
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => updateTriviaQuestion(editingQuestion)} className="px-3 py-1.5 rounded text-xs font-bold bg-primary text-primary-foreground">Save</button>
                      <button onClick={() => setEditingQuestion(null)} className="px-3 py-1.5 rounded text-xs text-muted-foreground border border-border/50">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground leading-snug">{q.question}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {q.options?.map((opt: string, i: number) => (
                          <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${i === q.correct_answer ? "bg-green-500/20 text-green-400 font-semibold" : "bg-muted/50 text-muted-foreground"}`}>
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
    </AdminLayout>
  );
}
