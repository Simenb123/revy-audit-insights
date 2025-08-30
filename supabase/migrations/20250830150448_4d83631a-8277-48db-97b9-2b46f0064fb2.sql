-- Create import_sessions table for tracking bulk imports
CREATE TABLE IF NOT EXISTS public.import_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'paused')),
  session_type TEXT NOT NULL DEFAULT 'shareholders_bulk',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  total_rows INTEGER NOT NULL DEFAULT 0,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  file_name TEXT,
  file_size BIGINT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.import_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own import sessions"
ON public.import_sessions
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_import_sessions_user_id ON public.import_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_import_sessions_status ON public.import_sessions(status);
CREATE INDEX IF NOT EXISTS idx_import_sessions_created_at ON public.import_sessions(created_at);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_import_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_import_sessions_updated_at
  BEFORE UPDATE ON public.import_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_import_sessions_updated_at();

-- Enable realtime for import_sessions
ALTER TABLE public.import_sessions REPLICA IDENTITY FULL;