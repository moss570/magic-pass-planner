ALTER TABLE public.vip_accounts ADD COLUMN IF NOT EXISTS enroll_token TEXT;
ALTER TABLE public.vip_accounts ADD COLUMN IF NOT EXISTS enroll_type TEXT;