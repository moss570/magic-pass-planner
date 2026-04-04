import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { resolvePostAuthRedirect } from "@/lib/authRedirect";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const redirectHandledRef = useRef(false);

  useEffect(() => {
    const handlePostAuthRedirect = (event: string, nextSession: Session | null) => {
      if (!nextSession || redirectHandledRef.current || typeof window === "undefined") return;
      if (event !== "SIGNED_IN" && event !== "INITIAL_SESSION") return;

      const redirectTo = resolvePostAuthRedirect(window.location.search);
      if (!redirectTo) return;

      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (currentPath === redirectTo) return;

      redirectHandledRef.current = true;
      window.location.replace(redirectTo);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!nextSession) {
        redirectHandledRef.current = false;
      }

      setSession(nextSession);
      setLoading(false);
      handlePostAuthRedirect(event, nextSession);
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
      handlePostAuthRedirect("INITIAL_SESSION", currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
