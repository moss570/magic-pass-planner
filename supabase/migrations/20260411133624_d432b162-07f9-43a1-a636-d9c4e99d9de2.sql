
-- Affiliate Networks
CREATE TABLE public.affiliate_networks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  display_name text NOT NULL,
  category text NOT NULL DEFAULT 'hotels',
  logo_url text,
  is_enabled boolean DEFAULT false,
  priority int DEFAULT 100,
  api_key_enc text,
  api_secret_enc text,
  affiliate_id text,
  sub_id_pattern text,
  base_url text,
  deeplink_template text,
  tracking_pixel_url text,
  auth_type text DEFAULT 'api_key',
  oauth_client_id text,
  oauth_client_secret_enc text,
  oauth_redirect_uri text,
  webhook_url text,
  webhook_secret_enc text,
  commission_rate_display text,
  cookie_window_days int,
  payout_currency text DEFAULT 'USD',
  sandbox_mode boolean DEFAULT true,
  sandbox_api_key_enc text,
  sandbox_api_secret_enc text,
  last_test_status text DEFAULT 'untested',
  last_test_at timestamptz,
  last_test_error text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

ALTER TABLE public.affiliate_networks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage affiliate_networks"
  ON public.affiliate_networks FOR ALL
  USING ((auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']))
  WITH CHECK ((auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

-- Affiliate Clicks
CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id uuid REFERENCES public.affiliate_networks(id),
  user_id uuid,
  trip_id uuid,
  deeplink text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own clicks"
  ON public.affiliate_clicks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read clicks"
  ON public.affiliate_clicks FOR SELECT
  USING ((auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

-- Affiliate Webhook Events
CREATE TABLE public.affiliate_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_slug text,
  event_type text,
  payload jsonb DEFAULT '{}'::jsonb,
  signature_valid boolean,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.affiliate_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read webhook events"
  ON public.affiliate_webhook_events FOR SELECT
  USING ((auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

CREATE POLICY "Service insert webhook events"
  ON public.affiliate_webhook_events FOR INSERT
  WITH CHECK (true);

-- Admin Audit Log
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  target_table text,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit log"
  ON public.admin_audit_log FOR SELECT
  USING ((auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

CREATE POLICY "Service insert audit log"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (true);

-- Seed affiliate networks
INSERT INTO public.affiliate_networks (slug, display_name, category, priority, deeplink_template, auth_type) VALUES
  ('skyscanner', 'Skyscanner', 'flights', 10, 'https://www.skyscanner.com/transport/flights/{origin}/{destination}/{depart_date}/{return_date}?adultsv2={adults}&ref={affiliate_id}', 'api_key'),
  ('kayak', 'Kayak', 'flights', 20, 'https://www.kayak.com/flights/{origin}-{destination}/{depart_date}/{return_date}?sort=price_a&fs=stops={stops_max}&a={affiliate_id}', 'api_key'),
  ('expedia_flights', 'Expedia Flights', 'flights', 30, 'https://www.expedia.com/Flights-search?trip=roundtrip&leg1=from:{origin},to:{destination},departure:{depart_date}&leg2=from:{destination},to:{origin},departure:{return_date}&passengers=adults:{adults}&affcid={affiliate_id}', 'api_key'),
  ('priceline', 'Priceline', 'flights', 40, 'https://www.priceline.com/m/fly/search/{origin}-{destination}/{depart_date}/{return_date}?num-adults={adults}&refid={affiliate_id}', 'api_key'),
  ('booking', 'Booking.com', 'hotels', 10, 'https://www.booking.com/searchresults.html?dest_id=20023488&dest_type=city&checkin={checkIn}&checkout={checkOut}&group_adults={adults}&group_children={children}&aid={affiliate_id}&label={sub_id}', 'api_key'),
  ('expedia_taap', 'Expedia TAAP', 'hotels', 20, 'https://www.expedia.com/Hotel-Search?destination=Orlando&startDate={checkIn}&endDate={checkOut}&rooms=1&adults={adults}&affcid={affiliate_id}', 'api_key'),
  ('hotels_com', 'Hotels.com', 'hotels', 30, 'https://www.hotels.com/search.do?q-destination=Orlando,FL&q-check-in={checkIn}&q-check-out={checkOut}&q-rooms=1&q-room-0-adults={adults}&rffrid={affiliate_id}', 'api_key'),
  ('agoda', 'Agoda', 'hotels', 40, 'https://www.agoda.com/search?city=17188&checkIn={checkIn}&checkOut={checkOut}&rooms=1&adults={adults}&cid={affiliate_id}', 'api_key'),
  ('marriott_affiliate', 'Marriott Affiliate', 'hotels', 50, 'https://www.marriott.com/search/default.mi?toDate={checkOut}&fromDate={checkIn}&destination=Orlando&adult={adults}&child={children}&t={affiliate_id}', 'api_key'),
  ('undercover_tourist', 'Undercover Tourist', 'tickets', 10, 'https://www.undercovertourist.com/orlando/walt-disney-world-tickets/?a={affiliate_id}&sub={sub_id}', 'api_key'),
  ('get_away_today', 'Get Away Today', 'tickets', 20, 'https://www.getawaytoday.com/disneyland-tickets?aid={affiliate_id}', 'api_key'),
  ('ares_travel', 'aRes Travel', 'tickets', 30, 'https://www.arestravel.com/disney-world-tickets?ref={affiliate_id}', 'api_key'),
  ('tripster', 'Tripster', 'tickets', 40, 'https://www.tripster.com/walt-disney-world-tickets/?aid={affiliate_id}', 'api_key'),
  ('rentalcars', 'Rentalcars.com', 'rental_cars', 10, 'https://www.rentalcars.com/search-results?location=Orlando&driversAge=30&puDay={pickupDay}&puMonth={pickupMonth}&puYear={pickupYear}&doDay={dropoffDay}&doMonth={dropoffMonth}&doYear={dropoffYear}&affiliateCode={affiliate_id}', 'api_key'),
  ('discover_cars', 'Discover Cars', 'rental_cars', 20, 'https://www.discovercars.com/search?location=Orlando&pick_up_date={checkIn}&drop_off_date={checkOut}&a={affiliate_id}', 'api_key'),
  ('expedia_cars', 'Expedia Cars', 'rental_cars', 30, 'https://www.expedia.com/Cars?locn=Orlando&date1={checkIn}&date2={checkOut}&affcid={affiliate_id}', 'api_key'),
  ('priceline_cars', 'Priceline Cars', 'rental_cars', 40, 'https://www.priceline.com/rentalcars/search?location=Orlando&pickupDate={checkIn}&dropoffDate={checkOut}&refid={affiliate_id}', 'api_key'),
  ('viator', 'Viator', 'activities', 10, 'https://www.viator.com/Orlando/d663-ttd?pid={affiliate_id}&mcid={sub_id}', 'api_key'),
  ('getyourguide', 'GetYourGuide', 'activities', 20, 'https://www.getyourguide.com/orlando-l191/?partner_id={affiliate_id}&cmp={sub_id}', 'api_key'),
  ('klook', 'Klook', 'activities', 30, 'https://www.klook.com/en-US/city/46-orlando/?aid={affiliate_id}', 'api_key'),
  ('allianz', 'Allianz Travel Insurance', 'insurance', 10, 'https://www.allianztravelinsurance.com/?utm_source={affiliate_id}&utm_medium=affiliate', 'api_key'),
  ('squaremouth', 'Squaremouth', 'insurance', 20, 'https://www.squaremouth.com/?affid={affiliate_id}', 'api_key');
