import { useState, useEffect, useRef } from "react";
import { UserPlus, QrCode, Search, Check, X, Users, Mail, Scan, Clock, Shield } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const SUPABASE_ANON = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";

interface Friend {
  id: string; first_name: string; last_name: string; email?: string;
}

interface PendingRequest {
  id: string; from_user_id: string; from_name: string; created_at: string;
}

export default function Friends() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [myQrToken, setMyQrToken] = useState<string>("");
  const [myName, setMyName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"friends" | "add" | "qr">("friends");
  const [addEmail, setAddEmail] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [showMyQR, setShowMyQR] = useState(false);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
    "x-client-authorization": `Bearer ${session?.access_token}`,
    "apikey": SUPABASE_ANON,
  });

  const loadData = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [friendsResp, qrResp] = await Promise.all([
        fetch(`${SUPABASE_URL}/functions/v1/social?action=list-friends`, { headers: getHeaders() }),
        fetch(`${SUPABASE_URL}/functions/v1/social?action=my-qr`, { headers: getHeaders() }),
      ]);
      const friendsData = await friendsResp.json();
      const qrData = await qrResp.json();
      setFriends(friendsData.friends || []);
      setPending(friendsData.pendingRequests || []);
      setMyQrToken(qrData.qrToken || "");
      setMyName(qrData.name || "");
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [session]);

  const addByEmail = async () => {
    if (!addEmail.trim()) return;
    setAddLoading(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/social?action=add-friend`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ email: addEmail.trim() }),
      });
      const data = await resp.json();
      if (data.success) {
        toast({
          title: data.userExists ? "✅ Friend request sent!" : "📧 Invite sent!",
          description: data.userExists ? `Request sent to ${addEmail}` : `Invited ${addEmail} to join Magic Pass Plus`,
        });
        setAddEmail("");
        loadData();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast({ title: "Failed to send request", description: String(err), variant: "destructive" });
    } finally {
      setAddLoading(false);
    }
  };

  const addByQR = async () => {
    if (!qrInput.trim()) return;
    setAddLoading(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/social?action=add-by-qr`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ qrToken: qrInput.trim() }),
      });
      const data = await resp.json();
      if (data.success) {
        toast({ title: `✅ ${data.friend.first_name} ${data.friend.last_name} added as friend!` });
        setQrInput("");
        loadData();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast({ title: "QR code not recognized", description: "Ask your friend to show their Magic Pass QR code", variant: "destructive" });
    } finally {
      setAddLoading(false);
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/social?action=accept-friend`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ requestId }),
      });
      const data = await resp.json();
      if (data.success) {
        toast({ title: "✅ Friend request accepted!" });
        loadData();
      }
    } catch {
      toast({ title: "Failed to accept", variant: "destructive" });
    }
  };

  // Generate a visual QR code using a simple grid pattern based on the token
  const QRDisplay = ({ token, name }: { token: string; name: string }) => {
    const size = 8;
    const cells: boolean[][] = Array(size).fill(null).map((_, r) =>
      Array(size).fill(null).map((_, c) => {
        const idx = (r * size + c) % token.length;
        return token.charCodeAt(idx) % 2 === 0;
      })
    );
    return (
      <div className="text-center">
        <div className="inline-block p-4 bg-white rounded-xl mb-3">
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
            {cells.map((row, r) => row.map((cell, c) => (
              <div key={`${r}-${c}`} className={`w-6 h-6 ${cell ? "bg-black" : "bg-white"}`} />
            )))}
          </div>
        </div>
        <p className="text-sm font-bold text-foreground mb-1">{name}</p>
        <p className="text-xs text-muted-foreground font-mono">{token.substring(0, 8).toUpperCase()}</p>
        <p className="text-xs text-muted-foreground mt-2">Have your friend scan this or enter the code</p>
      </div>
    );
  };

  return (
    <DashboardLayout title="👥 Magic Pass Friends" subtitle="Connect with fellow Disney fans">
      <div className="space-y-5">

        {/* Pending requests */}
        {pending.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs font-bold text-primary mb-3">🔔 {pending.length} Pending Friend Request{pending.length > 1 ? "s" : ""}</p>
            <div className="space-y-2">
              {pending.map(req => (
                <div key={req.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{req.from_name}</p>
                    <p className="text-xs text-muted-foreground">Sent {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => acceptRequest(req.id)}
                      className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/30 transition-colors flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-white/10">
          {[
            { id: "friends", label: `👥 My Friends (${friends.length})` },
            { id: "add", label: "➕ Add Friend" },
            { id: "qr", label: "🏰 My QR Code" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${tab === t.id ? "text-primary border-b-2 border-primary -mb-px" : "text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Friends list */}
        {tab === "friends" && (
          <div>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">No friends yet</p>
                <p className="text-xs text-muted-foreground mb-4">Add friends by email or QR code to plan trips together</p>
                <button onClick={() => setTab("add")}
                  className="px-5 py-2 rounded-xl font-bold text-sm text-[#080E1E]" style={{ background: "#F5C842" }}>
                  Add Your First Friend →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map(friend => (
                  <div key={friend.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/8 hover:border-white/15 transition-colors" style={{ background: "#111827" }}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-sm font-bold text-primary">
                      {friend.first_name?.[0] || "?"}{friend.last_name?.[0] || ""}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{friend.first_name} {friend.last_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Magic Pass friend · Info private
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                        💬 Message
                      </button>
                      <button className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                        🗺️ Plan Day
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add friend */}
        {tab === "add" && (
          <div className="space-y-5">
            {/* Privacy note */}
            <div className="p-4 rounded-xl border border-white/8 bg-white/3">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Your privacy is protected</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Friend requests only share your display name. Email addresses, phone numbers, and personal details are never shared between users. You can remove friends at any time.
                  </p>
                </div>
              </div>
            </div>

            {/* By email */}
            <div className="rounded-xl p-5 border border-white/8" style={{ background: "#111827" }}>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Add by Email</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Enter your friend's email. If they're on Magic Pass Plus, they'll get a friend request. If not, they'll get an invite to join.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={addEmail}
                  onChange={e => setAddEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addByEmail()}
                  placeholder="friend@email.com"
                  className="flex-1 px-3 py-2.5 rounded-lg bg-[#0D1230] border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                  style={{ minHeight: 44 }}
                />
                <button onClick={addByEmail} disabled={addLoading || !addEmail.trim()}
                  className="px-4 py-2.5 rounded-lg font-bold text-sm text-[#080E1E] disabled:opacity-50"
                  style={{ background: "#F5C842" }}>
                  {addLoading ? "..." : "Send"}
                </button>
              </div>
            </div>

            {/* By QR code */}
            <div className="rounded-xl p-5 border border-white/8" style={{ background: "#111827" }}>
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Add by QR Code</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Ask your friend to show their Magic Pass QR code (My QR Code tab), then enter the code below.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value.toUpperCase())}
                  placeholder="Enter friend's code (e.g. A1B2C3D4)"
                  className="flex-1 px-3 py-2.5 rounded-lg bg-[#0D1230] border border-white/10 text-sm text-foreground font-mono tracking-widest focus:outline-none focus:border-primary/40"
                  style={{ minHeight: 44 }}
                  maxLength={32}
                />
                <button onClick={addByQR} disabled={addLoading || !qrInput.trim()}
                  className="px-4 py-2.5 rounded-lg font-bold text-sm text-[#080E1E] disabled:opacity-50"
                  style={{ background: "#F5C842" }}>
                  {addLoading ? "..." : "Add"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 QR scanning coming soon — for now enter the 8-character code from their QR tab
              </p>
            </div>
          </div>
        )}

        {/* My QR code */}
        {tab === "qr" && (
          <div className="rounded-xl p-6 border border-white/8 text-center" style={{ background: "#111827" }}>
            <p className="text-sm font-bold text-foreground mb-1">Your Magic Pass QR Code</p>
            <p className="text-xs text-muted-foreground mb-6">Share this with friends so they can add you instantly. Your personal info stays private.</p>
            {myQrToken ? (
              <QRDisplay token={myQrToken} name={myName} />
            ) : (
              <div className="py-8">
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              </div>
            )}
            <div className="mt-6 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground">Your unique code:</p>
              <p className="text-sm font-mono font-bold text-primary tracking-widest mt-1">
                {myQrToken?.substring(0, 8).toUpperCase() || "Loading..."}
              </p>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
