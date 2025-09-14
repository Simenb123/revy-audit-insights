-- Create optimized ledger transactions RPC function that handles large datasets
CREATE OR REPLACE FUNCTION public.fetch_ledger_transactions(
  p_client_id UUID,
  p_version_id UUID DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 100,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_start_account TEXT DEFAULT NULL,
  p_end_account TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'transaction_date',
  p_sort_order TEXT DEFAULT 'asc'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_offset INTEGER;
  v_version_id UUID;
  v_transactions JSONB;
  v_totals JSONB;
  v_total_count INTEGER;
BEGIN
  -- Calculate offset for pagination
  v_offset := (p_page - 1) * p_page_size;
  
  -- Resolve version ID (prefer provided or get active version)
  IF p_version_id IS NOT NULL THEN
    v_version_id := p_version_id;
  ELSE
    SELECT id INTO v_version_id
    FROM public.accounting_data_versions
    WHERE client_id = p_client_id AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF v_version_id IS NULL THEN
    RAISE EXCEPTION 'No active version found for client %', p_client_id;
  END IF;

  -- Build base CTE with efficient indexing
  WITH base_query AS (
    SELECT 
      glt.id,
      glt.transaction_date,
      glt.description,
      COALESCE(glt.debit_amount, 0) as debit_amount,
      COALESCE(glt.credit_amount, 0) as credit_amount,
      COALESCE(glt.balance_amount, 0) as balance_amount,
      (COALESCE(glt.debit_amount, 0) - COALESCE(glt.credit_amount, 0)) as net_amount,
      glt.voucher_number,
      COALESCE(coa.account_number, 'UNKNOWN') as account_number,
      COALESCE(coa.account_name, 'Unknown Account') as account_name
    FROM public.general_ledger_transactions glt
    LEFT JOIN public.client_chart_of_accounts coa ON glt.client_account_id = coa.id
    WHERE glt.client_id = p_client_id 
      AND glt.version_id = v_version_id
      AND (p_start_date IS NULL OR glt.transaction_date >= p_start_date)
      AND (p_end_date IS NULL OR glt.transaction_date <= p_end_date)
      AND (p_start_account IS NULL OR COALESCE(coa.account_number, 'UNKNOWN') >= p_start_account)
      AND (p_end_account IS NULL OR COALESCE(coa.account_number, 'UNKNOWN') <= p_end_account)
  ),
  -- Get total count efficiently
  count_query AS (
    SELECT COUNT(*) as total_count FROM base_query
  ),
  -- Get totals efficiently  
  totals_query AS (
    SELECT 
      COALESCE(SUM(debit_amount), 0) as total_debit,
      COALESCE(SUM(credit_amount), 0) as total_credit,
      COALESCE(SUM(balance_amount), 0) as total_balance,
      COALESCE(SUM(net_amount), 0) as total_net
    FROM base_query
  ),
  -- Get paginated data with sorting
  paginated_data AS (
    SELECT *
    FROM base_query
    ORDER BY 
      CASE WHEN p_sort_by = 'transaction_date' AND p_sort_order = 'asc' THEN transaction_date END ASC,
      CASE WHEN p_sort_by = 'transaction_date' AND p_sort_order = 'desc' THEN transaction_date END DESC,
      CASE WHEN p_sort_by = 'account_number' AND p_sort_order = 'asc' THEN account_number END ASC,
      CASE WHEN p_sort_by = 'account_number' AND p_sort_order = 'desc' THEN account_number END DESC,
      CASE WHEN p_sort_by = 'debit_amount' AND p_sort_order = 'asc' THEN debit_amount END ASC,
      CASE WHEN p_sort_by = 'debit_amount' AND p_sort_order = 'desc' THEN debit_amount END DESC,
      CASE WHEN p_sort_by = 'credit_amount' AND p_sort_order = 'asc' THEN credit_amount END ASC,
      CASE WHEN p_sort_by = 'credit_amount' AND p_sort_order = 'desc' THEN credit_amount END DESC,
      CASE WHEN p_sort_by = 'net_amount' AND p_sort_order = 'asc' THEN net_amount END ASC,
      CASE WHEN p_sort_by = 'net_amount' AND p_sort_order = 'desc' THEN net_amount END DESC,
      transaction_date ASC -- Default fallback
    LIMIT p_page_size OFFSET v_offset
  )
  -- Combine results
  SELECT 
    json_build_object(
      'data', (SELECT json_agg(pd.*) FROM paginated_data pd),
      'count', (SELECT total_count FROM count_query),
      'totals', json_build_object(
        'totalDebit', (SELECT total_debit FROM totals_query),
        'totalCredit', (SELECT total_credit FROM totals_query),
        'totalBalance', (SELECT total_balance FROM totals_query),
        'totalNet', (SELECT total_net FROM totals_query)
      ),
      'metadata', json_build_object(
        'version_id', v_version_id,
        'page', p_page,
        'page_size', p_page_size,
        'sort_by', p_sort_by,
        'sort_order', p_sort_order
      )
    ) INTO v_transactions;

  RETURN v_transactions;

EXCEPTION
  WHEN OTHERS THEN
    -- Return safe defaults on error
    RETURN json_build_object(
      'data', '[]'::json,
      'count', 0,
      'totals', json_build_object(
        'totalDebit', 0,
        'totalCredit', 0, 
        'totalBalance', 0,
        'totalNet', 0
      ),
      'metadata', json_build_object(
        'error', SQLSTATE || ': ' || SQLERRM,
        'version_id', v_version_id
      )
    );
END;
$function$;