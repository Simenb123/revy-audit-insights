-- Fix the optimized_analysis function to properly assign values
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
  -- New scalar variables for proper assignment
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

  -- Compute fresh analysis
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
      COALESCE(glt.debit_amount, 0)   AS debit_amount,
      COALESCE(glt.credit_amount, 0)  AS credit_amount,
      COALESCE(glt.debit_amount, 0) - COALESCE(glt.credit_amount, 0) AS net_amount
    FROM public.general_ledger_transactions glt
    WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id
  ),
  totals AS (
    SELECT 
      COUNT(*) AS total_tx,
      COALESCE(SUM(debit_amount), 0) AS total_debit,
      COALESCE(SUM(credit_amount), 0) AS total_credit,
      COALESCE(SUM(net_amount), 0) AS total_net,
      MIN(transaction_date) AS start_date,
      MAX(transaction_date) AS end_date
    FROM base_tx
  ),
  monthly_agg AS (
    SELECT 
      TO_CHAR(b.transaction_date, 'YYYY-MM') AS month,
      COALESCE(SUM(b.debit_amount), 0)  AS total_debit,
      COALESCE(SUM(b.credit_amount), 0) AS total_credit,
      COALESCE(SUM(b.net_amount), 0)    AS net_amount
    FROM base_tx b
    GROUP BY TO_CHAR(b.transaction_date, 'YYYY-MM')
    ORDER BY month
  ),
  account_agg AS (
    SELECT 
      COALESCE(coa.account_number, 'UNKNOWN') AS account_number,
      COALESCE(coa.account_name, 'Unknown Account') AS account_name,
      COALESCE(SUM(ABS(b.debit_amount) + ABS(b.credit_amount)), 0) AS total_amount,
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
      COALESCE(SUM(b.debit_amount), 0)  AS total_debit,
      COALESCE(SUM(b.credit_amount), 0) AS total_credit,
      COALESCE(SUM(b.net_amount), 0)    AS net_amount
    FROM base_tx b
    LEFT JOIN public.client_chart_of_accounts coa ON b.client_account_id = coa.id
    GROUP BY coa.account_number, coa.account_name
    ORDER BY ABS(net_amount) DESC
    LIMIT 20
  ),
  quality_checks AS (
    SELECT 
      'MISSING_ACCOUNT' AS code,
      'high' AS severity,
      COUNT(*) AS flag_count,
      array_agg(b.id::text) FILTER (WHERE b.client_account_id IS NULL) AS sample_ids
    FROM base_tx b
    WHERE b.client_account_id IS NULL

    UNION ALL

    SELECT 
      'ZERO_AMOUNT' AS code,
      'low' AS severity,
      COUNT(*) AS flag_count,
      array_agg(b.id::text) FILTER (WHERE COALESCE(b.debit_amount, 0) = 0 AND COALESCE(b.credit_amount, 0) = 0) AS sample_ids
    FROM base_tx b
    WHERE COALESCE(b.debit_amount, 0) = 0 AND COALESCE(b.credit_amount, 0) = 0

    UNION ALL

    SELECT 
      'FUTURE_DATE' AS code,
      'med' AS severity,
      COUNT(*) AS flag_count,
      array_agg(b.id::text) FILTER (WHERE b.transaction_date > CURRENT_DATE) AS sample_ids
    FROM base_tx b
    WHERE b.transaction_date > CURRENT_DATE
  ),
  -- Trial balance summary aggregation from actual trial balance data
  trial_balance_agg AS (
    SELECT 
      COUNT(*) AS tb_total_accounts,
      COALESCE(SUM(CASE WHEN tb.closing_balance >= 0 THEN tb.closing_balance ELSE 0 END), 0) AS tb_total_debit,
      COALESCE(SUM(CASE WHEN tb.closing_balance < 0 THEN ABS(tb.closing_balance) ELSE 0 END), 0) AS tb_total_credit,
      COALESCE(SUM(tb.closing_balance), 0) AS tb_total_net
    FROM public.trial_balances tb
    WHERE tb.client_id = p_client_id
      AND tb.version = v_version_id::text
  ),
  -- Cross-check calculation: compare ledger balance with trial balance total
  balance_check AS (
    SELECT 
      COALESCE(SUM(b.net_amount), 0) AS ledger_balance,
      COALESCE((SELECT tb_total_net FROM trial_balance_agg LIMIT 1), 0) AS trial_balance_net
    FROM base_tx b
  )
  -- Get scalar values first
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
    bc.ledger_balance,
    bc.trial_balance_net
  INTO
    v_ledger_balance,
    v_trial_balance_net
  FROM balance_check bc;

  -- Build JSON aggregates separately
  SELECT json_agg(json_build_object(
    'month', m.month,
    'debit', m.total_debit,
    'credit', m.total_credit,
    'net', m.net_amount
  )) INTO v_monthly_summary
  FROM monthly_agg m;

  SELECT json_agg(json_build_object(
    'account', a.account_number || ' - ' || a.account_name,
    'amount', a.total_amount,
    'count', a.transaction_count
  )) INTO v_account_distribution
  FROM account_agg a;

  SELECT json_agg(json_build_object(
    'account', ta.account_number || ' - ' || ta.account_name,
    'net', ta.net_amount
  )) INTO v_top_accounts
  FROM top_accounts_agg ta;

  SELECT json_agg(json_build_object(
    'code', qc.code,
    'severity', qc.severity,
    'count', qc.flag_count,
    'sampleIds', COALESCE(qc.sample_ids[1:5], ARRAY[]::text[])
  )) FILTER (WHERE qc.flag_count > 0) INTO v_data_quality_flags
  FROM quality_checks qc;

  -- Build overview JSON
  v_overview := json_build_object(
    'total_debit', v_total_debit,
    'total_credit', v_total_credit,
    'total_net', v_total_net
  );

  -- Build proper date range
  v_date_range := json_build_object(
    'start', v_start_date,
    'end', v_end_date
  );

  -- Build cross-check JSON with strict equality check
  v_trial_balance_crosscheck := json_build_object(
    'balanced', ABS(v_ledger_balance - v_trial_balance_net) < 0.01,
    'diff', v_ledger_balance - v_trial_balance_net
  );

  -- Build trial balance summary JSON with correct values
  v_trial_balance_summary := json_build_object(
    'total_accounts', v_tb_total_accounts,
    'total_debit', v_tb_total_debit,
    'total_credit', v_tb_total_credit,
    'total_net', v_tb_total_net,
    'has_imbalance', ABS(v_tb_total_net) > 0.01,
    'difference', v_tb_total_net
  );

  -- Ensure defaults for possible NULLs
  v_monthly_summary := COALESCE(v_monthly_summary, '[]'::json);
  v_account_distribution := COALESCE(v_account_distribution, '[]'::json);
  v_top_accounts := COALESCE(v_top_accounts, '[]'::json);
  v_data_quality_flags := COALESCE(v_data_quality_flags, '[]'::json);

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

  -- Cache the result with 30 minute TTL
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
    -- On error, return safe defaults with error context in metadata
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