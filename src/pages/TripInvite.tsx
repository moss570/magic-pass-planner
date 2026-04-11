import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Castle, Loader2, CalendarDays, Users, Gift, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";

interface InviteData {
  invite: {
    id: string;
    first_name: string;
    last_name: string;
    invitee_email: string;
    invite_token: string;
    discount_code: string;
    discount_percent: number;
    expires_at: string;
    status: string;
  };
  trip: { name: string; start_date: string | null; end_date: string | null };
  inviterName: string;
}

export default function TripInvite() {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InviteData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!inviteToken) return;
    (async () => {
      try {
        const resp = await fetch(
          `${SUPABASE_URL}/functions/v1/travel-party-invite?action=view&token=${encodeURIComponent(inviteToken)}`,
          { headers: { "Content-Type": "application/json" } },
        );
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          setError(err.error || "Invite not found");
          return;
        }
        setData(await resp.json());
      } catch {
        setError("Failed to load invite");
      } finally {
        setLoading(false);
      }
    })();
  }, [inviteToken]);

  const expired = data?.invite.status === "expired";
  const accepted = data?.invite.status === "accepted";
  const revoked = data?.invite.status === "revoked";
  const isValid = data && !expired && !accepted && !revoked;

  const hoursLeft = data
    ? Math.max(0, Math.round((new Date(data.invite.expires_at).getTime() - Date.now()) / 3600000))
    : 0;

  const formatDate = (d: string | null) =>
    d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, var(--background) 0%, var(--muted) 100%)" }}>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-card gold-border p-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Castle className="w-7 h-7 text-primary" />
              <span className="text-xl font-bold text-primary">Magic Pass Plus</span>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {error && !loading && (
              <div className="text-center space-y-4">
                <p className="text-destructive font-semibold">{error}</p>
                <Button variant="outline" onClick={() => navigate("/signup")}>
                  Create an Account
                </Button>
              </div>
            )}

            {expired && !loading && (
              <div className="text-center space-y-4">
                <div className="text-4xl mb-2">⏰</div>
                <h1 className="text-xl font-bold text-foreground">Invite Expired</h1>
                <p className="text-sm text-muted-foreground">
                  This invite has expired. Ask {data?.inviterName} to send you a new one.
                </p>
                <Button variant="outline" onClick={() => navigate("/signup")}>
                  Sign Up Without Discount
                </Button>
              </div>
            )}

            {(accepted || revoked) && !loading && (
              <div className="text-center space-y-4">
                <div className="text-4xl mb-2">{accepted ? "✅" : "❌"}</div>
                <h1 className="text-xl font-bold text-foreground">
                  {accepted ? "Already Accepted" : "Invite Revoked"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {accepted
                    ? "This invite has already been used."
                    : "This invite has been cancelled."}
                </p>
                <Button variant="outline" onClick={() => navigate("/login")}>
                  Log In
                </Button>
              </div>
            )}

            {isValid && !loading && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="text-4xl mb-3">🏰</div>
                  <h1 className="text-xl font-bold text-foreground">You're Invited!</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong className="text-foreground">{data.inviterName}</strong> wants you to join their trip
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{data.trip.name}</p>
                      {data.trip.start_date && (
                        <p className="text-xs text-muted-foreground">
                          {formatDate(data.trip.start_date)}
                          {data.trip.end_date && ` — ${formatDate(data.trip.end_date)}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-primary/30 p-4 bg-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-primary">Special Welcome Discount</span>
                  </div>
                  <p className="text-sm text-foreground">
                    Get <strong className="text-primary">{data.invite.discount_percent}% off</strong> your
                    first Magic Pass Plus subscription!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Code: <span className="font-mono font-bold text-foreground">{data.invite.discount_code}</span>
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{hoursLeft > 0 ? `${hoursLeft} hours remaining` : "Expires soon"}</span>
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-base font-bold"
                  onClick={() => navigate(`/signup?invite=${inviteToken}`)}
                >
                  Create Your Account
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <button onClick={() => navigate(`/login?invite=${inviteToken}`)} className="text-primary hover:underline font-medium">
                    Log in
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
