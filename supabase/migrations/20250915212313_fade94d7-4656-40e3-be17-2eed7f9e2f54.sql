-- Create a working optimized_analysis function with simpler structure
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
  v_total_debit NUMERIC := 0;
  v_total_credit NUMERIC := 0;
  v_total_net NUMERIC := 0;
  v_start_date DATE;
  v_end_date DATE;
  v_tb_total_accounts INTEGER := 0;
  v_tb_total_debit NUMERIC := 0;
  v_tb_total_credit NUMERIC := 0;
  v_tb_total_net NUMERIC := 0;
  v_latest_tb_version TEXT;
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
    v_cached_result := jsonb_set(
      v_cached_result::jsonb,
      '{metadata,cached}',
      'true'::jsonb
    )::json;
    RETURN v_cached_result;
  END IF;

  -- Get basic transaction stats
  SELECT 
    COUNT(*),
    SUM(COALESCE(glt.debit_amount, 0)),
    SUM(COALESCE(glt.credit_amount, 0)),
    MIN(glt.transaction_date),
    MAX(glt.transaction_date)
  INTO
    v_total_transactions,
    v_total_debit,
    v_total_credit,
    v_start_date,
    v_end_date
  FROM public.general_ledger_transactions glt
  WHERE glt.client_id = p_client_id AND glt.version_id = v_version_id;

  v_total_net := v_total_debit - v_total_credit;

  -- Get latest trial balance version
  SELECT version INTO v_latest_tb_version
  FROM public.trial_balances tb
  WHERE tb.client_id = p_client_id
  ORDER BY tb.created_at DESC
  LIMIT 1;

  -- Get trial balance data
  SELECT 
    COUNT(*),
    SUM(CASE WHEN tb.closing_balance >= 0 THEN tb.closing_balance ELSE 0 END),
    SUM(CASE WHEN tb.closing_balance < 0 THEN ABS(tb.closing_balance) ELSE 0 END),
    SUM(tb.closing_balance)
  INTO
    v_tb_total_accounts,
    v_tb_total_debit,
    v_tb_total_credit,
    v_tb_total_net
  FROM public.trial_balances tb
  WHERE tb.client_id = p_client_id
    AND (tb.version = v_version_id::text OR tb.version = v_latest_tb_version);

  -- Final result with basic structure
  v_result := json_build_object(
    'total_transactions', v_total_transactions,
    'date_range', json_build_object(
      'start', v_start_date,
      'end', v_end_date
    ),
    'monthly_summary', '[]'::json,
    'account_distribution', '[]'::json,
    'top_accounts', '[]'::json,
    'data_quality_flags', '[]'::json,
    'trial_balance_crosscheck', json_build_object(
      'balanced', ABS(v_total_net - v_tb_total_net) < 0.01,
      'diff', v_total_net - v_tb_total_net
    ),
    'trial_balance_summary', json_build_object(
      'total_accounts', v_tb_total_accounts,
      'total_debit', v_tb_total_debit,
      'total_credit', v_tb_total_credit,
      'total_net', v_tb_total_net,
      'has_imbalance', ABS(v_tb_total_net) > 0.01,
      'difference', v_tb_total_net
    ),
    'overview', json_build_object(
      'total_debit', v_total_debit,
      'total_credit', v_total_credit,
      'total_net', v_total_net
    ),
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