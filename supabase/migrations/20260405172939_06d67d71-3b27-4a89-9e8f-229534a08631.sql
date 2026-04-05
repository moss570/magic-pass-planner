
-- Fix 1: Remove overly permissive vip_accounts policy (PUBLIC_DATA_EXPOSURE)
-- Service role bypasses RLS automatically, no policy needed for admin edge functions
DROP POLICY IF EXISTS "Service role manages vip accounts" ON vip_accounts;

-- Add scoped SELECT-only policy for authenticated users to check their own invite
CREATE POLICY "Users view own vip invite" ON vip_accounts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Fix 2: Restrict dining_alerts policy to authenticated role only
DROP POLICY IF EXISTS "Users manage own alerts" ON dining_alerts;

CREATE POLICY "Users manage own alerts" ON dining_alerts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
