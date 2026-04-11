
-- ==============================
-- park_brands
-- ==============================
CREATE TABLE public.park_brands (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  parks text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.park_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read park_brands" ON public.park_brands FOR SELECT USING (true);
CREATE POLICY "Admins manage park_brands" ON public.park_brands FOR ALL USING (
  (auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net'])
) WITH CHECK (
  (auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net'])
);

INSERT INTO public.park_brands (id, name, slug, parks, active) VALUES
  ('disney_wdw', 'Walt Disney World', 'disney-wdw', ARRAY['magic-kingdom','epcot','hollywood-studios','animal-kingdom','typhoon-lagoon','blizzard-beach'], true),
  ('universal_orlando', 'Universal Orlando Resort', 'universal-orlando', ARRAY['universal-studios','islands-of-adventure','epic-universe','volcano-bay'], false),
  ('seaworld_orlando', 'SeaWorld Orlando', 'seaworld-orlando', ARRAY['seaworld','discovery-cove','aquatica'], false);

-- ==============================
-- park_passes
-- ==============================
CREATE TABLE public.park_passes (
  id text PRIMARY KEY,
  brand_id text NOT NULL REFERENCES public.park_brands(id),
  tier text NOT NULL,
  display_name text NOT NULL,
  discount_percent_dining int DEFAULT 0,
  discount_percent_merch int DEFAULT 0,
  blockout_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.park_passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read park_passes" ON public.park_passes FOR SELECT USING (true);
CREATE POLICY "Admins manage park_passes" ON public.park_passes FOR ALL USING (
  (auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net'])
) WITH CHECK (
  (auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net'])
);

INSERT INTO public.park_passes (id, brand_id, tier, display_name, discount_percent_dining, discount_percent_merch, blockout_summary) VALUES
  ('disney_pixie_dust', 'disney_wdw', 'Pixie Dust', 'Pixie Dust Pass', 10, 20, 'Most weekends, holidays, and summer blocked'),
  ('disney_pirate', 'disney_wdw', 'Pirate', 'Pirate Pass', 10, 20, 'Peak weekends and holidays blocked'),
  ('disney_sorcerer', 'disney_wdw', 'Sorcerer', 'Sorcerer Pass', 10, 20, 'Select holidays blocked'),
  ('disney_incredi', 'disney_wdw', 'Incredi-Pass', 'Incredi-Pass', 10, 20, 'No blockout dates'),
  ('universal_seasonal', 'universal_orlando', 'Seasonal', 'Seasonal Pass', 10, 10, 'Blocked during peak periods'),
  ('universal_power', 'universal_orlando', 'Power', 'Power Pass', 10, 15, 'Most dates open'),
  ('universal_preferred', 'universal_orlando', 'Preferred', 'Preferred Pass', 15, 15, 'Minimal blockouts'),
  ('universal_premier', 'universal_orlando', 'Premier', 'Premier Pass', 15, 20, 'No blockout dates'),
  ('universal_premier_unlimited', 'universal_orlando', 'Premier Unlimited', 'Premier Unlimited Pass', 20, 20, 'No blockout dates + Express'),
  ('seaworld_silver', 'seaworld_orlando', 'Silver', 'Silver Pass', 10, 10, 'Weekends blocked seasonally'),
  ('seaworld_gold', 'seaworld_orlando', 'Gold', 'Gold Pass', 10, 15, 'Major holidays blocked'),
  ('seaworld_platinum', 'seaworld_orlando', 'Platinum', 'Platinum Pass', 15, 20, 'No blockout dates');

-- ==============================
-- user_park_passes
-- ==============================
CREATE TABLE public.user_park_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pass_id text NOT NULL REFERENCES public.park_passes(id),
  expiration_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_park_passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own park passes" ON public.user_park_passes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================
-- credit_cards
-- ==============================
CREATE TABLE public.credit_cards (
  id text PRIMARY KEY,
  issuer text NOT NULL,
  name text NOT NULL,
  reward_type text NOT NULL DEFAULT 'cashback',
  base_reward_rate numeric NOT NULL DEFAULT 1.0,
  disney_reward_rate numeric DEFAULT 0,
  dining_reward_rate numeric DEFAULT 1.0,
  hotel_reward_rate numeric DEFAULT 1.0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read credit_cards" ON public.credit_cards FOR SELECT USING (true);
CREATE POLICY "Admins manage credit_cards" ON public.credit_cards FOR ALL USING (
  (auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net'])
) WITH CHECK (
  (auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net'])
);

INSERT INTO public.credit_cards (id, issuer, name, reward_type, base_reward_rate, disney_reward_rate, dining_reward_rate, hotel_reward_rate, notes) VALUES
  ('disney_visa_classic', 'Chase', 'Disney Visa Classic', 'disney_rewards', 1.0, 1.0, 1.0, 1.0, '10% dining/merch at select WDW locations'),
  ('disney_premier_visa', 'Chase', 'Disney Premier Visa', 'disney_rewards', 1.0, 2.0, 1.0, 1.0, '10% dining/merch at select WDW locations + 2% Disney purchases'),
  ('chase_sapphire_preferred', 'Chase', 'Sapphire Preferred', 'points', 1.0, 1.0, 3.0, 2.0, '3x on dining, 2x on travel. Redeem at 1.25x via Chase Travel'),
  ('chase_sapphire_reserve', 'Chase', 'Sapphire Reserve', 'points', 1.0, 1.0, 3.0, 3.0, '3x on dining & travel. Redeem at 1.5x via Chase Travel'),
  ('amex_gold', 'American Express', 'Gold Card', 'points', 1.0, 1.0, 4.0, 1.0, '4x on restaurants & US supermarkets'),
  ('amex_platinum', 'American Express', 'Platinum Card', 'points', 1.0, 1.0, 1.0, 5.0, '5x on flights, hotels via Amex Travel'),
  ('capital_one_venture_x', 'Capital One', 'Venture X', 'miles', 2.0, 2.0, 2.0, 10.0, '2x everything, 10x hotels via Capital One Travel'),
  ('target_redcard_credit', 'Target', 'RedCard Credit', 'store_credit', 5.0, 5.0, 0, 0, '5% off Target purchases including Disney gift cards'),
  ('target_redcard_debit', 'Target', 'RedCard Debit', 'store_credit', 5.0, 5.0, 0, 0, '5% off Target purchases including Disney gift cards'),
  ('chase_freedom_unlimited', 'Chase', 'Freedom Unlimited', 'cashback', 1.5, 1.5, 3.0, 1.5, '1.5% everything, 3% dining & drugstores'),
  ('citi_double_cash', 'Citi', 'Double Cash', 'cashback', 2.0, 2.0, 2.0, 2.0, '2% on everything'),
  ('other_cashback', 'Other', 'Other Cash Back Card', 'cashback', 1.5, 1.5, 1.5, 1.5, 'Generic cash back card');

-- ==============================
-- user_credit_cards
-- ==============================
CREATE TABLE public.user_credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  card_id text NOT NULL REFERENCES public.credit_cards(id),
  is_primary boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_credit_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own credit cards" ON public.user_credit_cards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================
-- user_memberships
-- ==============================
CREATE TABLE public.user_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  membership_type text NOT NULL,
  expiration_date date,
  is_active boolean NOT NULL DEFAULT true,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own memberships" ON public.user_memberships FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================
-- Extend restaurants table
-- ==============================
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS brand_id text REFERENCES public.park_brands(id) DEFAULT 'disney_wdw',
  ADD COLUMN IF NOT EXISTS park_id text,
  ADD COLUMN IF NOT EXISTS resort_id text,
  ADD COLUMN IF NOT EXISTS service_type text DEFAULT 'table',
  ADD COLUMN IF NOT EXISTS avg_ticket_per_person numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lat numeric,
  ADD COLUMN IF NOT EXISTS lng numeric;

-- ==============================
-- park_discounts
-- ==============================
CREATE TABLE public.park_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id text NOT NULL REFERENCES public.park_brands(id),
  park_id text,
  category text NOT NULL DEFAULT 'dining',
  title text NOT NULL,
  description text,
  discount_percent int,
  discount_flat_amount numeric,
  eligible_pass_tiers text[] DEFAULT '{}',
  eligible_card_ids text[] DEFAULT '{}',
  restaurant_id uuid REFERENCES public.restaurants(id),
  hotel_id uuid,
  location text,
  image_url text,
  start_date date,
  end_date date,
  is_stackable_with text[] DEFAULT '{}',
  importance int DEFAULT 50,
  source text,
  last_verified_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.park_discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read park_discounts" ON public.park_discounts FOR SELECT USING (true);
CREATE POLICY "Admins manage park_discounts" ON public.park_discounts FOR ALL USING (
  (auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net'])
) WITH CHECK (
  (auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net'])
);

-- ==============================
-- ap_hotel_alerts
-- ==============================
CREATE TABLE public.ap_hotel_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  brand_id text NOT NULL REFERENCES public.park_brands(id),
  hotel_id uuid,
  hotel_name text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  adults int NOT NULL DEFAULT 2,
  children int NOT NULL DEFAULT 0,
  target_discount_percent int,
  target_max_rate numeric,
  current_best_rate numeric,
  current_best_discount int,
  status text NOT NULL DEFAULT 'watching',
  check_count int DEFAULT 0,
  last_checked_at timestamptz,
  price_history jsonb DEFAULT '[]',
  notify_email boolean DEFAULT true,
  notify_sms boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ap_hotel_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ap_hotel_alerts" ON public.ap_hotel_alerts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================
-- ap_merch_drops
-- ==============================
CREATE TABLE public.ap_merch_drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id text NOT NULL REFERENCES public.park_brands(id),
  name text NOT NULL,
  description text,
  image_url text,
  park_id text,
  location text,
  release_date timestamptz,
  price_msrp numeric,
  tags text[] DEFAULT '{}',
  is_limited boolean DEFAULT false,
  source_url text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz
);
ALTER TABLE public.ap_merch_drops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ap_merch_drops" ON public.ap_merch_drops FOR SELECT USING (true);
CREATE POLICY "Admins manage ap_merch_drops" ON public.ap_merch_drops FOR ALL USING (
  (auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net'])
) WITH CHECK (
  (auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net'])
);

-- ==============================
-- ap_merch_alerts
-- ==============================
CREATE TABLE public.ap_merch_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  brand_id text NOT NULL REFERENCES public.park_brands(id),
  drop_id uuid REFERENCES public.ap_merch_drops(id),
  keywords text[] DEFAULT '{}',
  categories text[] DEFAULT '{}',
  notify_email boolean DEFAULT true,
  notify_sms boolean DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  check_count int DEFAULT 0,
  last_checked_at timestamptz,
  last_match_ids text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ap_merch_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ap_merch_alerts" ON public.ap_merch_alerts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================
-- promotions
-- ==============================
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id text NOT NULL REFERENCES public.park_brands(id),
  title text NOT NULL,
  description text,
  discount_type text NOT NULL DEFAULT 'percent',
  discount_value numeric NOT NULL DEFAULT 0,
  eligible_card_ids text[] DEFAULT '{}',
  eligible_pass_tiers text[] DEFAULT '{}',
  eligible_restaurant_ids text[] DEFAULT '{}',
  eligible_hotel_ids text[] DEFAULT '{}',
  start_date date,
  end_date date,
  source_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read promotions" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "Admins manage promotions" ON public.promotions FOR ALL USING (
  (auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net'])
) WITH CHECK (
  (auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net'])
);

-- ==============================
-- Seed WDW restaurants (extend existing table)
-- ==============================
INSERT INTO public.restaurants (name, location, location_type, area, cuisine, price_range, requires_reservation, brand_id, park_id, service_type, avg_ticket_per_person) VALUES
  -- Magic Kingdom
  ('Be Our Guest Restaurant', 'Magic Kingdom', 'Park', 'Fantasyland', 'French', '$$$$', true, 'disney_wdw', 'magic-kingdom', 'table', 62),
  ('Cinderellas Royal Table', 'Magic Kingdom', 'Park', 'Fantasyland', 'American', '$$$$', true, 'disney_wdw', 'magic-kingdom', 'character', 75),
  ('The Crystal Palace', 'Magic Kingdom', 'Park', 'Main Street USA', 'American Buffet', '$$$', true, 'disney_wdw', 'magic-kingdom', 'character', 55),
  ('Liberty Tree Tavern', 'Magic Kingdom', 'Park', 'Liberty Square', 'American', '$$$', true, 'disney_wdw', 'magic-kingdom', 'table', 42),
  ('Jungle Navigation Co. Ltd Skipper Canteen', 'Magic Kingdom', 'Park', 'Adventureland', 'Asian Fusion', '$$$', true, 'disney_wdw', 'magic-kingdom', 'table', 38),
  ('Tony''s Town Square Restaurant', 'Magic Kingdom', 'Park', 'Main Street USA', 'Italian', '$$$', true, 'disney_wdw', 'magic-kingdom', 'table', 35),
  ('The Plaza Restaurant', 'Magic Kingdom', 'Park', 'Main Street USA', 'American', '$$', true, 'disney_wdw', 'magic-kingdom', 'table', 25),
  ('Columbia Harbour House', 'Magic Kingdom', 'Park', 'Liberty Square', 'Seafood', '$$', false, 'disney_wdw', 'magic-kingdom', 'quick', 16),
  ('Pecos Bill Tall Tale Inn and Cafe', 'Magic Kingdom', 'Park', 'Frontierland', 'Tex-Mex', '$$', false, 'disney_wdw', 'magic-kingdom', 'quick', 15),
  ('Cosmic Ray''s Starlight Cafe', 'Magic Kingdom', 'Park', 'Tomorrowland', 'American', '$$', false, 'disney_wdw', 'magic-kingdom', 'quick', 14),
  ('Casey''s Corner', 'Magic Kingdom', 'Park', 'Main Street USA', 'American', '$', false, 'disney_wdw', 'magic-kingdom', 'quick', 12),
  ('Sleepy Hollow', 'Magic Kingdom', 'Park', 'Liberty Square', 'Snacks', '$', false, 'disney_wdw', 'magic-kingdom', 'quick', 10),
  -- EPCOT
  ('Space 220', 'EPCOT', 'Park', 'Future World', 'American', '$$$$', true, 'disney_wdw', 'epcot', 'table', 79),
  ('Le Cellier Steakhouse', 'EPCOT', 'Park', 'World Showcase - Canada', 'Steakhouse', '$$$$', true, 'disney_wdw', 'epcot', 'table', 65),
  ('Teppan Edo', 'EPCOT', 'Park', 'World Showcase - Japan', 'Japanese', '$$$', true, 'disney_wdw', 'epcot', 'table', 40),
  ('Via Napoli Ristorante e Pizzeria', 'EPCOT', 'Park', 'World Showcase - Italy', 'Italian', '$$$', true, 'disney_wdw', 'epcot', 'table', 35),
  ('Biergarten Restaurant', 'EPCOT', 'Park', 'World Showcase - Germany', 'German Buffet', '$$$', true, 'disney_wdw', 'epcot', 'table', 45),
  ('San Angel Inn Restaurante', 'EPCOT', 'Park', 'World Showcase - Mexico', 'Mexican', '$$$', true, 'disney_wdw', 'epcot', 'table', 38),
  ('Coral Reef Restaurant', 'EPCOT', 'Park', 'Future World', 'Seafood', '$$$', true, 'disney_wdw', 'epcot', 'table', 42),
  ('Garden Grill Restaurant', 'EPCOT', 'Park', 'Future World', 'American', '$$$', true, 'disney_wdw', 'epcot', 'character', 55),
  ('Nine Dragons Restaurant', 'EPCOT', 'Park', 'World Showcase - China', 'Chinese', '$$$', true, 'disney_wdw', 'epcot', 'table', 30),
  ('Regal Eagle Smokehouse', 'EPCOT', 'Park', 'World Showcase - USA', 'BBQ', '$$', false, 'disney_wdw', 'epcot', 'quick', 17),
  ('Sunshine Seasons', 'EPCOT', 'Park', 'Future World', 'Multi-cuisine', '$$', false, 'disney_wdw', 'epcot', 'quick', 15),
  ('Les Halles Boulangerie-Patisserie', 'EPCOT', 'Park', 'World Showcase - France', 'French Bakery', '$$', false, 'disney_wdw', 'epcot', 'quick', 14),
  ('Katsura Grill', 'EPCOT', 'Park', 'World Showcase - Japan', 'Japanese', '$$', false, 'disney_wdw', 'epcot', 'quick', 16),
  ('Tutto Gusto Wine Cellar', 'EPCOT', 'Park', 'World Showcase - Italy', 'Italian', '$$$', false, 'disney_wdw', 'epcot', 'lounge', 35),
  ('Rose & Crown Dining Room', 'EPCOT', 'Park', 'World Showcase - UK', 'British', '$$$', true, 'disney_wdw', 'epcot', 'table', 38),
  ('La Hacienda de San Angel', 'EPCOT', 'Park', 'World Showcase - Mexico', 'Mexican', '$$$', true, 'disney_wdw', 'epcot', 'table', 42),
  ('Monsieur Paul', 'EPCOT', 'Park', 'World Showcase - France', 'French Fine Dining', '$$$$', true, 'disney_wdw', 'epcot', 'fine_dining', 85),
  ('Takumi-Tei', 'EPCOT', 'Park', 'World Showcase - Japan', 'Japanese Fine Dining', '$$$$', true, 'disney_wdw', 'epcot', 'fine_dining', 120),
  -- Hollywood Studios
  ('Hollywood Brown Derby', 'Hollywood Studios', 'Park', 'Hollywood Boulevard', 'American', '$$$$', true, 'disney_wdw', 'hollywood-studios', 'table', 55),
  ('Sci-Fi Dine-In Theater', 'Hollywood Studios', 'Park', 'Commissary Lane', 'American', '$$$', true, 'disney_wdw', 'hollywood-studios', 'table', 35),
  ('50s Prime Time Cafe', 'Hollywood Studios', 'Park', 'Echo Lake', 'American Comfort', '$$$', true, 'disney_wdw', 'hollywood-studios', 'table', 30),
  ('Mama Melrose''s Ristorante Italiano', 'Hollywood Studios', 'Park', 'Grand Avenue', 'Italian', '$$$', true, 'disney_wdw', 'hollywood-studios', 'table', 32),
  ('Oga''s Cantina', 'Hollywood Studios', 'Park', 'Star Wars: Galaxys Edge', 'Cocktails', '$$$', true, 'disney_wdw', 'hollywood-studios', 'lounge', 30),
  ('Docking Bay 7 Food and Cargo', 'Hollywood Studios', 'Park', 'Star Wars: Galaxys Edge', 'Multi-cuisine', '$$', false, 'disney_wdw', 'hollywood-studios', 'quick', 16),
  ('Woody''s Lunch Box', 'Hollywood Studios', 'Park', 'Toy Story Land', 'American', '$$', false, 'disney_wdw', 'hollywood-studios', 'quick', 14),
  ('Backlot Express', 'Hollywood Studios', 'Park', 'Echo Lake', 'American', '$$', false, 'disney_wdw', 'hollywood-studios', 'quick', 14),
  ('Roundup Rodeo BBQ', 'Hollywood Studios', 'Park', 'Toy Story Land', 'BBQ', '$$$', true, 'disney_wdw', 'hollywood-studios', 'table', 45),
  -- Animal Kingdom
  ('Tusker House Restaurant', 'Animal Kingdom', 'Park', 'Africa', 'African Buffet', '$$$', true, 'disney_wdw', 'animal-kingdom', 'character', 55),
  ('Yak & Yeti Restaurant', 'Animal Kingdom', 'Park', 'Asia', 'Pan-Asian', '$$$', true, 'disney_wdw', 'animal-kingdom', 'table', 35),
  ('Satu''li Canteen', 'Animal Kingdom', 'Park', 'Pandora', 'Pandoran', '$$', false, 'disney_wdw', 'animal-kingdom', 'quick', 16),
  ('Flame Tree Barbecue', 'Animal Kingdom', 'Park', 'Discovery Island', 'BBQ', '$$', false, 'disney_wdw', 'animal-kingdom', 'quick', 15),
  ('Rainforest Cafe at Animal Kingdom', 'Animal Kingdom', 'Park', 'Entrance', 'American', '$$$', true, 'disney_wdw', 'animal-kingdom', 'table', 30),
  ('Nomad Lounge', 'Animal Kingdom', 'Park', 'Discovery Island', 'Small Plates', '$$$', false, 'disney_wdw', 'animal-kingdom', 'lounge', 28),
  -- Disney Springs
  ('The BOATHOUSE', 'Disney Springs', 'Resort Area', 'The Landing', 'Seafood/Steaks', '$$$$', true, 'disney_wdw', null, 'table', 55),
  ('Morimoto Asia', 'Disney Springs', 'Resort Area', 'The Landing', 'Pan-Asian', '$$$', true, 'disney_wdw', null, 'table', 42),
  ('Wine Bar George', 'Disney Springs', 'Resort Area', 'The Landing', 'Wine/Small Plates', '$$$', true, 'disney_wdw', null, 'table', 45),
  ('Jaleo by Jose Andres', 'Disney Springs', 'Resort Area', 'West Side', 'Spanish Tapas', '$$$$', true, 'disney_wdw', null, 'table', 55),
  ('Raglan Road Irish Pub', 'Disney Springs', 'Resort Area', 'The Landing', 'Irish', '$$$', true, 'disney_wdw', null, 'table', 32),
  ('Homecomin', 'Disney Springs', 'Resort Area', 'The Landing', 'Southern', '$$$', true, 'disney_wdw', null, 'table', 32),
  ('Frontera Cocina', 'Disney Springs', 'Resort Area', 'Town Center', 'Mexican', '$$$', true, 'disney_wdw', null, 'table', 35),
  ('STK Orlando', 'Disney Springs', 'Resort Area', 'The Landing', 'Steakhouse', '$$$$', true, 'disney_wdw', null, 'fine_dining', 70),
  ('Wolfgang Puck Bar & Grill', 'Disney Springs', 'Resort Area', 'Town Center', 'American', '$$$', true, 'disney_wdw', null, 'table', 38),
  ('Paddlefish', 'Disney Springs', 'Resort Area', 'The Landing', 'Seafood', '$$$', true, 'disney_wdw', null, 'table', 42),
  ('Blaze Fast-Fire''d Pizza', 'Disney Springs', 'Resort Area', 'West Side', 'Pizza', '$$', false, 'disney_wdw', null, 'quick', 14),
  ('D-Luxe Burger', 'Disney Springs', 'Resort Area', 'Town Center', 'Burgers', '$$', false, 'disney_wdw', null, 'quick', 16),
  -- Resort Dining
  ('Topolino''s Terrace', 'Disney''s Riviera Resort', 'Resort', null, 'Italian/French', '$$$$', true, 'disney_wdw', null, 'character', 65),
  ('California Grill', 'Disney''s Contemporary Resort', 'Resort', null, 'American', '$$$$', true, 'disney_wdw', null, 'fine_dining', 85),
  ('Victoria & Albert''s', 'Disney''s Grand Floridian', 'Resort', null, 'American Fine Dining', '$$$$', true, 'disney_wdw', null, 'fine_dining', 250),
  ('Narcoossees', 'Disney''s Grand Floridian', 'Resort', null, 'Seafood', '$$$$', true, 'disney_wdw', null, 'fine_dining', 75),
  ('Citricos', 'Disney''s Grand Floridian', 'Resort', null, 'Mediterranean', '$$$$', true, 'disney_wdw', null, 'table', 60),
  ('Flying Fish', 'Disney''s BoardWalk', 'Resort', null, 'Seafood', '$$$$', true, 'disney_wdw', null, 'fine_dining', 65),
  ('Jiko - The Cooking Place', 'Disney''s Animal Kingdom Lodge', 'Resort', null, 'African', '$$$$', true, 'disney_wdw', null, 'table', 55),
  ('Boma - Flavors of Africa', 'Disney''s Animal Kingdom Lodge', 'Resort', null, 'African Buffet', '$$$', true, 'disney_wdw', null, 'table', 50),
  ('Sanaa', 'Disney''s Animal Kingdom Lodge - Kidani', 'Resort', null, 'Indian/African', '$$$', true, 'disney_wdw', null, 'table', 35),
  ('Ohana', 'Disney''s Polynesian Village Resort', 'Resort', null, 'Polynesian', '$$$', true, 'disney_wdw', null, 'character', 55),
  ('Kona Cafe', 'Disney''s Polynesian Village Resort', 'Resort', null, 'Pan-Asian', '$$$', true, 'disney_wdw', null, 'table', 30),
  ('Cape May Cafe', 'Disney''s Beach Club Resort', 'Resort', null, 'Seafood Buffet', '$$$', true, 'disney_wdw', null, 'character', 50),
  ('Yachtsman Steakhouse', 'Disney''s Yacht Club Resort', 'Resort', null, 'Steakhouse', '$$$$', true, 'disney_wdw', null, 'table', 65),
  ('Trail''s End Restaurant', 'Disney''s Fort Wilderness', 'Resort', null, 'American Buffet', '$$', true, 'disney_wdw', null, 'table', 25),
  ('Whispering Canyon Cafe', 'Disney''s Wilderness Lodge', 'Resort', null, 'American', '$$$', true, 'disney_wdw', null, 'table', 35),
  ('Artist Point', 'Disney''s Wilderness Lodge', 'Resort', null, 'Pacific NW', '$$$$', true, 'disney_wdw', null, 'character', 65),
  ('Ale & Compass Restaurant', 'Disney''s Yacht Club Resort', 'Resort', null, 'American', '$$$', true, 'disney_wdw', null, 'table', 30),
  ('Olivia''s Cafe', 'Disney''s Old Key West Resort', 'Resort', null, 'American', '$$$', true, 'disney_wdw', null, 'table', 28),
  ('Boatwright''s Dining Hall', 'Disney''s Port Orleans Riverside', 'Resort', null, 'Cajun/Creole', '$$$', true, 'disney_wdw', null, 'table', 28),
  ('Toledo - Tapas, Steak & Seafood', 'Disney''s Coronado Springs', 'Resort', null, 'Spanish', '$$$$', true, 'disney_wdw', null, 'table', 55),
  ('Maya Grill', 'Disney''s Coronado Springs', 'Resort', null, 'Mexican', '$$$', true, 'disney_wdw', null, 'table', 30)
ON CONFLICT (id) DO NOTHING;

-- ==============================
-- Seed initial park_discounts
-- ==============================
INSERT INTO public.park_discounts (brand_id, category, title, description, discount_percent, eligible_pass_tiers, eligible_card_ids, location, importance, source) VALUES
  ('disney_wdw', 'dining', '10% off dining at select restaurants', 'Valid at 100+ WDW table-service and quick-service locations. Show AP card at checkout.', 10, ARRAY['disney_pixie_dust','disney_pirate','disney_sorcerer','disney_incredi'], '{}', 'Walt Disney World parks & resorts', 90, 'disneyworld.disney.go.com'),
  ('disney_wdw', 'merchandise', '20% off select merchandise', 'Valid at most park gift shops and select resort shops. Exclusions apply for limited editions.', 20, ARRAY['disney_pixie_dust','disney_pirate','disney_sorcerer','disney_incredi'], '{}', 'WDW park & resort gift shops', 85, 'disneyworld.disney.go.com'),
  ('disney_wdw', 'hotels', 'Up to 25% off resort stays', 'AP-exclusive room rates at select WDW resort hotels for select dates.', 25, ARRAY['disney_pirate','disney_sorcerer','disney_incredi'], '{}', 'WDW Resort Hotels', 95, 'disneyworld.disney.go.com'),
  ('disney_wdw', 'dining', 'Disney Visa 10% Dining Discount', '10% off dining at select WDW table-service restaurants. Disney Visa cardholders only.', 10, '{}', ARRAY['disney_visa_classic','disney_premier_visa'], 'Select WDW table-service restaurants', 80, 'disneyworld.disney.go.com'),
  ('disney_wdw', 'merchandise', 'Disney Visa 10% Merchandise Discount', '10% off select merchandise at WDW owned-and-operated locations.', 10, '{}', ARRAY['disney_visa_classic','disney_premier_visa'], 'WDW owned-and-operated shops', 75, 'disneyworld.disney.go.com'),
  ('disney_wdw', 'experiences', '15% off Disney After Hours tickets', 'AP exclusive pricing for Disney After Hours events at select parks.', 15, ARRAY['disney_sorcerer','disney_incredi'], '{}', 'Magic Kingdom, Hollywood Studios', 70, 'disneyworld.disney.go.com'),
  ('disney_wdw', 'merchandise', 'AP Exclusive MagicBand+ Discount', '$34.99 (reg $44.99) for AP holders.', null, ARRAY['disney_pixie_dust','disney_pirate','disney_sorcerer','disney_incredi'], '{}', 'WDW parks & shopDisney.com', 60, 'disneyworld.disney.go.com'),
  ('disney_wdw', 'photopass', 'Free Memory Maker with Incredi-Pass', 'Included at no additional charge with Incredi-Pass.', 100, ARRAY['disney_incredi'], '{}', 'All WDW parks', 65, 'disneyworld.disney.go.com'),
  ('disney_wdw', 'dining', 'Tables in Wonderland 20% Dining', '20% off food and non-alcoholic beverages at 100+ WDW restaurants. Membership required.', 20, '{}', '{}', '100+ WDW restaurants', 88, 'Tables in Wonderland program');

-- Seed initial promotions
INSERT INTO public.promotions (brand_id, title, description, discount_type, discount_value, eligible_card_ids, eligible_pass_tiers, start_date, end_date, is_active) VALUES
  ('disney_wdw', 'AP Dining Days - Extra 5% Off', 'Annual Passholders get an additional 5% off at participating restaurants during AP Dining Days.', 'percent', 5, '{}', ARRAY['disney_pixie_dust','disney_pirate','disney_sorcerer','disney_incredi'], '2026-04-01', '2026-06-30', true),
  ('disney_wdw', 'Disney Visa 20% Off Select Merch', 'Disney Visa cardholders save 20% on select merchandise at participating locations.', 'percent', 20, ARRAY['disney_visa_classic','disney_premier_visa'], '{}', '2026-04-01', '2026-05-31', true);

-- Seed sample merch drops
INSERT INTO public.ap_merch_drops (brand_id, name, description, park_id, location, release_date, price_msrp, tags, is_limited, source) VALUES
  ('disney_wdw', '50th Anniversary AP-Exclusive Ears', 'Limited edition passholder-exclusive Minnie ears featuring 50th anniversary design', 'magic-kingdom', 'Emporium', now() - interval '2 days', 39.99, ARRAY['ears','anniversary','limited'], true, 'shopDisney'),
  ('disney_wdw', 'EPCOT Festival of the Arts AP Popcorn Bucket', 'Figment-themed premium popcorn bucket available only during the festival', 'epcot', 'Festival kiosks', now() + interval '14 days', 25.00, ARRAY['popcorn bucket','festival','figment'], true, 'Disney Parks Blog'),
  ('disney_wdw', 'Star Wars Day 2026 AP Pin Set', 'May the 4th exclusive pin set for Annual Passholders', 'hollywood-studios', 'Tatooine Traders', '2026-05-04T09:00:00Z', 29.99, ARRAY['pins','star wars','limited'], true, 'Disney Parks Blog'),
  ('disney_wdw', 'Loungefly Haunted Mansion AP Backpack', 'Passholder-exclusive Loungefly mini backpack with Haunted Mansion design', null, 'Multiple locations', now() + interval '30 days', 85.00, ARRAY['loungefly','haunted mansion','backpack'], true, 'Loungefly');
