
CREATE INDEX IF NOT EXISTS idx_notifications_pending_retry
  ON public.dining_notifications(sent_at)
  WHERE sent_at IS NULL AND retry_count < 5;

CREATE INDEX IF NOT EXISTS idx_dining_alerts_last_checked
  ON public.dining_alerts(last_checked_at NULLS FIRST)
  WHERE status = 'watching';
