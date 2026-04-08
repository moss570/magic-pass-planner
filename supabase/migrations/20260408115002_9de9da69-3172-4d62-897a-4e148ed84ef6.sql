
-- Create social_posts table
CREATE TABLE public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  image_url text,
  post_type text NOT NULL DEFAULT 'user',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active posts"
ON public.social_posts FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Users can create own posts"
ON public.social_posts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
ON public.social_posts FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
ON public.social_posts FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Create user_blocks table
CREATE TABLE public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks"
ON public.user_blocks FOR SELECT TO authenticated
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create own blocks"
ON public.user_blocks FOR INSERT TO authenticated
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete own blocks"
ON public.user_blocks FOR DELETE TO authenticated
USING (auth.uid() = blocker_id);
