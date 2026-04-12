
-- Add is_open to attractions
ALTER TABLE public.attractions ADD COLUMN IF NOT EXISTS is_open boolean NOT NULL DEFAULT true;

-- Add is_open and is_nighttime to shows
ALTER TABLE public.shows ADD COLUMN IF NOT EXISTS is_open boolean NOT NULL DEFAULT true;
ALTER TABLE public.shows ADD COLUMN IF NOT EXISTS is_nighttime boolean NOT NULL DEFAULT false;

-- Mark closed attractions
UPDATE public.attractions SET is_open = false
WHERE (lower(name) LIKE '%rock%roller%' AND park_id = 'hollywood-studios')
   OR (lower(name) LIKE '%muppet%vision%' AND park_id = 'hollywood-studios')
   OR (lower(name) LIKE '%muppetvision%' AND park_id = 'hollywood-studios');

-- Mark closed shows
UPDATE public.shows SET is_open = false
WHERE (lower(name) LIKE '%kitetails%' AND park_id = 'animal-kingdom')
   OR (lower(name) LIKE '%harmonious%' AND park_id = 'epcot');

-- Rename outdated EPCOT show to current name
UPDATE public.shows SET name = 'Luminous: The Symphony of Us'
WHERE park_id = 'epcot'
  AND (lower(name) LIKE '%epcot forever%' OR lower(name) LIKE '%luminous%')
  AND is_open = true;

-- Tag nighttime shows
UPDATE public.shows SET is_nighttime = true
WHERE lower(name) LIKE '%happily ever after%'
   OR lower(name) LIKE '%luminous%'
   OR lower(name) LIKE '%fantasmic%'
   OR lower(name) LIKE '%wonderful world of animation%'
   OR lower(name) LIKE '%disney movie magic%'
   OR lower(name) LIKE '%tree of life%awaken%';

-- If Fantasmic! exists in attractions but not in shows, copy it over
INSERT INTO public.shows (park_id, name, land, duration_min, location, is_open, is_nighttime)
SELECT park_id, name, land, avg_duration_min, 'Fantasmic! Amphitheater', true, true
FROM public.attractions
WHERE lower(name) LIKE '%fantasmic%' AND park_id = 'hollywood-studios'
AND NOT EXISTS (
  SELECT 1 FROM public.shows WHERE lower(name) LIKE '%fantasmic%' AND park_id = 'hollywood-studios'
);

-- Mark attractions-table Fantasmic! as closed (it belongs in shows)
UPDATE public.attractions SET is_open = false
WHERE lower(name) LIKE '%fantasmic%' AND park_id = 'hollywood-studios';
