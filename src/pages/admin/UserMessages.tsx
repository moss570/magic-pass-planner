import { useState, useEffect } from "react";
import { MessageSquare, Send, Archive, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

export default function UserMessages() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const { data } = await (supabase.from("user_messages" as any).select("*") as any).order("created_at", { ascending: false }).limit(50);
    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    setSendingReply(true);
    try {
      await fetch(`https://wknelhrmgspuztehetpa.supabase.co/functions/v1/admin-reply-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}`, "x-client-authorization": `Bearer ${session?.access_token}`, "apikey": "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC" },
        body: JSON.stringify({ to: selectedMessage.user_email, name: selectedMessage.user_name, subject: `Re: ${selectedMessage.subject}`, replyText, originalMessage: selectedMessage.message }),
      });
      await (supabase.from("user_messages" as any).update({ admin_reply: replyText, replied_at: new Date().toISOString(), replied_by: user?.email || "admin", status: "replied" }) as any).eq("id", selectedMessage.id);
      toast({ title: "✅ Reply sent!" }); setReplyText(""); setSelectedMessage(null); loadData();
    } catch { toast({ title: "Send failed", variant: "destructive" }); }
    finally { setSendingReply(false); }
  };

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> User Messages</h1>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ minHeight: 500 }}>
          <div className="rounded-xl overflow-hidden border border-border/50 bg-card">
            <div className="px-4 py-3 border-b border-border/50"><p className="text-xs font-bold text-foreground">Messages ({messages.length})</p></div>
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              {messages.length === 0 ? (
                <div className="text-center py-8"><MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-xs text-muted-foreground">No messages yet</p></div>
              ) : messages.map(msg => (
                <button key={msg.id} onClick={() => { setSelectedMessage(msg); setReplyText(""); }}
                  className={`w-full text-left px-4 py-3 border-b border-border/30 transition-colors hover:bg-muted/30 ${selectedMessage?.id === msg.id ? "bg-primary/10" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-foreground truncate">{msg.user_name || msg.user_email}</p>
                        {msg.status === "unread" && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{msg.subject}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleDateString()}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${msg.status === "replied" ? "bg-green-500/20 text-green-400" : msg.status === "unread" ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground"}`}>{msg.status}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card">
            {!selectedMessage ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-xs text-muted-foreground">Select a message to read and reply</p>
              </div>
            ) : (
              <div className="p-4 flex flex-col h-full">
                <div className="mb-4 pb-4 border-b border-border/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">{selectedMessage.user_name}</p>
                      <p className="text-xs text-primary">{selectedMessage.user_email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedMessage.subject} · {new Date(selectedMessage.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={async () => {
                      await (supabase.from("user_messages" as any).update({ status: "archived" }) as any).eq("id", selectedMessage.id);
                      setSelectedMessage(null); loadData();
                    }} className="text-muted-foreground hover:text-foreground p-1.5"><Archive className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="rounded-lg p-3 mb-4 flex-1 bg-muted/30"><p className="text-sm text-foreground leading-relaxed">{selectedMessage.message}</p></div>
                {selectedMessage.admin_reply && (
                  <div className="rounded-lg p-3 mb-3 border border-green-500/20 bg-green-500/5">
                    <p className="text-xs text-green-400 font-semibold mb-1">Your previous reply:</p>
                    <p className="text-xs text-muted-foreground">{selectedMessage.admin_reply}</p>
                  </div>
                )}
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={4} placeholder="Type your reply..."
                  className="w-full px-3 py-2 rounded-lg border border-border/50 text-sm text-foreground bg-muted/30 focus:outline-none focus:border-primary/40 resize-none mb-3" />
                <button onClick={sendReply} disabled={sendingReply || !replyText.trim()}
                  className="w-full py-2.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> {sendingReply ? "Sending..." : "Send Reply"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
