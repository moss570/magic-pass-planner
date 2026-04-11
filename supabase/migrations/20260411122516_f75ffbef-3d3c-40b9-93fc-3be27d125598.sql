
-- off_property_hotels (seed-ready reference table)
CREATE TABLE public.off_property_hotels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  star_rating NUMERIC DEFAULT 3,
  lat NUMERIC,
  lng NUMERIC,
  distance_to_mk_mi NUMERIC,
  distance_to_epcot_mi NUMERIC,
  distance_to_hs_mi NUMERIC,
  distance_to_ak_mi NUMERIC,
  typical_nightly_rate NUMERIC,
  amenities TEXT[] DEFAULT '{}',
  image_url TEXT,
  booking_url_template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.off_property_hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read off_property_hotels"
  ON public.off_property_hotels FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage off_property_hotels"
  ON public.off_property_hotels FOR ALL TO public
  USING ((auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']))
  WITH CHECK ((auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

-- hotel_alerts
CREATE TABLE public.hotel_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trip_id UUID REFERENCES public.saved_trips(id) ON DELETE SET NULL,
  hotel_name TEXT NOT NULL,
  hotel_id UUID REFERENCES public.off_property_hotels(id) ON DELETE SET NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  adults INTEGER NOT NULL DEFAULT 2,
  children INTEGER NOT NULL DEFAULT 0,
  target_price NUMERIC NOT NULL,
  current_price NUMERIC,
  price_history JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'watching',
  check_count INTEGER DEFAULT 0,
  last_checked_at TIMESTAMPTZ,
  last_checked_status TEXT,
  notify_email BOOLEAN DEFAULT true,
  notify_sms BOOLEAN DEFAULT false,
  booking_link TEXT,
  confirmation_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hotel_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own hotel alerts"
  ON public.hotel_alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- airfare_alerts
CREATE TABLE public.airfare_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trip_id UUID REFERENCES public.saved_trips(id) ON DELETE SET NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL DEFAULT 'MCO',
  depart_date DATE NOT NULL,
  return_date DATE NOT NULL,
  adults INTEGER NOT NULL DEFAULT 2,
  children INTEGER NOT NULL DEFAULT 0,
  target_price NUMERIC NOT NULL,
  current_price NUMERIC,
  price_history JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'watching',
  check_count INTEGER DEFAULT 0,
  last_checked_at TIMESTAMPTZ,
  cabin_class TEXT NOT NULL DEFAULT 'economy',
  stops_max INTEGER DEFAULT 2,
  notify_email BOOLEAN DEFAULT true,
  notify_sms BOOLEAN DEFAULT false,
  booking_link TEXT,
  airline TEXT,
  flight_numbers TEXT[],
  confirmation_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.airfare_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own airfare alerts"
  ON public.airfare_alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- price_check_runs (observability)
CREATE TABLE public.price_check_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  alerts_checked INTEGER DEFAULT 0,
  alerts_updated INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.price_check_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read price_check_runs"
  ON public.price_check_runs FOR SELECT TO public
  USING ((auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

CREATE POLICY "Service insert price_check_runs"
  ON public.price_check_runs FOR INSERT TO public
  WITH CHECK (true);
