
ALTER TABLE public.users_profile ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.users_profile ADD COLUMN IF NOT EXISTS membership_category TEXT DEFAULT 'Annual Passholder';
