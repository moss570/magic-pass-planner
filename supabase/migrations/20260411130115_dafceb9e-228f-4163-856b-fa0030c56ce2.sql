
-- travel_party_invites
CREATE TABLE public.travel_party_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.saved_trips(id) ON DELETE CASCADE NOT NULL,
  inviter_user_id uuid NOT NULL,
  invitee_email text NOT NULL,
  invitee_phone text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  invite_token text UNIQUE NOT NULL,
  discount_code text NOT NULL,
  discount_percent integer NOT NULL DEFAULT 20,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  status text NOT NULL DEFAULT 'pending',
  sent_email_at timestamptz,
  sent_sms_at timestamptz,
  accepted_at timestamptz,
  accepted_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.travel_party_invites ENABLE ROW LEVEL SECURITY;

-- Inviter manages own invites
CREATE POLICY "Inviters manage own invites"
  ON public.travel_party_invites FOR ALL
  TO authenticated
  USING (auth.uid() = inviter_user_id)
  WITH CHECK (auth.uid() = inviter_user_id);

-- Public can read by exact invite_token (for the accept page)
CREATE POLICY "Public view invite by token"
  ON public.travel_party_invites FOR SELECT
  TO public
  USING (true);

-- Index for token lookups
CREATE INDEX idx_travel_party_invites_token ON public.travel_party_invites (invite_token);

-- discount_codes table
CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  stripe_coupon_id text,
  user_id uuid NOT NULL,
  invite_id uuid REFERENCES public.travel_party_invites(id),
  percent_off integer NOT NULL DEFAULT 20,
  used_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own discount codes"
  ON public.discount_codes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service insert discount codes"
  ON public.discount_codes FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Service update discount codes"
  ON public.discount_codes FOR UPDATE
  TO public
  USING (true);
