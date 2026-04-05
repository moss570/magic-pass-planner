import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Castle } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      // Handle PKCE code flow (code in URL params)
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const error = params.get("error");
      const errorDescription = params.get("error_description");

      // Handle OAuth errors
      if (error) {
        console.error("OAuth error:", error, errorDescription);
        navigate("/login?error=" + encodeURIComponent(errorDescription || error));
        return;
      }

      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("Code exchange failed:", exchangeError);
            // Don't redirect to login immediately - session might still be set
          }
        } catch (err) {
          console.error("Exchange error:", err);
        }
      }

      // Check if we have a valid session now (regardless of how we got here)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Success - redirect to intended destination
        const storedRedirect = window.sessionStorage.getItem("magic-pass:post-auth-redirect");
        if (storedRedirect) {
          window.sessionStorage.removeItem("magic-pass:post-auth-redirect");
          navigate(storedRedirect, { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        // No session - check if there are hash params (implicit flow fallback)
        const hash = window.location.hash;
        if (hash && hash.includes("access_token")) {
          // Hash-based token - Supabase should handle this automatically
          setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session: s } }) => {
              if (s) {
                navigate("/dashboard", { replace: true });
              } else {
                navigate("/login");
              }
            });
          }, 500);
        } else {
          navigate("/login");
        }
      }
    };

    handleCallback();
  }, [navigate, location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#080E1E" }}>
      <div className="flex flex-col items-center gap-4">
        <Castle className="w-10 h-10 text-primary animate-pulse" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
