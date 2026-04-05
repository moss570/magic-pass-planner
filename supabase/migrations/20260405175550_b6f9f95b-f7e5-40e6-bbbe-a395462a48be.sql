-- Fix disney_sessions: restrict to authenticated role
DROP POLICY IF EXISTS "Users manage own disney session" ON disney_sessions;
CREATE POLICY "Users manage own disney session" ON disney_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix dining_notifications: restrict to authenticated role
DROP POLICY IF EXISTS "Users read own notifications" ON dining_notifications;
CREATE POLICY "Users read own notifications" ON dining_notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);