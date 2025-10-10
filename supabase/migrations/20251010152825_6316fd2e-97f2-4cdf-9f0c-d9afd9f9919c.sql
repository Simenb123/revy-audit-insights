
-- SECURITY FIX: Add security_invoker to schema_status view
-- This ensures the view respects RLS policies of the querying user

-- Drop existing view
DROP VIEW IF EXISTS public.schema_status;

-- Recreate with SECURITY INVOKER
CREATE VIEW public.schema_status
WITH (security_invoker = true) AS
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

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.schema_status TO authenticated;

-- Add comment explaining the security improvement
COMMENT ON VIEW public.schema_status IS 'Health check view for schema validation. Uses security_invoker=true to respect RLS policies of the querying user.';
