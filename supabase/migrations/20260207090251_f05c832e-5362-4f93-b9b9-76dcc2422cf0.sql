
-- Create a function to check KYC verification status that can be called by any authenticated user
-- This bypasses RLS so homeowners can check if a provider is verified before accepting their offer
CREATE OR REPLACE FUNCTION public.is_provider_kyc_verified(_provider_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM provider_kyc
    WHERE provider_id = _provider_id
    AND status = 'verified'
  );
$$;
