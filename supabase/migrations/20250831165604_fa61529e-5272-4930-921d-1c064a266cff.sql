-- Fix the calculate_population_analysis function to use correct column names and handle version IDs properly
CREATE OR REPLACE FUNCTION public.calculate_population_analysis(
  p_client_id uuid, 
  p_fiscal_year integer, 
  p_selected_standard_numbers text[], 
  p_excluded_account_numbers text[] DEFAULT ARRAY[]::text[], 
  p_version_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_version_id UUID;
  v_basic_stats JSONB;
  v_counter_accounts JSONB;
  v_outliers JSONB;
  v_time_series JSONB;
  v_accounts JSONB;
  v_total_records INTEGER;
  v_start_time TIMESTAMP := clock_timestamp();
  v_account_numbers TEXT[];
  v_version_string TEXT;
BEGIN
  -- Handle version ID - can be UUID or convert from string
  IF p_version_id IS NULL THEN
    -- Try to get active version from accounting_data_versions
    SELECT adv.id INTO v_version_id
    FROM public.accounting_data_versions adv
    WHERE adv.client_id = p_client_id
      AND adv.is_active = true
    LIMIT 1;
    
    -- If no active version found, get the latest trial balance version
    IF v_version_id IS NULL THEN
      SELECT version::uuid INTO v_version_id
      FROM public.trial_balances tb
      WHERE tb.client_id = p_client_id
        AND tb.period_year = p_fiscal_year
      ORDER BY tb.created_at DESC
      LIMIT 1;
    END IF;
  ELSE
    v_version_id := p_version_id;
  END IF;

  -- Get the version string for trial balance queries
  SELECT version INTO v_version_string
  FROM public.trial_balances tb
  WHERE tb.client_id = p_client_id
    AND tb.period_year = p_fiscal_year
    AND (v_version_id IS NULL OR tb.version = v_version_id::text)
  LIMIT 1;

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
        'accountsWithBalance', 0,
        'totalSum', 0,
        'averageBalance', 0,
        'medianBalance', 0,
        'q1', 0,
        'q3', 0,
        'minBalance', 0,
        'maxBalance', 0,
        'stdDev', 0,
        'iqr', 0
      ),
      'counterAccounts', '[]'::jsonb,
      'outliers', '[]'::jsonb,
      'timeSeries', '[]'::jsonb,
      'accounts', '[]'::jsonb,
      'totalRecords', 0,
      'executionTimeMs', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000,
      'versionId', v_version_id
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
      SUM(non_zero_count) as accounts_with_balance,
      SUM(abs_balance) as total_sum,
      AVG(abs_balance) as average_balance,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY abs_balance) as median_balance,
      PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY abs_balance) as q1,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY abs_balance) as q3,
      MIN(abs_balance) as min_balance,
      MAX(abs_balance) as max_balance,
      STDDEV(abs_balance) as std_dev
    FROM filtered_balances
  )
  SELECT jsonb_build_object(
    'totalAccounts', COALESCE(s.total_accounts, 0),
    'accountsWithBalance', COALESCE(s.accounts_with_balance, 0),
    'totalSum', COALESCE(s.total_sum, 0),
    'averageBalance', COALESCE(s.average_balance, 0),
    'medianBalance', COALESCE(s.median_balance, 0),
    'q1', COALESCE(s.q1, 0),
    'q3', COALESCE(s.q3, 0),
    'minBalance', COALESCE(s.min_balance, 0),
    'maxBalance', COALESCE(s.max_balance, 0),
    'stdDev', COALESCE(s.std_dev, 0),
    'iqr', COALESCE(s.q3 - s.q1, 0)
  ) INTO v_basic_stats
  FROM stats s;

  -- Counter account analysis using correct column names
  WITH transaction_pairs AS (
    SELECT 
      glt1.account_number as main_account,
      glt2.account_number as counter_account,
      MAX(coa2.account_name) as counter_account_name,
      COUNT(*) as transaction_count,
      SUM(ABS(COALESCE(glt1.debit_amount, glt1.credit_amount, 0))) as total_amount
    FROM public.general_ledger_transactions glt1
    JOIN public.general_ledger_transactions glt2 ON glt1.voucher_number = glt2.voucher_number 
      AND glt1.client_id = glt2.client_id
      AND glt1.id != glt2.id
    LEFT JOIN public.client_chart_of_accounts coa2 ON glt2.account_number = coa2.account_number 
      AND glt2.client_id = coa2.client_id
    WHERE glt1.client_id = p_client_id
      AND EXTRACT(YEAR FROM glt1.transaction_date) = p_fiscal_year
      AND (v_version_id IS NULL OR glt1.version_id = v_version_id)
      AND glt1.account_number = ANY(v_account_numbers)
      AND NOT (glt1.account_number = ANY(p_excluded_account_numbers))
    GROUP BY glt1.account_number, glt2.account_number
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'counterAccount', counter_account,
      'counterAccountName', COALESCE(counter_account_name, 'Ukjent konto'),
      'transactionCount', transaction_count,
      'totalAmount', total_amount,
      'percentage', ROUND((transaction_count::numeric / SUM(transaction_count) OVER()) * 100, 2)
    ) ORDER BY transaction_count DESC
  ) INTO v_counter_accounts
  FROM (
    SELECT * FROM transaction_pairs ORDER BY transaction_count DESC LIMIT 20
  ) top_counters;

  -- Account details (limited to prevent memory issues)
  WITH account_details AS (
    SELECT 
      coa.account_number,
      coa.account_name,
      tb.closing_balance,
      ABS(tb.closing_balance) as abs_balance,
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
        AND (v_version_id IS NULL OR version_id = v_version_id)
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
      'id', account_number,
      'accountNumber', account_number,
      'accountName', COALESCE(account_name, 'Ukjent konto'),
      'closingBalance', closing_balance,
      'transactionCount', transaction_count
    )
  ) INTO v_accounts
  FROM account_details;

  -- Get total record count for pagination info
  SELECT COUNT(*) INTO v_total_records
  FROM public.trial_balances tb
  JOIN public.client_chart_of_accounts coa ON tb.client_account_id = coa.id
  WHERE tb.client_id = p_client_id
    AND tb.period_year = p_fiscal_year
    AND (v_version_string IS NULL OR tb.version = v_version_string)
    AND coa.account_number = ANY(v_account_numbers);

  -- Return comprehensive analysis
  RETURN jsonb_build_object(
    'basicStats', COALESCE(v_basic_stats, '{}'::jsonb),
    'counterAccounts', COALESCE(v_counter_accounts, '[]'::jsonb),
    'outliers', COALESCE('[]'::jsonb, '[]'::jsonb),
    'timeSeries', COALESCE('[]'::jsonb, '[]'::jsonb),
    'accounts', COALESCE(v_accounts, '[]'::jsonb),
    'totalRecords', v_total_records,
    'executionTimeMs', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000,
    'versionId', v_version_id
  );
END;
$function$;