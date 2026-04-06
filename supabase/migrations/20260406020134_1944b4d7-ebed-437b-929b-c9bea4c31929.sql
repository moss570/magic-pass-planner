
ALTER TABLE public.dining_notifications
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
