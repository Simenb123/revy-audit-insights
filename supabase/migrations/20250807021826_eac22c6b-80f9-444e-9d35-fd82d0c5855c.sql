-- Create formula_variables table for storing predefined calculation formulas
CREATE TABLE public.formula_variables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  formula_expression TEXT NOT NULL,
  variable_type TEXT NOT NULL DEFAULT 'ratio', -- ratio, amount, percentage
  category TEXT NOT NULL DEFAULT 'financial', -- financial, operational, liquidity
  is_system_variable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.formula_variables ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view formula variables" 
ON public.formula_variables 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage formula variables" 
ON public.formula_variables 
FOR ALL 
USING (auth.uid() IN (
  SELECT p.id FROM profiles p 
  WHERE p.user_role = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type])
))
WITH CHECK (auth.uid() IN (
  SELECT p.id FROM profiles p 
  WHERE p.user_role = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type])
));

-- Create client_formula_overrides table for client-specific formula customizations
CREATE TABLE public.client_formula_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  formula_variable_id UUID NOT NULL REFERENCES public.formula_variables(id) ON DELETE CASCADE,
  custom_formula_expression TEXT NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, formula_variable_id)
);

-- Enable RLS
ALTER TABLE public.client_formula_overrides ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage formula overrides for their clients" 
ON public.client_formula_overrides 
FOR ALL 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
))
WITH CHECK (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_formula_variables_updated_at
  BEFORE UPDATE ON public.formula_variables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_formula_overrides_updated_at
  BEFORE UPDATE ON public.client_formula_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert system formula variables
INSERT INTO public.formula_variables (name, display_name, description, formula_expression, variable_type, category) VALUES
('liquidity_ratio', 'Likviditetsgrad', 'Omløpsmidler / Kortsiktig gjeld', 'SUM(1[1-9]:)/SUM(2[1-4]:)', 'ratio', 'liquidity'),
('equity_ratio', 'Egenkapitalandel', 'Egenkapital / Sum eiendeler * 100', 'SUM(2[0-2]:)/SUM(1:)*100', 'percentage', 'financial'),
('profit_margin', 'Resultatgrad', 'Driftsresultat / Driftsinntekter * 100', 'SUM(3:)/SUM(3:)*100', 'percentage', 'financial'),
('current_assets', 'Omløpsmidler', 'Sum av omløpsmidler', 'SUM(1[1-9]:)', 'amount', 'financial'),
('current_liabilities', 'Kortsiktig gjeld', 'Sum av kortsiktig gjeld', 'SUM(2[1-4]:)', 'amount', 'financial'),
('total_assets', 'Sum eiendeler', 'Total sum eiendeler', 'SUM(1:)', 'amount', 'financial'),
('total_equity', 'Egenkapital', 'Total egenkapital', 'SUM(2[0-2]:)', 'amount', 'financial'),
('revenue', 'Driftsinntekter', 'Sum driftsinntekter', 'SUM(3:)', 'amount', 'operational'),
('expenses', 'Driftskostnader', 'Sum driftskostnader', 'SUM(4:,5:)', 'amount', 'operational'),
('operating_result', 'Driftsresultat', 'Driftsinntekter - Driftskostnader', 'SUM(3:) + SUM(4:,5:)', 'amount', 'operational');

-- Fix trial_balance_mappings table to use proper mapping
-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_trial_balance_mappings_client_account 
ON public.trial_balance_mappings(client_id, account_number);

CREATE INDEX IF NOT EXISTS idx_account_classifications_client_account 
ON public.account_classifications(client_id, account_number, is_active);