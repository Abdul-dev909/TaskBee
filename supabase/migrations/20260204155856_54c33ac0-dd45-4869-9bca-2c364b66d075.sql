-- Add payment method and transaction ID columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card',
ADD COLUMN IF NOT EXISTS transaction_reference TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified';

-- Add comment for clarity
COMMENT ON COLUMN public.payments.payment_method IS 'Payment method: card, jazzcash, easypaisa';
COMMENT ON COLUMN public.payments.transaction_reference IS 'Transaction ID from mobile wallet payments';
COMMENT ON COLUMN public.payments.verification_status IS 'Status: verified (card), pending_verification (mobile), verified (after admin confirms)';