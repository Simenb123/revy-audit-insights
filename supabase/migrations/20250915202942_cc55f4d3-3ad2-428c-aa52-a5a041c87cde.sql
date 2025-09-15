-- Fix GROUP BY error and data integrity issues in optimized_analysis function
CREATE OR REPLACE FUNCTION public.optimized_analysis(p_client_id uuid, p_dataset_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_version_id UUID;
  v_result JSON;
  v_cache_key TEXT;
  v_cached_result JSON;
  v_total_transactions INTEGER := 0;
  v_date_range JSON := json_build_object('start', NULL, 'end', NULL);
  v_monthly_summary JSON := '[]'::json;
  v_account_distribution JSON := '[]'::json;
  v_top_accounts JSON := '[]'::json;
  v_data_quality_flags JSON := '[]'::json;
  v_trial_balance_crosscheck JSON := json_build_object('balanced', false, 'diff', 0);
  v_trial_balance_summary JSON := json_build_object('total_accounts', 0, 'total_debit', 0, 'total_credit', 0, 'total_net', 0, 'has_imbalance', false, 'difference', 0);
  v_overview JSON := json_build_object('total_debit', 0, 'total_credit', 0, 'total_net', 0);
  -- Scalar variables for proper assignment
  v_total_debit NUMERIC := 0;
  v_total_credit NUMERIC := 0;
  v_total_net NUMERIC := 0;
  v_start_date DATE;
  v_end_date DATE;
  v_tb_total_accounts INTEGER := 0;
  v_tb_total_debit NUMERIC := 0;
  v_tb_total_credit NUMERIC := 0;
  v_tb_total_net NUMERIC := 0;
  v_ledger_balance NUMERIC := 0;
  v_trial_balance_net NUMERIC := 0;
BEGIN
  -- Resolve version id (prefer provided dataset id or latest active)
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

  -- Generate cache key
  v_cache_key := 'optimized_analysis_' || p_client_id::text || '_' || v_version_id::text;

  -- Check cache first
  SELECT result_data INTO v_cached_result
  FROM public.analysis_cache
  WHERE cache_key = v_cache_key
    AND expires_at > now()
  LIMIT 1;

  -- Return cached result if found
  IF v_cached_result IS NOT NULL THEN
    -- Mark as cached in metadata
    v_cached_result := jsonb_set(
      v_cached_result::jsonb,
      '{metadata,cached}',
      'true'::jsonb
    )::json;
    RETURN v_cached_result;
  END IF;

  -- Compute fresh analysis with proper aggregation
  WITH base_tx AS (
    SELECT 
      glt.id,
      glt.client_id,
      glt.version_id,
      glt.transaction_date,
      glt.period_year,
      glt.period_month,
      glt.client_account_id,
      glt.voucher_number,
      COALESCE(glt.debit_amount, 0) AS debit_amount,
      COALESCE(glt.credit_amount, 0) AS credit_amount,
      (COALESCE(glt.debit_amount, 0) - COALESCE(glt.credit_amount, 0)) AS net_amount
    FROM public.general_ledger_transactions glt
    WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id
  ),
  totals AS (
    SELECT 
      COUNT(*) AS total_tx,
      SUM(debit_amount) AS total_debit,
      SUM(credit_amount) AS total_credit,
      SUM(net_amount) AS total_net,
      MIN(transaction_date) AS start_date,
      MAX(transaction_date) AS end_date
    FROM base_tx
  ),
  monthly_agg AS (
    SELECT 
      TO_CHAR(transaction_date, 'YYYY-MM') AS month,
      SUM(debit_amount) AS total_debit,
      SUM(credit_amount) AS total_credit,
      SUM(net_amount) AS net_amount
    FROM base_tx
    GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
    ORDER BY month
  ),
  account_agg AS (
    SELECT 
      COALESCE(coa.account_number, 'UNKNOWN') AS account_number,
      COALESCE(coa.account_name, 'Unknown Account') AS account_name,
      SUM(ABS(b.debit_amount) + ABS(b.credit_amount)) AS total_amount,
      COUNT(*) AS transaction_count
    FROM base_tx b
    LEFT JOIN public.client_chart_of_accounts coa ON b.client_account_id = coa.id
    GROUP BY coa.account_number, coa.account_name
    ORDER BY total_amount DESC
    LIMIT 50
  ),
  top_accounts_agg AS (
    SELECT 
      COALESCE(coa.account_number, 'UNKNOWN') AS account_number,
      COALESCE(coa.account_name, 'Unknown Account') AS account_name,
      SUM(b.debit_amount) AS total_debit,
      SUM(b.credit_amount) AS total_credit,
      SUM(b.net_amount) AS net_amount
    FROM base_tx b
    LEFT JOIN public.client_chart_of_accounts coa ON b.client_account_id = coa.id
    GROUP BY coa.account_number, coa.account_name
    ORDER BY ABS(SUM(b.net_amount)) DESC
    LIMIT 20
  ),
  quality_checks AS (
    SELECT 
      'MISSING_ACCOUNT' AS code,
      'high' AS severity,
      COUNT(*) AS flag_count,
      array_agg(b.id::text) AS sample_ids
    FROM base_tx b
    WHERE b.client_account_id IS NULL

    UNION ALL

    SELECT 
      'ZERO_AMOUNT' AS code,
      'low' AS severity,
      COUNT(*) AS flag_count,
      array_agg(b.id::text) AS sample_ids
    FROM base_tx b
    WHERE b.debit_amount = 0 AND b.credit_amount = 0

    UNION ALL

    SELECT 
      'FUTURE_DATE' AS code,
      'med' AS severity,
      COUNT(*) AS flag_count,
      array_agg(b.id::text) AS sample_ids
    FROM base_tx b
    WHERE b.transaction_date > CURRENT_DATE
  ),
  -- Trial balance summary with flexible version matching
  trial_balance_agg AS (
    SELECT 
      COUNT(*) AS tb_total_accounts,
      SUM(CASE WHEN tb.closing_balance >= 0 THEN tb.closing_balance ELSE 0 END) AS tb_total_debit,
      SUM(CASE WHEN tb.closing_balance < 0 THEN ABS(tb.closing_balance) ELSE 0 END) AS tb_total_credit,
      SUM(tb.closing_balance) AS tb_total_net
    FROM public.trial_balances tb
    WHERE tb.client_id = p_client_id
      AND (tb.version = v_version_id::text OR tb.version IN (
        SELECT DISTINCT tb2.version 
        FROM public.trial_balances tb2 
        WHERE tb2.client_id = p_client_id 
        ORDER BY tb2.created_at DESC 
        LIMIT 1
      ))
  ),
  -- Cross-check calculation
  balance_check AS (
    SELECT 
      SUM(b.net_amount) AS ledger_balance,
      (SELECT tb_total_net FROM trial_balance_agg LIMIT 1) AS trial_balance_net
    FROM base_tx b
  )
  -- Get scalar values from totals
  SELECT 
    COALESCE(t.total_tx, 0),
    COALESCE(t.total_debit, 0),
    COALESCE(t.total_credit, 0), 
    COALESCE(t.total_net, 0),
    t.start_date,
    t.end_date
  INTO
    v_total_transactions,
    v_total_debit,
    v_total_credit,
    v_total_net,
    v_start_date,
    v_end_date
  FROM totals t;

  -- Get trial balance scalars
  SELECT 
    COALESCE(tba.tb_total_accounts, 0),
    COALESCE(tba.tb_total_debit, 0),
    COALESCE(tba.tb_total_credit, 0),
    COALESCE(tba.tb_total_net, 0)
  INTO
    v_tb_total_accounts,
    v_tb_total_debit,
    v_tb_total_credit,
    v_tb_total_net
  FROM trial_balance_agg tba;

  -- Get balance check scalars
  SELECT 
    COALESCE(bc.ledger_balance, 0),
    COALESCE(bc.trial_balance_net, 0)
  INTO
    v_ledger_balance,
    v_trial_balance_net
  FROM balance_check bc;

  -- Build JSON aggregates
  SELECT COALESCE(json_agg(json_build_object(
    'month', m.month,
    'debit', m.total_debit,
    'credit', m.total_credit,
    'net', m.net_amount
  )), '[]'::json) INTO v_monthly_summary
  FROM monthly_agg m;

  SELECT COALESCE(json_agg(json_build_object(
    'account', a.account_number || ' - ' || a.account_name,
    'amount', a.total_amount,
    'count', a.transaction_count
  )), '[]'::json) INTO v_account_distribution
  FROM account_agg a;

  SELECT COALESCE(json_agg(json_build_object(
    'account', ta.account_number || ' - ' || ta.account_name,
    'net', ta.net_amount
  )), '[]'::json) INTO v_top_accounts
  FROM top_accounts_agg ta;

  SELECT COALESCE(json_agg(json_build_object(
    'code', qc.code,
    'severity', qc.severity,
    'count', qc.flag_count,
    'sampleIds', COALESCE(qc.sample_ids[1:5], ARRAY[]::text[])
  )) FILTER (WHERE qc.flag_count > 0), '[]'::json) INTO v_data_quality_flags
  FROM quality_checks qc;

  -- Build final JSON objects
  v_overview := json_build_object(
    'total_debit', v_total_debit,
    'total_credit', v_total_credit,
    'total_net', v_total_net
  );

  v_date_range := json_build_object(
    'start', v_start_date,
    'end', v_end_date
  );

  v_trial_balance_crosscheck := json_build_object(
    'balanced', ABS(v_ledger_balance - v_trial_balance_net) < 0.01,
    'diff', v_ledger_balance - v_trial_balance_net
  );

  v_trial_balance_summary := json_build_object(
    'total_accounts', v_tb_total_accounts,
    'total_debit', v_tb_total_debit,
    'total_credit', v_tb_total_credit,
    'total_net', v_tb_total_net,
    'has_imbalance', ABS(v_tb_total_net) > 0.01,
    'difference', v_tb_total_net
  );

  -- Final result
  v_result := json_build_object(
    'total_transactions', v_total_transactions,
    'date_range', v_date_range,
    'monthly_summary', v_monthly_summary,
    'account_distribution', v_account_distribution,
    'top_accounts', v_top_accounts,
    'data_quality_flags', v_data_quality_flags,
    'trial_balance_crosscheck', v_trial_balance_crosscheck,
    'trial_balance_summary', v_trial_balance_summary,
    'overview', v_overview,
    'metadata', json_build_object(
      'client_id', p_client_id,
      'dataset_id', v_version_id,
      'generated_at', NOW(),
      'cached', false
    )
  );

  -- Cache the result
  INSERT INTO public.analysis_cache (
    client_id, dataset_id, cache_key, result_data, analysis_type
  ) VALUES (
    p_client_id, v_version_id, v_cache_key, v_result, 'optimized'
  )
  ON CONFLICT (cache_key) 
  DO UPDATE SET 
    result_data = EXCLUDED.result_data,
    cached_at = now(),
    expires_at = now() + interval '30 minutes',
    updated_at = now();

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'total_transactions', 0,
      'date_range', json_build_object('start', NULL, 'end', NULL),
      'monthly_summary', '[]'::json,
      'account_distribution', '[]'::json,
      'top_accounts', '[]'::json,
      'data_quality_flags', '[]'::json,
      'trial_balance_crosscheck', json_build_object('balanced', false, 'diff', 0),
      'trial_balance_summary', json_build_object('total_accounts', 0, 'total_debit', 0, 'total_credit', 0, 'total_net', 0, 'has_imbalance', false, 'difference', 0),
      'overview', json_build_object('total_debit', 0, 'total_credit', 0, 'total_net', 0),
      'metadata', json_build_object(
        'client_id', p_client_id,
        'dataset_id', v_version_id,
        'generated_at', NOW(),
        'cached', false,
        'error', SQLSTATE || ': ' || SQLERRM
      )
    );
END;
$function$;

-- Update accounting data versions with correct totals
UPDATE public.accounting_data_versions 
SET 
  total_debit_amount = subq.total_debit,
  total_credit_amount = subq.total_credit,
  updated_at = now()
FROM (
  SELECT 
    glt.version_id,
    SUM(COALESCE(glt.debit_amount, 0)) as total_debit,
    SUM(COALESCE(glt.credit_amount, 0)) as total_credit
  FROM public.general_ledger_transactions glt
  WHERE glt.client_id = '8e5a5e79-8510-4e80-98a0-65e6548585ef'
  GROUP BY glt.version_id
) subq
WHERE accounting_data_versions.id = subq.version_id
AND accounting_data_versions.client_id = '8e5a5e79-8510-4e80-98a0-65e6548585ef';