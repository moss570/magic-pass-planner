INSERT INTO public.users_profile (id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users_profile)
ON CONFLICT (id) DO NOTHING;