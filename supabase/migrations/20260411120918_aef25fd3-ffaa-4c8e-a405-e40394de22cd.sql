
-- merchandise
CREATE TABLE public.merchandise (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  park_id text NOT NULL,
  land text NOT NULL,
  location text NOT NULL,
  name text NOT NULL,
  description text,
  image_url text,
  is_limited boolean NOT NULL DEFAULT false,
  valid_from date,
  valid_to date,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.merchandise ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read merchandise" ON public.merchandise FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage merchandise" ON public.merchandise FOR ALL USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

-- snacks
CREATE TABLE public.snacks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  park_id text NOT NULL,
  land text NOT NULL,
  location text NOT NULL,
  name text NOT NULL,
  price numeric,
  dietary_flags text[] DEFAULT '{}'::text[],
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.snacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read snacks" ON public.snacks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage snacks" ON public.snacks FOR ALL USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

-- photopass_locations
CREATE TABLE public.photopass_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  park_id text NOT NULL,
  land text NOT NULL,
  lat numeric,
  lng numeric,
  description text,
  is_magic_shot boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.photopass_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read photopass_locations" ON public.photopass_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage photopass_locations" ON public.photopass_locations FOR ALL USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

-- restrooms
CREATE TABLE public.restrooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  park_id text NOT NULL,
  land text NOT NULL,
  lat numeric,
  lng numeric,
  family_restroom boolean NOT NULL DEFAULT false,
  nursing_room boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.restrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read restrooms" ON public.restrooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage restrooms" ON public.restrooms FOR ALL USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

-- special_events
CREATE TABLE public.special_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  park_id text NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'tour',
  price_per_person numeric,
  duration_min integer NOT NULL DEFAULT 60,
  booking_url text,
  availability_note text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.special_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read special_events" ON public.special_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage special_events" ON public.special_events FOR ALL USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));
