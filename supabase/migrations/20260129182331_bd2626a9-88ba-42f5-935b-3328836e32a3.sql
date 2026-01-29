-- Fix profiles table: Restrict public access to prevent email exposure
-- Drop the overly permissive policy that exposes user emails publicly
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create a new policy that only allows authenticated users to view profiles
-- This prevents anonymous scraping of user email addresses
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- Add input validation constraints to the jobs table to ensure consistent data
-- These constraints provide server-side validation as a safety net
-- First drop if they exist, then recreate
DO $$
BEGIN
  -- Drop existing constraints if they exist
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_title_length') THEN
    ALTER TABLE public.jobs DROP CONSTRAINT job_title_length;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_description_length') THEN
    ALTER TABLE public.jobs DROP CONSTRAINT job_description_length;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_city_length') THEN
    ALTER TABLE public.jobs DROP CONSTRAINT job_city_length;
  END IF;
END $$;

ALTER TABLE public.jobs
ADD CONSTRAINT job_title_length 
  CHECK (char_length(title) >= 3 AND char_length(title) <= 200);

ALTER TABLE public.jobs
ADD CONSTRAINT job_description_length 
  CHECK (char_length(description) >= 10 AND char_length(description) <= 5000);

ALTER TABLE public.jobs
ADD CONSTRAINT job_city_length 
  CHECK (char_length(city) >= 2 AND char_length(city) <= 100);