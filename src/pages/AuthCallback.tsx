import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Castle } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("OAuth code exchange failed:", error);
          navigate("/login");
          return;
        }
      }

      // Check sessionStorage for stored redirect
      const storedRedirect = window.sessionStorage.getItem("magic-pass:post-auth-redirect");
      if (storedRedirect) {
        window.sessionStorage.removeItem("magic-pass:post-auth-redirect");
        navigate(storedRedirect, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    };

    handleCallback();
  }, [navigate, location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#080E1E" }}>
      <div className="flex flex-col items-center gap-4">
        <Castle className="w-10 h-10 text-primary animate-pulse" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
