-- Fix calculate_population_analysis function to use correct column names
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
    v_version_id UUID;
    v_basic_stats JSONB;
    v_accounts JSONB;
    v_counter_accounts JSONB;
    v_outliers JSONB;
    v_time_series JSONB;
    v_anomalies JSONB;
    v_enhanced_stats JSONB;
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
    ELSIF p_version_id IS NOT NULL THEN
        -- Try to find corresponding version string for UUID
        SELECT version INTO v_version_string
        FROM public.trial_balances tb
        WHERE tb.client_id = p_client_id
          AND tb.period_year = p_fiscal_year
          AND tb.version = p_version_id::text
        LIMIT 1;
        
        -- If no match found, use the UUID as string
        IF v_version_string IS NULL THEN
            v_version_string := p_version_id::text;
        END IF;
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
                'isEmpty', true
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
    WITH ordered_balances AS (
        SELECT abs_balance,
               ROW_NUMBER() OVER (ORDER BY abs_balance) as rn,
               COUNT(*) OVER () as total_count
        FROM population_balances
        WHERE abs_balance IS NOT NULL
    ),
    percentiles AS (
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
        'totalSum', v_total_sum
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
            'accountNumber', account_number,
            'accountName', COALESCE(account_name, 'Ukjent konto'),
            'closingBalance', closing_balance,
            'absBalance', abs_balance
        )
    ) INTO v_accounts
    FROM account_details;

    -- Counter account analysis - Fixed to use correct column names
    WITH counter_account_analysis AS (
        SELECT 
            counter_coa.account_number as counter_account,
            SUM(COALESCE(glt.debit_amount, 0) + COALESCE(glt.credit_amount, 0)) as total_amount,
            COUNT(*) as transaction_count
        FROM public.general_ledger_transactions glt
        JOIN public.client_chart_of_accounts main_coa ON glt.client_account_id = main_coa.id
        JOIN public.general_ledger_transactions counter_glt ON glt.voucher_number = counter_glt.voucher_number 
                                                               AND glt.client_id = counter_glt.client_id
                                                               AND glt.id != counter_glt.id
        JOIN public.client_chart_of_accounts counter_coa ON counter_glt.client_account_id = counter_coa.id
        WHERE glt.client_id = p_client_id
          AND glt.period_year = p_fiscal_year
          AND main_coa.account_number = ANY(v_account_numbers)
          AND counter_coa.account_number != ALL(v_account_numbers)
        GROUP BY counter_coa.account_number
        ORDER BY total_amount DESC
        LIMIT 10
    ),
    counter_accounts_with_names AS (
        SELECT 
            ca.counter_account,
            COALESCE(coa.account_name, ca.counter_account) as account_name,
            ca.total_amount,
            ca.transaction_count,
            ROUND((ca.total_amount / NULLIF(v_total_sum, 0)) * 100, 2) as percentage
        FROM counter_account_analysis ca
        LEFT JOIN public.client_chart_of_accounts coa ON ca.counter_account = coa.account_number AND coa.client_id = p_client_id
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'accountNumber', counter_account,
            'accountName', account_name,
            'totalAmount', total_amount,
            'transactionCount', transaction_count,
            'percentage', percentage
        )
    ) INTO v_counter_accounts
    FROM counter_accounts_with_names;

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

    -- Time series analysis - Fixed to use correct column names
    WITH monthly_data AS (
        SELECT 
            glt.period_year as year,
            glt.period_month as month,
            SUM(COALESCE(glt.debit_amount, 0) + COALESCE(glt.credit_amount, 0)) as total_amount,
            COUNT(*) as transaction_count
        FROM public.general_ledger_transactions glt
        JOIN public.client_chart_of_accounts coa ON glt.client_account_id = coa.id
        WHERE glt.client_id = p_client_id
          AND glt.period_year = p_fiscal_year
          AND coa.account_number = ANY(v_account_numbers)
        GROUP BY glt.period_year, glt.period_month
        ORDER BY year, month
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'month', month,
            'year', year,
            'totalAmount', total_amount,
            'transactionCount', transaction_count,
            'period', year || '-' || LPAD(month::text, 2, '0')
        )
    ) INTO v_time_series
    FROM monthly_data;

    -- Anomaly detection - Fixed to use correct column names
    WITH account_patterns AS (
        SELECT 
            pb.account_number,
            pb.account_name,
            pb.closing_balance,
            pb.abs_balance,
            CASE 
                WHEN pb.closing_balance > 0 AND NOT EXISTS(
                    SELECT 1 FROM public.general_ledger_transactions glt 
                    JOIN public.client_chart_of_accounts coa ON glt.client_account_id = coa.id
                    WHERE glt.client_id = p_client_id 
                    AND coa.account_number = pb.account_number 
                    AND glt.period_year = p_fiscal_year
                    AND glt.credit_amount > 0
                ) THEN 'only_debits'
                WHEN pb.closing_balance < 0 AND NOT EXISTS(
                    SELECT 1 FROM public.general_ledger_transactions glt 
                    JOIN public.client_chart_of_accounts coa ON glt.client_account_id = coa.id
                    WHERE glt.client_id = p_client_id 
                    AND coa.account_number = pb.account_number 
                    AND glt.period_year = p_fiscal_year
                    AND glt.debit_amount > 0
                ) THEN 'only_credits'
                WHEN pb.abs_balance > (v_mean + (3 * COALESCE(v_std_dev, 0))) THEN 'extreme_balance'
                ELSE NULL
            END as anomaly_type
        FROM population_balances pb
        WHERE pb.abs_balance > 0
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'accountNumber', account_number,
            'accountName', account_name,
            'closingBalance', closing_balance,
            'anomalyType', anomaly_type,
            'description', CASE 
                WHEN anomaly_type = 'only_debits' THEN 'Only debit transactions'
                WHEN anomaly_type = 'only_credits' THEN 'Only credit transactions'
                WHEN anomaly_type = 'extreme_balance' THEN 'Extremely high balance'
                ELSE 'Unknown anomaly'
            END
        )
    ) INTO v_anomalies
    FROM account_patterns
    WHERE anomaly_type IS NOT NULL;

    -- Clean up temp table
    DROP TABLE population_balances;

    -- Return comprehensive analysis with enhanced data
    RETURN jsonb_build_object(
        'basicStats', COALESCE(v_basic_stats, jsonb_build_object('totalAccounts', 0, 'totalSum', 0)),
        'accounts', COALESCE(v_accounts, '[]'::jsonb),
        'counterAccounts', COALESCE(v_counter_accounts, '[]'::jsonb),
        'outliers', COALESCE(v_outliers, jsonb_build_object('high', '[]'::jsonb, 'low', '[]'::jsonb)),
        'timeSeries', COALESCE(v_time_series, '[]'::jsonb),
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
            'accountsFound', COALESCE(array_length(v_account_numbers, 1), 0),
            'totalRecords', v_total_accounts,
            'isEmpty', false
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Clean up temp table if it exists
        BEGIN
            DROP TABLE IF EXISTS population_balances;
        EXCEPTION
            WHEN OTHERS THEN NULL;
        END;
        
        -- Return detailed error information for debugging
        RETURN jsonb_build_object(
            'basicStats', jsonb_build_object('totalAccounts', 0, 'totalSum', 0),
            'accounts', '[]'::jsonb,
            'counterAccounts', '[]'::jsonb,
            'outliers', jsonb_build_object('high', '[]'::jsonb, 'low', '[]'::jsonb),
            'timeSeries', '[]'::jsonb,
            'anomalies', '[]'::jsonb,
            'enhancedStats', jsonb_build_object(
                'mean', 0, 'median', 0, 'standardDeviation', 0,
                'q1', 0, 'q3', 0, 'iqr', 0, 'min', 0, 'max', 0
            ),
            'metadata', jsonb_build_object(
                'versionString', v_version_string,
                'executionTimeMs', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000,
                'hasDataForYear', v_has_data_for_year,
                'availableYears', COALESCE(v_available_years, ARRAY[]::INTEGER[]),
                'error', SQLSTATE || ': ' || SQLERRM,
                'selectedStandardNumbers', p_selected_standard_numbers,
                'isEmpty', true
            )
        );
END;
$function$