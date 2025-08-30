-- Create comprehensive population analysis function (corrected)
CREATE OR REPLACE FUNCTION public.calculate_population_analysis(
  p_client_id UUID,
  p_fiscal_year INTEGER,
  p_selected_standard_numbers TEXT[],
  p_excluded_account_numbers TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_version_id UUID DEFAULT NULL
)
RETURNS JSONB
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
BEGIN
  -- Get version ID if not provided
  IF p_version_id IS NULL THEN
    SELECT adv.id INTO v_version_id
    FROM public.accounting_data_versions adv
    WHERE adv.client_id = p_client_id
      AND adv.is_active = true
    LIMIT 1;
  ELSE
    v_version_id := p_version_id;
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
      AND (v_version_id IS NULL OR tb.version = v_version_id::text)
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

  -- Counter account analysis
  WITH transaction_pairs AS (
    SELECT 
      glt1.account_number as main_account,
      glt2.account_number as counter_account,
      MAX(coa2.account_name) as counter_account_name,
      COUNT(*) as transaction_count,
      SUM(ABS(glt1.amount)) as total_amount
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

  -- Outlier detection using IQR method
  WITH balance_stats AS (
    SELECT 
      PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY ABS(tb.closing_balance)) as q1,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ABS(tb.closing_balance)) as q3
    FROM public.trial_balances tb
    JOIN public.client_chart_of_accounts coa ON tb.client_account_id = coa.id
    WHERE tb.client_id = p_client_id
      AND tb.period_year = p_fiscal_year
      AND (v_version_id IS NULL OR tb.version = v_version_id::text)
      AND coa.account_number = ANY(v_account_numbers)
      AND NOT (coa.account_number = ANY(p_excluded_account_numbers))
  ),
  outlier_accounts AS (
    SELECT 
      coa.account_number,
      coa.account_name,
      tb.closing_balance,
      ABS(tb.closing_balance) as abs_balance,
      CASE 
        WHEN ABS(tb.closing_balance) > (bs.q3 + 1.5 * (bs.q3 - bs.q1)) THEN 'high'
        WHEN ABS(tb.closing_balance) < (bs.q1 - 1.5 * (bs.q3 - bs.q1)) THEN 'low'
      END as outlier_type
    FROM public.trial_balances tb
    JOIN public.client_chart_of_accounts coa ON tb.client_account_id = coa.id
    CROSS JOIN balance_stats bs
    WHERE tb.client_id = p_client_id
      AND tb.period_year = p_fiscal_year
      AND (v_version_id IS NULL OR tb.version = v_version_id::text)
      AND coa.account_number = ANY(v_account_numbers)
      AND NOT (coa.account_number = ANY(p_excluded_account_numbers))
      AND (
        ABS(tb.closing_balance) > (bs.q3 + 1.5 * (bs.q3 - bs.q1)) OR
        ABS(tb.closing_balance) < (bs.q1 - 1.5 * (bs.q3 - bs.q1))
      )
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'accountNumber', account_number,
      'accountName', account_name,
      'closingBalance', closing_balance,
      'absBalance', abs_balance,
      'outlierType', outlier_type
    ) ORDER BY abs_balance DESC
  ) INTO v_outliers
  FROM outlier_accounts;

  -- Time series analysis (monthly aggregation)
  WITH monthly_data AS (
    SELECT 
      DATE_TRUNC('month', glt.transaction_date) as month,
      COUNT(*) as transaction_count,
      SUM(ABS(glt.amount)) as total_amount
    FROM public.general_ledger_transactions glt
    WHERE glt.client_id = p_client_id
      AND EXTRACT(YEAR FROM glt.transaction_date) = p_fiscal_year
      AND (v_version_id IS NULL OR glt.version_id = v_version_id)
      AND glt.account_number = ANY(v_account_numbers)
      AND NOT (glt.account_number = ANY(p_excluded_account_numbers))
    GROUP BY DATE_TRUNC('month', glt.transaction_date)
    ORDER BY month
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'month', month,
      'transactionCount', transaction_count,
      'totalAmount', total_amount
    ) ORDER BY month
  ) INTO v_time_series
  FROM monthly_data;

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
      AND (v_version_id IS NULL OR tb.version = v_version_id::text)
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
    AND (v_version_id IS NULL OR tb.version = v_version_id::text)
    AND coa.account_number = ANY(v_account_numbers);

  -- Return comprehensive analysis
  RETURN jsonb_build_object(
    'basicStats', COALESCE(v_basic_stats, '{}'::jsonb),
    'counterAccounts', COALESCE(v_counter_accounts, '[]'::jsonb),
    'outliers', COALESCE(v_outliers, '[]'::jsonb),
    'timeSeries', COALESCE(v_time_series, '[]'::jsonb),
    'accounts', COALESCE(v_accounts, '[]'::jsonb),
    'totalRecords', v_total_records,
    'executionTimeMs', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000,
    'versionId', v_version_id
  );
END;
$function$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_trial_balance_mappings_client_lookup 
ON public.trial_balance_mappings (client_id, account_number, statement_line_number);

CREATE INDEX IF NOT EXISTS idx_account_classifications_client_lookup 
ON public.account_classifications (client_id, account_number, new_category) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_general_ledger_voucher_lookup 
ON public.general_ledger_transactions (client_id, voucher_number, version_id, transaction_date);

CREATE INDEX IF NOT EXISTS idx_trial_balances_client_year_version 
ON public.trial_balances (client_id, period_year, version);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.calculate_population_analysis TO authenticated;