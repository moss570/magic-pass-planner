
-- attractions table
CREATE TABLE public.attractions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  park_id text NOT NULL,
  name text NOT NULL,
  land text NOT NULL,
  lat numeric,
  lng numeric,
  has_lightning_lane boolean NOT NULL DEFAULT false,
  ll_type text CHECK (ll_type IN ('multi', 'individual', NULL)),
  avg_duration_min integer NOT NULL DEFAULT 5,
  ride_type text NOT NULL DEFAULT 'ride',
  thrill_level integer DEFAULT 3 CHECK (thrill_level BETWEEN 1 AND 5),
  height_req_in integer,
  description text,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read attractions"
  ON public.attractions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage attractions"
  ON public.attractions FOR ALL
  TO public
  USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com'::text, 'brandon@discountmikeblinds.net'::text]));

CREATE INDEX idx_attractions_park ON public.attractions(park_id);

-- shows table
CREATE TABLE public.shows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  park_id text NOT NULL,
  name text NOT NULL,
  location text,
  land text NOT NULL,
  schedule jsonb DEFAULT '[]'::jsonb,
  duration_min integer NOT NULL DEFAULT 20,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read shows"
  ON public.shows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage shows"
  ON public.shows FOR ALL
  TO public
  USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com'::text, 'brandon@discountmikeblinds.net'::text]));

CREATE INDEX idx_shows_park ON public.shows(park_id);

-- park_paths table (one row per park)
CREATE TABLE public.park_paths (
  park_id text PRIMARY KEY,
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  edges jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.park_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read park_paths"
  ON public.park_paths FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage park_paths"
  ON public.park_paths FOR ALL
  TO public
  USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com'::text, 'brandon@discountmikeblinds.net'::text]));

-- land_crowd_windows table
CREATE TABLE public.land_crowd_windows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  park_id text NOT NULL,
  land text NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  hour integer NOT NULL CHECK (hour BETWEEN 0 AND 23),
  crowd_level integer NOT NULL DEFAULT 3 CHECK (crowd_level BETWEEN 1 AND 5),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.land_crowd_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read crowd windows"
  ON public.land_crowd_windows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage crowd windows"
  ON public.land_crowd_windows FOR ALL
  TO public
  USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com'::text, 'brandon@discountmikeblinds.net'::text]));

CREATE INDEX idx_crowd_windows_park_land ON public.land_crowd_windows(park_id, land);
