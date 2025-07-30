-- Create analysis sessions table for tracking analysis jobs
CREATE TABLE public.analysis_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL DEFAULT 'transaction_analysis',
  status TEXT NOT NULL DEFAULT 'pending',
  data_version_id UUID REFERENCES public.accounting_data_versions(id),
  analysis_config JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  progress_percentage INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis results table for storing Python analysis outputs
CREATE TABLE public.analysis_results_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.analysis_sessions(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  result_data JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  confidence_score NUMERIC(5,4) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create filtered data cache table
CREATE TABLE public.filtered_data_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  data_version_id UUID NOT NULL REFERENCES public.accounting_data_versions(id) ON DELETE CASCADE,
  filter_hash TEXT NOT NULL,
  filter_criteria JSONB NOT NULL,
  filtered_data_summary JSONB NOT NULL,
  cache_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Enable RLS
ALTER TABLE public.analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filtered_data_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analysis_sessions
CREATE POLICY "Users can manage analysis sessions for their clients" 
ON public.analysis_sessions 
FOR ALL 
USING (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

-- RLS Policies for analysis_results_v2
CREATE POLICY "Users can view analysis results for their clients" 
ON public.analysis_results_v2 
FOR SELECT 
USING (session_id IN (
  SELECT analysis_sessions.id FROM analysis_sessions 
  WHERE analysis_sessions.client_id IN (
    SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
  )
));

CREATE POLICY "System can insert analysis results" 
ON public.analysis_results_v2 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for filtered_data_cache
CREATE POLICY "Users can manage filtered data cache for their clients" 
ON public.filtered_data_cache 
FOR ALL 
USING (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_analysis_sessions_client_id ON public.analysis_sessions(client_id);
CREATE INDEX idx_analysis_sessions_status ON public.analysis_sessions(status);
CREATE INDEX idx_analysis_results_session_id ON public.analysis_results_v2(session_id);
CREATE INDEX idx_analysis_results_type ON public.analysis_results_v2(analysis_type);
CREATE INDEX idx_filtered_data_cache_expires ON public.filtered_data_cache(expires_at);
CREATE INDEX idx_filtered_data_cache_hash ON public.filtered_data_cache(filter_hash);

-- Create triggers for updated_at
CREATE TRIGGER update_analysis_sessions_updated_at
  BEFORE UPDATE ON public.analysis_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to clean up expired cache
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.filtered_data_cache 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;