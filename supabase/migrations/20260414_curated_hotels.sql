-- Curated Hotels — Admin-managed list for trip planner
-- Replaces hardcoded curatedHotels.ts with Supabase table

CREATE TABLE IF NOT EXISTS curated_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_range TEXT NOT NULL,
  distance_miles NUMERIC NOT NULL,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  best_for TEXT,
  category TEXT NOT NULL,
  default_target_price NUMERIC NOT NULL,
  booking_search_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Insert the 9 existing hotels
INSERT INTO curated_hotels (name, price_range, distance_miles, amenities, best_for, category, default_target_price, booking_search_url)
VALUES
  ('Rosen Inn at Pointe Orlando', '$80-110', 8, ARRAY['Pool', 'Shuttle', 'Free Parking'], 'Families on a budget', 'Budget-Friendly', 80, 'https://www.booking.com/hotel/us/rosen-inn-at-pointe-orlando.html'),
  ('Holiday Inn Resort Orlando Suites', '$95-130', 7, ARRAY['Water Park', 'Kids Eat Free', 'Shuttle'], 'Families with young kids', 'Budget-Friendly', 95, 'https://www.booking.com/hotel/us/holiday-inn-resort-orlando-suites.html'),
  ('Avanti International Resort', '$75-100', 9, ARRAY['Pool', 'Kitchenette', 'Free Parking'], 'Extended stays', 'Budget-Friendly', 75, 'https://www.booking.com/hotel/us/avanti-international-resort.html'),
  ('Floridays Resort Orlando', '$140-200', 5, ARRAY['Full Kitchen', '2BR Suites', 'Pool', 'Free Parking'], 'Cooking meals to save money', 'Family Suites', 140, 'https://www.booking.com/hotel/us/floridays-resort-orlando.html'),
  ('Marriott''s Harbour Lake', '$160-250', 4, ARRAY['Full Kitchen', 'Water Park', 'Mini Golf'], 'Resort feel without Disney prices', 'Family Suites', 160, 'https://www.booking.com/hotel/us/marriott-harbour-lake.html'),
  ('Drury Plaza Hotel Orlando', '$130-180', 6, ARRAY['Free Breakfast', 'Evening Reception', 'Pool'], 'Free meals included', 'Family Suites', 130, 'https://www.booking.com/hotel/us/drury-plaza-orlando.html'),
  ('Wyndham Garden Lake Buena Vista', '$100-150', 1.5, ARRAY['Shuttle', 'Pool', 'Walk to Disney Springs'], 'Closest off-site option', 'Close to Parks', 100, 'https://www.booking.com/hotel/us/wyndham-garden-lake-buena-vista.html'),
  ('Hilton Orlando Buena Vista Palace', '$150-220', 1, ARRAY['Shuttle', 'Spa', 'Character Breakfast'], 'Extra Magic Hours eligible', 'Close to Parks', 150, 'https://www.booking.com/hotel/us/hilton-orlando-buena-vista-palace.html'),
  ('B Resort & Spa (Disney Springs)', '$130-190', 0.5, ARRAY['Walk to Disney Springs', 'Pool', 'Spa'], 'Walk to Disney Springs dining', 'Close to Parks', 130, 'https://www.booking.com/hotel/us/b-resort-spa-disney-springs.html')
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE curated_hotels ENABLE ROW LEVEL SECURITY;

-- Admins can read/write
CREATE POLICY "admins_manage_hotels" ON curated_hotels
  FOR ALL
  USING (auth.jwt() ->> 'email' IN ('moss570@gmail.com', 'brandon@discountmikeblinds.net'))
  WITH CHECK (auth.jwt() ->> 'email' IN ('moss570@gmail.com', 'brandon@discountmikeblinds.net'));

-- Public can read active hotels only
CREATE POLICY "public_read_active" ON curated_hotels
  FOR SELECT
  USING (is_active = true);
