
-- Add category_caps jsonb to saved_trips for per-category budget caps
ALTER TABLE public.saved_trips ADD COLUMN IF NOT EXISTS category_caps jsonb DEFAULT '{}'::jsonb;

-- Add walking_speed_kmh to users_profile for calibrated walking speed
ALTER TABLE public.users_profile ADD COLUMN IF NOT EXISTS walking_speed_kmh numeric DEFAULT NULL;
