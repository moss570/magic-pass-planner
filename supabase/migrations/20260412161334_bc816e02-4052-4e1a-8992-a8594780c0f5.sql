ALTER TABLE public.vip_accounts
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'vip'
  CHECK (type IN ('vip', 'beta_tester'));