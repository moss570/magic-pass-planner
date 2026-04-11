import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_ACCESS, type PlanAccess } from "@/lib/planFeatures";
import type { PlanId } from "@/lib/stripe";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbmVsaHJtZ3NwdXp0ZWhldHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzcyNzgsImV4cCI6MjA5MDgxMzI3OH0.vjT4Iun32HsCfoO7nVnfzLBnJy-Lye6N9ZryBbWuAjo";

function mapStripePlanNameToPlanId(planName: string | null | undefined): PlanId {
  if (!planName) return 'free';
  const map: Record<string, PlanId> = {
    'free': 'free',
    'ninety_day_planner': 'ninety_day_planner',
    '90 Day Magic Pass Planner': 'ninety_day_planner',
    'ninety_day_friend': 'ninety_day_friend',
    '90 Day Magic Pass Friend': 'ninety_day_friend',
    'magic_pass_planner': 'magic_pass_planner',
    'Magic Pass Planner': 'magic_pass_planner',
    'magic_pass_plus': 'magic_pass_plus',
    'Magic Pass Plus': 'magic_pass_plus',
    'founders_pass': 'founders_pass',
    'Magic Pass Plus FOUNDERS PASS': 'founders_pass',
    // Legacy plan names — backward compat
    'Pre-Trip Planner': 'free',
    'Magic Pass': 'magic_pass_planner',
    'AP Command Center': 'magic_pass_planner',
    'AP Command Center PLUS': 'magic_pass_plus',
  };
  return map[planName] ?? 'free';
}

export interface Subscription {
  subscribed: boolean;
  status?: string;
  plan_name?: string;
  plan_interval?: string;
  trial_end?: string | null;
  current_period_end?: string | null;
}

export interface SubscriptionState {
  loading: boolean;
  subscription: Subscription | null;
  subscribed: boolean;
  planId: PlanId;
  planName: string | null;
  billingInterval: 'monthly' | 'annual' | 'one_time' | null;
  trialEnd: string | null;
  periodEnd: string | null;
  access: PlanAccess;
  refresh: () => void;
}

export function useSubscription(): SubscriptionState {
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
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      const token = freshSession?.access_token ?? session.access_token;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/check-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-client-authorization": `Bearer ${token}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        setSubscription(data as Subscription);
      } else {
        console.error("check-subscription failed:", res.status);
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

  const planId = mapStripePlanNameToPlanId(subscription?.plan_name);
  const access = PLAN_ACCESS[planId];

  const billingInterval = subscription?.plan_interval === 'annual' ? 'annual' as const
    : subscription?.plan_interval === 'monthly' ? 'monthly' as const
    : subscription?.plan_interval === 'one_time' ? 'one_time' as const
    : null;

  return {
    loading,
    subscription,
    subscribed: subscription?.subscribed ?? false,
    planId,
    planName: subscription?.plan_name ?? null,
    billingInterval,
    trialEnd: subscription?.trial_end ?? null,
    periodEnd: subscription?.current_period_end ?? null,
    access,
    refresh: checkSubscription,
  };
}
