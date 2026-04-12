ALTER TABLE public.users_profile
  ADD COLUMN IF NOT EXISTS default_trip_mode text DEFAULT 'vacation',
  ADD COLUMN IF NOT EXISTS default_party_adults integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS default_party_children integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_ride_preference text DEFAULT 'mix',
  ADD COLUMN IF NOT EXISTS default_ll_option text DEFAULT 'multi';