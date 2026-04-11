
-- Create trip_versions table for up to 3 itinerary versions per trip
CREATE TABLE public.trip_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trip_id UUID NOT NULL REFERENCES public.saved_trips(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number BETWEEN 1 AND 3),
  name TEXT NOT NULL DEFAULT 'Version 1',
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  plans JSONB NOT NULL DEFAULT '[]'::jsonb,
  totals JSONB NOT NULL DEFAULT '{}'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (trip_id, version_number)
);

-- Enforce max 3 versions per trip
CREATE UNIQUE INDEX idx_trip_versions_trip_version ON public.trip_versions (trip_id, version_number);

-- Enable RLS
ALTER TABLE public.trip_versions ENABLE ROW LEVEL SECURITY;

-- User-scoped access
CREATE POLICY "Users manage own trip versions"
  ON public.trip_versions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
