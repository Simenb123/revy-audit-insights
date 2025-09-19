-- Create Supabase Queue for shareholders import background processing
CREATE TABLE IF NOT EXISTS public.shareholder_import_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id BIGINT NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  mapping JSONB NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | completed | failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_shareholder_import_queue_status 
ON public.shareholder_import_queue(status, created_at);

-- RLS policies for queue
ALTER TABLE public.shareholder_import_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own queue entries" 
ON public.shareholder_import_queue 
FOR ALL 
USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON public.shareholder_import_queue TO authenticated;
GRANT USAGE ON SEQUENCE import_jobs_id_seq TO authenticated;