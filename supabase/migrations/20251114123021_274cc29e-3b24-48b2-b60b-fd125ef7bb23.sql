-- Backfill missing profiles from auth.users
INSERT INTO public.profiles (id, email, created_at)
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;