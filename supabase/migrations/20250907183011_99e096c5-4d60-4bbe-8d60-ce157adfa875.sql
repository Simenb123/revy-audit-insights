-- AR/AP Balance Tables and Aggregation Function
CREATE TABLE ar_customer_balances (
  client_id uuid NOT NULL,
  version_id uuid NOT NULL,
  customer_id text NOT NULL,
  customer_name text,
  saldo numeric(18,2) NOT NULL DEFAULT 0,
  tx_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, version_id, customer_id)
);

CREATE TABLE ap_supplier_balances (
  client_id uuid NOT NULL,
  version_id uuid NOT NULL,
  supplier_id text NOT NULL,
  supplier_name text,
  saldo numeric(18,2) NOT NULL DEFAULT 0,
  tx_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, version_id, supplier_id)
);

-- RLS Policies
ALTER TABLE ar_customer_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ap_supplier_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AR balances for their clients" ON ar_customer_balances
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage AR balances for their clients" ON ar_customer_balances
  FOR ALL USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view AP balances for their clients" ON ap_supplier_balances
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage AP balances for their clients" ON ap_supplier_balances
  FOR ALL USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- RPC Function to refresh AR/AP aggregates
CREATE OR REPLACE FUNCTION refresh_ar_ap_aggregates(p_version_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_client_id uuid;
  v_ar_total numeric := 0;
  v_ap_total numeric := 0;
  v_ar_count integer := 0;
  v_ap_count integer := 0;
BEGIN
  -- Get client_id from version
  SELECT client_id INTO v_client_id
  FROM accounting_data_versions 
  WHERE id = p_version_id;
  
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Version not found: %', p_version_id;
  END IF;
  
  -- Delete existing aggregates for this version
  DELETE FROM ar_customer_balances WHERE version_id = p_version_id;
  DELETE FROM ap_supplier_balances WHERE version_id = p_version_id;
  
  -- Aggregate AR (customer balances)
  INSERT INTO ar_customer_balances (client_id, version_id, customer_id, customer_name, saldo, tx_count, updated_at)
  SELECT 
    t.client_id,
    t.version_id,
    t.customer_id,
    COALESCE(MAX(t.customer_name), MAX(c.customer_name)) as customer_name,
    SUM(COALESCE(t.debit_amount,0) - COALESCE(t.credit_amount,0)) as saldo,
    COUNT(*) as tx_count,
    now()
  FROM general_ledger_transactions t
  LEFT JOIN saft_customers c ON c.client_id = t.client_id AND c.version_id = t.version_id AND c.customer_id = t.customer_id
  WHERE t.version_id = p_version_id AND t.customer_id IS NOT NULL AND t.customer_id != ''
  GROUP BY t.client_id, t.version_id, t.customer_id
  HAVING ABS(SUM(COALESCE(t.debit_amount,0) - COALESCE(t.credit_amount,0))) > 0.01;
  
  -- Aggregate AP (supplier balances)  
  INSERT INTO ap_supplier_balances (client_id, version_id, supplier_id, supplier_name, saldo, tx_count, updated_at)
  SELECT 
    t.client_id,
    t.version_id, 
    t.supplier_id,
    COALESCE(MAX(t.supplier_name), MAX(s.supplier_name)) as supplier_name,
    SUM(COALESCE(t.credit_amount,0) - COALESCE(t.debit_amount,0)) as saldo,
    COUNT(*) as tx_count,
    now()
  FROM general_ledger_transactions t
  LEFT JOIN saft_suppliers s ON s.client_id = t.client_id AND s.version_id = t.version_id AND s.supplier_id = t.supplier_id  
  WHERE t.version_id = p_version_id AND t.supplier_id IS NOT NULL AND t.supplier_id != ''
  GROUP BY t.client_id, t.version_id, t.supplier_id
  HAVING ABS(SUM(COALESCE(t.credit_amount,0) - COALESCE(t.debit_amount,0))) > 0.01;
  
  -- Get totals for return
  SELECT COALESCE(SUM(saldo), 0), COUNT(*) INTO v_ar_total, v_ar_count
  FROM ar_customer_balances WHERE version_id = p_version_id;
  
  SELECT COALESCE(SUM(saldo), 0), COUNT(*) INTO v_ap_total, v_ap_count  
  FROM ap_supplier_balances WHERE version_id = p_version_id;
  
  RETURN jsonb_build_object(
    'ar_total', v_ar_total,
    'ar_count', v_ar_count,
    'ap_total', v_ap_total, 
    'ap_count', v_ap_count,
    'client_id', v_client_id,
    'version_id', p_version_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';