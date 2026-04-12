import { useState, useEffect } from "react";
import { Mail, Send, Bell, UtensilsCrossed, Radio, Sparkles, Users, ChevronLeft, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender_id: string | null;
  receiver_id: string;
  content: string;
  message_type: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_membership?: string;
}

interface Thread {
  partnerId: string;
  partnerName: string;
  partnerMembership: string | null;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messageType: string;
}

export default function Inbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "direct" | "system" | "beacon" | "alerts">("all");

  const loadMessages = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await (supabase.from("messages" as any).select("*") as any)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(200);

      // Load friends
      const { data: f1 } = await supabase.from("friendships").select("user_id_2").eq("user_id_1", user.id);
      const { data: f2 } = await supabase.from("friendships").select("user_id_1").eq("user_id_2", user.id);
      const fIds = new Set([
        ...(f1 || []).map(f => f.user_id_2),
        ...(f2 || []).map(f => f.user_id_1),
      ]);
      setFriendIds(fIds);

      // Enrich with sender profiles
      const profileCache: Record<string, any> = {};
      const enriched: Message[] = [];
      for (const msg of (data || [])) {
        const senderId = msg.sender_id;
        if (senderId && !profileCache[senderId]) {
          const { data: p } = await supabase.from("users_profile").select("first_name, last_name, username, membership_category").eq("id", senderId).single();
          profileCache[senderId] = p;
        }
        const profile = senderId ? profileCache[senderId] : null;
        enriched.push({
          ...msg,
          sender_name: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.username || "User" : "System",
          sender_membership: profile?.membership_category || null,
        });
      }
      setMessages(enriched);
    } catch (err) {
      console.error("Inbox load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMessages(); }, [user]);

  // Build threads
  const threads: Thread[] = (() => {
    const threadMap: Record<string, Thread> = {};
    for (const msg of messages) {
      const isSystem = !msg.sender_id || msg.message_type !== "direct";
      const partnerId = isSystem
        ? `system-${msg.message_type}`
        : (msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id!);

      if (!threadMap[partnerId]) {
        threadMap[partnerId] = {
          partnerId,
          partnerName: isSystem ? getSystemLabel(msg.message_type) : msg.sender_name || "User",
          partnerMembership: isSystem ? null : msg.sender_membership || null,
          lastMessage: msg.content,
          lastTime: msg.created_at,
          unread: 0,
          messageType: msg.message_type,
        };
      }
      if (!msg.is_read && msg.receiver_id === user?.id) {
        threadMap[partnerId].unread++;
      }
    }
    return Object.values(threadMap).sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
  })();

  function getSystemLabel(type: string): string {
    switch (type) {
      case "dining_alert": return "🍽️ Dining Alerts";
      case "event_alert": return "🎪 Event Alerts";
      case "beacon": return "📡 Magic Beacon";
      case "system": return "🔔 System Notifications";
      default: return "📨 Messages";
    }
  }

  function getSystemIcon(type: string) {
    switch (type) {
      case "dining_alert": return UtensilsCrossed;
      case "event_alert": return Sparkles;
      case "beacon": return Radio;
      case "system": return Bell;
      default: return Mail;
    }
  }

  const filteredThreads = threads.filter(t => {
    if (filter === "all") return true;
    if (filter === "direct") return t.messageType === "direct";
    if (filter === "system") return t.messageType === "system";
    if (filter === "beacon") return t.messageType === "beacon";
    if (filter === "alerts") return t.messageType === "dining_alert" || t.messageType === "event_alert";
    return true;
  });

  const threadMessages = activeThread
    ? messages.filter(m => {
        if (activeThread.startsWith("system-")) {
          const type = activeThread.replace("system-", "");
          return m.message_type === type;
        }
        return (m.sender_id === activeThread && m.receiver_id === user?.id)
            || (m.sender_id === user?.id && m.receiver_id === activeThread);
      }).reverse()
    : [];

  const markAsRead = async (threadId: string) => {
    if (!user) return;
    const unreadIds = messages
      .filter(m => !m.is_read && m.receiver_id === user.id && (
        threadId.startsWith("system-")
          ? m.message_type === threadId.replace("system-", "")
          : m.sender_id === threadId
      ))
      .map(m => m.id);

    if (unreadIds.length > 0) {
      for (const id of unreadIds) {
        await (supabase.from("messages" as any).update({ is_read: true }) as any).eq("id", id);
      }
      setMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, is_read: true } : m));
    }
  };

  const openThread = (threadId: string) => {
    setActiveThread(threadId);
    markAsRead(threadId);
  };

  const sendMessage = async () => {
    if (!replyText.trim() || !user || !activeThread || activeThread.startsWith("system-")) return;
    if (!friendIds.has(activeThread)) {
      toast({ title: "You can only message friends", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await (supabase.from("messages" as any).insert({
        sender_id: user.id,
        receiver_id: activeThread,
        content: replyText.trim(),
        message_type: "direct",
      }) as any);
      setReplyText("");
      loadMessages();
    } catch {
      toast({ title: "Failed to send", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const MEMBERSHIP_BADGES: Record<string, { label: string; color: string }> = {
    "Annual Passholder": { label: "🎟️ AP", color: "bg-primary/20 text-primary" },
    "DVC Member": { label: "🏰 DVC", color: "bg-purple-500/20 text-purple-400" },
    "Out of State Traveler": { label: "✈️ Traveler", color: "bg-blue-500/20 text-blue-400" },
  };

  const totalUnread = messages.filter(m => !m.is_read && m.receiver_id === user?.id).length;

  return (
    <DashboardLayout title="📬 Unified Inbox" subtitle={`${totalUnread} unread message${totalUnread !== 1 ? "s" : ""}`}>
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "var(--card)", minHeight: 500 }}>
          <div className="flex h-full" style={{ minHeight: 500 }}>

            {/* Thread list */}
            <div className={`${activeThread ? "hidden md:block" : "block"} w-full md:w-80 border-r border-white/8`}>
              {/* Filter tabs */}
              <div className="flex gap-1 p-2 border-b border-white/8 overflow-x-auto">
                {([
                  { id: "all", label: "All" },
                  { id: "direct", label: "💬 DMs" },
                  { id: "alerts", label: "🔔 Alerts" },
                  { id: "beacon", label: "📡 Beacon" },
                  { id: "system", label: "⚙️ System" },
                ] as const).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      filter === f.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="py-8 text-center">
                  <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="py-12 text-center px-4">
                  <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-semibold text-foreground mb-1">No messages</p>
                  <p className="text-xs text-muted-foreground">Messages from friends, alerts, and beacons appear here</p>
                </div>
              ) : (
                <div className="overflow-y-auto" style={{ maxHeight: 440 }}>
                  {filteredThreads.map(thread => {
                    const Icon = getSystemIcon(thread.messageType);
                    const isActive = activeThread === thread.partnerId;
                    const badge = thread.partnerMembership ? MEMBERSHIP_BADGES[thread.partnerMembership] : null;
                    return (
                      <button
                        key={thread.partnerId}
                        onClick={() => openThread(thread.partnerId)}
                        className={`w-full text-left px-4 py-3 border-b border-white/5 transition-colors ${
                          isActive ? "bg-primary/10" : "hover:bg-white/3"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <p className={`text-sm font-semibold truncate ${thread.unread > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                                  {thread.partnerName}
                                </p>
                                {badge && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${badge.color}`}>{badge.label}</span>}
                              </div>
                              {thread.unread > 0 && (
                                <span className="w-5 h-5 rounded-full bg-primary text-[10px] text-background font-bold flex items-center justify-center shrink-0">
                                  {thread.unread}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{thread.lastMessage}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                              {new Date(thread.lastTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Message view */}
            <div className={`${activeThread ? "block" : "hidden md:block"} flex-1 flex flex-col`}>
              {!activeThread ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Select a conversation</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Thread header */}
                  <div className="px-4 py-3 border-b border-white/8 flex items-center gap-3">
                    <button onClick={() => setActiveThread(null)} className="md:hidden text-primary">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <p className="text-sm font-bold text-foreground">
                      {threads.find(t => t.partnerId === activeThread)?.partnerName || "Messages"}
                    </p>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 380 }}>
                    {threadMessages.map(msg => {
                      const isMine = msg.sender_id === user?.id;
                      const isDiningAlert = msg.message_type === "dining_alert";
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                            isMine
                              ? "bg-primary/20 text-foreground"
                              : "bg-white/5 text-foreground"
                          }`}>
                            <p className="leading-relaxed">{msg.content}</p>
                            {isDiningAlert && msg.reference_id && (
                              <a href={msg.reference_id} target="_blank" rel="noopener noreferrer"
                                className="mt-2 inline-block px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--background)]"
                                style={{ background: "#F0B429" }}>
                                Book Now →
                              </a>
                            )}
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply box (only for direct messages with friends) */}
                  {!activeThread.startsWith("system-") && friendIds.has(activeThread) && (
                    <div className="px-4 py-3 border-t border-white/8 flex gap-2">
                      <input
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                        style={{ background: "var(--muted)" }}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={sending || !replyText.trim()}
                        className="px-4 py-2 rounded-lg font-bold text-sm text-[var(--background)] disabled:opacity-50"
                        style={{ background: "#F0B429" }}
                      >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                  {!activeThread.startsWith("system-") && !friendIds.has(activeThread) && (
                    <div className="px-4 py-3 border-t border-white/8 text-center">
                      <p className="text-xs text-muted-foreground">💡 You can only message friends. Send a friend request first.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
