import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map price IDs to plan names
const PRICE_TO_PLAN: Record<string, string> = {
  "price_1TIFQjHGyELqjZIIWYcXXufY": "Pre-Trip Planner",
  "price_1TIFRRHGyELqjZIIgxUOhMUF": "Pre-Trip Planner",
  "price_1TIFRwHGyELqjZIIy7UMYR2U": "Magic Pass",
  "price_1TIFSLHGyELqjZIIZ8Jw8MP2": "Magic Pass",
  "price_1TIFSwHGyELqjZII9yTjfkYd": "AP Command Center",
  "price_1TIFTMHGyELqjZIIwZqYxeUt": "AP Command Center",
  "price_1TIFTqHGyELqjZII0qpW5oiT": "AP Command Center PLUS",
  "price_1TIFUJHGyELqjZIIs9kh5fxU": "AP Command Center PLUS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("x-client-authorization") ?? req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) throw new Error("Authorization token is empty");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active or trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    });

    const sub = subscriptions.data.find(s => s.status === "active" || s.status === "trialing");

    if (!sub) {
      logStep("No active/trialing subscription found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const priceId = sub.items.data[0]?.price?.id;
    const planName = PRICE_TO_PLAN[priceId] || sub.metadata?.plan_name || "Magic Pass Plan";
    const interval = sub.items.data[0]?.price?.recurring?.interval || "month";

    logStep("Active subscription found", { status: sub.status, planName, priceId });

    // Upsert into subscriptions table
    await supabaseClient.from("subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      plan_name: planName,
      plan_interval: interval === "year" ? "annual" : "monthly",
      status: sub.status,
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return new Response(JSON.stringify({
      subscribed: true,
      status: sub.status,
      plan_name: planName,
      plan_interval: interval,
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
