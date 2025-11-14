-- Drop existing insert policies on notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;

-- Create a single INSERT policy that allows any authenticated user to insert notifications
-- This is necessary because providers need to create notifications for homeowners and vice versa
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications
FOR INSERT
TO public
WITH CHECK (auth.role() = 'authenticated');