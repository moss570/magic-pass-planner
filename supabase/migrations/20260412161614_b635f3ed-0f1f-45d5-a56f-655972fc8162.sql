-- Link Andi's VIP record to her user_id
UPDATE public.vip_accounts
SET user_id = 'ad8a8cd8-3481-40f8-88ac-5de003518b48',
    status = 'active',
    invite_accepted_at = now(),
    updated_at = now()
WHERE email = 'adavidoffmoss@gmail.com';

-- Create subscription for Andi (VIP Free Forever)
INSERT INTO public.subscriptions (user_id, stripe_customer_id, stripe_subscription_id, plan_name, status, current_period_end, updated_at)
VALUES ('ad8a8cd8-3481-40f8-88ac-5de003518b48', 'vip_free_forever', 'vip_ad8a8cd8-3481-40f8-88ac-5de003518b48', 'magic_pass_plus', 'active', '2099-12-31T23:59:59Z', now())
ON CONFLICT (user_id) DO UPDATE SET
  plan_name = 'magic_pass_plus',
  status = 'active',
  stripe_customer_id = 'vip_free_forever',
  stripe_subscription_id = 'vip_ad8a8cd8-3481-40f8-88ac-5de003518b48',
  current_period_end = '2099-12-31T23:59:59Z',
  updated_at = now();

-- Fix legacy plan names: AP Command Center PLUS -> magic_pass_plus
UPDATE public.subscriptions
SET plan_name = 'magic_pass_plus', updated_at = now()
WHERE plan_name = 'AP Command Center PLUS';

-- Fix legacy plan names: AP Command Center -> magic_pass_planner
UPDATE public.subscriptions
SET plan_name = 'magic_pass_planner', updated_at = now()
WHERE plan_name = 'AP Command Center';

-- Fix legacy plan names: Magic Pass -> magic_pass_planner
UPDATE public.subscriptions
SET plan_name = 'magic_pass_planner', updated_at = now()
WHERE plan_name = 'Magic Pass';

-- Fix legacy plan names: Pre-Trip Planner -> free
UPDATE public.subscriptions
SET plan_name = 'free', updated_at = now()
WHERE plan_name = 'Pre-Trip Planner';

-- Also fix moss570's VIP subscription to use correct plan name
UPDATE public.subscriptions
SET plan_name = 'magic_pass_plus', updated_at = now()
WHERE stripe_customer_id = 'vip_free_forever' AND plan_name != 'magic_pass_plus';