-- Create withdrawal_requests table for provider withdrawals
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  withdrawal_method TEXT NOT NULL, -- 'jazzcash', 'easypaisa', 'bank'
  account_number TEXT NOT NULL,
  account_title TEXT NOT NULL,
  bank_name TEXT, -- Only for bank transfers
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'rejected'
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Add payment_screenshot_url column to payments table
ALTER TABLE public.payments ADD COLUMN payment_screenshot_url TEXT;

-- Enable RLS on withdrawal_requests
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Providers can view their own withdrawal requests
CREATE POLICY "Providers can view their own withdrawals"
ON public.withdrawal_requests
FOR SELECT
USING (auth.uid() = provider_id);

-- Providers can create withdrawal requests
CREATE POLICY "Providers can create withdrawal requests"
ON public.withdrawal_requests
FOR INSERT
WITH CHECK (auth.uid() = provider_id);

-- Admins can view all withdrawal requests
CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawal_requests
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can update withdrawal requests
CREATE POLICY "Admins can update withdrawals"
ON public.withdrawal_requests
FOR UPDATE
USING (is_admin(auth.uid()));

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment_screenshots', 'payment_screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload payment screenshots
CREATE POLICY "Users can upload payment screenshots"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'payment_screenshots' AND auth.role() = 'authenticated');

-- Allow admins to view payment screenshots
CREATE POLICY "Admins can view payment screenshots"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment_screenshots' AND is_admin(auth.uid()));

-- Allow users to view their own screenshots
CREATE POLICY "Users can view their own payment screenshots"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment_screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);