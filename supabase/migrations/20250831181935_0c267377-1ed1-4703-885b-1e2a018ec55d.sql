-- Fix the calculate_population_analysis function to properly handle trial balance version strings
CREATE OR REPLACE FUNCTION public.calculate_population_analysis(
  p_client_id uuid, 
  p_fiscal_year integer, 
  p_selected_standard_numbers text[], 
  p_excluded_account_numbers text[] DEFAULT ARRAY[]::text[], 
  p_version_string text DEFAULT NULL -- Changed from uuid to text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_version_string TEXT;
  v_basic_stats JSONB;
  v_counter_accounts JSONB;
  v_outliers JSONB;
  v_time_series JSONB;
  v_accounts JSONB;
  v_total_records INTEGER;
  v_start_time TIMESTAMP := clock_timestamp();
  v_account_numbers TEXT[];
BEGIN
  -- Handle version string - get the most recent if not provided
  IF p_version_string IS NULL THEN
    -- Get the latest trial balance version for this client and year
    SELECT version INTO v_version_string
    FROM public.trial_balances tb
    WHERE tb.client_id = p_client_id
      AND tb.period_year = p_fiscal_year
    ORDER BY tb.created_at DESC
    LIMIT 1;
  ELSE
    v_version_string := p_version_string;
  END IF;

  -- Get relevant account numbers based on mappings and classifications
  WITH mapped_accounts AS (
    -- Direct mappings via trial_balance_mappings
    SELECT DISTINCT tbm.account_number
    FROM public.trial_balance_mappings tbm
    JOIN public.standard_accounts sa ON tbm.statement_line_number = sa.standard_number
    WHERE tbm.client_id = p_client_id
      AND sa.standard_number = ANY(p_selected_standard_numbers)
    
    UNION
    
    -- Fallback via account_classifications
    SELECT DISTINCT ac.account_number
    FROM public.account_classifications ac
    JOIN public.standard_accounts sa ON ac.new_category = sa.standard_name
    WHERE ac.client_id = p_client_id
      AND ac.is_active = true
      AND sa.standard_number = ANY(p_selected_standard_numbers)
      AND ac.account_number NOT IN (
        SELECT tbm2.account_number 
        FROM public.trial_balance_mappings tbm2 
        WHERE tbm2.client_id = p_client_id
      )
  )
  SELECT array_agg(account_number) INTO v_account_numbers
  FROM mapped_accounts;

  -- If no accounts found, return empty result
  IF v_account_numbers IS NULL OR array_length(v_account_numbers, 1) = 0 THEN
    RETURN jsonb_build_object(
      'basicStats', jsonb_build_object(
        'totalAccounts', 0,
        'totalSum', 0
      ),
      'accounts', '[]'::jsonb
    );
  END IF;

  -- Basic statistics calculation
  WITH filtered_balances AS (
    SELECT 
      coa.account_number,
      coa.account_name,
      tb.closing_balance,
      ABS(tb.closing_balance) as abs_balance,
      CASE WHEN tb.closing_balance != 0 THEN 1 ELSE 0 END as non_zero_count
    FROM public.trial_balances tb
    JOIN public.client_chart_of_accounts coa ON tb.client_account_id = coa.id
    WHERE tb.client_id = p_client_id
      AND tb.period_year = p_fiscal_year
      AND (v_version_string IS NULL OR tb.version = v_version_string)
      AND coa.account_number = ANY(v_account_numbers)
      AND NOT (coa.account_number = ANY(p_excluded_account_numbers))
  ),
  stats AS (
    SELECT 
      COUNT(*) as total_accounts,
      SUM(abs_balance) as total_sum
    FROM filtered_balances
  )
  SELECT jsonb_build_object(
    'totalAccounts', COALESCE(s.total_accounts, 0),
    'totalSum', COALESCE(s.total_sum, 0)
  ) INTO v_basic_stats
  FROM stats s;

  -- Account details (limited to prevent memory issues)
  WITH account_details AS (
    SELECT 
      coa.account_number,
      coa.account_name,
      tb.closing_balance,
      COALESCE(tc.transaction_count, 0) as transaction_count
    FROM public.trial_balances tb
    JOIN public.client_chart_of_accounts coa ON tb.client_account_id = coa.id
    LEFT JOIN (
      SELECT 
        account_number,
        COUNT(*) as transaction_count
      FROM public.general_ledger_transactions
      WHERE client_id = p_client_id
        AND EXTRACT(YEAR FROM transaction_date) = p_fiscal_year
      GROUP BY account_number
    ) tc ON coa.account_number = tc.account_number
    WHERE tb.client_id = p_client_id
      AND tb.period_year = p_fiscal_year
      AND (v_version_string IS NULL OR tb.version = v_version_string)
      AND coa.account_number = ANY(v_account_numbers)
    ORDER BY ABS(tb.closing_balance) DESC
    LIMIT 1000 -- Limit to prevent memory issues
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'accountNumber', account_number,
      'accountName', COALESCE(account_name, 'Ukjent konto'),
      'closingBalance', closing_balance,
      'transactionCount', transaction_count
    )
  ) INTO v_accounts
  FROM account_details;

  -- Return comprehensive analysis
  RETURN jsonb_build_object(
    'basicStats', COALESCE(v_basic_stats, '{}'::jsonb),
    'accounts', COALESCE(v_accounts, '[]'::jsonb)
  );
END;
$function$;