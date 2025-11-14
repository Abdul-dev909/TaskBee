-- Create complaints table
CREATE TABLE public.complaints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  type text NOT NULL,
  description text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'Pending',
  assigned_admin uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add blocking fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS block_reason text;

-- Enable RLS on complaints
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for complaints table

-- Homeowners can create complaints
CREATE POLICY "Users can create complaints"
ON public.complaints
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Homeowners can view their own complaints
CREATE POLICY "Users can view their own complaints"
ON public.complaints
FOR SELECT
USING (auth.uid() = created_by);

-- Providers can view complaints against them
CREATE POLICY "Providers can view complaints against them"
ON public.complaints
FOR SELECT
USING (auth.uid() = provider_id);

-- Admins can view all complaints
CREATE POLICY "Admins can view all complaints"
ON public.complaints
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can update complaints
CREATE POLICY "Admins can update complaints"
ON public.complaints
FOR UPDATE
USING (is_admin(auth.uid()));

-- Admins can delete complaints
CREATE POLICY "Admins can delete complaints"
ON public.complaints
FOR DELETE
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_complaints_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.update_complaints_updated_at();