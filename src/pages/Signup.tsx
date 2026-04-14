import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Footer from "@/components/Footer";
import { Castle, Loader2, Gift, Sparkles, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { buildPostAuthRedirect, clearStoredPostAuthRedirect, preparePostAuthRedirect } from "@/lib/authRedirect";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";

const ENROLL_BANNERS: Record<string, { icon: React.ReactNode; text: string; color: string }> = {
  beta_tester: { icon: <Beaker className="w-4 h-4 shrink-0" />, text: "You've been invited as a Beta Tester! Full access for 1 year.", color: "bg-purple-500/10 border-purple-500/30 text-purple-400" },
  vip: { icon: <Gift className="w-4 h-4 shrink-0" />, text: "You've been invited as a VIP Member — Free Forever!", color: "bg-primary/10 border-primary/30 text-primary" },
  free_month: { icon: <Sparkles className="w-4 h-4 shrink-0" />, text: "You've got one free month of Magic Pass Plus!", color: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
};

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const enrollToken = searchParams.get("enroll");
  const enrollType = searchParams.get("type") || "vip";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Store invite token for post-signup acceptance
  useEffect(() => {
    if (inviteToken) {
      localStorage.setItem("mpp:pending-invite", inviteToken);
    }
    if (enrollToken) {
      localStorage.setItem("mpp:pending-enroll", enrollToken);
      localStorage.setItem("mpp:pending-enroll-type", enrollType);
    }
  }, [inviteToken, enrollToken, enrollType]);

  const acceptInviteAfterSignup = async (accessToken: string) => {
    const pendingInvite = localStorage.getItem("mpp:pending-invite");
    if (!pendingInvite) return;
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/travel-party-accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "x-client-authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ inviteToken: pendingInvite }),
      });
      localStorage.removeItem("mpp:pending-invite");
    } catch {
      // Non-critical — user can accept later
    }
  };

  const acceptEnrollAfterSignup = async () => {
    const pendingEnroll = localStorage.getItem("mpp:pending-enroll");
    if (!pendingEnroll) return;
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/vip-invite?action=accept-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enroll_token: pendingEnroll }),
      });
      localStorage.removeItem("mpp:pending-enroll");
      localStorage.removeItem("mpp:pending-enroll-type");
    } catch {
      // Non-critical
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const postAuthRedirect = buildPostAuthRedirect(location.search);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}${postAuthRedirect}` },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      await acceptInviteAfterSignup(data.session.access_token);
      await acceptEnrollAfterSignup();
      navigate(postAuthRedirect);
    } else {
      setSuccess("Check your email to confirm your account.");
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setGoogleLoading(true);
    const postAuthRedirect = preparePostAuthRedirect(location.search);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${postAuthRedirect}` },
    });
    if (error) {
      clearStoredPostAuthRedirect();
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const enrollBanner = enrollToken ? ENROLL_BANNERS[enrollType] || ENROLL_BANNERS.vip : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, var(--background) 0%, var(--muted) 100%)" }}>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
        <div className="rounded-xl bg-card gold-border p-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Castle className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold text-primary">Magic Pass</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground text-center mb-2">Create your account</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            {enrollToken ? "Complete your signup to activate your invite" : "Start your 7-day free trial today"}
          </p>

          {enrollBanner && (
            <div className={`mb-4 rounded-lg border px-4 py-3 flex items-center gap-2 ${enrollBanner.color}`}>
              {enrollBanner.icon}
              <p className="text-sm font-medium">{enrollBanner.text}</p>
            </div>
          )}

          {!enrollToken && inviteToken && (
            <div className="mb-4 rounded-lg bg-primary/10 border border-primary/30 px-4 py-3 flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary shrink-0" />
              <p className="text-sm text-primary font-medium">
                You've been invited! Your discount will be applied automatically.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-400">
              {success}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSignup}>
            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg h-11"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : enrollToken ? "Create Account & Activate" : "Create Account"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs text-muted-foreground">
              <span className="bg-card px-3">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            disabled={googleLoading}
            onClick={handleGoogleSignup}
            className="w-full border-border text-foreground hover:bg-muted rounded-lg h-11 font-medium"
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue with Google"}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to={`/login${location.search}`} className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </p>

          {!enrollToken && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              7-day free trial included. No credit card required.
            </p>
          )}
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Signup;
