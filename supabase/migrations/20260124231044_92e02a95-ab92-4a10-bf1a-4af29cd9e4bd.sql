-- Create archive table for old completed jobs
CREATE TABLE public.archived_jobs (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  budget TEXT,
  city TEXT NOT NULL,
  date_time TIMESTAMPTZ,
  posted_by UUID NOT NULL,
  assigned_provider_id UUID,
  status TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  original_created_at TIMESTAMPTZ NOT NULL,
  original_updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create archive table for old messages
CREATE TABLE public.archived_messages (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  is_read BOOLEAN NOT NULL,
  original_created_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.archived_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for archived_jobs (admin only access)
CREATE POLICY "Admins can view archived jobs"
  ON public.archived_jobs FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete archived jobs"
  ON public.archived_jobs FOR DELETE
  USING (is_admin(auth.uid()));

-- Users can view their own archived jobs
CREATE POLICY "Users can view their archived jobs"
  ON public.archived_jobs FOR SELECT
  USING (auth.uid() = posted_by OR auth.uid() = assigned_provider_id);

-- RLS policies for archived_messages (admin only access)
CREATE POLICY "Admins can view archived messages"
  ON public.archived_messages FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete archived messages"
  ON public.archived_messages FOR DELETE
  USING (is_admin(auth.uid()));

-- Users can view their own archived messages
CREATE POLICY "Users can view their archived messages"
  ON public.archived_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Create function to archive old data
CREATE OR REPLACE FUNCTION public.archive_old_data(days_old INTEGER DEFAULT 90)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived_jobs_count INTEGER;
  archived_messages_count INTEGER;
  cutoff_date TIMESTAMPTZ;
BEGIN
  cutoff_date := now() - (days_old || ' days')::INTERVAL;
  
  -- Archive old completed jobs
  WITH moved_jobs AS (
    INSERT INTO archived_jobs (id, title, category, description, budget, city, date_time, posted_by, assigned_provider_id, status, latitude, longitude, original_created_at, original_updated_at)
    SELECT id, title, category, description, budget, city, date_time, posted_by, assigned_provider_id, status::TEXT, latitude, longitude, created_at, updated_at
    FROM jobs
    WHERE status = 'completed' AND updated_at < cutoff_date
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO archived_jobs_count FROM moved_jobs;
  
  -- Archive messages for those jobs
  WITH moved_messages AS (
    INSERT INTO archived_messages (id, job_id, sender_id, receiver_id, message_text, is_read, original_created_at)
    SELECT m.id, m.job_id, m.sender_id, m.receiver_id, m.message_text, m.is_read, m.created_at
    FROM messages m
    WHERE m.job_id IN (SELECT id FROM archived_jobs WHERE archived_at > now() - INTERVAL '1 minute')
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO archived_messages_count FROM moved_messages;
  
  -- Delete archived messages from main table
  DELETE FROM messages 
  WHERE job_id IN (
    SELECT id FROM jobs 
    WHERE status = 'completed' AND updated_at < cutoff_date
  );
  
  -- Delete archived jobs from main table
  DELETE FROM jobs 
  WHERE status = 'completed' AND updated_at < cutoff_date;
  
  RETURN json_build_object(
    'archived_jobs', archived_jobs_count,
    'archived_messages', archived_messages_count,
    'cutoff_date', cutoff_date
  );
END;
$$;

-- Create indexes for better query performance
CREATE INDEX idx_archived_jobs_posted_by ON public.archived_jobs(posted_by);
CREATE INDEX idx_archived_jobs_provider ON public.archived_jobs(assigned_provider_id);
CREATE INDEX idx_archived_messages_job ON public.archived_messages(job_id);
CREATE INDEX idx_archived_messages_users ON public.archived_messages(sender_id, receiver_id);