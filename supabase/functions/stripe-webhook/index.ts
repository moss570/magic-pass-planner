import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

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

const PRICE_TO_INTERVAL: Record<string, string> = {
  "price_1TIFQjHGyELqjZIIWYcXXufY": "monthly",
  "price_1TIFRRHGyELqjZIIgxUOhMUF": "annual",
  "price_1TIFRwHGyELqjZIIy7UMYR2U": "monthly",
  "price_1TIFSLHGyELqjZIIZ8Jw8MP2": "annual",
  "price_1TIFSwHGyELqjZII9yTjfkYd": "monthly",
  "price_1TIFTMHGyELqjZIIwZqYxeUt": "annual",
  "price_1TIFTqHGyELqjZII0qpW5oiT": "monthly",
  "price_1TIFUJHGyELqjZIIs9kh5fxU": "annual",
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    logStep("ERROR", { message: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET" });
    return new Response("Server misconfigured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    logStep("ERROR", { message: "No stripe-signature header" });
    return new Response("No signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("Signature verification failed", { message: msg });
    return new Response(`Webhook signature verification failed: ${msg}`, { status: 400 });
  }

  logStep("Event received", { type: event.type, id: event.id });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    logStep("Checkout session completed", { sessionId: session.id, customerId: session.customer, subscriptionId: session.subscription });

    const userId = session.metadata?.user_id || session.subscription_data?.metadata?.user_id;
    if (!userId) {
      // Try to find user by email
      const customerEmail = session.customer_details?.email || session.customer_email;
      if (!customerEmail) {
        logStep("ERROR", { message: "No user_id in metadata and no email to look up" });
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const { data: users } = await supabaseClient.auth.admin.listUsers();
      const matchedUser = users?.users?.find(u => u.email === customerEmail);
      if (!matchedUser) {
        logStep("ERROR", { message: `No Supabase user found for email: ${customerEmail}` });
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      await upsertSubscription(supabaseClient, stripe, matchedUser.id, session);
    } else {
      await upsertSubscription(supabaseClient, stripe, userId, session);
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    logStep("Subscription event", { type: event.type, subId: subscription.id, status: subscription.status });

    // Find user by subscription metadata or customer email
    const userId = subscription.metadata?.user_id;
    if (userId) {
      await upsertFromSubscription(supabaseClient, subscription, userId);
    } else {
      // Look up by stripe_subscription_id in our table
      const { data: existingSub } = await supabaseClient
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", subscription.id)
        .maybeSingle();
      
      if (existingSub?.user_id) {
        await upsertFromSubscription(supabaseClient, subscription, existingSub.user_id);
      } else {
        logStep("Could not find user for subscription", { subId: subscription.id });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});

async function upsertSubscription(supabaseClient: any, stripe: Stripe, userId: string, session: Stripe.Checkout.Session) {
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    logStep("No subscription ID in session");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await upsertFromSubscription(supabaseClient, subscription, userId);
}

async function upsertFromSubscription(supabaseClient: any, subscription: Stripe.Subscription, userId: string) {
  const priceId = subscription.items.data[0]?.price?.id;
  const planName = PRICE_TO_PLAN[priceId] || subscription.metadata?.plan_name || "Unknown Plan";
  const planInterval = PRICE_TO_INTERVAL[priceId] || (subscription.items.data[0]?.price?.recurring?.interval === "year" ? "annual" : "monthly");

  const row = {
    user_id: userId,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    plan_name: planName,
    plan_interval: planInterval,
    status: subscription.status,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  logStep("Upserting subscription", row);
  const { error } = await supabaseClient.from("subscriptions").upsert(row, { onConflict: "user_id" });
  if (error) {
    logStep("ERROR upserting subscription", { message: error.message });
  } else {
    logStep("Subscription upserted successfully");
  }
}
