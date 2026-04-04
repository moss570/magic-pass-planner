
-- Drop existing overly broad policies on users_profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users_profile;

-- Recreate with authenticated role
CREATE POLICY "Users can view own profile"
  ON public.users_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Drop and recreate subscription policy with authenticated role
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
