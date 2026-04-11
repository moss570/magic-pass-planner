
-- 1. Add forwarding_token columns to users_profile
ALTER TABLE public.users_profile
  ADD COLUMN IF NOT EXISTS forwarding_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS forwarding_token_rotated_at timestamptz,
  ADD COLUMN IF NOT EXISTS trusted_senders jsonb DEFAULT '[]'::jsonb;

-- 2. Function to generate random 16-char URL-safe token
CREATE OR REPLACE FUNCTION public.generate_forwarding_token()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT string_agg(
    substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', ceil(random() * 64)::int, 1),
    ''
  )
  FROM generate_series(1, 16)
$$;

-- 3. Backfill existing users
UPDATE public.users_profile
SET forwarding_token = public.generate_forwarding_token()
WHERE forwarding_token IS NULL;

-- 4. Trigger to auto-generate token on new user profile creation
CREATE OR REPLACE FUNCTION public.set_forwarding_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.forwarding_token IS NULL THEN
    NEW.forwarding_token := public.generate_forwarding_token();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_forwarding_token
  BEFORE INSERT ON public.users_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.set_forwarding_token();

-- 5. reservations_inbox table
CREATE TABLE public.reservations_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trip_id uuid REFERENCES public.saved_trips(id),
  source text NOT NULL DEFAULT 'manual_paste',
  raw_content text,
  parsed jsonb,
  type text,
  status text NOT NULL DEFAULT 'pending_review',
  confirmation_number text,
  sender_email text,
  attachments jsonb DEFAULT '[]'::jsonb,
  reviewed_by_user_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reservations_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reservations"
  ON public.reservations_inbox FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. inbound_email_events table
CREATE TABLE public.inbound_email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  raw_to text,
  raw_from text,
  subject text,
  message_id text UNIQUE,
  s3_key text,
  processed_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'accepted',
  reject_reason text,
  reservation_id uuid REFERENCES public.reservations_inbox(id)
);

ALTER TABLE public.inbound_email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage inbound_email_events"
  ON public.inbound_email_events FOR ALL
  TO public
  USING ((auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com', 'brandon@discountmikeblinds.net']))
  WITH CHECK ((auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com', 'brandon@discountmikeblinds.net']));

-- 7. Storage bucket for reservation attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('reservations', 'reservations', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own reservation files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'reservations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own reservation files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'reservations' AND auth.uid()::text = (storage.foldername(name))[1]);
