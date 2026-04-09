-- Magic Pass Plus Games System
-- Tables for group gaming with leaderboards and AI avatars

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Game Hosts (Host creates a game session)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.game_hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL,
  game_title VARCHAR(255) NOT NULL,
  max_players INT DEFAULT 10,
  current_players INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  host_avatar_url TEXT,
  host_nickname VARCHAR(50),
  qr_code TEXT,
  join_code VARCHAR(6) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  is_public BOOLEAN DEFAULT TRUE,
  difficulty VARCHAR(20) DEFAULT 'medium',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_hosts_user_id ON public.game_hosts(user_id);
CREATE INDEX IF NOT EXISTS idx_game_hosts_status ON public.game_hosts(status);
CREATE INDEX IF NOT EXISTS idx_game_hosts_join_code ON public.game_hosts(join_code);

ALTER TABLE public.game_hosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read game_hosts" ON public.game_hosts FOR SELECT USING (is_public = TRUE);
CREATE POLICY "Users manage own games" ON public.game_hosts USING (auth.uid() = user_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Game Players (Participants)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_host_id UUID NOT NULL REFERENCES public.game_hosts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  player_nickname VARCHAR(50) NOT NULL,
  player_avatar_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_host BOOLEAN DEFAULT FALSE,
  score INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'joined',
  device_type VARCHAR(20) DEFAULT 'web'
);

CREATE INDEX IF NOT EXISTS idx_game_players_game_host_id ON public.game_players(game_host_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user_id ON public.game_players(user_id);

ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read game_players" ON public.game_players FOR SELECT USING (TRUE);
CREATE POLICY "Users manage own player records" ON public.game_players USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.game_hosts WHERE id = game_host_id));

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Game Sessions (Active game instance)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_host_id UUID NOT NULL REFERENCES public.game_hosts(id) ON DELETE CASCADE,
  round_number INT DEFAULT 1,
  current_challenge TEXT,
  time_remaining_seconds INT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_live BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_game_host_id ON public.game_sessions(game_host_id);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read game_sessions" ON public.game_sessions FOR SELECT USING (TRUE);
CREATE POLICY "Users manage own sessions" ON public.game_sessions USING (auth.uid() IN (SELECT user_id FROM public.game_hosts WHERE id = game_host_id));

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- High Scores (Leaderboard)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.game_high_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) DEFAULT 'medium',
  final_score INT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_session_id UUID REFERENCES public.game_sessions(id) ON DELETE SET NULL,
  is_personal_best BOOLEAN DEFAULT FALSE,
  solo_mode BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_game_high_scores_user_id ON public.game_high_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_high_scores_game_type ON public.game_high_scores(game_type);
CREATE INDEX IF NOT EXISTS idx_game_high_scores_score ON public.game_high_scores(final_score DESC);

ALTER TABLE public.game_high_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read game_high_scores" ON public.game_high_scores FOR SELECT USING (TRUE);
CREATE POLICY "Users insert own scores" ON public.game_high_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- AI Game Avatars (Procedurally generated)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.game_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url TEXT NOT NULL,
  avatar_prompt TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  style VARCHAR(50) DEFAULT 'family-friendly'
);

CREATE INDEX IF NOT EXISTS idx_game_avatars_user_id ON public.game_avatars(user_id);

ALTER TABLE public.game_avatars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own avatars" ON public.game_avatars USING (auth.uid() = user_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Timestamps trigger
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION update_game_hosts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_hosts_updated_at_trigger
BEFORE UPDATE ON public.game_hosts
FOR EACH ROW
EXECUTE FUNCTION update_game_hosts_updated_at();

