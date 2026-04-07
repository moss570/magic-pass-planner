
-- ==============================================
-- EVENT ALERTS TABLE
-- ==============================================
CREATE TABLE public.event_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_name text NOT NULL,
  event_url text NOT NULL,
  alert_date date NOT NULL,
  party_size integer NOT NULL DEFAULT 2,
  preferred_time text DEFAULT 'Any',
  alert_email boolean DEFAULT true,
  alert_sms boolean DEFAULT false,
  status text DEFAULT 'watching',
  priority_launch boolean NOT NULL DEFAULT false,
  window_opens_at timestamptz,
  last_checked_at timestamptz,
  check_count integer DEFAULT 0,
  availability_found_at timestamptz,
  availability_url text,
  found_times text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.event_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own event alerts"
  ON public.event_alerts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_event_alerts_status ON public.event_alerts (status, last_checked_at);
CREATE INDEX idx_event_alerts_priority ON public.event_alerts (priority_launch, window_opens_at) WHERE priority_launch = true;

-- ==============================================
-- EVENT NOTIFICATIONS TABLE
-- ==============================================
CREATE TABLE public.event_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id uuid REFERENCES public.event_alerts(id) ON DELETE CASCADE,
  user_id uuid,
  event_name text,
  alert_date date,
  party_size integer,
  availability_url text,
  notification_type text,
  sent_at timestamptz,
  delivery_status text DEFAULT 'pending',
  delivery_details jsonb DEFAULT '[]'::jsonb,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own event notifications"
  ON public.event_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_event_notifications_pending ON public.event_notifications (delivery_status) WHERE delivery_status = 'pending';
