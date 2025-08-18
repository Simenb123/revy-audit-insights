-- Create AI Analysis Sessions table
CREATE TABLE public.ai_analysis_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  data_version_id UUID,
  session_type TEXT NOT NULL DEFAULT 'ai_transaction_analysis',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  current_step TEXT,
  total_steps INTEGER DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  analysis_config JSONB DEFAULT '{}',
  result_data JSONB,
  metadata JSONB DEFAULT '{}',
  created_by UUID DEFAULT auth.uid(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create AI Analysis Cache table
CREATE TABLE public.ai_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  data_version_id UUID NOT NULL,
  analysis_type TEXT NOT NULL DEFAULT 'transaction_analysis',
  config_hash TEXT NOT NULL,
  result_data JSONB NOT NULL,
  confidence_score NUMERIC(3,2) DEFAULT 0.85,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  analysis_duration_ms INTEGER,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  access_count INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  UNIQUE(client_id, data_version_id, analysis_type, config_hash)
);

-- Enable RLS
ALTER TABLE public.ai_analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_analysis_sessions
CREATE POLICY "Users can manage AI analysis sessions for their clients"
ON public.ai_analysis_sessions
FOR ALL
USING (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

-- RLS Policies for ai_analysis_cache  
CREATE POLICY "Users can manage AI analysis cache for their clients"
ON public.ai_analysis_cache
FOR ALL
USING (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_ai_analysis_sessions_client_status ON public.ai_analysis_sessions(client_id, status);
CREATE INDEX idx_ai_analysis_sessions_version ON public.ai_analysis_sessions(data_version_id);
CREATE INDEX idx_ai_analysis_cache_lookup ON public.ai_analysis_cache(client_id, data_version_id, analysis_type);
CREATE INDEX idx_ai_analysis_cache_expires ON public.ai_analysis_cache(expires_at);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_ai_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ai_analysis_sessions
CREATE TRIGGER update_ai_analysis_sessions_updated_at
  BEFORE UPDATE ON public.ai_analysis_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_analysis_updated_at();

-- Create function to cleanup expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_ai_analysis_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_analysis_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;