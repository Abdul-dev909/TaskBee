-- Add latitude and longitude to jobs table
ALTER TABLE public.jobs 
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;

-- Add latitude, longitude, and service_radius to provider_profiles table
ALTER TABLE public.provider_profiles 
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION,
ADD COLUMN service_radius_km INTEGER DEFAULT 10;

-- Create a function to calculate distance between two points using Haversine formula
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  earth_radius_km DOUBLE PRECISION := 6371;
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius_km * c;
END;
$$;

-- Create a function to find providers within radius of a job
CREATE OR REPLACE FUNCTION public.get_nearby_providers(
  job_lat DOUBLE PRECISION,
  job_lon DOUBLE PRECISION,
  job_category TEXT
)
RETURNS TABLE (
  provider_id UUID,
  user_id UUID,
  full_name TEXT,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id AS provider_id,
    pp.user_id,
    pp.full_name,
    calculate_distance_km(job_lat, job_lon, pp.latitude, pp.longitude) AS distance_km
  FROM provider_profiles pp
  WHERE 
    pp.latitude IS NOT NULL 
    AND pp.longitude IS NOT NULL
    AND pp.is_verified = true
    AND pp.skill_category = job_category
    AND calculate_distance_km(job_lat, job_lon, pp.latitude, pp.longitude) <= COALESCE(pp.service_radius_km, 10)
  ORDER BY distance_km ASC;
END;
$$;

-- Create trigger function to notify nearby providers when a job is created
CREATE OR REPLACE FUNCTION public.notify_nearby_providers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider RECORD;
BEGIN
  -- Only notify for new jobs with location
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    FOR provider IN 
      SELECT * FROM get_nearby_providers(NEW.latitude, NEW.longitude, NEW.category)
    LOOP
      INSERT INTO public.notifications (
        user_id,
        title,
        body,
        type,
        related_id
      ) VALUES (
        provider.user_id,
        'New Job Near You! 📍',
        'A new ' || NEW.category || ' job "' || NEW.title || '" was posted ' || ROUND(provider.distance_km::numeric, 1) || ' km away',
        'nearby_job',
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-notify on job creation
CREATE TRIGGER on_job_created_notify_providers
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_nearby_providers();