

## Remove 7-Day Free Trial from Subscription Checkout

The `create-checkout` edge function currently adds `trial_period_days: 7` to all subscription checkouts. Removing this single property will make subscriptions start billing immediately.

### Change

**File: `supabase/functions/create-checkout/index.ts`**

Remove the `trial_period_days: 7` line from the `subscription_data` block (around line 135). The subscription metadata will remain, but users will be charged immediately upon subscribing.

```typescript
// Before
sessionParams.subscription_data = {
  trial_period_days: 7,  // ← remove this line
  metadata: { user_id: user.id, plan_name: planName || "" },
};

// After
sessionParams.subscription_data = {
  metadata: { user_id: user.id, plan_name: planName || "" },
};
```

One file, one line removed. The edge function will be redeployed automatically.

