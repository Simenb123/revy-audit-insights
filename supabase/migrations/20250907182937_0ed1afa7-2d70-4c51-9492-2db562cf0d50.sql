-- Schema cache fix and admin tools
CREATE OR REPLACE FUNCTION refresh_postgrest_schema()
RETURNS void AS $$
BEGIN
  -- Notify PostgREST to reload schema cache
  PERFORM pg_notify('pgrst', 'reload schema');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin RLS policy
ALTER FUNCTION refresh_postgrest_schema() OWNER TO postgres;

-- Health check view for schema validation
CREATE OR REPLACE VIEW schema_status AS
SELECT 
  'ar_customer_balances' as table_name,
  bool_or(column_name = 'client_id') as has_client_id,
  bool_or(column_name = 'version_id') as has_version_id,
  bool_or(column_name = 'customer_id') as has_customer_id,
  bool_or(column_name = 'saldo') as has_saldo,
  now() as checked_at
FROM information_schema.columns 
WHERE table_name = 'ar_customer_balances'
UNION ALL
SELECT 
  'ap_supplier_balances' as table_name,
  bool_or(column_name = 'client_id') as has_client_id,
  bool_or(column_name = 'version_id') as has_version_id,
  bool_or(column_name = 'supplier_id') as has_supplier_id,
  bool_or(column_name = 'saldo') as has_saldo,
  now() as checked_at
FROM information_schema.columns 
WHERE table_name = 'ap_supplier_balances';