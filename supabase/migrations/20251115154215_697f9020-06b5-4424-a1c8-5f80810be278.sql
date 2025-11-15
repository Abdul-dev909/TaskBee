-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  homeowner_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  offered_rate INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL DEFAULT 49,
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Paid',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create provider_wallet table
CREATE TABLE public.provider_wallet (
  provider_id UUID NOT NULL PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create provider_transactions table
CREATE TABLE public.provider_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  gross_amount INTEGER NOT NULL,
  commission INTEGER NOT NULL,
  net_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Homeowners can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = homeowner_id);

CREATE POLICY "Providers can view payments for their jobs"
  ON public.payments FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Homeowners can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = homeowner_id);

CREATE POLICY "Admins can update payments"
  ON public.payments FOR UPDATE
  USING (is_admin(auth.uid()));

-- RLS Policies for provider_wallet
CREATE POLICY "Providers can view their own wallet"
  ON public.provider_wallet FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "Admins can view all wallets"
  ON public.provider_wallet FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert wallets"
  ON public.provider_wallet FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update wallets"
  ON public.provider_wallet FOR UPDATE
  USING (true);

-- RLS Policies for provider_transactions
CREATE POLICY "Providers can view their own transactions"
  ON public.provider_transactions FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "Admins can view all transactions"
  ON public.provider_transactions FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert transactions"
  ON public.provider_transactions FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_payments_job_id ON public.payments(job_id);
CREATE INDEX idx_payments_homeowner_id ON public.payments(homeowner_id);
CREATE INDEX idx_payments_provider_id ON public.payments(provider_id);
CREATE INDEX idx_provider_transactions_provider_id ON public.provider_transactions(provider_id);
CREATE INDEX idx_provider_transactions_job_id ON public.provider_transactions(job_id);