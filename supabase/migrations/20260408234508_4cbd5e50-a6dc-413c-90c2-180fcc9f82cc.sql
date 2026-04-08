
-- Create headsup_words table for Line Mind game
CREATE TABLE public.headsup_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.headsup_words ENABLE ROW LEVEL SECURITY;

-- Public can read active words
CREATE POLICY "Public read active words"
  ON public.headsup_words
  FOR SELECT
  USING (is_active = true);

-- Admins can manage all words
CREATE POLICY "Admins manage words"
  ON public.headsup_words
  FOR ALL
  USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com'::text, 'brandon@discountmikeblinds.net'::text]))
  WITH CHECK ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['moss570@gmail.com'::text, 'brandon@discountmikeblinds.net'::text]));

-- Seed Disney words
INSERT INTO public.headsup_words (word, category) VALUES
  -- Characters
  ('Mickey Mouse', 'characters'),
  ('Elsa', 'characters'),
  ('Buzz Lightyear', 'characters'),
  ('Cinderella', 'characters'),
  ('Stitch', 'characters'),
  ('Goofy', 'characters'),
  ('Maleficent', 'characters'),
  ('Moana', 'characters'),
  ('Simba', 'characters'),
  ('Captain Jack Sparrow', 'characters'),
  ('Tinker Bell', 'characters'),
  ('Ratatouille', 'characters'),
  -- Rides
  ('Space Mountain', 'rides'),
  ('Haunted Mansion', 'rides'),
  ('Pirates of the Caribbean', 'rides'),
  ('Splash Mountain', 'rides'),
  ('Big Thunder Mountain', 'rides'),
  ('It''s a Small World', 'rides'),
  ('Tower of Terror', 'rides'),
  ('Expedition Everest', 'rides'),
  ('Rock ''n'' Roller Coaster', 'rides'),
  ('Flight of Passage', 'rides'),
  ('TRON Lightcycle Run', 'rides'),
  ('Jungle Cruise', 'rides'),
  -- Food
  ('Dole Whip', 'food'),
  ('Turkey Leg', 'food'),
  ('Mickey Ice Cream Bar', 'food'),
  ('Churro', 'food'),
  ('Mickey Waffle', 'food'),
  ('Corn Dog Nuggets', 'food'),
  ('Ronto Wrap', 'food'),
  ('Grey Stuff', 'food'),
  ('LeFou''s Brew', 'food'),
  ('School Bread', 'food'),
  -- Movies
  ('The Lion King', 'movies'),
  ('Frozen', 'movies'),
  ('Toy Story', 'movies'),
  ('Finding Nemo', 'movies'),
  ('Encanto', 'movies'),
  ('Aladdin', 'movies'),
  ('The Little Mermaid', 'movies'),
  ('Coco', 'movies'),
  ('Tangled', 'movies'),
  ('Zootopia', 'movies'),
  -- Parks
  ('Magic Kingdom', 'parks'),
  ('EPCOT', 'parks'),
  ('Hollywood Studios', 'parks'),
  ('Animal Kingdom', 'parks'),
  ('Cinderella Castle', 'parks'),
  ('Tree of Life', 'parks'),
  ('Spaceship Earth', 'parks'),
  ('Main Street USA', 'parks'),
  ('Galaxy''s Edge', 'parks'),
  ('Pandora', 'parks');
