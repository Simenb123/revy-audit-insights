-- Job tracking table
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id BIGSERIAL PRIMARY KEY,
  job_type TEXT NOT NULL,                -- 'shareholders'
  status TEXT NOT NULL DEFAULT 'queued', -- queued | running | done | error
  source_path TEXT,
  total_rows BIGINT DEFAULT 0,
  rows_loaded BIGINT DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policy for import_jobs
CREATE POLICY "Users can manage their own import jobs" ON public.import_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Staging table for bulk imports (UNLOGGED for speed)
CREATE UNLOGGED TABLE IF NOT EXISTS public.shareholders_staging (
  id SERIAL PRIMARY KEY,
  orgnr TEXT,
  selskap TEXT,
  aksjeklasse TEXT,
  navn_aksjonaer TEXT,
  fodselsaar_orgnr TEXT,
  landkode TEXT DEFAULT 'NO',
  antall_aksjer INTEGER DEFAULT 0,
  year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create imports bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('imports', 'imports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for imports bucket
CREATE POLICY "Users can upload to imports bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'imports' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view their own imports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'imports' AND 
    auth.role() = 'authenticated'
  );