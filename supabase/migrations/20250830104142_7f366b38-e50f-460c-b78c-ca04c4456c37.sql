-- Forbedre calculate_population_analysis funksjonen med ekte statistisk analyse
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
  v_anomalies JSONB;
  v_trend_analysis JSONB;
  v_total_records INTEGER;
  v_start_time TIMESTAMP := clock_timestamp();
  v_account_numbers TEXT[];
  v_cache_key TEXT;
  v_cached_result JSONB;
BEGIN
  -- Generer cache key basert på input parametere
  v_cache_key := 'pop_analysis_' || p_client_id::text || '_' || p_fiscal_year::text || '_' || 
                 array_to_string(p_selected_standard_numbers, ',') || '_' ||
                 array_to_string(p_excluded_account_numbers, ',') || '_' ||
                 COALESCE(p_version_id::text, 'null');

  -- Sjekk cache først (5 minutters TTL)
  SELECT result_data INTO v_cached_result
  FROM public.ai_analysis_cache
  WHERE config_hash = v_cache_key
    AND client_id = p_client_id
    AND expires_at > now()
    AND analysis_type = 'population_analysis'
  LIMIT 1;

  IF v_cached_result IS NOT NULL THEN
    -- Oppdater cache hits
    UPDATE public.ai_analysis_cache 
    SET access_count = access_count + 1, last_accessed = now()
    WHERE config_hash = v_cache_key AND client_id = p_client_id;
    
    RETURN v_cached_result;
  END IF;

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
        'totalAccounts', 0, 'accountsWithBalance', 0, 'totalSum', 0,
        'averageBalance', 0, 'medianBalance', 0, 'q1', 0, 'q3', 0,
        'minBalance', 0, 'maxBalance', 0, 'stdDev', 0, 'iqr', 0
      ),
      'counterAccounts', '[]'::jsonb,
      'outliers', '[]'::jsonb,
      'timeSeries', '[]'::jsonb,
      'accounts', '[]'::jsonb,
      'anomalies', '[]'::jsonb,
      'trendAnalysis', jsonb_build_object('trend', 'insufficient_data', 'seasonality', 'none'),
      'totalRecords', 0,
      'executionTimeMs', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000,
      'versionId', v_version_id
    );
  END IF;

  -- Enhanced basic statistics with statistical measures
  WITH filtered_balances AS (
    SELECT 
      coa.account_number,
      coa.account_name,
      tb.closing_balance,
      ABS(tb.closing_balance) as abs_balance,
      CASE WHEN tb.closing_balance != 0 THEN 1 ELSE 0 END as non_zero_count,
      -- Calculate Z-score for anomaly detection
      (ABS(tb.closing_balance) - AVG(ABS(tb.closing_balance)) OVER()) / 
        NULLIF(STDDEV(ABS(tb.closing_balance)) OVER(), 0) as z_score
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
      STDDEV(abs_balance) as std_dev,
      -- Additional statistical measures
      PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY abs_balance) as p10,
      PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY abs_balance) as p90,
      -- Skewness calculation (simplified)
      (AVG(POWER((abs_balance - AVG(abs_balance) OVER()), 3)) / 
       POWER(STDDEV(abs_balance), 3)) as skewness
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
    'iqr', COALESCE(s.q3 - s.q1, 0),
    'p10', COALESCE(s.p10, 0),
    'p90', COALESCE(s.p90, 0),
    'skewness', COALESCE(s.skewness, 0)
  ) INTO v_basic_stats
  FROM stats s;

  -- Enhanced outlier detection using multiple methods
  WITH balance_stats AS (
    SELECT 
      PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY ABS(tb.closing_balance)) as q1,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ABS(tb.closing_balance)) as q3,
      AVG(ABS(tb.closing_balance)) as mean_balance,
      STDDEV(ABS(tb.closing_balance)) as std_balance
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
      -- IQR method
      CASE 
        WHEN ABS(tb.closing_balance) > (bs.q3 + 1.5 * (bs.q3 - bs.q1)) THEN 'high'
        WHEN ABS(tb.closing_balance) < (bs.q1 - 1.5 * (bs.q3 - bs.q1)) THEN 'low'
      END as iqr_outlier_type,
      -- Z-score method (>2.5 standard deviations)
      CASE 
        WHEN ABS(ABS(tb.closing_balance) - bs.mean_balance) / NULLIF(bs.std_balance, 0) > 2.5 THEN
          CASE WHEN ABS(tb.closing_balance) > bs.mean_balance THEN 'high' ELSE 'low' END
      END as zscore_outlier_type,
      -- Statistical scores
      ABS(ABS(tb.closing_balance) - bs.mean_balance) / NULLIF(bs.std_balance, 0) as z_score,
      (ABS(tb.closing_balance) - bs.q1) / NULLIF(bs.q3 - bs.q1, 0) as iqr_score
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
        ABS(tb.closing_balance) < (bs.q1 - 1.5 * (bs.q3 - bs.q1)) OR
        ABS(ABS(tb.closing_balance) - bs.mean_balance) / NULLIF(bs.std_balance, 0) > 2.5
      )
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'accountNumber', account_number,
      'accountName', account_name,
      'closingBalance', closing_balance,
      'absBalance', abs_balance,
      'outlierType', COALESCE(iqr_outlier_type, zscore_outlier_type, 'unknown'),
      'zScore', ROUND(COALESCE(z_score, 0)::numeric, 2),
      'iqrScore', ROUND(COALESCE(iqr_score, 0)::numeric, 2),
      'detectionMethod', 
        CASE 
          WHEN iqr_outlier_type IS NOT NULL AND zscore_outlier_type IS NOT NULL THEN 'both'
          WHEN iqr_outlier_type IS NOT NULL THEN 'iqr'
          WHEN zscore_outlier_type IS NOT NULL THEN 'zscore'
          ELSE 'other'
        END
    ) ORDER BY abs_balance DESC
  ) INTO v_outliers
  FROM outlier_accounts;

  -- Enhanced anomaly detection
  WITH statistical_anomalies AS (
    SELECT 
      coa.account_number,
      coa.account_name,
      tb.closing_balance,
      ABS(tb.closing_balance) as abs_balance,
      -- Multiple anomaly types
      CASE 
        WHEN tb.closing_balance = 0 AND coa.account_number LIKE '1%' THEN 'zero_asset_balance'
        WHEN tb.closing_balance = 0 AND coa.account_number LIKE '2%' THEN 'zero_liability_balance'
        WHEN ABS(tb.closing_balance) > 10000000 THEN 'extremely_high_balance'
        WHEN tb.closing_balance < 0 AND coa.account_number LIKE '1%' THEN 'negative_asset'
        WHEN tb.closing_balance > 0 AND coa.account_number LIKE '2%' THEN 'positive_liability'
      END as anomaly_type,
      -- Severity scoring
      CASE 
        WHEN ABS(tb.closing_balance) > 10000000 THEN 'high'
        WHEN tb.closing_balance < 0 AND coa.account_number LIKE '1%' THEN 'high'
        WHEN tb.closing_balance > 0 AND coa.account_number LIKE '2%' THEN 'medium'
        WHEN tb.closing_balance = 0 THEN 'low'
        ELSE 'medium'
      END as severity
    FROM public.trial_balances tb
    JOIN public.client_chart_of_accounts coa ON tb.client_account_id = coa.id
    WHERE tb.client_id = p_client_id
      AND tb.period_year = p_fiscal_year
      AND (v_version_id IS NULL OR tb.version = v_version_id::text)
      AND coa.account_number = ANY(v_account_numbers)
      AND NOT (coa.account_number = ANY(p_excluded_account_numbers))
      AND (
        tb.closing_balance = 0 OR
        ABS(tb.closing_balance) > 10000000 OR
        (tb.closing_balance < 0 AND coa.account_number LIKE '1%') OR
        (tb.closing_balance > 0 AND coa.account_number LIKE '2%')
      )
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'accountNumber', account_number,
      'accountName', account_name,
      'anomalyType', anomaly_type,
      'severity', severity,
      'description', 
        CASE anomaly_type
          WHEN 'zero_asset_balance' THEN 'Eiendel med null saldo'
          WHEN 'zero_liability_balance' THEN 'Gjeld med null saldo'
          WHEN 'extremely_high_balance' THEN 'Ekstremt høy saldo over 10 mill NOK'
          WHEN 'negative_asset' THEN 'Negativ eiendel'
          WHEN 'positive_liability' THEN 'Positiv gjeldskonto'
          ELSE 'Ukjent anomali'
        END,
      'closingBalance', closing_balance
    ) ORDER BY 
      CASE severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      abs_balance DESC
  ) INTO v_anomalies
  FROM statistical_anomalies
  WHERE anomaly_type IS NOT NULL;

  -- Enhanced time series with trend and seasonality analysis
  WITH monthly_data AS (
    SELECT 
      DATE_TRUNC('month', glt.transaction_date) as month,
      COUNT(*) as transaction_count,
      SUM(ABS(glt.amount)) as total_amount,
      AVG(ABS(glt.amount)) as avg_amount,
      -- Add month number for seasonality analysis
      EXTRACT(MONTH FROM glt.transaction_date) as month_num
    FROM public.general_ledger_transactions glt
    WHERE glt.client_id = p_client_id
      AND EXTRACT(YEAR FROM glt.transaction_date) = p_fiscal_year
      AND (v_version_id IS NULL OR glt.version_id = v_version_id)
      AND glt.account_number = ANY(v_account_numbers)
      AND NOT (glt.account_number = ANY(p_excluded_account_numbers))
    GROUP BY DATE_TRUNC('month', glt.transaction_date), EXTRACT(MONTH FROM glt.transaction_date)
    ORDER BY month
  ),
  trend_calculation AS (
    SELECT 
      *,
      ROW_NUMBER() OVER (ORDER BY month) as row_num,
      COUNT(*) OVER () as total_months,
      -- Simple linear regression slope calculation
      (COUNT(*) OVER () * SUM(ROW_NUMBER() OVER (ORDER BY month) * total_amount) OVER () - 
       SUM(ROW_NUMBER() OVER (ORDER BY month)) OVER () * SUM(total_amount) OVER ()) / 
      NULLIF(COUNT(*) OVER () * SUM(POWER(ROW_NUMBER() OVER (ORDER BY month), 2)) OVER () - 
             POWER(SUM(ROW_NUMBER() OVER (ORDER BY month)) OVER (), 2), 0) as trend_slope
    FROM monthly_data
  ),
  seasonality_analysis AS (
    SELECT 
      month_num,
      AVG(total_amount) as avg_monthly_amount,
      STDDEV(total_amount) as stddev_monthly_amount,
      COUNT(*) as occurrences
    FROM monthly_data
    GROUP BY month_num
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'month', month,
      'transactionCount', transaction_count,  
      'totalAmount', total_amount,
      'avgAmount', ROUND(avg_amount::numeric, 2)
    ) ORDER BY month
  ) INTO v_time_series
  FROM monthly_data;

  -- Trend analysis summary
  WITH trend_summary AS (
    SELECT 
      CASE 
        WHEN COUNT(*) < 3 THEN 'insufficient_data'
        WHEN AVG(
          (COUNT(*) OVER () * SUM(ROW_NUMBER() OVER (ORDER BY month) * total_amount) OVER () - 
           SUM(ROW_NUMBER() OVER (ORDER BY month)) OVER () * SUM(total_amount) OVER ()) / 
          NULLIF(COUNT(*) OVER () * SUM(POWER(ROW_NUMBER() OVER (ORDER BY month), 2)) OVER () - 
                 POWER(SUM(ROW_NUMBER() OVER (ORDER BY month)) OVER (), 2), 0)
        ) > 1000 THEN 'increasing'
        WHEN AVG(
          (COUNT(*) OVER () * SUM(ROW_NUMBER() OVER (ORDER BY month) * total_amount) OVER () - 
           SUM(ROW_NUMBER() OVER (ORDER BY month)) OVER () * SUM(total_amount) OVER ()) / 
          NULLIF(COUNT(*) OVER () * SUM(POWER(ROW_NUMBER() OVER (ORDER BY month), 2)) OVER () - 
                 POWER(SUM(ROW_NUMBER() OVER (ORDER BY month)) OVER (), 2), 0)
        ) < -1000 THEN 'decreasing'
        ELSE 'stable'
      END as trend,
      -- Simple seasonality detection based on coefficient of variation
      CASE 
        WHEN STDDEV(total_amount) / NULLIF(AVG(total_amount), 0) > 0.3 THEN 'detected'
        ELSE 'none'
      END as seasonality
    FROM (
      SELECT 
        month,
        total_amount,
        ROW_NUMBER() OVER (ORDER BY month) as row_num
      FROM monthly_data
    ) t
  )
  SELECT jsonb_build_object(
    'trend', COALESCE((SELECT trend FROM trend_summary LIMIT 1), 'insufficient_data'),
    'seasonality', COALESCE((SELECT seasonality FROM trend_summary LIMIT 1), 'none')
  ) INTO v_trend_analysis;

  -- Counter account analysis (unchanged)
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

  -- Account details (unchanged)
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
    LIMIT 1000
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

  -- Get total record count
  SELECT COUNT(*) INTO v_total_records
  FROM public.trial_balances tb
  JOIN public.client_chart_of_accounts coa ON tb.client_account_id = coa.id
  WHERE tb.client_id = p_client_id
    AND tb.period_year = p_fiscal_year
    AND (v_version_id IS NULL OR tb.version = v_version_id::text)
    AND coa.account_number = ANY(v_account_numbers);

  -- Build final result
  DECLARE
    final_result JSONB;
  BEGIN
    final_result := jsonb_build_object(
      'basicStats', COALESCE(v_basic_stats, '{}'::jsonb),
      'counterAccounts', COALESCE(v_counter_accounts, '[]'::jsonb),
      'outliers', COALESCE(v_outliers, '[]'::jsonb),
      'timeSeries', COALESCE(v_time_series, '[]'::jsonb),
      'accounts', COALESCE(v_accounts, '[]'::jsonb),
      'anomalies', COALESCE(v_anomalies, '[]'::jsonb),
      'trendAnalysis', COALESCE(v_trend_analysis, jsonb_build_object('trend', 'insufficient_data', 'seasonality', 'none')),
      'totalRecords', v_total_records,
      'executionTimeMs', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000,
      'versionId', v_version_id
    );

    -- Cache the result
    INSERT INTO public.ai_analysis_cache (
      client_id, analysis_type, config_hash, result_data, 
      transaction_count, expires_at, confidence_score
    ) VALUES (
      p_client_id, 'population_analysis', v_cache_key, final_result,
      v_total_records, now() + interval '5 minutes', 0.95
    )
    ON CONFLICT (config_hash, client_id, analysis_type) 
    DO UPDATE SET 
      result_data = EXCLUDED.result_data,
      transaction_count = EXCLUDED.transaction_count,
      expires_at = EXCLUDED.expires_at,
      last_accessed = now(),
      access_count = ai_analysis_cache.access_count + 1;

    RETURN final_result;
  END;
END;
$function$;

-- Legg til indekser for bedre ytelse
CREATE INDEX IF NOT EXISTS idx_general_ledger_transactions_analysis 
ON public.general_ledger_transactions (client_id, transaction_date, account_number, version_id)
WHERE transaction_date IS NOT NULL AND account_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trial_balances_analysis
ON public.trial_balances (client_id, period_year, version, client_account_id)
WHERE closing_balance IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_lookup
ON public.ai_analysis_cache (client_id, analysis_type, config_hash, expires_at)
WHERE expires_at > now();