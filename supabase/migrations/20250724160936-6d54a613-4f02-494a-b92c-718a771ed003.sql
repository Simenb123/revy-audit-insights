-- Create comprehensive database structure for AI and analytics

-- 1. Formula definitions table for reusable formulas
CREATE TABLE public.formula_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  formula_expression jsonb NOT NULL,
  category text,
  is_system_formula boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 2. Formula variables table for named variables/KPIs
CREATE TABLE public.formula_variables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  display_name text NOT NULL,
  description text,
  variable_type text NOT NULL DEFAULT 'account_reference', -- account_reference, constant, calculated
  value_expression jsonb,
  data_type text NOT NULL DEFAULT 'numeric', -- numeric, percentage, currency
  category text,
  is_system_variable boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3. Account relationships table for hierarchical and analytical relationships
CREATE TABLE public.account_relationships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_account_id uuid REFERENCES public.standard_accounts(id),
  child_account_id uuid REFERENCES public.standard_accounts(id),
  relationship_type text NOT NULL, -- hierarchy, aggregation, dependency, analytical
  weight numeric DEFAULT 1.0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(parent_account_id, child_account_id, relationship_type)
);

-- 4. Formula usage tracking for AI/ML
CREATE TABLE public.formula_usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formula_id uuid REFERENCES public.formula_definitions(id),
  account_id uuid REFERENCES public.standard_accounts(id),
  client_id uuid,
  user_id uuid REFERENCES auth.users(id),
  usage_context text, -- financial_statement, analysis, audit_procedure
  execution_time_ms integer,
  result_value numeric,
  input_values jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  session_id text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 5. Add enhanced metadata to standard_accounts for AI/ML
ALTER TABLE public.standard_accounts 
ADD COLUMN complexity_score integer DEFAULT 1,
ADD COLUMN ai_tags text[] DEFAULT '{}',
ADD COLUMN usage_frequency integer DEFAULT 0,
ADD COLUMN last_used_at timestamp with time zone,
ADD COLUMN validation_rules jsonb DEFAULT '{}'::jsonb,
ADD COLUMN business_rules jsonb DEFAULT '{}'::jsonb,
ADD COLUMN audit_significance text DEFAULT 'low', -- low, medium, high, critical
ADD COLUMN ml_features jsonb DEFAULT '{}'::jsonb;

-- 6. Create indexes for performance
CREATE INDEX idx_formula_definitions_category ON public.formula_definitions(category);
CREATE INDEX idx_formula_definitions_active ON public.formula_definitions(is_active);
CREATE INDEX idx_formula_variables_type ON public.formula_variables(variable_type);
CREATE INDEX idx_formula_variables_active ON public.formula_variables(is_active);
CREATE INDEX idx_account_relationships_parent ON public.account_relationships(parent_account_id);
CREATE INDEX idx_account_relationships_child ON public.account_relationships(child_account_id);
CREATE INDEX idx_account_relationships_type ON public.account_relationships(relationship_type);
CREATE INDEX idx_formula_usage_context ON public.formula_usage_logs(usage_context);
CREATE INDEX idx_formula_usage_client ON public.formula_usage_logs(client_id);
CREATE INDEX idx_standard_accounts_ai_tags ON public.standard_accounts USING GIN(ai_tags);
CREATE INDEX idx_standard_accounts_complexity ON public.standard_accounts(complexity_score);
CREATE INDEX idx_standard_accounts_audit_sig ON public.standard_accounts(audit_significance);

-- 7. Enable RLS on new tables
ALTER TABLE public.formula_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_usage_logs ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
CREATE POLICY "Users can view system and own formulas" ON public.formula_definitions
FOR SELECT USING (is_system_formula = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own formulas" ON public.formula_definitions
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own formulas" ON public.formula_definitions
FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can view system and own variables" ON public.formula_variables
FOR SELECT USING (is_system_variable = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own variables" ON public.formula_variables
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own variables" ON public.formula_variables
FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can view all account relationships" ON public.account_relationships
FOR SELECT USING (true);

CREATE POLICY "Admins can manage account relationships" ON public.account_relationships
FOR ALL USING (auth.uid() IN (
  SELECT id FROM public.profiles 
  WHERE user_role IN ('admin', 'partner', 'manager')
));

CREATE POLICY "Users can view their own usage logs" ON public.formula_usage_logs
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert usage logs" ON public.formula_usage_logs
FOR INSERT WITH CHECK (true);

-- 9. Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_formula_definitions_updated_at
BEFORE UPDATE ON public.formula_definitions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_formula_variables_updated_at
BEFORE UPDATE ON public.formula_variables
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_account_relationships_updated_at
BEFORE UPDATE ON public.account_relationships
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Insert some system formulas and variables
INSERT INTO public.formula_variables (name, display_name, description, variable_type, data_type, category, is_system_variable) VALUES
('gross_profit_margin', 'Bruttofortjenestegrad', 'Bruttofortjeneste i prosent av omsetning', 'calculated', 'percentage', 'profitability', true),
('operating_margin', 'Driftsgrad', 'Driftsresultat i prosent av omsetning', 'calculated', 'percentage', 'profitability', true),
('equity_ratio', 'Egenkapitalandel', 'Egenkapital i prosent av totalkapital', 'calculated', 'percentage', 'solvency', true),
('current_ratio', 'Likviditetsgrad 1', 'Omløpsmidler delt på kortsiktig gjeld', 'calculated', 'numeric', 'liquidity', true),
('debt_ratio', 'Gjeldsgrad', 'Total gjeld i prosent av totalkapital', 'calculated', 'percentage', 'solvency', true);

INSERT INTO public.formula_definitions (name, description, formula_expression, category, is_system_formula) VALUES
('gross_profit_calculation', 'Standard bruttofortjenesteberegning', 
'{"type": "formula", "expression": "revenue - cost_of_goods_sold", "variables": ["revenue", "cost_of_goods_sold"]}', 
'profitability', true),
('working_capital', 'Arbeidskapitalberegning', 
'{"type": "formula", "expression": "current_assets - current_liabilities", "variables": ["current_assets", "current_liabilities"]}', 
'liquidity', true);