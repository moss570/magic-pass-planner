
CREATE TABLE public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all reactions" ON public.post_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add own reactions" ON public.post_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.post_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own reactions" ON public.post_reactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_post_reactions_post_id ON public.post_reactions(post_id);
