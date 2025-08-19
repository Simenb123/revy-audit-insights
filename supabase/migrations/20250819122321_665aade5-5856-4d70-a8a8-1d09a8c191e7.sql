-- Fix audit sampling tables schema to match edge function expectations

-- Drop existing tables first
DROP TABLE IF EXISTS public.audit_sampling_items CASCADE;
DROP TABLE IF EXISTS public.audit_sampling_plans CASCADE;

-- Create audit_sampling_plans table with correct schema
CREATE TABLE public.audit_sampling_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  fiscal_year INTEGER NOT NULL,
  test_type TEXT NOT NULL DEFAULT 'SUBSTANTIVE',
  method TEXT NOT NULL DEFAULT 'SRS',
  population_size INTEGER NOT NULL DEFAULT 0,
  population_sum NUMERIC(15,2) NOT NULL DEFAULT 0,
  materiality NUMERIC(15,2),
  expected_misstatement NUMERIC(15,2),
  confidence_level NUMERIC(5,2) NOT NULL DEFAULT 95.0,
  risk_level TEXT NOT NULL DEFAULT 'moderat',
  tolerable_deviation_rate NUMERIC(5,2),
  expected_deviation_rate NUMERIC(5,2),
  strata_bounds NUMERIC[],
  threshold_amount NUMERIC(15,2),
  recommended_sample_size INTEGER NOT NULL DEFAULT 0,
  actual_sample_size INTEGER NOT NULL DEFAULT 0,
  coverage_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  plan_name TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_sampling_items table with correct schema
CREATE TABLE public.audit_sampling_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.audit_sampling_plans(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  risk_score NUMERIC(5,4) DEFAULT 0,
  account_no TEXT NOT NULL,
  account_name TEXT NOT NULL,
  transaction_date DATE,
  description TEXT,
  is_high_risk BOOLEAN DEFAULT false,
  stratum_id INTEGER,
  selection_method TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.audit_sampling_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_sampling_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit_sampling_plans
CREATE POLICY "Users can manage sampling plans for their clients"
ON public.audit_sampling_plans
FOR ALL
USING (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
))
WITH CHECK (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

-- Create RLS policies for audit_sampling_items  
CREATE POLICY "Users can manage sampling items for their plans"
ON public.audit_sampling_items
FOR ALL
USING (plan_id IN (
  SELECT asp.id FROM public.audit_sampling_plans asp
  JOIN clients c ON asp.client_id = c.id
  WHERE c.user_id = auth.uid()
))
WITH CHECK (plan_id IN (
  SELECT asp.id FROM public.audit_sampling_plans asp
  JOIN clients c ON asp.client_id = c.id
  WHERE c.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_audit_sampling_plans_client_id ON public.audit_sampling_plans(client_id);
CREATE INDEX idx_audit_sampling_plans_fiscal_year ON public.audit_sampling_plans(fiscal_year);
CREATE INDEX idx_audit_sampling_items_plan_id ON public.audit_sampling_items(plan_id);
CREATE INDEX idx_audit_sampling_items_account_number ON public.audit_sampling_items(account_no);

-- Create trigger for updating updated_at
CREATE TRIGGER update_audit_sampling_plans_updated_at
  BEFORE UPDATE ON public.audit_sampling_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();