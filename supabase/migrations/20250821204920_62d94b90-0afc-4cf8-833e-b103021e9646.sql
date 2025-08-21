-- Final Security Fix: Complete all remaining functions with SET search_path

-- These functions still need SET search_path = '' based on the security scan
CREATE OR REPLACE FUNCTION public.set_updated_at_report_builder_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_audit_firm_claim_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.claimed_by IS NULL THEN
    NEW.claimed_by := auth.uid();
  END IF;
  IF NEW.claimed_at IS NULL THEN
    NEW.claimed_at := now();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_amount_statistics(p_client_id uuid, p_version_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_count', COUNT(*),
    'sum', SUM(COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)),
    'average', AVG(COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)),
    'min', MIN(COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)),
    'max', MAX(COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)),
    'positive_count', COUNT(*) FILTER (WHERE (COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)) > 0),
    'negative_count', COUNT(*) FILTER (WHERE (COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)) < 0)
  ) INTO result
  FROM public.general_ledger_transactions
  WHERE client_id = p_client_id 
    AND version_id = p_version_id;
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_income_statement(p_client_id uuid, p_period_start date, p_period_end date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.generate_balance_sheet(p_client_id uuid, p_as_of_date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_financial_reports()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.financial_reports_cache 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.find_time_logic_issues(p_client_id uuid, p_version_id uuid)
RETURNS TABLE(transaction_id uuid, voucher_number text, transaction_date date, issue_type text, issue_description text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    glt.id,
    glt.voucher_number,
    glt.transaction_date,
    CASE 
      WHEN glt.transaction_date > CURRENT_DATE THEN 'future_date'
      WHEN glt.transaction_date < CURRENT_DATE - INTERVAL '5 years' THEN 'very_old_date'
      WHEN EXTRACT(DOW FROM glt.transaction_date) IN (0, 6) THEN 'weekend_posting'
      WHEN TO_CHAR(glt.transaction_date, 'MM-DD') IN ('01-01', '05-01', '05-17', '12-25', '12-26') THEN 'holiday_posting'
      ELSE 'other'
    END as issue_type,
    CASE 
      WHEN glt.transaction_date > CURRENT_DATE THEN 'Transaksjon datert i fremtiden'
      WHEN glt.transaction_date < CURRENT_DATE - INTERVAL '5 years' THEN 'Transaksjon mer enn 5 år gammel'
      WHEN EXTRACT(DOW FROM glt.transaction_date) IN (0, 6) THEN 'Transaksjon postert på helg'
      WHEN TO_CHAR(glt.transaction_date, 'MM-DD') IN ('01-01', '05-01', '05-17', '12-25', '12-26') THEN 'Transaksjon postert på helligdag'
      ELSE 'Annet tidsproblem'
    END as issue_description
  FROM public.general_ledger_transactions glt
  WHERE glt.client_id = p_client_id 
    AND glt.version_id = p_version_id
    AND (
      glt.transaction_date > CURRENT_DATE OR
      glt.transaction_date < CURRENT_DATE - INTERVAL '5 years' OR
      EXTRACT(DOW FROM glt.transaction_date) IN (0, 6) OR
      TO_CHAR(glt.transaction_date, 'MM-DD') IN ('01-01', '05-01', '05-17', '12-25', '12-26')
    )
  ORDER BY 
    CASE issue_type
      WHEN 'future_date' THEN 1
      WHEN 'holiday_posting' THEN 2
      WHEN 'weekend_posting' THEN 3
      WHEN 'very_old_date' THEN 4
      ELSE 5
    END,
    glt.transaction_date DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_unified_categories_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;