-- Create simple analysis cache table 
CREATE TABLE IF NOT EXISTS public.ai_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  dataset_id UUID,
  cache_key TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 hour')
);

-- Enable RLS
ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own analysis cache" 
ON public.ai_analysis_cache 
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_lookup 
ON public.ai_analysis_cache (client_id, dataset_id, cache_key, expires_at);