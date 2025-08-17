-- Phase 4: Budget Planning and Forecasting Tables

-- Budget templates for reusable budget structures
CREATE TABLE public.budget_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'annual' CHECK (template_type IN ('annual', 'monthly', 'quarterly')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Main budgets table
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  budget_name TEXT NOT NULL,
  budget_year INTEGER NOT NULL,
  budget_type TEXT NOT NULL DEFAULT 'operating' CHECK (budget_type IN ('operating', 'capital', 'cash_flow', 'master')),
  template_id UUID REFERENCES public.budget_templates(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'active', 'closed')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'NOK',
  total_revenue NUMERIC(15,2) DEFAULT 0,
  total_expenses NUMERIC(15,2) DEFAULT 0,
  net_income NUMERIC(15,2) DEFAULT 0,
  approval_date DATE,
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  version_number INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(client_id, budget_year, budget_type, version_number)
);

-- Budget line items (detailed budget entries)
CREATE TABLE public.budget_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('revenue', 'expense', 'asset', 'liability', 'equity')),
  budget_category TEXT, -- e.g., 'sales', 'marketing', 'operations'
  period_type TEXT NOT NULL DEFAULT 'monthly' CHECK (period_type IN ('annual', 'quarterly', 'monthly')),
  
  -- Budget amounts by period
  jan_amount NUMERIC(15,2) DEFAULT 0,
  feb_amount NUMERIC(15,2) DEFAULT 0,
  mar_amount NUMERIC(15,2) DEFAULT 0,
  apr_amount NUMERIC(15,2) DEFAULT 0,
  may_amount NUMERIC(15,2) DEFAULT 0,
  jun_amount NUMERIC(15,2) DEFAULT 0,
  jul_amount NUMERIC(15,2) DEFAULT 0,
  aug_amount NUMERIC(15,2) DEFAULT 0,
  sep_amount NUMERIC(15,2) DEFAULT 0,
  oct_amount NUMERIC(15,2) DEFAULT 0,
  nov_amount NUMERIC(15,2) DEFAULT 0,
  dec_amount NUMERIC(15,2) DEFAULT 0,
  
  total_annual_amount NUMERIC(15,2) GENERATED ALWAYS AS (
    jan_amount + feb_amount + mar_amount + apr_amount + 
    may_amount + jun_amount + jul_amount + aug_amount + 
    sep_amount + oct_amount + nov_amount + dec_amount
  ) STORED,
  
  notes TEXT,
  allocation_method TEXT DEFAULT 'manual' CHECK (allocation_method IN ('manual', 'even_split', 'seasonal', 'historical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Budget vs Actual comparison data
CREATE TABLE public.budget_actuals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_line_id UUID NOT NULL REFERENCES public.budget_lines(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  budgeted_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  actual_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  variance_amount NUMERIC(15,2) GENERATED ALWAYS AS (actual_amount - budgeted_amount) STORED,
  variance_percentage NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN budgeted_amount = 0 THEN 0
      ELSE ROUND(((actual_amount - budgeted_amount) / ABS(budgeted_amount)) * 100, 2)
    END
  ) STORED,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(budget_line_id, period_year, period_month)
);

-- Forecasting scenarios
CREATE TABLE public.forecast_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  scenario_name TEXT NOT NULL,
  scenario_type TEXT NOT NULL DEFAULT 'optimistic' CHECK (scenario_type IN ('pessimistic', 'realistic', 'optimistic')),
  base_budget_id UUID REFERENCES public.budgets(id),
  forecast_period_start DATE NOT NULL,
  forecast_period_end DATE NOT NULL,
  assumptions TEXT, -- JSON or text description of assumptions
  confidence_level NUMERIC(3,1) DEFAULT 75.0 CHECK (confidence_level BETWEEN 0 AND 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Forecast line items
CREATE TABLE public.forecast_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID NOT NULL REFERENCES public.forecast_scenarios(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  forecasted_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  growth_rate NUMERIC(5,2) DEFAULT 0, -- Monthly growth rate percentage
  calculation_method TEXT DEFAULT 'manual' CHECK (calculation_method IN ('manual', 'trend', 'seasonal', 'regression')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Variance analysis reports
CREATE TABLE public.variance_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  budget_id UUID NOT NULL REFERENCES public.budgets(id),
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'monthly' CHECK (report_type IN ('monthly', 'quarterly', 'ytd', 'annual')),
  summary_data JSONB NOT NULL DEFAULT '{}',
  significant_variances JSONB DEFAULT '[]', -- Array of significant variance items
  analysis_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_budgets_client_year ON public.budgets(client_id, budget_year);
CREATE INDEX idx_budget_lines_budget_id ON public.budget_lines(budget_id);
CREATE INDEX idx_budget_lines_account ON public.budget_lines(account_number, account_type);
CREATE INDEX idx_budget_actuals_period ON public.budget_actuals(period_year, period_month);
CREATE INDEX idx_forecast_scenarios_client ON public.forecast_scenarios(client_id);
CREATE INDEX idx_forecast_lines_scenario_period ON public.forecast_lines(scenario_id, period_year, period_month);
CREATE INDEX idx_variance_reports_client_period ON public.variance_reports(client_id, report_period_start, report_period_end);

-- RLS Policies
ALTER TABLE public.budget_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variance_reports ENABLE ROW LEVEL SECURITY;

-- Budget Templates Policies
CREATE POLICY "Everyone can view budget templates" 
ON public.budget_templates FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create budget templates" 
ON public.budget_templates FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their budget templates" 
ON public.budget_templates FOR UPDATE 
USING (created_by = auth.uid());

-- Budgets Policies
CREATE POLICY "Users can manage budgets for their clients" 
ON public.budgets FOR ALL 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

-- Budget Lines Policies  
CREATE POLICY "Users can manage budget lines for their budgets" 
ON public.budget_lines FOR ALL 
USING (budget_id IN (
  SELECT b.id FROM public.budgets b 
  JOIN clients c ON b.client_id = c.id 
  WHERE c.user_id = auth.uid()
));

-- Budget Actuals Policies
CREATE POLICY "Users can manage budget actuals for their budgets" 
ON public.budget_actuals FOR ALL 
USING (budget_line_id IN (
  SELECT bl.id FROM public.budget_lines bl 
  JOIN public.budgets b ON bl.budget_id = b.id 
  JOIN clients c ON b.client_id = c.id 
  WHERE c.user_id = auth.uid()
));

-- Forecast Scenarios Policies
CREATE POLICY "Users can manage forecast scenarios for their clients" 
ON public.forecast_scenarios FOR ALL 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

-- Forecast Lines Policies
CREATE POLICY "Users can manage forecast lines for their scenarios" 
ON public.forecast_lines FOR ALL 
USING (scenario_id IN (
  SELECT fs.id FROM public.forecast_scenarios fs 
  JOIN clients c ON fs.client_id = c.id 
  WHERE c.user_id = auth.uid()
));

-- Variance Reports Policies
CREATE POLICY "Users can manage variance reports for their clients" 
ON public.variance_reports FOR ALL 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

-- Triggers for updated_at
CREATE TRIGGER update_budget_templates_updated_at
  BEFORE UPDATE ON public.budget_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_lines_updated_at
  BEFORE UPDATE ON public.budget_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forecast_scenarios_updated_at
  BEFORE UPDATE ON public.forecast_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Functions for budget calculations
CREATE OR REPLACE FUNCTION public.calculate_budget_totals(p_budget_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.budgets 
  SET 
    total_revenue = (
      SELECT COALESCE(SUM(total_annual_amount), 0) 
      FROM public.budget_lines 
      WHERE budget_id = p_budget_id AND account_type = 'revenue'
    ),
    total_expenses = (
      SELECT COALESCE(SUM(total_annual_amount), 0) 
      FROM public.budget_lines 
      WHERE budget_id = p_budget_id AND account_type = 'expense'
    ),
    updated_at = now()
  WHERE id = p_budget_id;
  
  -- Calculate net income
  UPDATE public.budgets 
  SET net_income = total_revenue - total_expenses
  WHERE id = p_budget_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get budget summary
CREATE OR REPLACE FUNCTION public.get_budget_summary(p_client_id UUID, p_budget_year INTEGER)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_budgets', COUNT(*),
    'active_budgets', COUNT(*) FILTER (WHERE is_active = true),
    'draft_budgets', COUNT(*) FILTER (WHERE status = 'draft'),
    'approved_budgets', COUNT(*) FILTER (WHERE status = 'approved'),
    'total_revenue_budget', COALESCE(SUM(total_revenue) FILTER (WHERE is_active = true), 0),
    'total_expense_budget', COALESCE(SUM(total_expenses) FILTER (WHERE is_active = true), 0),
    'projected_net_income', COALESCE(SUM(net_income) FILTER (WHERE is_active = true), 0)
  ) INTO result
  FROM public.budgets
  WHERE client_id = p_client_id 
    AND budget_year = p_budget_year;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update budget actuals from transaction data
CREATE OR REPLACE FUNCTION public.sync_budget_actuals(p_budget_id UUID, p_year INTEGER, p_month INTEGER)
RETURNS INTEGER AS $$
DECLARE
  synced_count INTEGER := 0;
  line_record RECORD;
  actual_amount NUMERIC(15,2);
BEGIN
  -- Loop through budget lines and calculate actuals
  FOR line_record IN 
    SELECT id, account_number, account_type 
    FROM public.budget_lines 
    WHERE budget_id = p_budget_id
  LOOP
    -- This would typically join with general_ledger_transactions or similar
    -- For now, we'll use a placeholder calculation
    actual_amount := 0;
    
    -- Insert or update budget actuals
    INSERT INTO public.budget_actuals (
      budget_line_id, period_year, period_month, 
      budgeted_amount, actual_amount
    ) VALUES (
      line_record.id, p_year, p_month,
      -- Get budgeted amount for the specific month
      CASE p_month
        WHEN 1 THEN (SELECT jan_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 2 THEN (SELECT feb_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 3 THEN (SELECT mar_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 4 THEN (SELECT apr_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 5 THEN (SELECT may_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 6 THEN (SELECT jun_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 7 THEN (SELECT jul_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 8 THEN (SELECT aug_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 9 THEN (SELECT sep_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 10 THEN (SELECT oct_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 11 THEN (SELECT nov_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 12 THEN (SELECT dec_amount FROM public.budget_lines WHERE id = line_record.id)
        ELSE 0
      END,
      actual_amount
    )
    ON CONFLICT (budget_line_id, period_year, period_month)
    DO UPDATE SET 
      actual_amount = EXCLUDED.actual_amount,
      last_updated = now();
    
    synced_count := synced_count + 1;
  END LOOP;
  
  RETURN synced_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;