-- Fix Security Definer View issue by removing SECURITY DEFINER from analysis functions
-- These functions will now respect RLS policies properly

-- 1. Remove SECURITY DEFINER from account distribution function
CREATE OR REPLACE FUNCTION public.calculate_account_distribution(p_client_id uuid, p_version_id uuid)
RETURNS TABLE(account_number text, account_name text, transaction_count integer, total_amount numeric)
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    coa.account_number,
    coa.account_name,
    COUNT(*)::INTEGER as transaction_count,
    SUM(COALESCE(glt.debit_amount, 0) + COALESCE(glt.credit_amount, 0)) as total_amount
  FROM public.general_ledger_transactions glt
  INNER JOIN public.client_chart_of_accounts coa ON glt.client_account_id = coa.id
  WHERE glt.client_id = p_client_id 
    AND glt.version_id = p_version_id
  GROUP BY coa.account_number, coa.account_name
  ORDER BY transaction_count DESC;
END;
$function$;

-- 2. Remove SECURITY DEFINER from monthly summary function
CREATE OR REPLACE FUNCTION public.calculate_monthly_summary(p_client_id uuid, p_version_id uuid)
RETURNS TABLE(month text, transaction_count integer, total_amount numeric)
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(glt.transaction_date, 'YYYY-MM') as month,
    COUNT(*)::INTEGER as transaction_count,
    SUM(COALESCE(glt.debit_amount, 0) - COALESCE(glt.credit_amount, 0)) as total_amount
  FROM public.general_ledger_transactions glt
  WHERE glt.client_id = p_client_id 
    AND glt.version_id = p_version_id
  GROUP BY TO_CHAR(glt.transaction_date, 'YYYY-MM')
  ORDER BY month;
END;
$function$;

-- 3. Remove SECURITY DEFINER from duplicate transactions function
CREATE OR REPLACE FUNCTION public.find_duplicate_transactions(p_client_id uuid, p_version_id uuid)
RETURNS TABLE(duplicate_key text, transaction_count integer, transaction_ids uuid[], amount numeric, transaction_date date, description text, account_number text)
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  WITH duplicate_groups AS (
    SELECT 
      glt.transaction_date::TEXT || '_' || 
      COALESCE(glt.debit_amount, 0)::TEXT || '_' || 
      COALESCE(glt.credit_amount, 0)::TEXT || '_' || 
      COALESCE(glt.description, '') || '_' || 
      COALESCE(coa.account_number, '') as dup_key,
      COUNT(*) as cnt,
      ARRAY_AGG(glt.id) as ids,
      glt.transaction_date,
      COALESCE(glt.debit_amount, glt.credit_amount, 0) as amt,
      glt.description,
      coa.account_number
    FROM public.general_ledger_transactions glt
    INNER JOIN public.client_chart_of_accounts coa ON glt.client_account_id = coa.id
    WHERE glt.client_id = p_client_id 
      AND glt.version_id = p_version_id
    GROUP BY 
      glt.transaction_date,
      COALESCE(glt.debit_amount, 0),
      COALESCE(glt.credit_amount, 0),
      glt.description,
      coa.account_number
    HAVING COUNT(*) > 1
  )
  SELECT 
    dg.dup_key,
    dg.cnt::INTEGER,
    dg.ids,
    dg.amt,
    dg.transaction_date,
    dg.description,
    dg.account_number
  FROM duplicate_groups dg
  ORDER BY dg.cnt DESC, dg.amt DESC;
END;
$function$;

-- 4. Remove SECURITY DEFINER from time logic issues function
CREATE OR REPLACE FUNCTION public.find_time_logic_issues(p_client_id uuid, p_version_id uuid)
RETURNS TABLE(transaction_id uuid, voucher_number text, transaction_date date, issue_type text, issue_description text)
LANGUAGE plpgsql
STABLE
SET search_path TO ''
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