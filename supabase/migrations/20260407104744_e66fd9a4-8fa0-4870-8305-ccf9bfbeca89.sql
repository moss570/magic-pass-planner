ALTER TABLE public.dining_alerts
  ADD COLUMN priority_launch boolean NOT NULL DEFAULT false,
  ADD COLUMN window_opens_at timestamptz NULL;

CREATE INDEX idx_dining_alerts_priority ON public.dining_alerts (priority_launch, window_opens_at)
  WHERE priority_launch = true AND status = 'watching';