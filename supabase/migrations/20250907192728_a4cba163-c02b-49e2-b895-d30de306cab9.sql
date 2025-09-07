-- Drop and recreate refresh_ar_ap_aggregates function with SAF-T balance support
DROP FUNCTION IF EXISTS public.refresh_ar_ap_aggregates(uuid);

CREATE OR REPLACE FUNCTION public.refresh_ar_ap_aggregates(p_version_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_client_id uuid;
  v_ar_total numeric := 0;
  v_ap_total numeric := 0;
  v_ar_count integer := 0;
  v_ap_count integer := 0;
  v_import_session_id uuid;
  v_transaction_count integer := 0;
BEGIN
  -- Get client_id from version
  SELECT client_id INTO v_client_id
  FROM public.accounting_data_versions 
  WHERE id = p_version_id;
  
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Version not found: %', p_version_id;
  END IF;
  
  -- Get the latest import session for this client
  SELECT id INTO v_import_session_id
  FROM public.saft_import_sessions 
  WHERE client_id = v_client_id 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Check if we have transactions for this version
  SELECT COUNT(*) INTO v_transaction_count
  FROM public.general_ledger_transactions
  WHERE version_id = p_version_id;
  
  -- Delete existing aggregates for this version
  DELETE FROM public.ar_customer_balances WHERE version_id = p_version_id;
  DELETE FROM public.ap_supplier_balances WHERE version_id = p_version_id;
  
  IF v_transaction_count > 0 THEN
    -- Use transaction-based aggregation (preferred method)
    RAISE NOTICE 'Using transaction-based AR/AP aggregation for % transactions', v_transaction_count;
    
    -- Aggregate AR (customer balances) from transactions
    INSERT INTO public.ar_customer_balances (client_id, version_id, customer_id, customer_name, saldo, tx_count, updated_at)
    SELECT 
      t.client_id,
      t.version_id,
      t.customer_id,
      COALESCE(MAX(t.customer_name), MAX(c.customer_name)) as customer_name,
      SUM(COALESCE(t.debit_amount,0) - COALESCE(t.credit_amount,0)) as saldo,
      COUNT(*) as tx_count,
      now()
    FROM public.general_ledger_transactions t
    LEFT JOIN public.saft_customers c ON c.client_id = t.client_id AND c.customer_id = t.customer_id
    WHERE t.version_id = p_version_id AND t.customer_id IS NOT NULL AND t.customer_id != ''
    GROUP BY t.client_id, t.version_id, t.customer_id
    HAVING ABS(SUM(COALESCE(t.debit_amount,0) - COALESCE(t.credit_amount,0))) > 0.01;
    
    -- Aggregate AP (supplier balances) from transactions  
    INSERT INTO public.ap_supplier_balances (client_id, version_id, supplier_id, supplier_name, saldo, tx_count, updated_at)
    SELECT 
      t.client_id,
      t.version_id, 
      t.supplier_id,
      COALESCE(MAX(t.supplier_name), MAX(s.supplier_name)) as supplier_name,
      SUM(COALESCE(t.credit_amount,0) - COALESCE(t.debit_amount,0)) as saldo,
      COUNT(*) as tx_count,
      now()
    FROM public.general_ledger_transactions t
    LEFT JOIN public.saft_suppliers s ON s.client_id = t.client_id AND s.supplier_id = t.supplier_id  
    WHERE t.version_id = p_version_id AND t.supplier_id IS NOT NULL AND t.supplier_id != ''
    GROUP BY t.client_id, t.version_id, t.supplier_id
    HAVING ABS(SUM(COALESCE(t.credit_amount,0) - COALESCE(t.debit_amount,0))) > 0.01;
    
  ELSIF v_import_session_id IS NOT NULL THEN
    -- Fallback to SAF-T pre-calculated balances
    RAISE NOTICE 'No transactions found, using SAF-T pre-calculated balances from session %', v_import_session_id;
    
    -- Use SAF-T customer balances
    INSERT INTO public.ar_customer_balances (client_id, version_id, customer_id, customer_name, saldo, tx_count, updated_at)
    SELECT 
      v_client_id,
      p_version_id,
      c.customer_id,
      c.customer_name,
      COALESCE(c.closing_balance_netto, 0) as saldo,
      0 as tx_count, -- No transactions, using pre-calculated
      now()
    FROM public.saft_customers c
    WHERE c.client_id = v_client_id 
    AND (c.import_session_id = v_import_session_id OR c.import_session_id IS NULL)
    AND ABS(COALESCE(c.closing_balance_netto, 0)) > 0.01;
    
    -- Use SAF-T supplier balances
    INSERT INTO public.ap_supplier_balances (client_id, version_id, supplier_id, supplier_name, saldo, tx_count, updated_at)
    SELECT 
      v_client_id,
      p_version_id,
      s.supplier_id,
      s.supplier_name,
      COALESCE(s.closing_balance_netto, 0) as saldo,
      0 as tx_count, -- No transactions, using pre-calculated
      now()
    FROM public.saft_suppliers s
    WHERE s.client_id = v_client_id 
    AND (s.import_session_id = v_import_session_id OR s.import_session_id IS NULL)
    AND ABS(COALESCE(s.closing_balance_netto, 0)) > 0.01;
    
  ELSE
    RAISE NOTICE 'No transactions or SAF-T data found for client %, creating empty aggregates', v_client_id;
  END IF;
  
  -- Get totals for return
  SELECT COALESCE(SUM(saldo), 0), COUNT(*) INTO v_ar_total, v_ar_count
  FROM public.ar_customer_balances WHERE version_id = p_version_id;
  
  SELECT COALESCE(SUM(saldo), 0), COUNT(*) INTO v_ap_total, v_ap_count  
  FROM public.ap_supplier_balances WHERE version_id = p_version_id;
  
  RETURN jsonb_build_object(
    'ar_total', v_ar_total,
    'ar_count', v_ar_count,
    'ap_total', v_ap_total, 
    'ap_count', v_ap_count,
    'client_id', v_client_id,
    'version_id', p_version_id,
    'method', CASE 
      WHEN v_transaction_count > 0 THEN 'transactions'
      WHEN v_import_session_id IS NOT NULL THEN 'saft_balances'
      ELSE 'empty'
    END,
    'transaction_count', v_transaction_count,
    'import_session_id', v_import_session_id
  );
END;
$function$;