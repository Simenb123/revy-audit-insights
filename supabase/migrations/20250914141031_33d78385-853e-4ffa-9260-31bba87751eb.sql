-- Create analysis cache table for optimized analysis results
CREATE TABLE IF NOT EXISTS public.ai_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  dataset_id UUID,
  cache_key TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 hour')
);

-- Enable RLS
ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own analysis cache" 
ON public.ai_analysis_cache 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create analysis cache" 
ON public.ai_analysis_cache 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update analysis cache" 
ON public.ai_analysis_cache 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_client_dataset 
ON public.ai_analysis_cache (client_id, dataset_id, cache_key);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_expires 
ON public.ai_analysis_cache (expires_at);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_ai_analysis_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_analysis_cache_updated_at
BEFORE UPDATE ON public.ai_analysis_cache
FOR EACH ROW
EXECUTE FUNCTION update_ai_analysis_cache_updated_at();

-- Enhanced optimized_analysis function with caching and enhanced statistics
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
  v_cached_result JSONB;
  v_total_transactions INTEGER := 0;
  v_date_range JSON := json_build_object('start', NULL, 'end', NULL);
  v_monthly_summary JSON := '[]'::json;
  v_account_distribution JSON := '[]'::json;
  v_top_accounts JSON := '[]'::json;
  v_data_quality_flags JSON := '[]'::json;
  v_trial_balance_crosscheck JSON := json_build_object('balanced', false, 'diff', 0);
  v_overview JSON := json_build_object('total_debit', 0, 'total_credit', 0, 'total_net', 0);
  v_amount_statistics JSON := json_build_object('sum', 0, 'average', 0, 'min', 0, 'max', 0, 'positive_count', 0, 'negative_count', 0);
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

  -- Create cache key
  v_cache_key := 'optimized_analysis_' || p_client_id::text || '_' || v_version_id::text;

  -- Check cache first
  SELECT analysis_data INTO v_cached_result
  FROM public.ai_analysis_cache
  WHERE client_id = p_client_id 
    AND dataset_id = v_version_id 
    AND cache_key = v_cache_key 
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_cached_result IS NOT NULL THEN
    RETURN v_cached_result::json;
  END IF;

  -- Base CTE with per-transaction net_amount and enhanced calculations
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
  amount_stats AS (
    SELECT 
      COALESCE(SUM(net_amount), 0) AS sum_net,
      COALESCE(AVG(net_amount), 0) AS avg_net,
      COALESCE(MIN(net_amount), 0) AS min_net,
      COALESCE(MAX(net_amount), 0) AS max_net,
      COUNT(*) FILTER (WHERE net_amount > 0) AS positive_count,
      COUNT(*) FILTER (WHERE net_amount < 0) AS negative_count
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

    UNION ALL

    SELECT 
      'DUPLICATE_VOUCHER' AS code,
      'med' AS severity,
      COUNT(*) AS flag_count,
      array_agg(b.id::text) AS sample_ids
    FROM base_tx b
    WHERE b.voucher_number IS NOT NULL
      AND b.voucher_number IN (
        SELECT voucher_number 
        FROM base_tx 
        WHERE voucher_number IS NOT NULL 
        GROUP BY voucher_number, debit_amount, credit_amount 
        HAVING COUNT(*) > 1
      )
  ),
  balance_check AS (
    SELECT COALESCE(SUM(b.net_amount), 0) AS calculated_balance
    FROM base_tx b
  )
  SELECT
    -- Assign scalars from different CTEs
    t.total_tx,
    t.total_debit,
    t.total_credit,
    t.total_net,
    t.start_date,
    t.end_date,
    -- Amount statistics
    json_build_object(
      'sum', ast.sum_net,
      'average', ast.avg_net,
      'min', ast.min_net,
      'max', ast.max_net,
      'positive_count', ast.positive_count,
      'negative_count', ast.negative_count
    ) AS _amount_statistics,
    -- JSON aggregates
    (
      SELECT json_agg(json_build_object(
        'month', m.month,
        'debit', m.total_debit,
        'credit', m.total_credit,
        'net', m.net_amount,
        'net_amount', m.net_amount
      )) FROM monthly_agg m
    ) AS _monthly_summary,
    (
      SELECT json_agg(json_build_object(
        'account', a.account_number || ' - ' || a.account_name,
        'amount', a.total_amount,
        'count', a.transaction_count
      )) FROM account_agg a
    ) AS _account_distribution,
    (
      SELECT json_agg(json_build_object(
        'account', ta.account_number || ' - ' || ta.account_name,
        'net', ta.net_amount,
        'net_amount', ta.net_amount,
        'debit_amount', ta.total_debit,
        'credit_amount', ta.total_credit
      )) FROM top_accounts_agg ta
    ) AS _top_accounts,
    (
      SELECT json_agg(json_build_object(
        'code', qc.code,
        'severity', qc.severity,
        'count', qc.flag_count,
        'sampleIds', COALESCE(qc.sample_ids[1:5], ARRAY[]::text[])
      )) FILTER (WHERE qc.flag_count > 0)
      FROM quality_checks qc
    ) AS _data_quality_flags,
    (
      SELECT json_build_object(
        'balanced', ABS(bc.calculated_balance) < 0.01,
        'diff', bc.calculated_balance
      )
      FROM balance_check bc
    ) AS _trial_balance_crosscheck
  INTO
    v_total_transactions,
    v_overview,
    v_overview,
    v_overview,
    v_date_range,
    v_date_range,
    v_amount_statistics,
    v_monthly_summary,
    v_account_distribution,
    v_top_accounts,
    v_data_quality_flags,
    v_trial_balance_crosscheck
  FROM totals t, amount_stats ast;

  -- Build overview JSON from totals
  v_overview := json_build_object(
    'total_debit', COALESCE((v_overview->>'total_debit')::numeric, 0),
    'total_credit', COALESCE((v_overview->>'total_credit')::numeric, 0),
    'total_net', COALESCE((v_overview->>'total_net')::numeric, 0)
  );

  -- Build date range
  v_date_range := json_build_object(
    'start', v_date_range->>'start_date',
    'end', v_date_range->>'end_date'
  );

  -- Ensure defaults for possible NULLs
  v_monthly_summary := COALESCE(v_monthly_summary, '[]'::json);
  v_account_distribution := COALESCE(v_account_distribution, '[]'::json);
  v_top_accounts := COALESCE(v_top_accounts, '[]'::json);
  v_data_quality_flags := COALESCE(v_data_quality_flags, '[]'::json);
  v_trial_balance_crosscheck := COALESCE(v_trial_balance_crosscheck, json_build_object('balanced', false, 'diff', 0));
  v_amount_statistics := COALESCE(v_amount_statistics, json_build_object('sum', 0, 'average', 0, 'min', 0, 'max', 0, 'positive_count', 0, 'negative_count', 0));

  -- Final result
  v_result := json_build_object(
    'total_transactions', COALESCE(v_total_transactions, 0),
    'date_range', v_date_range,
    'monthly_summary', v_monthly_summary,
    'account_distribution', v_account_distribution,
    'top_accounts', v_top_accounts,
    'data_quality_flags', v_data_quality_flags,
    'trial_balance_crosscheck', v_trial_balance_crosscheck,
    'amount_statistics', v_amount_statistics,
    'overview', v_overview,
    'metadata', json_build_object(
      'client_id', p_client_id,
      'dataset_id', v_version_id,
      'generated_at', NOW()
    )
  );

  -- Cache the result
  INSERT INTO public.ai_analysis_cache (client_id, dataset_id, cache_key, analysis_data, expires_at)
  VALUES (p_client_id, v_version_id, v_cache_key, v_result::jsonb, now() + INTERVAL '1 hour')
  ON CONFLICT (client_id, dataset_id, cache_key) 
  DO UPDATE SET 
    analysis_data = EXCLUDED.analysis_data,
    updated_at = now(),
    expires_at = EXCLUDED.expires_at;

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
      'amount_statistics', json_build_object('sum', 0, 'average', 0, 'min', 0, 'max', 0, 'positive_count', 0, 'negative_count', 0),
      'overview', json_build_object('total_debit', 0, 'total_credit', 0, 'total_net', 0),
      'metadata', json_build_object(
        'client_id', p_client_id,
        'dataset_id', v_version_id,
        'generated_at', NOW(),
        'error', SQLSTATE || ': ' || SQLERRM
      )
    );
END;
$function$;