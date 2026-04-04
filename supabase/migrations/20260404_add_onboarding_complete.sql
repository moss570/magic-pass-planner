ALTER TABLE public.users_profile
ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;
