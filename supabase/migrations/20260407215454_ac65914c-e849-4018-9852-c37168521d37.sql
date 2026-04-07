
-- Beacon community events (admin-managed)
CREATE TABLE public.beacon_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  emoji TEXT DEFAULT '🎪',
  type TEXT DEFAULT 'experience',
  park TEXT NOT NULL,
  location TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL,
  description TEXT,
  badge TEXT DEFAULT 'Event',
  badge_color TEXT DEFAULT 'bg-primary/20 text-primary',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.beacon_events ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view active events
CREATE POLICY "Authenticated users can view active beacon events"
ON public.beacon_events FOR SELECT TO authenticated
USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins manage beacon events"
ON public.beacon_events FOR ALL TO authenticated
USING ((auth.jwt() ->> 'email') IN ('moss570@gmail.com', 'brandon@discountmikeblinds.net'))
WITH CHECK ((auth.jwt() ->> 'email') IN ('moss570@gmail.com', 'brandon@discountmikeblinds.net'));

-- Beacon RSVPs
CREATE TABLE public.beacon_rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.beacon_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.beacon_rsvps ENABLE ROW LEVEL SECURITY;

-- Everyone can see RSVPs
CREATE POLICY "Authenticated users can view beacon rsvps"
ON public.beacon_rsvps FOR SELECT TO authenticated
USING (true);

-- Users can RSVP themselves
CREATE POLICY "Users can rsvp to events"
ON public.beacon_rsvps FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own RSVP
CREATE POLICY "Users can remove own rsvp"
ON public.beacon_rsvps FOR DELETE TO authenticated
USING (auth.uid() = user_id);
