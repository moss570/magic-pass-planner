
CREATE TABLE public.launch_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text,
  signup_type text NOT NULL DEFAULT 'updates' CHECK (signup_type IN ('updates', 'beta_tester')),
  marketing_consent boolean NOT NULL DEFAULT false,
  consent_timestamp timestamp with time zone,
  ip_address text,
  source text DEFAULT 'homepage',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT launch_signups_email_type_key UNIQUE (email, signup_type)
);

ALTER TABLE public.launch_signups ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public-facing form)
CREATE POLICY "Public can submit signups"
  ON public.launch_signups
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins read signups"
  ON public.launch_signups
  FOR SELECT
  TO public
  USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

-- Only admins can update
CREATE POLICY "Admins update signups"
  ON public.launch_signups
  FOR UPDATE
  TO public
  USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

-- Only admins can delete
CREATE POLICY "Admins delete signups"
  ON public.launch_signups
  FOR DELETE
  TO public
  USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

-- Auto-update timestamp
CREATE TRIGGER update_launch_signups_updated_at
  BEFORE UPDATE ON public.launch_signups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
