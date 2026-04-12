
CREATE TABLE public.tier_access_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text NOT NULL,
  plan_id text NOT NULL,
  value jsonb NOT NULL,
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (feature_key, plan_id)
);

ALTER TABLE public.tier_access_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tier_access_overrides"
ON public.tier_access_overrides
FOR ALL
USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com'::text, 'brandon@discountmikeblinds.net'::text]))
WITH CHECK ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com'::text, 'brandon@discountmikeblinds.net'::text]));
