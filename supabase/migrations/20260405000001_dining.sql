-- ============================================================
-- MAGIC PASS PLUS — Dining Reservation System
-- Migration: 2026-04-04
-- ============================================================

-- ============================================================
-- 1. RESTAURANTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,         -- Park or resort name
  location_type text NOT NULL,    -- 'Park' | 'Resort' | 'Disney Springs'
  area text,                      -- Sub-area e.g. "Fantasyland", "BoardWalk"
  cuisine text,
  price_range text,               -- '$' | '$$' | '$$$' | '$$$$'
  meal_periods text[] DEFAULT '{}', -- ['Breakfast','Lunch','Dinner','Brunch']
  requires_reservation boolean DEFAULT true,
  accepts_walk_ins boolean DEFAULT false,
  dining_plan boolean DEFAULT true,
  disney_url text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read restaurants" ON public.restaurants FOR SELECT USING (true);

-- ============================================================
-- 2. DINING ALERTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.dining_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  alert_date date NOT NULL,
  party_size integer NOT NULL DEFAULT 2,
  meal_periods text[] DEFAULT '{"Any"}',
  preferred_time text,            -- e.g. "18:00" or "Any"
  alert_email boolean DEFAULT true,
  alert_sms boolean DEFAULT false,
  alert_push boolean DEFAULT true,
  status text DEFAULT 'watching', -- 'watching' | 'found' | 'booked' | 'expired' | 'cancelled'
  last_checked_at timestamptz,
  check_count integer DEFAULT 0,
  availability_found_at timestamptz,
  availability_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.dining_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own alerts" ON public.dining_alerts FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 3. ALERT NOTIFICATIONS LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.dining_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid REFERENCES public.dining_alerts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_name text,
  alert_date date,
  party_size integer,
  availability_url text,
  notification_type text,         -- 'email' | 'sms' | 'push'
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE public.dining_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.dining_notifications FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- 4. SEED RESTAURANTS — Magic Kingdom
-- ============================================================
INSERT INTO public.restaurants (name, location, location_type, area, cuisine, price_range, meal_periods, requires_reservation, dining_plan, disney_url) VALUES
('Be Our Guest Restaurant', 'Magic Kingdom', 'Park', 'Fantasyland', 'French', '$$$$', ARRAY['Breakfast','Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/magic-kingdom/be-our-guest-restaurant/'),
('Cinderella''s Royal Table', 'Magic Kingdom', 'Park', 'Fantasyland', 'American', '$$$$', ARRAY['Breakfast','Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/magic-kingdom/cinderellas-royal-table/'),
('The Crystal Palace', 'Magic Kingdom', 'Park', 'Main Street USA', 'American Buffet', '$$$', ARRAY['Breakfast','Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/magic-kingdom/crystal-palace/'),
('Liberty Tree Tavern', 'Magic Kingdom', 'Park', 'Liberty Square', 'American', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/magic-kingdom/liberty-tree-tavern/'),
('The Skipper Canteen', 'Magic Kingdom', 'Park', 'Adventureland', 'International', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/magic-kingdom/skipper-canteen/'),
('Tony''s Town Square Restaurant', 'Magic Kingdom', 'Park', 'Main Street USA', 'Italian', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/magic-kingdom/tonys-town-square-restaurant/'),
('The Plaza Restaurant', 'Magic Kingdom', 'Park', 'Main Street USA', 'American', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/magic-kingdom/plaza-restaurant/'),
('Jungle Navigation Co. Ltd. Skipper Canteen', 'Magic Kingdom', 'Park', 'Adventureland', 'International', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/magic-kingdom/skipper-canteen/');

-- ============================================================
-- 5. SEED RESTAURANTS — EPCOT
-- ============================================================
INSERT INTO public.restaurants (name, location, location_type, area, cuisine, price_range, meal_periods, requires_reservation, dining_plan, disney_url) VALUES
('Space 220 Restaurant', 'EPCOT', 'Park', 'World Discovery', 'American', '$$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/space-220/'),
('Coral Reef Restaurant', 'EPCOT', 'Park', 'World Nature', 'Seafood', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/coral-reef-restaurant/'),
('The Garden Grill Restaurant', 'EPCOT', 'Park', 'World Nature', 'American', '$$$', ARRAY['Breakfast','Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/garden-grill-restaurant/'),
('Akershus Royal Banquet Hall', 'EPCOT', 'Park', 'World Showcase - Norway', 'Norwegian', '$$$', ARRAY['Breakfast','Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/akershus-royal-banquet-hall/'),
('Biergarten Restaurant', 'EPCOT', 'Park', 'World Showcase - Germany', 'German Buffet', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/biergarten-restaurant/'),
('Chefs de France', 'EPCOT', 'Park', 'World Showcase - France', 'French', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/chefs-de-france/'),
('Monsieur Paul', 'EPCOT', 'Park', 'World Showcase - France', 'French Fine Dining', '$$$$', ARRAY['Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/monsieur-paul/'),
('Le Cellier Steakhouse', 'EPCOT', 'Park', 'World Showcase - Canada', 'Steakhouse', '$$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/le-cellier-steakhouse/'),
('Teppan Edo', 'EPCOT', 'Park', 'World Showcase - Japan', 'Japanese Teppanyaki', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/teppan-edo/'),
('Tokyo Dining', 'EPCOT', 'Park', 'World Showcase - Japan', 'Japanese', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/tokyo-dining/'),
('Via Napoli Ristorante e Pizzeria', 'EPCOT', 'Park', 'World Showcase - Italy', 'Italian', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/via-napoli-ristorante-e-pizzeria/'),
('Tutto Italia Ristorante', 'EPCOT', 'Park', 'World Showcase - Italy', 'Italian', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/tutto-italia-ristorante/'),
('San Angel Inn Restaurante', 'EPCOT', 'Park', 'World Showcase - Mexico', 'Mexican', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/san-angel-inn-restaurante/'),
('La Hacienda de San Angel', 'EPCOT', 'Park', 'World Showcase - Mexico', 'Mexican', '$$$', ARRAY['Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/la-hacienda-de-san-angel/'),
('Spice Road Table', 'EPCOT', 'Park', 'World Showcase - Morocco', 'Mediterranean', '$$$', ARRAY['Lunch','Dinner'], true, false, 'https://disneyworld.disney.go.com/dining/epcot/spice-road-table/'),
('Restaurant Marrakesh', 'EPCOT', 'Park', 'World Showcase - Morocco', 'Moroccan', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/restaurant-marrakesh/'),
('Nine Dragons Restaurant', 'EPCOT', 'Park', 'World Showcase - China', 'Chinese', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/nine-dragons-restaurant/'),
('Topolino''s Terrace', 'EPCOT', 'Park', 'World Showcase', 'Italian-inspired', '$$$$', ARRAY['Breakfast','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/epcot/topolinos-terrace/');

-- ============================================================
-- 6. SEED RESTAURANTS — Hollywood Studios
-- ============================================================
INSERT INTO public.restaurants (name, location, location_type, area, cuisine, price_range, meal_periods, requires_reservation, dining_plan, disney_url) VALUES
('50''s Prime Time Café', 'Hollywood Studios', 'Park', 'Hollywood Boulevard', 'American Comfort', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/hollywood-studios/50s-prime-time-cafe/'),
('Hollywood & Vine', 'Hollywood Studios', 'Park', 'Hollywood Boulevard', 'American Buffet', '$$$', ARRAY['Breakfast','Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/hollywood-studios/hollywood-and-vine/'),
('Sci-Fi Dine-In Theater Restaurant', 'Hollywood Studios', 'Park', 'Hollywood Boulevard', 'American', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/hollywood-studios/sci-fi-dine-in-theater/'),
('Mama Melrose''s Ristorante Italiano', 'Hollywood Studios', 'Park', 'Grand Avenue', 'Italian', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/hollywood-studios/mama-melroses-ristorante-italiano/');

-- ============================================================
-- 7. SEED RESTAURANTS — Animal Kingdom
-- ============================================================
INSERT INTO public.restaurants (name, location, location_type, area, cuisine, price_range, meal_periods, requires_reservation, dining_plan, disney_url) VALUES
('Tiffins Restaurant', 'Animal Kingdom', 'Park', 'Discovery Island', 'Global', '$$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/animal-kingdom/tiffins-restaurant/'),
('Tusker House Restaurant', 'Animal Kingdom', 'Park', 'Africa', 'African Buffet', '$$$', ARRAY['Breakfast','Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/animal-kingdom/tusker-house-restaurant/'),
('Yak & Yeti Restaurant', 'Animal Kingdom', 'Park', 'Asia', 'Pan-Asian', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/animal-kingdom/yak-and-yeti-restaurant/');

-- ============================================================
-- 8. SEED RESTAURANTS — Disney Springs
-- ============================================================
INSERT INTO public.restaurants (name, location, location_type, area, cuisine, price_range, meal_periods, requires_reservation, dining_plan, disney_url) VALUES
('The BOATHOUSE', 'Disney Springs', 'Disney Springs', 'The Landing', 'Seafood/Steakhouse', '$$$$', ARRAY['Lunch','Dinner'], true, false, 'https://disneyworld.disney.go.com/dining/disney-springs/the-boathouse/'),
('Chef Art Smith''s Homecomin''', 'Disney Springs', 'Disney Springs', 'The Landing', 'Southern American', '$$$', ARRAY['Breakfast','Lunch','Dinner','Brunch'], true, false, 'https://disneyworld.disney.go.com/dining/disney-springs/homecomin/'),
('Morimoto Asia', 'Disney Springs', 'Disney Springs', 'The Landing', 'Pan-Asian', '$$$$', ARRAY['Lunch','Dinner'], true, false, 'https://disneyworld.disney.go.com/dining/disney-springs/morimoto-asia/'),
('STK Orlando', 'Disney Springs', 'Disney Springs', 'The Landing', 'Modern Steakhouse', '$$$$', ARRAY['Lunch','Dinner'], true, false, 'https://disneyworld.disney.go.com/dining/disney-springs/stk-orlando/'),
('Paddlefish', 'Disney Springs', 'Disney Springs', 'The Landing', 'Seafood', '$$$$', ARRAY['Lunch','Dinner'], true, false, 'https://disneyworld.disney.go.com/dining/disney-springs/paddlefish/'),
('Maria & Enzo''s Ristorante', 'Disney Springs', 'Disney Springs', 'The Landing', 'Italian', '$$$', ARRAY['Lunch','Dinner'], true, false, 'https://disneyworld.disney.go.com/dining/disney-springs/maria-and-enzos/'),
('Enzo''s Hideaway Tunnel Bar', 'Disney Springs', 'Disney Springs', 'The Landing', 'Italian', '$$$', ARRAY['Lunch','Dinner'], true, false, 'https://disneyworld.disney.go.com/dining/disney-springs/enzos-hideaway/'),
('Raglan Road Irish Pub', 'Disney Springs', 'Disney Springs', 'The Landing', 'Irish', '$$$', ARRAY['Lunch','Dinner','Brunch'], true, false, 'https://disneyworld.disney.go.com/dining/disney-springs/raglan-road/'),
('Terralina Crafted Italian', 'Disney Springs', 'Disney Springs', 'The Landing', 'Italian', '$$$', ARRAY['Lunch','Dinner'], true, false, 'https://disneyworld.disney.go.com/dining/disney-springs/terralina-crafted-italian/'),
('T-REX', 'Disney Springs', 'Disney Springs', 'The Landing', 'American', '$$$', ARRAY['Lunch','Dinner'], true, false, 'https://disneyworld.disney.go.com/dining/disney-springs/trex/'),
('Rainforest Cafe', 'Disney Springs', 'Disney Springs', 'Marketplace', 'American', '$$$', ARRAY['Lunch','Dinner'], true, false, 'https://disneyworld.disney.go.com/dining/disney-springs/rainforest-cafe/'),
('Wine Bar George', 'Disney Springs', 'Disney Springs', 'The Landing', 'Mediterranean', '$$$', ARRAY['Lunch','Dinner'], true, false, 'https://disneyworld.disney.go.com/dining/disney-springs/wine-bar-george/');

-- ============================================================
-- 9. SEED RESTAURANTS — Magic Kingdom Resorts
-- ============================================================
INSERT INTO public.restaurants (name, location, location_type, area, cuisine, price_range, meal_periods, requires_reservation, dining_plan, disney_url) VALUES
('California Grill', 'Disney''s Contemporary Resort', 'Resort', 'Contemporary Resort', 'Californian', '$$$$', ARRAY['Dinner','Brunch'], true, true, 'https://disneyworld.disney.go.com/dining/contemporary-resort/california-grill/'),
('The Wave...of American Flavors', 'Disney''s Contemporary Resort', 'Resort', 'Contemporary Resort', 'American', '$$$', ARRAY['Breakfast','Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/contemporary-resort/the-wave/'),
('Chef Mickey''s', 'Disney''s Contemporary Resort', 'Resort', 'Contemporary Resort', 'American Buffet', '$$$', ARRAY['Breakfast','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/contemporary-resort/chef-mickeys/'),
('''Ohana', 'Disney''s Polynesian Village Resort', 'Resort', 'Polynesian Resort', 'Polynesian', '$$$', ARRAY['Breakfast','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/polynesian-resort/ohana/'),
('Kona Cafe', 'Disney''s Polynesian Village Resort', 'Resort', 'Polynesian Resort', 'Pacific Rim', '$$$', ARRAY['Breakfast','Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/polynesian-resort/kona-cafe/'),
('Citricos', 'Disney''s Grand Floridian Resort', 'Resort', 'Grand Floridian', 'Mediterranean', '$$$$', ARRAY['Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/grand-floridian-resort-and-spa/citricos/'),
('Narcoossee''s', 'Disney''s Grand Floridian Resort', 'Resort', 'Grand Floridian', 'Seafood/Steakhouse', '$$$$', ARRAY['Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/grand-floridian-resort-and-spa/narcoossees/'),
('1900 Park Fare', 'Disney''s Grand Floridian Resort', 'Resort', 'Grand Floridian', 'American Buffet', '$$$', ARRAY['Breakfast','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/grand-floridian-resort-and-spa/1900-park-fare/'),
('Grand Floridian Café', 'Disney''s Grand Floridian Resort', 'Resort', 'Grand Floridian', 'American', '$$$', ARRAY['Breakfast','Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/grand-floridian-resort-and-spa/grand-floridian-cafe/'),
('Whispering Canyon Café', 'Disney''s Wilderness Lodge', 'Resort', 'Wilderness Lodge', 'American BBQ', '$$$', ARRAY['Breakfast','Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/wilderness-lodge-resort/whispering-canyon-cafe/'),
('Artist Point', 'Disney''s Wilderness Lodge', 'Resort', 'Wilderness Lodge', 'Pacific Northwest', '$$$$', ARRAY['Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/wilderness-lodge-resort/artist-point/'),
('Storybook Dining at Artist Point', 'Disney''s Wilderness Lodge', 'Resort', 'Wilderness Lodge', 'American', '$$$$', ARRAY['Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/wilderness-lodge-resort/storybook-dining-at-artist-point/');

-- ============================================================
-- 10. SEED RESTAURANTS — EPCOT & Hollywood Studios Resorts
-- ============================================================
INSERT INTO public.restaurants (name, location, location_type, area, cuisine, price_range, meal_periods, requires_reservation, dining_plan, disney_url) VALUES
('Yachtsman Steakhouse', 'Disney''s Yacht Club Resort', 'Resort', 'Yacht Club', 'Steakhouse', '$$$$', ARRAY['Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/yacht-club-resort/yachtsman-steakhouse/'),
('Cape May Cafe', 'Disney''s Beach Club Resort', 'Resort', 'Beach Club', 'New England Seafood Buffet', '$$$', ARRAY['Breakfast','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/beach-club-resort/cape-may-cafe/'),
('Beaches & Cream Soda Shop', 'Disney''s Beach Club Resort', 'Resort', 'Beach Club', 'American', '$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/beach-club-resort/beaches-and-cream-soda-shop/'),
('Flying Fish', 'Disney''s BoardWalk Inn', 'Resort', 'BoardWalk', 'Seafood', '$$$$', ARRAY['Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/boardwalk-inn/flying-fish/'),
('Trattoria al Forno', 'Disney''s BoardWalk Inn', 'Resort', 'BoardWalk', 'Italian', '$$$', ARRAY['Breakfast','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/boardwalk-inn/trattoria-al-forno/'),
('Shula''s Steak House', 'Walt Disney World Swan', 'Resort', 'Swan Hotel', 'Steakhouse', '$$$$', ARRAY['Dinner'], true, false, 'https://disneyworld.disney.go.com/dining/walt-disney-world-swan/shulas-steak-house/'),
('Il Mulino New York Trattoria', 'Walt Disney World Swan', 'Resort', 'Swan Hotel', 'Italian', '$$$', ARRAY['Dinner'], true, false, 'https://disneyworld.disney.go.com/dining/walt-disney-world-swan/il-mulino/'),
('Bluezoo', 'Walt Disney World Dolphin', 'Resort', 'Dolphin Hotel', 'Seafood', '$$$$', ARRAY['Dinner'], true, false, 'https://disneyworld.disney.go.com/dining/walt-disney-world-dolphin/bluezoo/'),
('Todd English''s bluezoo', 'Walt Disney World Dolphin', 'Resort', 'Dolphin Hotel', 'Seafood', '$$$$', ARRAY['Dinner'], true, false, 'https://disneyworld.disney.go.com/dining/walt-disney-world-dolphin/bluezoo/');

-- ============================================================
-- 11. SEED RESTAURANTS — Animal Kingdom Resorts
-- ============================================================
INSERT INTO public.restaurants (name, location, location_type, area, cuisine, price_range, meal_periods, requires_reservation, dining_plan, disney_url) VALUES
('Jiko — The Cooking Place', 'Disney''s Animal Kingdom Lodge', 'Resort', 'Animal Kingdom Lodge', 'African', '$$$$', ARRAY['Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/animal-kingdom-lodge/jiko-the-cooking-place/'),
('Boma — Flavors of Africa', 'Disney''s Animal Kingdom Lodge', 'Resort', 'Animal Kingdom Lodge', 'African Buffet', '$$$', ARRAY['Breakfast','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/animal-kingdom-lodge/boma-flavors-of-africa/'),
('Sanaa', 'Disney''s Animal Kingdom Lodge', 'Resort', 'Kidani Village', 'African Indian', '$$$', ARRAY['Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/animal-kingdom-villas-kidani/sanaa/'),
('The Mara', 'Disney''s Animal Kingdom Lodge', 'Resort', 'Animal Kingdom Lodge', 'African Quick Service', '$$', ARRAY['Breakfast','Lunch','Dinner'], false, false, 'https://disneyworld.disney.go.com/dining/animal-kingdom-lodge/the-mara/');

-- ============================================================
-- 12. SEED RESTAURANTS — Disney Springs Area Resorts
-- ============================================================
INSERT INTO public.restaurants (name, location, location_type, area, cuisine, price_range, meal_periods, requires_reservation, dining_plan, disney_url) VALUES
('Olivia''s Café', 'Disney''s Old Key West Resort', 'Resort', 'Old Key West', 'American', '$$$', ARRAY['Breakfast','Lunch','Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/old-key-west-resort/olivias-cafe/'),
('Fulton''s', 'Disney''s Port Orleans Resort', 'Resort', 'Riverside', 'American', '$$$', ARRAY['Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/port-orleans-resort-riverside/fultons/'),
('Boatwright''s Dining Hall', 'Disney''s Port Orleans Resort', 'Resort', 'Riverside', 'Cajun', '$$$', ARRAY['Dinner'], true, true, 'https://disneyworld.disney.go.com/dining/port-orleans-resort-riverside/boatwrights-dining-hall/');

-- ============================================================
-- 13. INDEX FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON public.restaurants(location);
CREATE INDEX IF NOT EXISTS idx_restaurants_location_type ON public.restaurants(location_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON public.restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_dining_alerts_user_id ON public.dining_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_dining_alerts_status ON public.dining_alerts(status);
CREATE INDEX IF NOT EXISTS idx_dining_alerts_alert_date ON public.dining_alerts(alert_date);
