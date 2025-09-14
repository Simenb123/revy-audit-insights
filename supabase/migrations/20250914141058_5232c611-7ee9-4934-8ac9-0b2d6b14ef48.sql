-- Create analysis cache table for optimized analysis results
CREATE TABLE IF NOT EXISTS public.ai_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  dataset_id UUID,
  cache_key TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  UNIQUE(client_id, COALESCE(dataset_id, '00000000-0000-0000-0000-000000000000'::uuid), cache_key)
);

-- Enable RLS
ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own analysis cache" 
ON public.ai_analysis_cache 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create analysis cache" 
ON public.ai_analysis_cache 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update analysis cache" 
ON public.ai_analysis_cache 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_client_dataset 
ON public.ai_analysis_cache (client_id, dataset_id, cache_key);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_expires 
ON public.ai_analysis_cache (expires_at);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_ai_analysis_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_analysis_cache_updated_at
BEFORE UPDATE ON public.ai_analysis_cache
FOR EACH ROW
EXECUTE FUNCTION update_ai_analysis_cache_updated_at();