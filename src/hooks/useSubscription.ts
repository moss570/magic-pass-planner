import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Subscription {
  subscribed: boolean;
  status?: string;
  plan_name?: string;
  plan_interval?: string;
  trial_end?: string | null;
  current_period_end?: string | null;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token || !user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        console.error("check-subscription error:", error);
        // Fallback to local table
        const { data: localSub } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (localSub) {
          setSubscription({
            subscribed: localSub.status === "active" || localSub.status === "trialing",
            status: localSub.status,
            plan_name: localSub.plan_name,
            plan_interval: localSub.plan_interval,
            trial_end: localSub.trial_end,
            current_period_end: localSub.current_period_end,
          });
        } else {
          setSubscription(null);
        }
      } else {
        setSubscription(data as Subscription);
      }
    } catch (err) {
      console.error("useSubscription error:", err);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  return { subscription, loading, refresh: checkSubscription };
}
