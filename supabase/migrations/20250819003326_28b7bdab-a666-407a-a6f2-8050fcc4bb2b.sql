-- Create new enums only if they don't exist
DO $$ BEGIN
    CREATE TYPE test_type AS ENUM ('SUBSTANTIVE', 'CONTROL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sampling_method AS ENUM ('SRS', 'SYSTEMATIC', 'MUS', 'STRATIFIED', 'THRESHOLD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create audit_sampling_plans table
CREATE TABLE public.audit_sampling_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  fiscal_year INTEGER NOT NULL,
  test_type test_type NOT NULL,
  method sampling_method NOT NULL,
  population_size INTEGER NOT NULL,
  population_sum NUMERIC(15,2) NOT NULL,
  materiality NUMERIC(15,2),
  expected_misstatement NUMERIC(15,2),
  confidence_level INTEGER NOT NULL DEFAULT 95,
  risk_level risk_level NOT NULL DEFAULT 'moderat',
  tolerable_deviation_rate NUMERIC(5,4),
  expected_deviation_rate NUMERIC(5,4),
  strata_bounds JSONB,
  threshold_amount NUMERIC(15,2),
  recommended_sample_size INTEGER NOT NULL,
  actual_sample_size INTEGER DEFAULT 0,
  coverage_percentage NUMERIC(5,2) DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL DEFAULT auth.uid(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create audit_sampling_items table
CREATE TABLE public.audit_sampling_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.audit_sampling_plans(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  risk_score NUMERIC(3,2) DEFAULT 0,
  account_no TEXT,
  account_name TEXT,
  transaction_date DATE,
  description TEXT,
  is_high_risk BOOLEAN DEFAULT false,
  stratum_id INTEGER,
  selection_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_audit_sampling_plans_client_year ON public.audit_sampling_plans(client_id, fiscal_year);
CREATE INDEX idx_audit_sampling_items_plan_id ON public.audit_sampling_items(plan_id);
CREATE INDEX idx_audit_sampling_items_transaction ON public.audit_sampling_items(transaction_id);

-- Enable RLS
ALTER TABLE public.audit_sampling_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_sampling_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage sampling plans for their clients"
ON public.audit_sampling_plans
FOR ALL
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage sampling items for their plans"
ON public.audit_sampling_items
FOR ALL
USING (plan_id IN (
  SELECT id FROM public.audit_sampling_plans 
  WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
))
WITH CHECK (plan_id IN (
  SELECT id FROM public.audit_sampling_plans 
  WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
));

-- Add trigger for updated_at
CREATE TRIGGER update_audit_sampling_plans_updated_at
BEFORE UPDATE ON public.audit_sampling_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();