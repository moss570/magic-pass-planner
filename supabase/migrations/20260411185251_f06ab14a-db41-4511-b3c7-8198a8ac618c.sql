-- Table to track Founders Pass availability
CREATE TABLE IF NOT EXISTS public.founders_pass_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_slots integer NOT NULL DEFAULT 500,
  remaining integer NOT NULL DEFAULT 500,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.founders_pass_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read founders slots"
  ON public.founders_pass_slots
  FOR SELECT
  USING (true);

CREATE POLICY "Admins manage founders slots"
  ON public.founders_pass_slots
  FOR ALL
  USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com'::text, 'brandon@discountmikeblinds.net'::text]));

INSERT INTO public.founders_pass_slots (total_slots, remaining) VALUES (500, 500);

-- Public RPC to read remaining slots (no auth required)
CREATE OR REPLACE FUNCTION public.get_founders_remaining()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT remaining FROM public.founders_pass_slots LIMIT 1;
$$;

-- Trigger to decrement on new founders_pass subscription
CREATE OR REPLACE FUNCTION public.decrement_founders_slot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan_name = 'founders_pass' AND (OLD.plan_name IS NULL OR OLD.plan_name <> 'founders_pass') THEN
    UPDATE public.founders_pass_slots SET remaining = GREATEST(0, remaining - 1), updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_founders_subscription
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.decrement_founders_slot();