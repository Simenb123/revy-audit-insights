
-- Add accounting periods table
CREATE TABLE public.accounting_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'calendar' CHECK (period_type IN ('calendar', 'interim', 'fiscal')),
  fiscal_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  description TEXT,
  UNIQUE(client_id, fiscal_year, period_type)
);

-- Add accounting data versions table
CREATE TABLE public.accounting_data_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  accounting_period_id UUID NOT NULL REFERENCES public.accounting_periods(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  parent_version_id UUID REFERENCES public.accounting_data_versions(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  change_description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_type TEXT NOT NULL CHECK (data_type IN ('chart_of_accounts', 'trial_balance', 'general_ledger', 'mappings')),
  UNIQUE(client_id, accounting_period_id, data_type, version_number)
);

-- Add account audit notes table
CREATE TABLE public.account_audit_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.client_chart_of_accounts(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.accounting_data_versions(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL DEFAULT 'comment' CHECK (note_type IN ('comment', 'risk', 'procedure', 'analysis')),
  note_content TEXT NOT NULL,
  is_carried_forward BOOLEAN NOT NULL DEFAULT false,
  priority_level TEXT DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add transaction line details table
CREATE TABLE public.transaction_line_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.general_ledger_transactions(id) ON DELETE CASCADE,
  line_description TEXT,
  audit_comments TEXT,
  risk_assessment TEXT CHECK (risk_assessment IN ('low', 'medium', 'high', 'critical')),
  supporting_documents JSONB DEFAULT '[]'::jsonb,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'exception', 'resolved')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add balance line analysis table
CREATE TABLE public.balance_line_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  trial_balance_id UUID REFERENCES public.trial_balances(id) ON DELETE CASCADE,
  analysis_notes TEXT,
  variance_explanation TEXT,
  prior_year_comparison JSONB,
  audit_procedures_applied TEXT[],
  materiality_assessment TEXT CHECK (materiality_assessment IN ('immaterial', 'material', 'significant')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add analysis templates table for future Python integration
CREATE TABLE public.analysis_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('ratio_analysis', 'variance_analysis', 'trend_analysis', 'custom')),
  python_script_ref TEXT,
  parameters JSONB DEFAULT '{}'::jsonb,
  applicable_account_types TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  audit_firm_id UUID REFERENCES public.audit_firms(id),
  is_system_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Extend account_mappings table with new columns
ALTER TABLE public.account_mappings 
ADD COLUMN version_id UUID REFERENCES public.accounting_data_versions(id),
ADD COLUMN related_party_flag BOOLEAN DEFAULT false,
ADD COLUMN estimate_flag BOOLEAN DEFAULT false,
ADD COLUMN audit_focus_area TEXT CHECK (audit_focus_area IN ('low_risk', 'medium_risk', 'high_risk', 'key_audit_matter')),
ADD COLUMN mapping_notes TEXT,
ADD COLUMN last_reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN last_reviewed_at TIMESTAMP WITH TIME ZONE;

-- Extend trial_balances table to support versioning and periods
ALTER TABLE public.trial_balances 
ADD COLUMN accounting_period_id UUID REFERENCES public.accounting_periods(id),
ADD COLUMN version_id UUID REFERENCES public.accounting_data_versions(id),
ADD COLUMN prior_year_balance DECIMAL(15,2),
ADD COLUMN variance_amount DECIMAL(15,2),
ADD COLUMN variance_percentage DECIMAL(5,2);

-- Extend general_ledger_transactions table
ALTER TABLE public.general_ledger_transactions 
ADD COLUMN accounting_period_id UUID REFERENCES public.accounting_periods(id),
ADD COLUMN version_id UUID REFERENCES public.accounting_data_versions(id),
ADD COLUMN transaction_source TEXT DEFAULT 'import' CHECK (transaction_source IN ('import', 'manual', 'adjustment')),
ADD COLUMN audit_trail JSONB DEFAULT '{}'::jsonb;

-- Add updated_at trigger to new tables
CREATE TRIGGER accounting_periods_updated_at 
  BEFORE UPDATE ON public.accounting_periods 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER account_audit_notes_updated_at 
  BEFORE UPDATE ON public.account_audit_notes 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER transaction_line_details_updated_at 
  BEFORE UPDATE ON public.transaction_line_details 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER balance_line_analysis_updated_at 
  BEFORE UPDATE ON public.balance_line_analysis 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER analysis_templates_updated_at 
  BEFORE UPDATE ON public.analysis_templates 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add RLS policies for new tables
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_data_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_audit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_line_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_line_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for accounting_periods
CREATE POLICY "Users can manage their clients' accounting periods" 
  ON public.accounting_periods 
  FOR ALL 
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS policies for accounting_data_versions
CREATE POLICY "Users can manage their clients' data versions" 
  ON public.accounting_data_versions 
  FOR ALL 
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS policies for account_audit_notes
CREATE POLICY "Users can manage their clients' audit notes" 
  ON public.account_audit_notes 
  FOR ALL 
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS policies for transaction_line_details
CREATE POLICY "Users can manage their clients' transaction details" 
  ON public.transaction_line_details 
  FOR ALL 
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS policies for balance_line_analysis
CREATE POLICY "Users can manage their clients' balance analysis" 
  ON public.balance_line_analysis 
  FOR ALL 
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS policies for analysis_templates
CREATE POLICY "Users can view analysis templates for their firm" 
  ON public.analysis_templates 
  FOR SELECT 
  USING (audit_firm_id = get_user_firm(auth.uid()) OR is_system_template = true OR audit_firm_id IS NULL);

CREATE POLICY "Users can create analysis templates for their firm" 
  ON public.analysis_templates 
  FOR INSERT 
  WITH CHECK (audit_firm_id = get_user_firm(auth.uid()) AND created_by = auth.uid());

-- Add indexes for performance
CREATE INDEX idx_accounting_periods_client_fiscal_year ON public.accounting_periods(client_id, fiscal_year);
CREATE INDEX idx_accounting_data_versions_period ON public.accounting_data_versions(accounting_period_id, is_active);
CREATE INDEX idx_account_audit_notes_account ON public.account_audit_notes(account_id, version_id);
CREATE INDEX idx_transaction_line_details_transaction ON public.transaction_line_details(transaction_id);
CREATE INDEX idx_balance_line_analysis_trial_balance ON public.balance_line_analysis(trial_balance_id);
CREATE INDEX idx_analysis_templates_type ON public.analysis_templates(template_type, is_active);

-- Function to automatically suggest fiscal year based on current date
CREATE OR REPLACE FUNCTION public.suggest_fiscal_year()
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT CASE 
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 8 THEN EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
    ELSE (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::INTEGER
  END;
$$;

-- Function to create default accounting period for a client
CREATE OR REPLACE FUNCTION public.create_default_accounting_period(
  p_client_id UUID,
  p_fiscal_year INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fiscal_year INTEGER;
  v_period_id UUID;
BEGIN
  -- Use provided fiscal year or suggest one
  v_fiscal_year := COALESCE(p_fiscal_year, suggest_fiscal_year());
  
  -- Create the accounting period
  INSERT INTO public.accounting_periods (
    client_id,
    period_start,
    period_end,
    period_type,
    fiscal_year,
    status,
    created_by,
    description
  ) VALUES (
    p_client_id,
    MAKE_DATE(v_fiscal_year, 8, 1),  -- August 1st
    MAKE_DATE(v_fiscal_year + 1, 7, 31),  -- July 31st next year
    'fiscal',
    v_fiscal_year,
    'draft',
    auth.uid(),
    'Revisjonsår ' || v_fiscal_year
  ) RETURNING id INTO v_period_id;
  
  RETURN v_period_id;
END;
$$;
