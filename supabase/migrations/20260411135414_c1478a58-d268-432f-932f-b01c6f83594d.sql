
-- best_days_predictions
CREATE TABLE public.best_days_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id text NOT NULL,
  prediction_date date NOT NULL,
  score int NOT NULL DEFAULT 0,
  grade text NOT NULL DEFAULT 'C',
  crowd_level int NOT NULL DEFAULT 5,
  weather_summary text,
  weather_high_f int,
  weather_low_f int,
  precip_chance int DEFAULT 0,
  pass_tier_blocked boolean DEFAULT false,
  reasons jsonb DEFAULT '[]'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_best_days_park_date ON public.best_days_predictions (park_id, prediction_date);
ALTER TABLE public.best_days_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read best_days_predictions" ON public.best_days_predictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage best_days_predictions" ON public.best_days_predictions FOR ALL USING ((auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

-- park_crowd_forecasts
CREATE TABLE public.park_crowd_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id text NOT NULL,
  forecast_date date NOT NULL,
  crowd_level int NOT NULL DEFAULT 5,
  source text DEFAULT 'manual',
  fetched_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX idx_crowd_park_date ON public.park_crowd_forecasts (park_id, forecast_date);
ALTER TABLE public.park_crowd_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read park_crowd_forecasts" ON public.park_crowd_forecasts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage park_crowd_forecasts" ON public.park_crowd_forecasts FOR ALL USING ((auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

-- park_weather_forecasts
CREATE TABLE public.park_weather_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id text NOT NULL,
  forecast_date date NOT NULL,
  high_f int,
  low_f int,
  precip_chance int DEFAULT 0,
  summary text,
  source text DEFAULT 'nws',
  fetched_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX idx_weather_park_date ON public.park_weather_forecasts (park_id, forecast_date);
ALTER TABLE public.park_weather_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read park_weather_forecasts" ON public.park_weather_forecasts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage park_weather_forecasts" ON public.park_weather_forecasts FOR ALL USING ((auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

-- pass_tier_blockouts
CREATE TABLE public.pass_tier_blockouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id text NOT NULL,
  pass_tier text NOT NULL,
  blockout_date date NOT NULL,
  is_blocked boolean NOT NULL DEFAULT true,
  source text DEFAULT 'manual',
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX idx_blockout_park_tier_date ON public.pass_tier_blockouts (park_id, pass_tier, blockout_date);
ALTER TABLE public.pass_tier_blockouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read pass_tier_blockouts" ON public.pass_tier_blockouts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage pass_tier_blockouts" ON public.pass_tier_blockouts FOR ALL USING ((auth.jwt() ->> 'email') = ANY(ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));
