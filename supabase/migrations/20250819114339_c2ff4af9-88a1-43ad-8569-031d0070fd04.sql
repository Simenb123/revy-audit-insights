-- Create audit_sampling_plans table
CREATE TABLE public.audit_sampling_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  sampling_method TEXT NOT NULL DEFAULT 'systematic_random',
  population_source TEXT NOT NULL DEFAULT 'accounting_lines',
  selected_standard_numbers TEXT[] DEFAULT '{}',
  excluded_account_numbers TEXT[] DEFAULT '{}',
  population_size INTEGER NOT NULL DEFAULT 0,
  population_sum NUMERIC(15,2) NOT NULL DEFAULT 0,
  sample_size INTEGER NOT NULL DEFAULT 0,
  confidence_level NUMERIC(5,2) DEFAULT 95.0,
  tolerable_error NUMERIC(15,2) DEFAULT 0,
  expected_error NUMERIC(15,2) DEFAULT 0,
  version_id UUID,
  fiscal_year INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_sampling_items table
CREATE TABLE public.audit_sampling_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sampling_plan_id UUID NOT NULL REFERENCES public.audit_sampling_plans(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'account',
  account_id TEXT,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  balance_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  interval_value NUMERIC(15,2),
  random_start NUMERIC(15,2),
  selection_reason TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  sample_order INTEGER,
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
USING (sampling_plan_id IN (
  SELECT asp.id FROM public.audit_sampling_plans asp
  JOIN clients c ON asp.client_id = c.id
  WHERE c.user_id = auth.uid()
))
WITH CHECK (sampling_plan_id IN (
  SELECT asp.id FROM public.audit_sampling_plans asp
  JOIN clients c ON asp.client_id = c.id
  WHERE c.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_audit_sampling_plans_client_id ON public.audit_sampling_plans(client_id);
CREATE INDEX idx_audit_sampling_plans_fiscal_year ON public.audit_sampling_plans(fiscal_year);
CREATE INDEX idx_audit_sampling_items_plan_id ON public.audit_sampling_items(sampling_plan_id);
CREATE INDEX idx_audit_sampling_items_account_number ON public.audit_sampling_items(account_number);

-- Create trigger for updating updated_at
CREATE TRIGGER update_audit_sampling_plans_updated_at
  BEFORE UPDATE ON public.audit_sampling_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();