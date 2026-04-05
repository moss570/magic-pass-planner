import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbmVsaHJtZ3NwdXp0ZWhldHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzcyNzgsImV4cCI6MjA5MDgxMzI3OH0.vjT4Iun32HsCfoO7nVnfzLBnJy-Lye6N9ZryBbWuAjo";

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
    if (!session || !user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/check-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "x-client-authorization": `Bearer ${session.access_token}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        setSubscription(data as Subscription);
      } else {
        console.error("check-subscription failed:", res.status);
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
      }
    } catch (err) {
      console.error("useSubscription error:", err);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [session, user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  return { subscription, loading, refresh: checkSubscription };
}
