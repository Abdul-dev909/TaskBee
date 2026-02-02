-- 1. Restrict profiles table access
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create helper function for job relationships
CREATE OR REPLACE FUNCTION public.has_job_relationship(_viewer_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Viewer is homeowner, profile is assigned provider
    SELECT 1 FROM jobs 
    WHERE posted_by = _viewer_id 
    AND assigned_provider_id = _profile_id
    UNION
    -- Viewer is provider, profile is job poster
    SELECT 1 FROM jobs 
    WHERE assigned_provider_id = _viewer_id 
    AND posted_by = _profile_id
    UNION
    -- Viewer and profile have message history
    SELECT 1 FROM messages
    WHERE (sender_id = _viewer_id AND receiver_id = _profile_id)
       OR (receiver_id = _viewer_id AND sender_id = _profile_id)
  )
$$;

-- Create restricted profile access policy
CREATE POLICY "Users can view own profile or job-related profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id 
  OR is_admin(auth.uid())
  OR has_job_relationship(auth.uid(), id)
);

-- 2. Restrict provider_profiles to authenticated users
DROP POLICY IF EXISTS "Anyone can view provider profiles" ON public.provider_profiles;

CREATE POLICY "Authenticated users can view provider profiles"
ON public.provider_profiles FOR SELECT
USING (auth.role() = 'authenticated');

-- 3. Secure provider_ratings
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.provider_ratings;

-- Providers can see all ratings for themselves
CREATE POLICY "Providers can view their own ratings"
ON public.provider_ratings FOR SELECT
USING (auth.uid() = provider_id);

-- Homeowners can see ratings they gave
CREATE POLICY "Homeowners can view their own ratings"
ON public.provider_ratings FOR SELECT
USING (auth.uid() = homeowner_id);

-- Admins can see all ratings
CREATE POLICY "Admins can view all ratings"
ON public.provider_ratings FOR SELECT
USING (is_admin(auth.uid()));

-- Create public view for aggregated ratings without homeowner_id
CREATE OR REPLACE VIEW public.provider_ratings_public
WITH (security_invoker=on) AS
SELECT id, provider_id, rating, review, created_at
FROM public.provider_ratings;

-- 4. Add message deletion policy
CREATE POLICY "Users can delete messages they sent"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id);

-- 5. Create location fuzzing function
CREATE OR REPLACE FUNCTION public.get_fuzzy_coordinates(
  lat double precision, 
  lon double precision,
  precision_km double precision DEFAULT 1.0
)
RETURNS TABLE(fuzzy_lat double precision, fuzzy_lon double precision)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  lat_precision double precision;
  lon_precision double precision;
BEGIN
  -- Approximate: 1 degree latitude = 111km
  lat_precision := precision_km / 111.0;
  -- Longitude varies with latitude, but use approximate value
  lon_precision := precision_km / (111.0 * COS(RADIANS(lat)));
  
  fuzzy_lat := ROUND(lat / lat_precision) * lat_precision;
  fuzzy_lon := ROUND(lon / lon_precision) * lon_precision;
  RETURN NEXT;
END;
$$;