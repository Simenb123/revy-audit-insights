-- Funksjon for å beregne kontofordeling (SQL-optimalisert)
CREATE OR REPLACE FUNCTION calculate_account_distribution(
  p_client_id UUID,
  p_version_id UUID
)
RETURNS TABLE(
  account_number TEXT,
  account_name TEXT,
  transaction_count INTEGER,
  total_amount NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    coa.account_number,
    coa.account_name,
    COUNT(*)::INTEGER as transaction_count,
    SUM(COALESCE(glt.debit_amount, 0) + COALESCE(glt.credit_amount, 0)) as total_amount
  FROM general_ledger_transactions glt
  INNER JOIN client_chart_of_accounts coa ON glt.client_account_id = coa.id
  WHERE glt.client_id = p_client_id 
    AND glt.version_id = p_version_id
  GROUP BY coa.account_number, coa.account_name
  ORDER BY transaction_count DESC;
END;
$$;

-- Funksjon for månedlig sammendrag (SQL-optimalisert)
CREATE OR REPLACE FUNCTION calculate_monthly_summary(
  p_client_id UUID,
  p_version_id UUID
)
RETURNS TABLE(
  month TEXT,
  transaction_count INTEGER,
  total_amount NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(glt.transaction_date, 'YYYY-MM') as month,
    COUNT(*)::INTEGER as transaction_count,
    SUM(COALESCE(glt.debit_amount, 0) - COALESCE(glt.credit_amount, 0)) as total_amount
  FROM general_ledger_transactions glt
  WHERE glt.client_id = p_client_id 
    AND glt.version_id = p_version_id
  GROUP BY TO_CHAR(glt.transaction_date, 'YYYY-MM')
  ORDER BY month;
END;
$$;

-- Funksjon for beløpsstatistikk (SQL-optimalisert)
CREATE OR REPLACE FUNCTION calculate_amount_statistics(
  p_client_id UUID,
  p_version_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_count', COUNT(*),
    'sum', SUM(COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)),
    'average', AVG(COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)),
    'min', MIN(COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)),
    'max', MAX(COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)),
    'positive_count', COUNT(*) FILTER (WHERE (COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)) > 0),
    'negative_count', COUNT(*) FILTER (WHERE (COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)) < 0)
  ) INTO result
  FROM general_ledger_transactions
  WHERE client_id = p_client_id 
    AND version_id = p_version_id;
  
  RETURN result;
END;
$$;

-- Funksjon for å finne dupliserte transaksjoner (SQL-optimalisert)
CREATE OR REPLACE FUNCTION find_duplicate_transactions(
  p_client_id UUID,
  p_version_id UUID
)
RETURNS TABLE(
  duplicate_key TEXT,
  transaction_count INTEGER,
  transaction_ids UUID[],
  amount NUMERIC,
  transaction_date DATE,
  description TEXT,
  account_number TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH duplicate_groups AS (
    SELECT 
      glt.transaction_date::TEXT || '_' || 
      COALESCE(glt.debit_amount, 0)::TEXT || '_' || 
      COALESCE(glt.credit_amount, 0)::TEXT || '_' || 
      COALESCE(glt.description, '') || '_' || 
      COALESCE(coa.account_number, '') as dup_key,
      COUNT(*) as cnt,
      ARRAY_AGG(glt.id) as ids,
      glt.transaction_date,
      COALESCE(glt.debit_amount, glt.credit_amount, 0) as amt,
      glt.description,
      coa.account_number
    FROM general_ledger_transactions glt
    INNER JOIN client_chart_of_accounts coa ON glt.client_account_id = coa.id
    WHERE glt.client_id = p_client_id 
      AND glt.version_id = p_version_id
    GROUP BY 
      glt.transaction_date,
      COALESCE(glt.debit_amount, 0),
      COALESCE(glt.credit_amount, 0),
      glt.description,
      coa.account_number
    HAVING COUNT(*) > 1
  )
  SELECT 
    dg.dup_key,
    dg.cnt::INTEGER,
    dg.ids,
    dg.amt,
    dg.transaction_date,
    dg.description,
    dg.account_number
  FROM duplicate_groups dg
  ORDER BY dg.cnt DESC, dg.amt DESC;
END;
$$;

-- Funksjon for å finne tidslogikk-problemer (SQL-optimalisert)
CREATE OR REPLACE FUNCTION find_time_logic_issues(
  p_client_id UUID,
  p_version_id UUID
)
RETURNS TABLE(
  transaction_id UUID,
  voucher_number TEXT,
  transaction_date DATE,
  issue_type TEXT,
  issue_description TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    glt.id,
    glt.voucher_number,
    glt.transaction_date,
    CASE 
      WHEN glt.transaction_date > CURRENT_DATE THEN 'future_date'
      WHEN glt.transaction_date < CURRENT_DATE - INTERVAL '5 years' THEN 'very_old_date'
      WHEN EXTRACT(DOW FROM glt.transaction_date) IN (0, 6) THEN 'weekend_posting'
      WHEN TO_CHAR(glt.transaction_date, 'MM-DD') IN ('01-01', '05-01', '05-17', '12-25', '12-26') THEN 'holiday_posting'
      ELSE 'other'
    END as issue_type,
    CASE 
      WHEN glt.transaction_date > CURRENT_DATE THEN 'Transaksjon datert i fremtiden'
      WHEN glt.transaction_date < CURRENT_DATE - INTERVAL '5 years' THEN 'Transaksjon mer enn 5 år gammel'
      WHEN EXTRACT(DOW FROM glt.transaction_date) IN (0, 6) THEN 'Transaksjon postert på helg'
      WHEN TO_CHAR(glt.transaction_date, 'MM-DD') IN ('01-01', '05-01', '05-17', '12-25', '12-26') THEN 'Transaksjon postert på helligdag'
      ELSE 'Annet tidsproblem'
    END as issue_description
  FROM general_ledger_transactions glt
  WHERE glt.client_id = p_client_id 
    AND glt.version_id = p_version_id
    AND (
      glt.transaction_date > CURRENT_DATE OR
      glt.transaction_date < CURRENT_DATE - INTERVAL '5 years' OR
      EXTRACT(DOW FROM glt.transaction_date) IN (0, 6) OR
      TO_CHAR(glt.transaction_date, 'MM-DD') IN ('01-01', '05-01', '05-17', '12-25', '12-26')
    )
  ORDER BY 
    CASE issue_type
      WHEN 'future_date' THEN 1
      WHEN 'holiday_posting' THEN 2
      WHEN 'weekend_posting' THEN 3
      WHEN 'very_old_date' THEN 4
      ELSE 5
    END,
    glt.transaction_date DESC;
END;
$$;

-- Funksjon for grunnleggende transaksjonsinformasjon
CREATE OR REPLACE FUNCTION get_basic_transaction_info(
  p_client_id UUID,
  p_version_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_transactions', COUNT(*),
    'date_range', json_build_object(
      'start', MIN(transaction_date),
      'end', MAX(transaction_date)
    ),
    'unique_accounts', COUNT(DISTINCT client_account_id),
    'unique_vouchers', COUNT(DISTINCT voucher_number) FILTER (WHERE voucher_number IS NOT NULL),
    'total_debit', SUM(COALESCE(debit_amount, 0)),
    'total_credit', SUM(COALESCE(credit_amount, 0))
  ) INTO result
  FROM general_ledger_transactions
  WHERE client_id = p_client_id 
    AND version_id = p_version_id;
  
  RETURN result;
END;
$$;

-- Indekser for bedre ytelse
CREATE INDEX IF NOT EXISTS idx_glt_client_version ON general_ledger_transactions(client_id, version_id);
CREATE INDEX IF NOT EXISTS idx_glt_transaction_date ON general_ledger_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_glt_voucher_number ON general_ledger_transactions(voucher_number);
CREATE INDEX IF NOT EXISTS idx_glt_amounts ON general_ledger_transactions(debit_amount, credit_amount);
CREATE INDEX IF NOT EXISTS idx_glt_description ON general_ledger_transactions USING gin(to_tsvector('norwegian', description));

-- Indeks for client_chart_of_accounts
CREATE INDEX IF NOT EXISTS idx_coa_client_id ON client_chart_of_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_coa_account_number ON client_chart_of_accounts(account_number);