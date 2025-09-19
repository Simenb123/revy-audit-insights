-- Create shareholders_import_queue table for background job processing
CREATE TABLE IF NOT EXISTS public.shareholders_import_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id BIGINT NOT NULL,
  user_id UUID NOT NULL,
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  mapping JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_shareholders_import_queue_status_created 
ON public.shareholders_import_queue (status, created_at) 
WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.shareholders_import_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view queue items for their jobs" 
ON public.shareholders_import_queue 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can manage queue items" 
ON public.shareholders_import_queue 
FOR ALL 
USING (true)
WITH CHECK (true);