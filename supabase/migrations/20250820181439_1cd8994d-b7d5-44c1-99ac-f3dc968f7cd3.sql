-- Rename audit_sampling_items to audit_sampling_samples for consistency
ALTER TABLE public.audit_sampling_items RENAME TO audit_sampling_samples;

-- Add sample_type column to distinguish between TARGETED and RESIDUAL samples
ALTER TABLE public.audit_sampling_samples 
ADD COLUMN sample_type TEXT DEFAULT 'RESIDUAL'
CHECK (sample_type IN ('TARGETED', 'RESIDUAL'));

-- Add missing fields to audit_sampling_plans for enhanced functionality
ALTER TABLE public.audit_sampling_plans 
ADD COLUMN performance_materiality NUMERIC,
ADD COLUMN risk_matrix JSONB DEFAULT '{"lav": 0.8, "moderat": 1.0, "hoy": 1.3}'::jsonb,
ADD COLUMN threshold_mode TEXT DEFAULT 'DISABLED' CHECK (threshold_mode IN ('DISABLED', 'PM', 'TM', 'CUSTOM')),
ADD COLUMN min_per_stratum INTEGER DEFAULT 1,
ADD COLUMN risk_weighting TEXT DEFAULT 'disabled' CHECK (risk_weighting IN ('disabled', 'moderat', 'hoy')),
ADD COLUMN param_hash TEXT,
ADD COLUMN seed INTEGER,
ADD COLUMN confidence_factor NUMERIC DEFAULT 1.0;

-- Backfill sample_type based on existing data (high-value items as TARGETED)
UPDATE public.audit_sampling_samples 
SET sample_type = 'TARGETED' 
WHERE amount >= COALESCE((
  SELECT threshold_amount 
  FROM public.audit_sampling_plans 
  WHERE id = audit_sampling_samples.plan_id
), 999999999);

-- Create audit_sampling_strata table for stratification configuration
CREATE TABLE public.audit_sampling_strata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.audit_sampling_plans(id) ON DELETE CASCADE,
  stratum_index INTEGER NOT NULL,
  lower_bound NUMERIC NOT NULL,
  upper_bound NUMERIC,
  min_sample_size INTEGER DEFAULT 1,
  weight_factor NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_sampling_exports table for export history
CREATE TABLE public.audit_sampling_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.audit_sampling_plans(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('CSV', 'JSON', 'PDF')),
  file_path TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.audit_sampling_strata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_sampling_exports ENABLE ROW LEVEL SECURITY;

-- RLS policies for strata table
CREATE POLICY "Users can manage strata for their sampling plans"
ON public.audit_sampling_strata
FOR ALL
USING (
  plan_id IN (
    SELECT id FROM public.audit_sampling_plans 
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

-- RLS policies for exports table  
CREATE POLICY "Users can manage exports for their sampling plans"
ON public.audit_sampling_exports
FOR ALL
USING (
  plan_id IN (
    SELECT id FROM public.audit_sampling_plans 
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

-- Create indexes for performance
CREATE INDEX idx_audit_sampling_strata_plan_id ON public.audit_sampling_strata(plan_id);
CREATE INDEX idx_audit_sampling_exports_plan_id ON public.audit_sampling_exports(plan_id);
CREATE INDEX idx_audit_sampling_samples_sample_type ON public.audit_sampling_samples(sample_type);
CREATE INDEX idx_audit_sampling_plans_param_hash ON public.audit_sampling_plans(param_hash);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_audit_sampling_strata_updated_at
BEFORE UPDATE ON public.audit_sampling_strata
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing RLS policies to use the new table name
DROP POLICY IF EXISTS "Users can view sampling items for their plans" ON public.audit_sampling_samples;
CREATE POLICY "Users can view sampling samples for their plans"
ON public.audit_sampling_samples
FOR SELECT
USING (
  plan_id IN (
    SELECT id FROM public.audit_sampling_plans 
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can insert sampling items for their plans" ON public.audit_sampling_samples;
CREATE POLICY "Users can insert sampling samples for their plans"
ON public.audit_sampling_samples
FOR INSERT
WITH CHECK (
  plan_id IN (
    SELECT id FROM public.audit_sampling_plans 
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);