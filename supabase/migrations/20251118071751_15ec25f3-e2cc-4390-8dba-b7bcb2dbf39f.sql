-- Create KYC documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc_documents', 'kyc_documents', false);

-- Storage policies for KYC documents
CREATE POLICY "Providers can upload their own KYC documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'kyc_documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Providers can view their own KYC documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc_documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all KYC documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc_documents' 
  AND is_admin(auth.uid())
);

-- Add is_verified column to provider_profiles
ALTER TABLE public.provider_profiles
ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false;

-- Create provider_kyc table
CREATE TABLE public.provider_kyc (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cnic_number TEXT NOT NULL,
  cnic_front_url TEXT NOT NULL,
  cnic_back_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified', 'pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on provider_kyc
ALTER TABLE public.provider_kyc ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provider_kyc
CREATE POLICY "Providers can view their own KYC"
ON public.provider_kyc
FOR SELECT
USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert their own KYC"
ON public.provider_kyc
FOR INSERT
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update their own KYC"
ON public.provider_kyc
FOR UPDATE
USING (auth.uid() = provider_id);

CREATE POLICY "Admins can view all KYC"
ON public.provider_kyc
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all KYC"
ON public.provider_kyc
FOR UPDATE
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_provider_kyc_updated_at
BEFORE UPDATE ON public.provider_kyc
FOR EACH ROW
EXECUTE FUNCTION public.update_provider_updated_at();