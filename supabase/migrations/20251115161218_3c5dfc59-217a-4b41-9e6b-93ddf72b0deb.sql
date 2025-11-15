-- Add admin SELECT policy for jobs table
CREATE POLICY "Admins can view all jobs"
ON public.jobs
FOR SELECT
USING (is_admin(auth.uid()));

-- Add admin SELECT policy for job_requests table
CREATE POLICY "Admins can view all job_requests"
ON public.job_requests
FOR SELECT
USING (is_admin(auth.uid()));