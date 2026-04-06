
-- Recreate view with SECURITY INVOKER to respect querying user's permissions
CREATE OR REPLACE VIEW public.game_content_public
WITH (security_invoker = true) AS
SELECT
  id,
  game_type,
  title,
  image_url,
  location_name,
  park,
  queue_name,
  clue_description,
  multiple_choice,
  gps_lat,
  gps_lng,
  created_at
FROM public.game_content
WHERE status = 'approved';
