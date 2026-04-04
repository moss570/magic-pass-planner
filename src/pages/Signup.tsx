import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { Castle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { buildPostAuthRedirect, clearStoredPostAuthRedirect, preparePostAuthRedirect } from "@/lib/authRedirect";

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #080E1E 0%, #0D1230 100%)" }}>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
        <div className="rounded-xl bg-card gold-border p-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Castle className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold text-primary">Magic Pass</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground text-center mb-2">Create your account</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Start your 7-day free trial today
          </p>

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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
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

          <p className="text-center text-xs text-muted-foreground mt-4">
            7-day free trial included. No credit card required.
          </p>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Signup;
