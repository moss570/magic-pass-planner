
-- =============================================
-- 1. Fix game_content RLS: enforce game developer check server-side
-- =============================================

-- Drop the old permissive policy
DROP POLICY IF EXISTS "Game devs manage content" ON game_content;

-- Create a security definer function to check game developer status
CREATE OR REPLACE FUNCTION public.is_game_developer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vip_accounts
    WHERE user_id = _user_id
    AND is_game_developer = true
  )
$$;

-- New policy: only verified game developers can manage their own content
CREATE POLICY "Game devs manage own content"
ON game_content FOR ALL
TO authenticated
USING (
  auth.uid() = submitted_by
  AND public.is_game_developer(auth.uid())
)
WITH CHECK (
  auth.uid() = submitted_by
  AND public.is_game_developer(auth.uid())
  AND status = 'pending'
);

-- =============================================
-- 2. Fix trip_expenses: validate user_id on INSERT
-- =============================================

-- Drop the old ALL policy
DROP POLICY IF EXISTS "Trip expenses managed by trip creator" ON trip_expenses;

-- SELECT: trip creator can see all expenses for their trips
CREATE POLICY "Trip creator can view expenses"
ON trip_expenses FOR SELECT
TO authenticated
USING (
  trip_id IN (SELECT id FROM saved_trips WHERE user_id = auth.uid())
);

-- INSERT: must set user_id to own uid, and trip must belong to them
CREATE POLICY "Users insert own expenses"
ON trip_expenses FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND trip_id IN (SELECT id FROM saved_trips WHERE user_id = auth.uid())
);

-- UPDATE: trip creator can update expenses in their trips
CREATE POLICY "Trip creator can update expenses"
ON trip_expenses FOR UPDATE
TO authenticated
USING (
  trip_id IN (SELECT id FROM saved_trips WHERE user_id = auth.uid())
);

-- DELETE: trip creator can delete expenses in their trips
CREATE POLICY "Trip creator can delete expenses"
ON trip_expenses FOR DELETE
TO authenticated
USING (
  trip_id IN (SELECT id FROM saved_trips WHERE user_id = auth.uid())
);

-- =============================================
-- 3. Create a view that hides correct_answer for public reads
-- =============================================

CREATE OR REPLACE VIEW public.game_content_public AS
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

-- Grant access to the view
GRANT SELECT ON public.game_content_public TO anon, authenticated;
