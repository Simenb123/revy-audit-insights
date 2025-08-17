-- Create bank statements table for reconciliation
CREATE TABLE public.bank_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  bank_account_number TEXT NOT NULL,
  statement_date DATE NOT NULL,
  opening_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'NOK',
  statement_reference TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bank transactions table
CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_statement_id UUID NOT NULL REFERENCES public.bank_statements(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  value_date DATE,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  balance_after NUMERIC(15,2),
  reference_number TEXT,
  transaction_type TEXT,
  journal_entry_line_id UUID REFERENCES public.journal_entry_lines(id),
  reconciliation_status TEXT NOT NULL DEFAULT 'unreconciled' CHECK (reconciliation_status IN ('unreconciled', 'matched', 'suggested', 'manual')),
  reconciled_at TIMESTAMP WITH TIME ZONE,
  reconciled_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reconciliation suggestions table
CREATE TABLE public.reconciliation_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_transaction_id UUID NOT NULL REFERENCES public.bank_transactions(id) ON DELETE CASCADE,
  journal_entry_line_id UUID NOT NULL REFERENCES public.journal_entry_lines(id) ON DELETE CASCADE,
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  match_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  decided_at TIMESTAMP WITH TIME ZONE,
  decided_by UUID
);

-- Create financial reports cache table
CREATE TABLE public.financial_reports_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('income_statement', 'balance_sheet', 'trial_balance', 'cash_flow')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  report_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  parameters JSONB DEFAULT '{}',
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reports_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_statements
CREATE POLICY "Users can manage bank statements for their clients"
ON public.bank_statements FOR ALL
USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

-- RLS Policies for bank_transactions
CREATE POLICY "Users can manage bank transactions for their clients"
ON public.bank_transactions FOR ALL
USING (bank_statement_id IN (
  SELECT bs.id FROM public.bank_statements bs
  JOIN public.clients c ON bs.client_id = c.id
  WHERE c.user_id = auth.uid()
));

-- RLS Policies for reconciliation_suggestions
CREATE POLICY "Users can manage reconciliation suggestions for their clients"
ON public.reconciliation_suggestions FOR ALL
USING (bank_transaction_id IN (
  SELECT bt.id FROM public.bank_transactions bt
  JOIN public.bank_statements bs ON bt.bank_statement_id = bs.id
  JOIN public.clients c ON bs.client_id = c.id
  WHERE c.user_id = auth.uid()
));

-- RLS Policies for financial_reports_cache
CREATE POLICY "Users can manage financial reports for their clients"
ON public.financial_reports_cache FOR ALL
USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_bank_statements_client_date ON public.bank_statements(client_id, statement_date);
CREATE INDEX idx_bank_transactions_statement_date ON public.bank_transactions(bank_statement_id, transaction_date);
CREATE INDEX idx_bank_transactions_reconciliation ON public.bank_transactions(reconciliation_status, transaction_date);
CREATE INDEX idx_reconciliation_suggestions_status ON public.reconciliation_suggestions(status, confidence_score DESC);
CREATE INDEX idx_financial_reports_cache_lookup ON public.financial_reports_cache(client_id, report_type, period_start, period_end);
CREATE INDEX idx_financial_reports_cache_expires ON public.financial_reports_cache(expires_at);

-- Function to generate income statement
CREATE OR REPLACE FUNCTION public.generate_income_statement(
  p_client_id UUID,
  p_period_start DATE,
  p_period_end DATE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'revenue', revenue_data,
    'expenses', expense_data,
    'net_income', COALESCE(revenue_data->>'total', '0')::NUMERIC - COALESCE(expense_data->>'total', '0')::NUMERIC,
    'period_start', p_period_start,
    'period_end', p_period_end,
    'generated_at', now()
  ) INTO result
  FROM (
    SELECT 
      jsonb_build_object(
        'total', COALESCE(SUM(CASE WHEN coa.account_type = 'revenue' THEN jel.credit_amount - jel.debit_amount ELSE 0 END), 0),
        'accounts', jsonb_agg(
          jsonb_build_object(
            'account_number', coa.account_number,
            'account_name', coa.account_name,
            'amount', SUM(jel.credit_amount - jel.debit_amount)
          ) ORDER BY coa.account_number
        ) FILTER (WHERE coa.account_type = 'revenue')
      ) as revenue_data,
      jsonb_build_object(
        'total', COALESCE(SUM(CASE WHEN coa.account_type = 'expense' THEN jel.debit_amount - jel.credit_amount ELSE 0 END), 0),
        'accounts', jsonb_agg(
          jsonb_build_object(
            'account_number', coa.account_number,
            'account_name', coa.account_name,
            'amount', SUM(jel.debit_amount - jel.credit_amount)
          ) ORDER BY coa.account_number
        ) FILTER (WHERE coa.account_type = 'expense')
      ) as expense_data
    FROM public.journal_entry_lines jel
    JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    JOIN public.client_chart_of_accounts coa ON jel.account_id = coa.id
    WHERE je.client_id = p_client_id
      AND je.voucher_date BETWEEN p_period_start AND p_period_end
      AND je.status = 'posted'
      AND coa.account_type IN ('revenue', 'expense')
  ) subquery;
  
  RETURN result;
END;
$$;

-- Function to generate balance sheet
CREATE OR REPLACE FUNCTION public.generate_balance_sheet(
  p_client_id UUID,
  p_as_of_date DATE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'assets', assets_data,
    'liabilities', liabilities_data,
    'equity', equity_data,
    'as_of_date', p_as_of_date,
    'generated_at', now()
  ) INTO result
  FROM (
    SELECT 
      jsonb_build_object(
        'total', COALESCE(SUM(CASE WHEN coa.account_type = 'asset' THEN jel.debit_amount - jel.credit_amount ELSE 0 END), 0),
        'accounts', jsonb_agg(
          jsonb_build_object(
            'account_number', coa.account_number,
            'account_name', coa.account_name,
            'amount', SUM(jel.debit_amount - jel.credit_amount)
          ) ORDER BY coa.account_number
        ) FILTER (WHERE coa.account_type = 'asset')
      ) as assets_data,
      jsonb_build_object(
        'total', COALESCE(SUM(CASE WHEN coa.account_type = 'liability' THEN jel.credit_amount - jel.debit_amount ELSE 0 END), 0),
        'accounts', jsonb_agg(
          jsonb_build_object(
            'account_number', coa.account_number,
            'account_name', coa.account_name,
            'amount', SUM(jel.credit_amount - jel.debit_amount)
          ) ORDER BY coa.account_number
        ) FILTER (WHERE coa.account_type = 'liability')
      ) as liabilities_data,
      jsonb_build_object(
        'total', COALESCE(SUM(CASE WHEN coa.account_type = 'equity' THEN jel.credit_amount - jel.debit_amount ELSE 0 END), 0),
        'accounts', jsonb_agg(
          jsonb_build_object(
            'account_number', coa.account_number,
            'account_name', coa.account_name,
            'amount', SUM(jel.credit_amount - jel.debit_amount)
          ) ORDER BY coa.account_number
        ) FILTER (WHERE coa.account_type = 'equity')
      ) as equity_data
    FROM public.journal_entry_lines jel
    JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    JOIN public.client_chart_of_accounts coa ON jel.account_id = coa.id
    WHERE je.client_id = p_client_id
      AND je.voucher_date <= p_as_of_date
      AND je.status = 'posted'
      AND coa.account_type IN ('asset', 'liability', 'equity')
  ) subquery;
  
  RETURN result;
END;
$$;

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION public.cleanup_expired_financial_reports()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.financial_reports_cache 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;