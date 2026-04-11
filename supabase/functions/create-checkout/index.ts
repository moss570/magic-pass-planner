import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      });
    }

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

    const rawBody = await req.text();
    logStep("Raw request body", { length: rawBody.length, body: rawBody.substring(0, 200) });

    if (!rawBody || rawBody.trim().length === 0) {
      throw new Error("Request body is empty. Expected JSON with priceId.");
    }

    let parsed: { priceId?: string; planName?: string; discountCode?: string };
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new Error(`Invalid JSON in request body: ${rawBody.substring(0, 100)}`);
    }

    const { priceId, planName, discountCode } = parsed;
    if (!priceId) throw new Error("priceId is required");
    logStep("Checkout request", { priceId, planName, discountCode: discountCode || "none" });

    // Determine if this is a one-time purchase (no interval) based on plan name
    const oneTimePlans = ['ninety_day_planner', 'ninety_day_friend', '90 Day Magic Pass Planner', '90 Day Magic Pass Friend'];
    const isOneTime = oneTimePlans.includes(planName || '');

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find or reference existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    }

    // Resolve discount code to Stripe coupon if provided
    let stripeCouponId: string | undefined;
    if (discountCode) {
      // Look up in discount_codes table
      const { data: dc } = await supabaseAdmin
        .from("discount_codes")
        .select("*")
        .eq("code", discountCode)
        .eq("user_id", user.id)
        .is("used_at", null)
        .single();

      if (dc) {
        // Check expiry
        if (new Date(dc.expires_at) > new Date()) {
          // Create or reuse Stripe coupon
          if (dc.stripe_coupon_id) {
            stripeCouponId = dc.stripe_coupon_id;
          } else {
            const coupon = await stripe.coupons.create({
              percent_off: dc.percent_off,
              duration: "once",
              name: `Travel Party Invite - ${dc.percent_off}% off`,
            });
            stripeCouponId = coupon.id;
            // Save back the Stripe coupon ID
            await supabaseAdmin
              .from("discount_codes")
              .update({ stripe_coupon_id: coupon.id })
              .eq("id", dc.id);
          }
          // Mark as used
          await supabaseAdmin
            .from("discount_codes")
            .update({ used_at: new Date().toISOString() })
            .eq("id", dc.id);
          logStep("Discount applied", { code: discountCode, couponId: stripeCouponId });
        } else {
          logStep("Discount expired", { code: discountCode });
        }
      } else {
        logStep("Discount code not found or already used", { code: discountCode });
      }
    }

    // Also check for any unused discount code for this user (auto-apply)
    if (!stripeCouponId) {
      const { data: pendingDc } = await supabaseAdmin
        .from("discount_codes")
        .select("*")
        .eq("user_id", user.id)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .single();

      if (pendingDc) {
        if (pendingDc.stripe_coupon_id) {
          stripeCouponId = pendingDc.stripe_coupon_id;
        } else {
          const coupon = await stripe.coupons.create({
            percent_off: pendingDc.percent_off,
            duration: "once",
            name: `Travel Party Invite - ${pendingDc.percent_off}% off`,
          });
          stripeCouponId = coupon.id;
          await supabaseAdmin
            .from("discount_codes")
            .update({ stripe_coupon_id: coupon.id })
            .eq("id", pendingDc.id);
        }
        await supabaseAdmin
          .from("discount_codes")
          .update({ used_at: new Date().toISOString() })
          .eq("id", pendingDc.id);
        logStep("Auto-applied pending discount", { couponId: stripeCouponId });
      }
    }

    const origin = req.headers.get("origin") || "https://magicpassplus.com";

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isOneTime ? "payment" : "subscription",
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        user_id: user.id,
        plan_name: planName || "",
      },
    };

    if (!isOneTime) {
      sessionParams.subscription_data = {
        trial_period_days: 7,
        metadata: {
          user_id: user.id,
          plan_name: planName || "",
        },
      };
    }

    if (stripeCouponId) {
      sessionParams.discounts = [{ coupon: stripeCouponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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
