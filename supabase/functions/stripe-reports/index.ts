import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = ["moss570@gmail.com", "brandon@discountmikeblinds.net"];
const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

async function stripeGet(path: string) {
  const resp = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { "Authorization": `Bearer ${STRIPE_KEY}` },
  });
  return resp.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("x-client-authorization") ?? req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user || !ADMIN_EMAILS.includes(userData.user.email || "")) {
      throw new Error("Admin access required");
    }

    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "month"; // day, week, month, year

    // Calculate date ranges
    const now = Math.floor(Date.now() / 1000);
    const ranges: Record<string, number> = {
      day: now - 86400,
      week: now - 604800,
      month: now - 2592000,
      year: now - 31536000,
    };
    const since = ranges[period] || ranges.month;

    // Fetch Stripe data in parallel
    const [chargesData, payoutsData, balanceData, refundsData, subscriptionsData] = await Promise.all([
      stripeGet(`charges?limit=100&created[gte]=${since}`),
      stripeGet(`payouts?limit=20&arrival_date[gte]=${since}`),
      stripeGet(`balance`),
      stripeGet(`refunds?limit=20&created[gte]=${since}`),
      stripeGet(`subscriptions?limit=100&status=active`),
    ]);

    // Process charges
    const charges = chargesData.data || [];
    const successfulCharges = charges.filter((c: any) => c.paid && !c.refunded);
    const grossRevenue = successfulCharges.reduce((sum: number, c: any) => sum + c.amount, 0) / 100;
    const stripeFees = successfulCharges.reduce((sum: number, c: any) => sum + (c.application_fee_amount || 0), 0) / 100;
    const processingFees = successfulCharges.reduce((sum: number, c: any) => {
      // Stripe fee: 2.9% + $0.30 per charge
      return sum + Math.round(c.amount * 0.029 + 30);
    }, 0) / 100;
    const netRevenue = grossRevenue - processingFees;

    // Process refunds
    const refunds = refundsData.data || [];
    const totalRefunds = refunds.reduce((sum: number, r: any) => sum + r.amount, 0) / 100;

    // Process payouts (what went to your bank)
    const payouts = payoutsData.data || [];
    const totalPayouts = payouts.filter((p: any) => p.status === "paid").reduce((sum: number, p: any) => sum + p.amount, 0) / 100;
    const pendingPayouts = payouts.filter((p: any) => p.status === "pending" || p.status === "in_transit").reduce((sum: number, p: any) => sum + p.amount, 0) / 100;

    // Balance
    const available = (balanceData.available || []).reduce((sum: number, b: any) => sum + b.amount, 0) / 100;
    const pending = (balanceData.pending || []).reduce((sum: number, b: any) => sum + b.amount, 0) / 100;

    // Active subscriptions MRR
    const activeSubs = subscriptionsData.data || [];
    const mrr = activeSubs.reduce((sum: number, s: any) => {
      const amount = s.items?.data?.[0]?.price?.unit_amount || 0;
      const interval = s.items?.data?.[0]?.price?.recurring?.interval;
      const monthly = interval === "year" ? amount / 12 : amount;
      return sum + monthly;
    }, 0) / 100;

    // Build charge breakdown by plan
    const planBreakdown: Record<string, { count: number; revenue: number }> = {};
    successfulCharges.forEach((c: any) => {
      const desc = c.description || c.metadata?.plan_name || "Other";
      if (!planBreakdown[desc]) planBreakdown[desc] = { count: 0, revenue: 0 };
      planBreakdown[desc].count++;
      planBreakdown[desc].revenue += c.amount / 100;
    });

    // Recent transactions list
    const recentTransactions = charges.slice(0, 20).map((c: any) => ({
      id: c.id,
      amount: c.amount / 100,
      currency: c.currency.toUpperCase(),
      status: c.paid ? (c.refunded ? "refunded" : "paid") : "failed",
      description: c.description || "Subscription",
      email: c.billing_details?.email || c.metadata?.email || "",
      date: new Date(c.created * 1000).toISOString().split("T")[0],
      fee: Math.round(c.amount * 0.029 + 30) / 100,
      net: (c.amount - Math.round(c.amount * 0.029 + 30)) / 100,
    }));

    // Payout schedule
    const upcomingPayouts = payouts.slice(0, 5).map((p: any) => ({
      id: p.id,
      amount: p.amount / 100,
      status: p.status,
      arrivalDate: new Date(p.arrival_date * 1000).toISOString().split("T")[0],
      description: p.description || "Automatic payout",
    }));

    return new Response(JSON.stringify({
      period,
      summary: {
        grossRevenue,
        processingFees,
        netRevenue,
        totalRefunds,
        netAfterRefunds: netRevenue - totalRefunds,
        totalPayouts,
        pendingPayouts,
        availableBalance: available,
        pendingBalance: pending,
        activeSubscriptions: activeSubs.length,
        estimatedMRR: mrr,
        chargeCount: successfulCharges.length,
        averageChargeValue: successfulCharges.length > 0 ? grossRevenue / successfulCharges.length : 0,
      },
      planBreakdown,
      recentTransactions,
      upcomingPayouts,
      stripeMode: STRIPE_KEY.startsWith("sk_live") ? "LIVE" : "TEST",
      generatedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
