-- Create firm-specific standard accounts table
CREATE TABLE public.firm_standard_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_firm_id UUID NOT NULL,
  base_standard_account_id UUID REFERENCES public.standard_accounts(id),
  standard_number INTEGER NOT NULL,
  standard_name TEXT NOT NULL,
  account_type account_type NOT NULL,
  category TEXT,
  analysis_group TEXT,
  display_order INTEGER,
  line_type line_type NOT NULL DEFAULT 'detail',
  parent_line_id UUID REFERENCES public.firm_standard_accounts(id),
  calculation_formula TEXT,
  is_total_line BOOLEAN DEFAULT false,
  sign_multiplier INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false, -- true if created by firm, false if copied from global
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(audit_firm_id, standard_number)
);

-- Enable RLS
ALTER TABLE public.firm_standard_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view firm standard accounts for their firm" 
ON public.firm_standard_accounts 
FOR SELECT 
USING (audit_firm_id = get_user_firm(auth.uid()));

CREATE POLICY "Users can manage firm standard accounts for their firm" 
ON public.firm_standard_accounts 
FOR ALL 
USING (audit_firm_id = get_user_firm(auth.uid()))
WITH CHECK (audit_firm_id = get_user_firm(auth.uid()));

-- Create firm-specific account mapping rules
CREATE TABLE public.firm_account_mapping_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_firm_id UUID NOT NULL,
  base_rule_id UUID REFERENCES public.account_mapping_rules(id),
  rule_name TEXT NOT NULL,
  account_range_start INTEGER NOT NULL,
  account_range_end INTEGER NOT NULL,
  firm_standard_account_id UUID REFERENCES public.firm_standard_accounts(id),
  confidence_score NUMERIC DEFAULT 0.9,
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.firm_account_mapping_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view firm mapping rules for their firm" 
ON public.firm_account_mapping_rules 
FOR SELECT 
USING (audit_firm_id = get_user_firm(auth.uid()));

CREATE POLICY "Users can manage firm mapping rules for their firm" 
ON public.firm_account_mapping_rules 
FOR ALL 
USING (audit_firm_id = get_user_firm(auth.uid()))
WITH CHECK (audit_firm_id = get_user_firm(auth.uid()));

-- Create function to copy global standards to firm
CREATE OR REPLACE FUNCTION public.copy_global_standards_to_firm(p_audit_firm_id UUID)
RETURNS INTEGER AS $$
DECLARE
  copied_count INTEGER := 0;
  standard_record RECORD;
BEGIN
  -- Copy all global standard accounts to firm
  FOR standard_record IN 
    SELECT * FROM public.standard_accounts 
    WHERE is_active = true
    ORDER BY display_order, standard_number
  LOOP
    INSERT INTO public.firm_standard_accounts (
      audit_firm_id,
      base_standard_account_id,
      standard_number,
      standard_name,
      account_type,
      category,
      analysis_group,
      display_order,
      line_type,
      parent_line_id,
      calculation_formula,
      is_total_line,
      sign_multiplier,
      is_active,
      is_custom,
      created_by
    ) VALUES (
      p_audit_firm_id,
      standard_record.id,
      standard_record.standard_number,
      standard_record.standard_name,
      standard_record.account_type,
      standard_record.category,
      standard_record.analysis_group,
      standard_record.display_order,
      standard_record.line_type,
      NULL, -- Will be updated in second pass
      standard_record.calculation_formula,
      standard_record.is_total_line,
      standard_record.sign_multiplier,
      true,
      false,
      auth.uid()
    );
    
    copied_count := copied_count + 1;
  END LOOP;
  
  -- Update parent references for firm accounts
  UPDATE public.firm_standard_accounts fsa1
  SET parent_line_id = fsa2.id
  FROM public.firm_standard_accounts fsa2
  JOIN public.standard_accounts sa1 ON fsa1.base_standard_account_id = sa1.id
  JOIN public.standard_accounts sa2 ON fsa2.base_standard_account_id = sa2.id
  WHERE fsa1.audit_firm_id = p_audit_firm_id
    AND fsa2.audit_firm_id = p_audit_firm_id
    AND sa1.parent_line_id = sa2.id;
  
  RETURN copied_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Copy global mapping rules to firm
CREATE OR REPLACE FUNCTION public.copy_global_mapping_rules_to_firm(p_audit_firm_id UUID)
RETURNS INTEGER AS $$
DECLARE
  copied_count INTEGER := 0;
  rule_record RECORD;
  firm_account_id UUID;
BEGIN
  FOR rule_record IN 
    SELECT amr.*, sa.standard_number 
    FROM public.account_mapping_rules amr
    JOIN public.standard_accounts sa ON amr.standard_account_id = sa.id
    WHERE amr.is_active = true
  LOOP
    -- Find corresponding firm standard account
    SELECT id INTO firm_account_id
    FROM public.firm_standard_accounts
    WHERE audit_firm_id = p_audit_firm_id
      AND standard_number = rule_record.standard_number;
    
    IF firm_account_id IS NOT NULL THEN
      INSERT INTO public.firm_account_mapping_rules (
        audit_firm_id,
        base_rule_id,
        rule_name,
        account_range_start,
        account_range_end,
        firm_standard_account_id,
        confidence_score,
        is_active,
        is_custom,
        created_by
      ) VALUES (
        p_audit_firm_id,
        rule_record.id,
        rule_record.rule_name,
        rule_record.account_range_start,
        rule_record.account_range_end,
        firm_account_id,
        rule_record.confidence_score,
        true,
        false,
        auth.uid()
      );
      
      copied_count := copied_count + 1;
    END IF;
  END LOOP;
  
  RETURN copied_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_firm_standard_accounts_updated_at
  BEFORE UPDATE ON public.firm_standard_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_firm_account_mapping_rules_updated_at
  BEFORE UPDATE ON public.firm_account_mapping_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();