
-- Beta feedback table
CREATE TABLE public.beta_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  type text NOT NULL DEFAULT 'bug' CHECK (type IN ('bug', 'feature', 'general')),
  title text NOT NULL,
  description text NOT NULL,
  page_url text,
  user_agent text,
  screenshot_url text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'resolved', 'wont_fix')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
ON public.beta_feedback FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view feedback"
ON public.beta_feedback FOR SELECT
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('jason@mousewatcher.com', 'admin@magicpassplanner.com')
);

CREATE POLICY "Admins can update feedback"
ON public.beta_feedback FOR UPDATE
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('jason@mousewatcher.com', 'admin@magicpassplanner.com')
);

-- Client error log table
CREATE TABLE public.client_error_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  error_message text NOT NULL,
  error_stack text,
  component_name text,
  page_url text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_error_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log errors"
ON public.client_error_log FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view errors"
ON public.client_error_log FOR SELECT
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('jason@mousewatcher.com', 'admin@magicpassplanner.com')
);

-- Indexes
CREATE INDEX idx_beta_feedback_status ON public.beta_feedback(status);
CREATE INDEX idx_beta_feedback_type ON public.beta_feedback(type);
CREATE INDEX idx_beta_feedback_created ON public.beta_feedback(created_at DESC);
CREATE INDEX idx_client_error_log_created ON public.client_error_log(created_at DESC);
CREATE INDEX idx_client_error_log_message ON public.client_error_log(error_message);
