-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT rate_limits_action_type_check CHECK (action_type IN ('job_application', 'message_send', 'complaint_submission'))
);

-- Enable RLS on rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own rate limits
CREATE POLICY "Users can view their own rate limits"
ON public.rate_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own rate limits
CREATE POLICY "Users can insert their own rate limits"
ON public.rate_limits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own rate limits
CREATE POLICY "Users can update their own rate limits"
ON public.rate_limits
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all rate limits
CREATE POLICY "Admins can view all rate limits"
ON public.rate_limits
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON public.rate_limits(user_id, action_type, window_start);

-- Add message length constraint
ALTER TABLE public.messages
ADD CONSTRAINT message_length_check CHECK (char_length(message_text) <= 2000);

-- Add complaint description length constraint (10 minimum to account for existing data)
ALTER TABLE public.complaints
ADD CONSTRAINT complaint_description_length_check CHECK (
  char_length(description) >= 10 AND char_length(description) <= 2000
);