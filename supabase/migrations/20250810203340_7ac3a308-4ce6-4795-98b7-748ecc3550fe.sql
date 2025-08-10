-- Create table for per-client, per-year materiality settings
CREATE TABLE IF NOT EXISTS public.materiality_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  fiscal_year INTEGER NOT NULL,
  materiality NUMERIC NOT NULL,
  working_materiality NUMERIC NOT NULL,
  clearly_trivial NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NOK',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL DEFAULT auth.uid(),
  updated_by UUID NULL
);

-- Optional FK to clients table for integrity (kept simple to avoid cross-schema issues)
ALTER TABLE public.materiality_settings
  ADD CONSTRAINT materiality_settings_client_fk
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

-- Ensure one row per client/year
CREATE UNIQUE INDEX IF NOT EXISTS ux_materiality_settings_client_year 
  ON public.materiality_settings(client_id, fiscal_year);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_materiality_settings_client 
  ON public.materiality_settings(client_id);

-- Enable RLS
ALTER TABLE public.materiality_settings ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage settings for their own clients
CREATE POLICY IF NOT EXISTS "Users can view materiality for their clients"
ON public.materiality_settings FOR SELECT
USING (
  client_id IN (
    SELECT c.id FROM public.clients c WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Users can insert materiality for their clients"
ON public.materiality_settings FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT c.id FROM public.clients c WHERE c.user_id = auth.uid()
  ) AND created_by = auth.uid()
);

CREATE POLICY IF NOT EXISTS "Users can update materiality for their clients"
ON public.materiality_settings FOR UPDATE
USING (
  client_id IN (
    SELECT c.id FROM public.clients c WHERE c.user_id = auth.uid()
  )
) WITH CHECK (
  client_id IN (
    SELECT c.id FROM public.clients c WHERE c.user_id = auth.uid()
  )
);

-- Trigger to maintain updated_at and updated_by
CREATE OR REPLACE FUNCTION public.set_materiality_updated_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_materiality_updated_fields ON public.materiality_settings;
CREATE TRIGGER trg_materiality_updated_fields
BEFORE UPDATE ON public.materiality_settings
FOR EACH ROW EXECUTE FUNCTION public.set_materiality_updated_fields();