
CREATE OR REPLACE FUNCTION public.generate_forwarding_token()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT string_agg(
    substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', ceil(random() * 64)::int, 1),
    ''
  )
  FROM generate_series(1, 16)
$$;
