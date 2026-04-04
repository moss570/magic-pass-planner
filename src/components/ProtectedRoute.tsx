import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Castle } from "lucide-react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [lastCheckedState, setLastCheckedState] = useState<{
    path: string | null;
    userId: string | null;
  }>({ path: null, userId: null });

  useEffect(() => {
    let isActive = true;

    if (!user) {
      setOnboardingComplete(null);
      setLastCheckedState({ path: location.pathname, userId: null });
      setCheckingOnboarding(false);
      return () => {
        isActive = false;
      };
    }

    setCheckingOnboarding(true);

    supabase
      .from("users_profile")
      .select("onboarding_complete")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isActive) return;

        if (error) {
          console.error("Error checking onboarding status", error);
          setOnboardingComplete(false);
        } else {
          setOnboardingComplete(data?.onboarding_complete ?? false);
        }

        setLastCheckedState({ path: location.pathname, userId: user.id });
        setCheckingOnboarding(false);
      })
      .catch((error) => {
        if (!isActive) return;

        console.error("Error checking onboarding status", error);
        setOnboardingComplete(false);
        setLastCheckedState({ path: location.pathname, userId: user.id });
        setCheckingOnboarding(false);
      });

    return () => {
      isActive = false;
    };
  }, [location.pathname, user?.id]);

  const routeCheckStale =
    lastCheckedState.path !== location.pathname ||
    lastCheckedState.userId !== (user?.id ?? null);

  if (loading || checkingOnboarding || routeCheckStale) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080E1E" }}>
        <div className="flex flex-col items-center gap-4">
          <Castle className="w-10 h-10 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (onboardingComplete && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  if (!onboardingComplete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
