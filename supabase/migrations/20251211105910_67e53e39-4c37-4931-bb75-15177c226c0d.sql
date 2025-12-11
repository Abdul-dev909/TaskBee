-- Fix overly permissive notification INSERT policy
-- Remove the current permissive policy that allows any authenticated user to create notifications for any user
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

-- Create a new restricted policy that only allows:
-- 1. Admins to create any notification
-- 2. Users to create notifications only for users they have a job relationship with
CREATE POLICY "Users can create notifications for related users only"
ON public.notifications FOR INSERT
WITH CHECK (
  -- Admins can create notifications for anyone
  is_admin(auth.uid())
  OR
  -- Users can only notify users in shared jobs (as homeowner or provider)
  EXISTS (
    SELECT 1 FROM jobs
    WHERE (
      (posted_by = auth.uid() AND assigned_provider_id = user_id) OR
      (assigned_provider_id = auth.uid() AND posted_by = user_id)
    )
  )
  OR
  -- Users can create notifications for themselves
  auth.uid() = user_id
);

-- Fix overly permissive provider_wallet policies
-- Remove current permissive INSERT and UPDATE policies
DROP POLICY IF EXISTS "System can insert wallets" ON public.provider_wallet;
DROP POLICY IF EXISTS "System can update wallets" ON public.provider_wallet;

-- Wallet INSERT/UPDATE should only happen through service role (edge functions)
-- No new INSERT policy needed - only service role can insert
-- No new UPDATE policy needed - only service role can update

-- Fix overly permissive provider_transactions INSERT policy if it exists
DROP POLICY IF EXISTS "System can insert transactions" ON public.provider_transactions;
-- No new INSERT policy needed - only service role can insert transactions