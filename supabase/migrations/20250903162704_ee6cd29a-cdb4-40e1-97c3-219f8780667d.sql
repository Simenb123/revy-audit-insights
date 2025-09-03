-- Drop all existing overloaded versions of calculate_population_analysis
DROP FUNCTION IF EXISTS public.calculate_population_analysis(uuid, integer, text[], text[], text);
DROP FUNCTION IF EXISTS public.calculate_population_analysis(uuid, integer, text[], text[], text, uuid);
DROP FUNCTION IF EXISTS public.calculate_population_analysis(uuid, integer, text[], text[], uuid);

-- Create the single, comprehensive calculate_population_analysis function
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
    v_start_time TIMESTAMP := clock_timestamp();
    v_account_numbers TEXT[];
    v_total_accounts INTEGER := 0;
    v_total_sum NUMERIC := 0;
    v_available_years INTEGER[];
    v_has_data_for_year BOOLEAN := false;
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

    -- If no accounts found or no data for year, return informative empty result
    IF v_account_numbers IS NULL OR array_length(v_account_numbers, 1) = 0 OR NOT v_has_data_for_year THEN
        RETURN jsonb_build_object(
            'basicStats', jsonb_build_object(
                'totalAccounts', 0,
                'totalSum', 0
            ),
            'accounts', '[]'::jsonb,
            'metadata', jsonb_build_object(
                'versionString', v_version_string,
                'executionTimeMs', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000,
                'hasDataForYear', v_has_data_for_year,
                'availableYears', COALESCE(v_available_years, ARRAY[]::INTEGER[]),
                'selectedStandardNumbers', p_selected_standard_numbers,
                'accountsFound', COALESCE(array_length(v_account_numbers, 1), 0)
            )
        );
    END IF;

    -- Calculate basic statistics with exclusions applied server-side
    WITH filtered_balances AS (
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
            GROUP BY account_number
        ) tc ON coa.account_number = tc.account_number
        WHERE tb.client_id = p_client_id
          AND tb.period_year = p_fiscal_year
          AND (v_version_string IS NULL OR tb.version = v_version_string)
          AND coa.account_number = ANY(v_account_numbers)
          AND NOT (coa.account_number = ANY(p_excluded_account_numbers))
    )
    SELECT 
        COUNT(*)::INTEGER,
        COALESCE(SUM(abs_balance), 0)::NUMERIC
    INTO v_total_accounts, v_total_sum
    FROM filtered_balances;

    -- Build basic stats
    SELECT jsonb_build_object(
        'totalAccounts', v_total_accounts,
        'totalSum', v_total_sum
    ) INTO v_basic_stats;

    -- Account details (limited and filtered to prevent memory issues)
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
        LIMIT 1000
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

    -- Return comprehensive analysis with enhanced metadata
    RETURN jsonb_build_object(
        'basicStats', COALESCE(v_basic_stats, jsonb_build_object('totalAccounts', 0, 'totalSum', 0)),
        'accounts', COALESCE(v_accounts, '[]'::jsonb),
        'metadata', jsonb_build_object(
            'versionString', v_version_string,
            'executionTimeMs', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000,
            'hasDataForYear', v_has_data_for_year,
            'availableYears', COALESCE(v_available_years, ARRAY[]::INTEGER[]),
            'selectedStandardNumbers', p_selected_standard_numbers,
            'excludedAccounts', array_length(p_excluded_account_numbers, 1),
            'accountsFound', COALESCE(array_length(v_account_numbers, 1), 0),
            'totalRecords', v_total_accounts
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Return detailed error information for debugging
        RETURN jsonb_build_object(
            'basicStats', jsonb_build_object('totalAccounts', 0, 'totalSum', 0),
            'accounts', '[]'::jsonb,
            'metadata', jsonb_build_object(
                'versionString', v_version_string,
                'executionTimeMs', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000,
                'hasDataForYear', v_has_data_for_year,
                'availableYears', COALESCE(v_available_years, ARRAY[]::INTEGER[]),
                'error', SQLSTATE || ': ' || SQLERRM,
                'selectedStandardNumbers', p_selected_standard_numbers
            )
        );
END;
$function$;