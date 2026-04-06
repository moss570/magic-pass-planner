-- ============================================================
-- Fix notification delivery pipeline
-- 1. Change sent_at default to NULL (not now()) so unsent notifications are trackable
-- 2. Add delivery tracking columns
-- 3. Add retry support
-- 4. Add phone column to users_profile if missing
-- 5. Add index for retry query
-- ============================================================

-- Fix sent_at default — notifications should start as unsent
ALTER TABLE public.dining_notifications
  ALTER COLUMN sent_at SET DEFAULT NULL;

-- Add delivery tracking columns
ALTER TABLE public.dining_notifications
  ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'delivered', 'partial_failure', 'failed')),
  ADD COLUMN IF NOT EXISTS delivery_details jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;

-- Ensure users_profile has a phone column for SMS alerts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users_profile'
      AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.users_profile ADD COLUMN phone text;
  END IF;
END $$;

-- Index for finding unsent notifications that need retry
CREATE INDEX IF NOT EXISTS idx_notifications_pending_retry
  ON public.dining_notifications(created_at)
  WHERE sent_at IS NULL AND retry_count < 5;

-- Index for faster alert checking (alerts not recently checked)
CREATE INDEX IF NOT EXISTS idx_dining_alerts_last_checked
  ON public.dining_alerts(last_checked_at NULLS FIRST)
  WHERE status = 'watching';

-- Update any existing notifications that were logged with sent_at = now()
-- but never actually sent (no delivery_details)
UPDATE public.dining_notifications
SET sent_at = NULL, delivery_status = 'pending'
WHERE delivery_details IS NULL OR delivery_details = '[]'::jsonb;
