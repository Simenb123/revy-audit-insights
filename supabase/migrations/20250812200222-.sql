-- Create client_report_versions table with RLS and indexes
CREATE TABLE IF NOT EXISTS public.client_report_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL,
  version_name text NOT NULL,
  version_description text NULL,
  widgets_config jsonb NOT NULL DEFAULT '[]'::jsonb,
  layout_config jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional FK (safe if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'client_reports'
  ) THEN
    ALTER TABLE public.client_report_versions
    ADD CONSTRAINT client_report_versions_report_id_fkey
    FOREIGN KEY (report_id) REFERENCES public.client_reports(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_report_versions_report_id ON public.client_report_versions(report_id);
CREATE INDEX IF NOT EXISTS idx_client_report_versions_created_at ON public.client_report_versions(created_at DESC);

-- Enable RLS
ALTER TABLE public.client_report_versions ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage versions for reports they own (via clients.user_id)
CREATE POLICY IF NOT EXISTS "Users can view report versions for their clients" ON public.client_report_versions
FOR SELECT USING (
  report_id IN (
    SELECT cr.id FROM public.client_reports cr
    JOIN public.clients c ON c.id = cr.client_id
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Users can insert report versions for their clients" ON public.client_report_versions
FOR INSERT WITH CHECK (
  report_id IN (
    SELECT cr.id FROM public.client_reports cr
    JOIN public.clients c ON c.id = cr.client_id
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Users can update report versions for their clients" ON public.client_report_versions
FOR UPDATE USING (
  report_id IN (
    SELECT cr.id FROM public.client_reports cr
    JOIN public.clients c ON c.id = cr.client_id
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Users can delete report versions for their clients" ON public.client_report_versions
FOR DELETE USING (
  report_id IN (
    SELECT cr.id FROM public.client_reports cr
    JOIN public.clients c ON c.id = cr.client_id
    WHERE c.user_id = auth.uid()
  )
);
