-- Ensure optimized_analysis defines and uses net_amount aliases correctly within scope
CREATE OR REPLACE FUNCTION public.optimized_analysis(p_client_id uuid, p_dataset_id uuid DEFAULT NULL::uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
  -- Resolve version id
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

  -- Basic counts
  SELECT COUNT(*) INTO v_total_transactions
  FROM public.general_ledger_transactions glt
  WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id;

  -- Date range
  SELECT json_build_object(
    'start', COALESCE(MIN(glt.transaction_date)::text, ''),
    'end', COALESCE(MAX(glt.transaction_date)::text, '')
  ) INTO v_date_range
  FROM public.general_ledger_transactions glt
  WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id;

  -- Monthly summary (define net_amount inside CTE and use alias only within this scope)
  WITH monthly_agg AS (
    SELECT 
      TO_CHAR(glt.transaction_date, 'YYYY-MM') AS month,
      COALESCE(SUM(glt.debit_amount), 0)     AS total_debit,
      COALESCE(SUM(glt.credit_amount), 0)    AS total_credit,
      COALESCE(SUM(glt.debit_amount), 0) - COALESCE(SUM(glt.credit_amount), 0) AS net_amount
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

  -- Account distribution
  WITH account_agg AS (
    SELECT 
      COALESCE(coa.account_number, 'UNKNOWN') AS account_number,
      COALESCE(coa.account_name, 'Unknown Account') AS account_name,
      COALESCE(SUM(ABS(COALESCE(glt.debit_amount, 0) + COALESCE(glt.credit_amount, 0))), 0) AS total_amount,
      COUNT(*) AS transaction_count
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

  -- Top accounts (define net_amount in CTE; use alias for ORDER BY and JSON build INSIDE same CTE scope only)
  WITH top_accounts_agg AS (
    SELECT 
      COALESCE(coa.account_number, 'UNKNOWN') AS account_number,
      COALESCE(coa.account_name, 'Unknown Account') AS account_name,
      COALESCE(SUM(COALESCE(glt.debit_amount, 0)), 0)  AS total_debit,
      COALESCE(SUM(COALESCE(glt.credit_amount, 0)), 0) AS total_credit,
      COALESCE(SUM(COALESCE(glt.debit_amount, 0)), 0) - COALESCE(SUM(COALESCE(glt.credit_amount, 0)), 0) AS net_amount
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

  -- Data quality flags (unchanged)
  WITH quality_checks AS (
    SELECT 
      'MISSING_ACCOUNT' AS code,
      'high' AS severity,
      COUNT(*) AS flag_count,
      array_agg(glt.id::text) FILTER (WHERE glt.client_account_id IS NULL) AS sample_ids
    FROM public.general_ledger_transactions glt
    WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id AND glt.client_account_id IS NULL

    UNION ALL

    SELECT 
      'ZERO_AMOUNT' AS code,
      'low' AS severity,
      COUNT(*) AS flag_count,
      array_agg(glt.id::text) FILTER (WHERE COALESCE(glt.debit_amount, 0) = 0 AND COALESCE(glt.credit_amount, 0) = 0) AS sample_ids
    FROM public.general_ledger_transactions glt
    WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id AND COALESCE(glt.debit_amount, 0) = 0 AND COALESCE(glt.credit_amount, 0) = 0

    UNION ALL

    SELECT 
      'FUTURE_DATE' AS code,
      'med' AS severity,
      COUNT(*) AS flag_count,
      array_agg(glt.id::text) FILTER (WHERE glt.transaction_date > CURRENT_DATE) AS sample_ids
    FROM public.general_ledger_transactions glt
    WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id AND glt.transaction_date > CURRENT_DATE
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

  -- Trial balance crosscheck (no external net_amount references)
  WITH balance_check AS (
    SELECT 
      COALESCE(SUM(COALESCE(glt.debit_amount, 0) - COALESCE(glt.credit_amount, 0)), 0) AS calculated_balance
    FROM public.general_ledger_transactions glt
    WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id
  )
  SELECT json_build_object(
    'balanced', ABS(calculated_balance) < 0.01,
    'diff', calculated_balance
  ) INTO v_trial_balance_crosscheck
  FROM balance_check;

  -- Final result
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