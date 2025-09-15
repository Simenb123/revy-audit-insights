-- Fix calculate_population_analysis function to use simple direct mapping from trial_balance_mappings
CREATE OR REPLACE FUNCTION public.calculate_population_analysis(
    p_client_id uuid, 
    p_fiscal_year integer, 
    p_selected_standard_numbers text[], 
    p_excluded_account_numbers text[] DEFAULT ARRAY[]::text[], 
    p_version_string text DEFAULT NULL::text, 
    p_version_id uuid DEFAULT NULL::uuid
) 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_version_string TEXT;
    v_basic_stats JSONB;
    v_accounts JSONB;
    v_counter_accounts JSONB;
    v_outliers JSONB;
    v_time_series JSONB;
    v_anomalies JSONB;
    v_enhanced_stats JSONB;
    v_trend_analysis JSONB;
    v_start_time TIMESTAMP := clock_timestamp();
    v_account_numbers TEXT[];
    v_total_accounts INTEGER := 0;
    v_total_sum NUMERIC := 0;
    v_available_years INTEGER[];
    v_has_data_for_year BOOLEAN := false;
    v_median NUMERIC;
    v_q1 NUMERIC;
    v_q3 NUMERIC;
    v_std_dev NUMERIC;
    v_mean NUMERIC;
    v_iqr NUMERIC;
    v_outlier_threshold_high NUMERIC;
    v_outlier_threshold_low NUMERIC;
BEGIN
    -- Handle version parameters - prefer string over UUID for trial balance queries
    IF p_version_string IS NOT NULL THEN
        v_version_string := p_version_string;
    ELSE
        -- Get the latest trial balance version for this client and year
        SELECT version INTO v_version_string
        FROM public.trial_balances tb
        WHERE tb.client_id = p_client_id
          AND tb.period_year = p_fiscal_year
        ORDER BY tb.created_at DESC
        LIMIT 1;
    END IF;

    -- Check if we have any data for this fiscal year
    SELECT EXISTS(
        SELECT 1 FROM public.trial_balances tb
        WHERE tb.client_id = p_client_id
          AND tb.period_year = p_fiscal_year
    ) INTO v_has_data_for_year;

    -- Get available years if current year has no data
    IF NOT v_has_data_for_year THEN
        SELECT array_agg(DISTINCT period_year ORDER BY period_year DESC) INTO v_available_years
        FROM public.trial_balances tb
        WHERE tb.client_id = p_client_id
        LIMIT 5;
    END IF;

    -- Get relevant account numbers using SIMPLE direct mapping from trial_balance_mappings
    SELECT array_agg(DISTINCT tbm.account_number) INTO v_account_numbers
    FROM public.trial_balance_mappings tbm
    WHERE tbm.client_id = p_client_id
      AND tbm.statement_line_number = ANY(p_selected_standard_numbers);

    -- Debug logging
    RAISE INFO 'Selected standard numbers: %', p_selected_standard_numbers;
    RAISE INFO 'Found account numbers: %', v_account_numbers;
    RAISE INFO 'Version string: %', v_version_string;

    -- If no accounts found or no data for year, return informative empty result
    IF v_account_numbers IS NULL OR array_length(v_account_numbers, 1) = 0 OR NOT v_has_data_for_year THEN
        RETURN jsonb_build_object(
            'basicStats', jsonb_build_object(
                'totalAccounts', 0,
                'totalSum', 0
            ),
            'accounts', '[]'::jsonb,
            'counterAccounts', '[]'::jsonb,
            'outliers', jsonb_build_object('high', '[]'::jsonb, 'low', '[]'::jsonb),
            'timeSeries', '[]'::jsonb,
            'anomalies', '[]'::jsonb,
            'trendAnalysis', jsonb_build_object(
                'trend', 'ikke_nok_data',
                'seasonality', 'none'
            ),
            'enhancedStats', jsonb_build_object(
                'mean', 0, 'median', 0, 'standardDeviation', 0,
                'q1', 0, 'q3', 0, 'iqr', 0, 'min', 0, 'max', 0
            ),
            'metadata', jsonb_build_object(
                'versionString', v_version_string,
                'executionTimeMs', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000,
                'hasDataForYear', v_has_data_for_year,
                'availableYears', COALESCE(v_available_years, ARRAY[]::INTEGER[]),
                'selectedStandardNumbers', p_selected_standard_numbers,
                'accountsFound', COALESCE(array_length(v_account_numbers, 1), 0),
                'isEmpty', true,
                'error', CASE 
                    WHEN NOT v_has_data_for_year THEN 'Ingen saldobalanse data for år ' || p_fiscal_year
                    WHEN v_account_numbers IS NULL OR array_length(v_account_numbers, 1) = 0 THEN 'Ingen konti funnet for valgte standardnummer'
                    ELSE NULL
                END
            )
        );
    END IF;

    -- Create temp table for population balances for statistical calculations
    CREATE TEMP TABLE population_balances AS
    SELECT 
        coa.account_number,
        coa.account_name,
        tb.closing_balance,
        ABS(tb.closing_balance) as abs_balance
    FROM public.trial_balances tb
    JOIN public.client_chart_of_accounts coa ON tb.client_account_id = coa.id
    WHERE tb.client_id = p_client_id
      AND tb.period_year = p_fiscal_year
      AND (v_version_string IS NULL OR tb.version = v_version_string)
      AND coa.account_number = ANY(v_account_numbers)
      AND NOT (coa.account_number = ANY(p_excluded_account_numbers));

    -- Calculate basic statistics
    SELECT 
        COUNT(*)::INTEGER,
        COALESCE(SUM(abs_balance), 0)::NUMERIC,
        COALESCE(AVG(abs_balance), 0)::NUMERIC
    INTO v_total_accounts, v_total_sum, v_mean
    FROM population_balances;

    RAISE INFO 'Population stats - accounts: %, sum: %, mean: %', v_total_accounts, v_total_sum, v_mean;

    -- Calculate enhanced statistics
    WITH percentiles AS (
        SELECT 
            PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY abs_balance) as q1,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY abs_balance) as median,
            PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY abs_balance) as q3,
            STDDEV(abs_balance) as std_dev,
            MIN(abs_balance) as min_val,
            MAX(abs_balance) as max_val
        FROM population_balances
        WHERE abs_balance IS NOT NULL
    )
    SELECT q1, median, q3, std_dev, min_val, max_val
    INTO v_q1, v_median, v_q3, v_std_dev, v_outlier_threshold_low, v_outlier_threshold_high
    FROM percentiles;

    -- Calculate IQR and outlier thresholds
    v_iqr := COALESCE(v_q3 - v_q1, 0);
    v_outlier_threshold_high := COALESCE(v_q3 + (1.5 * v_iqr), v_outlier_threshold_high);
    v_outlier_threshold_low := COALESCE(v_q1 - (1.5 * v_iqr), 0);

    -- Build enhanced stats
    SELECT jsonb_build_object(
        'mean', COALESCE(v_mean, 0),
        'median', COALESCE(v_median, 0),
        'standardDeviation', COALESCE(v_std_dev, 0),
        'q1', COALESCE(v_q1, 0),
        'q3', COALESCE(v_q3, 0),
        'iqr', COALESCE(v_iqr, 0),
        'min', COALESCE(v_outlier_threshold_low, 0),
        'max', COALESCE(v_outlier_threshold_high, 0)
    ) INTO v_enhanced_stats;

    -- Build basic stats
    SELECT jsonb_build_object(
        'totalAccounts', v_total_accounts,
        'accountsWithBalance', (SELECT COUNT(*) FROM population_balances WHERE abs_balance > 0)::INTEGER,
        'totalSum', v_total_sum,
        'averageBalance', v_mean,
        'medianBalance', COALESCE(v_median, 0),
        'q1', COALESCE(v_q1, 0),
        'q3', COALESCE(v_q3, 0),
        'minBalance', COALESCE(v_outlier_threshold_low, 0),
        'maxBalance', COALESCE(v_outlier_threshold_high, 0),
        'stdDev', COALESCE(v_std_dev, 0),
        'iqr', COALESCE(v_iqr, 0)
    ) INTO v_basic_stats;

    -- Account details (limited and filtered to prevent memory issues)
    WITH account_details AS (
        SELECT 
            account_number,
            account_name,
            closing_balance,
            abs_balance
        FROM population_balances
        ORDER BY abs_balance DESC
        LIMIT 1000
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', account_number,
            'accountNumber', account_number,
            'accountName', COALESCE(account_name, 'Ukjent konto'),
            'closingBalance', closing_balance,
            'transactionCount', 0
        )
    ) INTO v_accounts
    FROM account_details;

    -- Simple counter account analysis (if GL transactions are available)
    SELECT '[]'::jsonb INTO v_counter_accounts;

    -- Outlier detection
    WITH high_outliers AS (
        SELECT 
            account_number,
            account_name,
            closing_balance,
            abs_balance
        FROM population_balances
        WHERE abs_balance > v_outlier_threshold_high
        ORDER BY abs_balance DESC
        LIMIT 20
    ),
    low_outliers AS (
        SELECT 
            account_number,
            account_name,
            closing_balance,
            abs_balance
        FROM population_balances
        WHERE abs_balance < v_outlier_threshold_low AND abs_balance > 0
        ORDER BY abs_balance ASC
        LIMIT 20
    )
    SELECT jsonb_build_object(
        'high', COALESCE((SELECT jsonb_agg(
            jsonb_build_object(
                'accountNumber', account_number,
                'accountName', account_name,
                'closingBalance', closing_balance,
                'deviation', abs_balance - v_mean
            )
        ) FROM high_outliers), '[]'::jsonb),
        'low', COALESCE((SELECT jsonb_agg(
            jsonb_build_object(
                'accountNumber', account_number,
                'accountName', account_name,
                'closingBalance', closing_balance,
                'deviation', v_mean - abs_balance
            )
        ) FROM low_outliers), '[]'::jsonb)
    ) INTO v_outliers;

    -- Simple time series analysis (placeholder)
    SELECT '[]'::jsonb INTO v_time_series;

    -- Simple trend analysis
    SELECT jsonb_build_object(
        'trend', 'stable',
        'seasonality', 'none'
    ) INTO v_trend_analysis;

    -- Simple anomaly detection (placeholder)
    SELECT '[]'::jsonb INTO v_anomalies;

    -- Clean up temp table
    DROP TABLE population_balances;

    -- Return comprehensive analysis
    RETURN jsonb_build_object(
        'basicStats', COALESCE(v_basic_stats, jsonb_build_object('totalAccounts', 0, 'totalSum', 0)),
        'accounts', COALESCE(v_accounts, '[]'::jsonb),
        'counterAccounts', COALESCE(v_counter_accounts, '[]'::jsonb),
        'outliers', COALESCE(v_outliers, jsonb_build_object('high', '[]'::jsonb, 'low', '[]'::jsonb)),
        'timeSeries', COALESCE(v_time_series, '[]'::jsonb),
        'trendAnalysis', COALESCE(v_trend_analysis, jsonb_build_object(
            'trend', 'stable',
            'seasonality', 'none'
        )),
        'anomalies', COALESCE(v_anomalies, '[]'::jsonb),
        'enhancedStats', COALESCE(v_enhanced_stats, jsonb_build_object(
            'mean', 0, 'median', 0, 'standardDeviation', 0,
            'q1', 0, 'q3', 0, 'iqr', 0, 'min', 0, 'max', 0
        )),
        'metadata', jsonb_build_object(
            'versionString', v_version_string,
            'executionTimeMs', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000,
            'hasDataForYear', v_has_data_for_year,
            'availableYears', COALESCE(v_available_years, ARRAY[]::INTEGER[]),
            'selectedStandardNumbers', p_selected_standard_numbers,
            'excludedAccounts', array_length(p_excluded_account_numbers, 1),
            'totalRecords', v_total_accounts,
            'accountsFound', COALESCE(array_length(v_account_numbers, 1), 0),
            'isEmpty', v_total_accounts = 0
        )
    );
END;
$function$;