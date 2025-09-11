-- Fix the optimized_analysis RPC to properly handle net_amount calculations
CREATE OR REPLACE FUNCTION public.optimized_analysis(p_client_id uuid, p_dataset_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_version_id UUID;
  v_total_transactions INTEGER := 0;
  v_date_range JSON;
  v_monthly_summary JSON;
  v_account_distribution JSON;
  v_top_accounts JSON;
  v_data_quality_flags JSON;
  v_trial_balance_crosscheck JSON;
  v_result JSON;
BEGIN
  -- Get the active version or use provided dataset_id
  IF p_dataset_id IS NOT NULL THEN
    v_version_id := p_dataset_id;
  ELSE
    SELECT id INTO v_version_id
    FROM public.accounting_data_versions
    WHERE client_id = p_client_id AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF v_version_id IS NULL THEN
    RAISE EXCEPTION 'No active dataset found for client %', p_client_id;
  END IF;

  -- Get total transaction count
  SELECT COUNT(*) INTO v_total_transactions
  FROM public.general_ledger_transactions glt
  WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id;

  -- Calculate date range
  SELECT json_build_object(
    'start', COALESCE(MIN(glt.transaction_date)::text, ''),
    'end', COALESCE(MAX(glt.transaction_date)::text, '')
  ) INTO v_date_range
  FROM public.general_ledger_transactions glt
  WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id;

  -- Calculate monthly summary with proper net_amount calculation
  WITH monthly_agg AS (
    SELECT 
      TO_CHAR(glt.transaction_date, 'YYYY-MM') as month,
      COALESCE(SUM(glt.debit_amount), 0) as total_debit,
      COALESCE(SUM(glt.credit_amount), 0) as total_credit,
      COALESCE(SUM(glt.debit_amount), 0) - COALESCE(SUM(glt.credit_amount), 0) as net_amount
    FROM public.general_ledger_transactions glt
    WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id
    GROUP BY TO_CHAR(glt.transaction_date, 'YYYY-MM')
    ORDER BY month
  )
  SELECT json_agg(
    json_build_object(
      'month', month,
      'debit', total_debit,
      'credit', total_credit,
      'net', net_amount
    )
  ) INTO v_monthly_summary
  FROM monthly_agg;

  -- Calculate account distribution
  WITH account_agg AS (
    SELECT 
      COALESCE(coa.account_number, 'UNKNOWN') as account_number,
      COALESCE(coa.account_name, 'Unknown Account') as account_name,
      COALESCE(SUM(ABS(COALESCE(glt.debit_amount, 0) + COALESCE(glt.credit_amount, 0))), 0) as total_amount,
      COUNT(*) as transaction_count
    FROM public.general_ledger_transactions glt
    LEFT JOIN public.client_chart_of_accounts coa ON glt.client_account_id = coa.id
    WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id
    GROUP BY coa.account_number, coa.account_name
    ORDER BY total_amount DESC
    LIMIT 50
  )
  SELECT json_agg(
    json_build_object(
      'account', account_number || ' - ' || account_name,
      'amount', total_amount,
      'count', transaction_count
    )
  ) INTO v_account_distribution
  FROM account_agg;

  -- Calculate top accounts by net amount with proper scope handling
  WITH top_accounts_agg AS (
    SELECT 
      COALESCE(coa.account_number, 'UNKNOWN') as account_number,
      COALESCE(coa.account_name, 'Unknown Account') as account_name,
      COALESCE(SUM(COALESCE(glt.debit_amount, 0)), 0) as total_debit,
      COALESCE(SUM(COALESCE(glt.credit_amount, 0)), 0) as total_credit,
      COALESCE(SUM(COALESCE(glt.debit_amount, 0)), 0) - COALESCE(SUM(COALESCE(glt.credit_amount, 0)), 0) as net_amount
    FROM public.general_ledger_transactions glt
    LEFT JOIN public.client_chart_of_accounts coa ON glt.client_account_id = coa.id
    WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id
    GROUP BY coa.account_number, coa.account_name
    ORDER BY ABS(net_amount) DESC
    LIMIT 20
  )
  SELECT json_agg(
    json_build_object(
      'account', account_number || ' - ' || account_name,
      'net', net_amount,
      'debit_amount', total_debit,
      'credit_amount', total_credit
    )
  ) INTO v_top_accounts
  FROM top_accounts_agg;

  -- Data quality flags with NULL safety
  WITH quality_checks AS (
    -- Missing account mappings
    SELECT 
      'MISSING_ACCOUNT' as code,
      'high' as severity,
      COUNT(*) as flag_count,
      array_agg(glt.id::text) FILTER (WHERE glt.client_account_id IS NULL) as sample_ids
    FROM public.general_ledger_transactions glt
    WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id
      AND glt.client_account_id IS NULL
    
    UNION ALL
    
    -- Zero amount transactions
    SELECT 
      'ZERO_AMOUNT' as code,
      'low' as severity,
      COUNT(*) as flag_count,
      array_agg(glt.id::text) FILTER (WHERE COALESCE(glt.debit_amount, 0) = 0 AND COALESCE(glt.credit_amount, 0) = 0) as sample_ids
    FROM public.general_ledger_transactions glt
    WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id
      AND COALESCE(glt.debit_amount, 0) = 0 AND COALESCE(glt.credit_amount, 0) = 0
    
    UNION ALL
    
    -- Future dated transactions
    SELECT 
      'FUTURE_DATE' as code,
      'med' as severity,
      COUNT(*) as flag_count,
      array_agg(glt.id::text) FILTER (WHERE glt.transaction_date > CURRENT_DATE) as sample_ids
    FROM public.general_ledger_transactions glt
    WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id
      AND glt.transaction_date > CURRENT_DATE
  )
  SELECT json_agg(
    json_build_object(
      'code', code,
      'severity', severity,
      'count', flag_count,
      'sampleIds', COALESCE(sample_ids[1:5], ARRAY[]::text[])
    )
  ) FILTER (WHERE flag_count > 0)
  INTO v_data_quality_flags
  FROM quality_checks;

  -- Trial balance crosscheck with NULL safety
  WITH balance_check AS (
    SELECT 
      COALESCE(SUM(COALESCE(glt.debit_amount, 0) - COALESCE(glt.credit_amount, 0)), 0) as calculated_balance
    FROM public.general_ledger_transactions glt
    WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id
  )
  SELECT json_build_object(
    'balanced', ABS(calculated_balance) < 0.01,
    'diff', calculated_balance
  ) INTO v_trial_balance_crosscheck
  FROM balance_check;

  -- Build final result with proper NULL handling
  SELECT json_build_object(
    'total_transactions', COALESCE(v_total_transactions, 0),
    'date_range', COALESCE(v_date_range, json_build_object('start', null, 'end', null)),
    'monthly_summary', COALESCE(v_monthly_summary, '[]'::json),
    'account_distribution', COALESCE(v_account_distribution, '[]'::json),
    'top_accounts', COALESCE(v_top_accounts, '[]'::json),
    'data_quality_flags', COALESCE(v_data_quality_flags, '[]'::json),
    'trial_balance_crosscheck', COALESCE(v_trial_balance_crosscheck, json_build_object('balanced', false, 'diff', 0)),
    'metadata', json_build_object(
      'client_id', p_client_id,
      'dataset_id', v_version_id,
      'generated_at', NOW()
    )
  ) INTO v_result;

  RETURN v_result;
END;
$function$;