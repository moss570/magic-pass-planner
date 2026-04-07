
-- Messages table (unified inbox)
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'direct',
  reference_id TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own messages"
ON public.messages FOR SELECT TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id OR sender_id IS NULL);

CREATE POLICY "Users update own received messages"
ON public.messages FOR UPDATE TO authenticated
USING (auth.uid() = receiver_id);
