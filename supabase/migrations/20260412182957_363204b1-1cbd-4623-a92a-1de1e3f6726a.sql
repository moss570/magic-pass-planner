-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trip activity log for GPS tracking and adaptive scheduling
CREATE TABLE public.trip_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trip_id UUID REFERENCES public.saved_trips(id) ON DELETE CASCADE NOT NULL,
  day_index INTEGER NOT NULL DEFAULT 0,
  day_status TEXT NOT NULL DEFAULT 'planning' CHECK (day_status IN ('planning', 'active', 'completed')),
  location TEXT NOT NULL,
  park TEXT,
  land TEXT,
  planned_start_time TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  departed_at TIMESTAMPTZ,
  actual_wait_minutes INTEGER,
  actual_ride_minutes INTEGER,
  planned_wait_minutes INTEGER,
  planned_ride_minutes INTEGER,
  activity_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_activity_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own activity logs
CREATE POLICY "Users can view own activity logs"
  ON public.trip_activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activity logs"
  ON public.trip_activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity logs"
  ON public.trip_activity_log FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity logs"
  ON public.trip_activity_log FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for fast lookups
CREATE INDEX idx_trip_activity_log_trip ON public.trip_activity_log(trip_id, day_index);
CREATE INDEX idx_trip_activity_log_user ON public.trip_activity_log(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_trip_activity_log_updated_at
  BEFORE UPDATE ON public.trip_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();