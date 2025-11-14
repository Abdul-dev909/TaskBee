-- Add admin update policy for profiles table
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Add admin delete policy for profiles table
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (is_admin(auth.uid()));