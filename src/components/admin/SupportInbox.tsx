/**
 * Support Inbox — Admin Console Tab
 * Read, reply, and manage support@magicpassplus.com
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Send, ArrowLeft, Clock, CheckCircle, AlertCircle, Loader2, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Email {
  id: string;
  message_id: string;
  from_address: string;
  from_name: string | null;
  to_address: string;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  is_outbound: boolean;
  status: "open" | "in_progress" | "resolved" | "sent";
  received_at: string;
}

const STATUS_CONFIG = {
  open: { label: "Open", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Mail },
  in_progress: { label: "In Progress", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  resolved: { label: "Resolved", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
  sent: { label: "Sent", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Send },
};

export default function SupportInbox() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch emails
  const fetchEmails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("support-email", {
        body: { action: "fetch_emails", limit: 100 },
      });

      if (data?.emails) {
        setEmails(data.emails);
      }
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmails(); }, []);

  // Send reply
  const sendReply = async () => {
    if (!selectedEmail || !replyText.trim()) return;
    setSending(true);

    try {
      await supabase.functions.invoke("support-email", {
        body: {
          action: "send_reply",
          to: selectedEmail.from_address,
          subject: selectedEmail.subject,
          body: replyText,
          inReplyTo: selectedEmail.message_id,
        },
      });

      // Update status to resolved
      await updateStatus(selectedEmail.id, "resolved");
      setReplyText("");
      setSelectedEmail(null);
      fetchEmails();
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setSending(false);
    }
  };

  // Update email status
  const updateStatus = async (emailId: string, status: string) => {
    try {
      await supabase.functions.invoke("support-email", {
        body: { action: "update_status", emailId, status },
      });
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, status: status as any } : e));
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Filter emails
  const filteredEmails = emails.filter(e => {
    if (filter !== "all" && e.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.subject.toLowerCase().includes(q) ||
        e.from_address.toLowerCase().includes(q) ||
        e.from_name?.toLowerCase().includes(q) ||
        e.body_text?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // ─── Email Detail View ───────────────────────────────────
  if (selectedEmail) {
    const sc = STATUS_CONFIG[selectedEmail.status];
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedEmail(null)} className="flex items-center gap-2 text-white/50 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Inbox
        </button>

        <div className="bg-[#111827] border border-white/10 rounded-xl p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">{selectedEmail.subject || "(No subject)"}</h3>
              <p className="text-white/40 text-sm">
                From: <span className="text-white/70">{selectedEmail.from_name || selectedEmail.from_address}</span>
              </p>
              <p className="text-white/30 text-xs">{new Date(selectedEmail.received_at).toLocaleString()}</p>
            </div>
            
            {/* Status Toggle */}
            <div className="flex gap-1">
              {(["open", "in_progress", "resolved"] as const).map(s => (
                <button key={s} onClick={() => updateStatus(selectedEmail.id, s)}
                  className={`px-2 py-1 rounded text-[10px] font-bold border ${
                    selectedEmail.status === s ? STATUS_CONFIG[s].color : "bg-white/5 border-white/10 text-white/30"
                  }`}>
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="bg-black/30 rounded-lg p-4 mb-4 max-h-[40vh] overflow-y-auto">
            {selectedEmail.body_html ? (
              <div className="text-white/80 text-sm leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
            ) : (
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedEmail.body_text || "(Empty email)"}
              </p>
            )}
          </div>

          {/* Reply */}
          {!selectedEmail.is_outbound && (
            <div className="border-t border-white/10 pt-4">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Send className="w-4 h-4" /> Reply
              </h4>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                rows={5}
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-yellow-500/50 resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-white/20 text-xs">Sending from: support@magicpassplus.com</p>
                <button onClick={sendReply} disabled={!replyText.trim() || sending}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${
                    replyText.trim() && !sending
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                      : "bg-white/10 text-white/30"
                  }`}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Email List View ─────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-yellow-400" /> Support Inbox
        </h2>
        <button onClick={fetchEmails} disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-sm hover:bg-white/10">
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "open", "in_progress", "resolved"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              filter === f ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400" : "bg-white/5 border-white/10 text-white/40"
            }`}>
            {f === "all" ? "All" : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG].label}
            {f !== "all" && ` (${emails.filter(e => e.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search emails..."
          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-yellow-500/50"
        />
      </div>

      {/* Email List */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-6 h-6 text-white/30 animate-spin mx-auto" />
          <p className="text-white/30 text-sm mt-2">Loading emails...</p>
        </div>
      ) : filteredEmails.length === 0 ? (
        <div className="text-center py-8">
          <Mail className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-white/30 text-sm">
            {emails.length === 0 ? "No emails yet. Inbox is empty." : "No emails match your filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredEmails.map(email => {
            const sc = STATUS_CONFIG[email.status];
            const StatusIcon = sc.icon;
            return (
              <motion.button
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${sc.color} border`}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-semibold text-sm truncate">
                        {email.is_outbound ? `→ ${email.to_address}` : email.from_name || email.from_address}
                      </p>
                      <span className="text-white/30 text-xs flex-shrink-0 ml-2">{formatDate(email.received_at)}</span>
                    </div>
                    <p className="text-white/60 text-xs truncate">{email.subject || "(No subject)"}</p>
                    <p className="text-white/30 text-xs truncate mt-0.5">
                      {email.body_text?.slice(0, 80) || "(No preview)"}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="flex justify-center gap-4 pt-2 border-t border-white/10">
        <span className="text-white/20 text-xs">{emails.length} total</span>
        <span className="text-blue-400/50 text-xs">{emails.filter(e => e.status === "open").length} open</span>
        <span className="text-yellow-400/50 text-xs">{emails.filter(e => e.status === "in_progress").length} in progress</span>
        <span className="text-green-400/50 text-xs">{emails.filter(e => e.status === "resolved").length} resolved</span>
      </div>
    </div>
  );
}
