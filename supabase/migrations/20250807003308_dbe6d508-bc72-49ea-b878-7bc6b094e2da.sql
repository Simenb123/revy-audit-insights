-- Create table for firm-specific formula definitions
CREATE TABLE public.firm_formula_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_firm_id UUID REFERENCES public.audit_firms(id) ON DELETE CASCADE,
  base_formula_id UUID REFERENCES public.formula_definitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'custom',
  formula_expression JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure unique formula names per firm
  UNIQUE(audit_firm_id, name)
);

-- Enable RLS
ALTER TABLE public.firm_formula_definitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view formulas in their firm"
ON public.firm_formula_definitions
FOR SELECT
USING (audit_firm_id = get_user_firm(auth.uid()) OR is_active = true);

CREATE POLICY "Users can create formulas in their firm"
ON public.firm_formula_definitions
FOR INSERT
WITH CHECK (audit_firm_id = get_user_firm(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can update formulas in their firm"
ON public.firm_formula_definitions
FOR UPDATE
USING (audit_firm_id = get_user_firm(auth.uid()) AND (created_by = auth.uid() OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])));

-- Add trigger for updated_at
CREATE TRIGGER update_firm_formula_definitions_updated_at
  BEFORE UPDATE ON public.firm_formula_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add categories to global formula_definitions table
ALTER TABLE public.formula_definitions 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'financial_ratios';

-- Update existing formulas with categories
UPDATE public.formula_definitions 
SET category = CASE 
  WHEN name LIKE '%margin%' OR name LIKE '%profit%' THEN 'profitability'
  WHEN name LIKE '%ratio%' OR name LIKE '%liquidity%' THEN 'liquidity'
  WHEN name LIKE '%equity%' OR name LIKE '%debt%' THEN 'solvency'
  ELSE 'financial_ratios'
END
WHERE category = 'financial_ratios' OR category IS NULL;