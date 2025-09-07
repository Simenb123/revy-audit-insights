-- Add test SAF-T customer and supplier data to demonstrate balance reading
-- First, create test import session with proper UUID
INSERT INTO saft_import_sessions (id, client_id, file_name, file_size, import_status, saft_version, processing_started_at, created_by, metadata)
VALUES (
  gen_random_uuid(),
  'db422dac-dd79-4a62-a34c-05166f77ce42',
  'Test SAF-T import',
  1000000,
  'completed',
  '1.3',
  now(),
  (SELECT auth.uid()),
  '{"test": "demo_data"}'::jsonb
) RETURNING id as session_id;

-- Store the session id in a variable for reuse
WITH new_session AS (
  INSERT INTO saft_import_sessions (id, client_id, file_name, file_size, import_status, saft_version, processing_started_at, created_by, metadata)
  VALUES (
    gen_random_uuid(),
    'db422dac-dd79-4a62-a34c-05166f77ce42',
    'Test SAF-T import',
    1000000,
    'completed',
    '1.3',
    now(),
    (SELECT auth.uid()),
    '{"test": "demo_data"}'::jsonb
  ) RETURNING id
),
-- Insert test SAF-T customers with balances  
customer_inserts AS (
  INSERT INTO saft_customers (
    client_id, import_session_id, customer_id, customer_name, 
    closing_balance_netto, opening_balance_netto,
    closing_debit_balance, closing_credit_balance
  ) 
  SELECT 
    'db422dac-dd79-4a62-a34c-05166f77ce42',
    new_session.id, 
    customer_data.customer_id,
    customer_data.customer_name,
    customer_data.closing_balance_netto,
    customer_data.opening_balance_netto,
    customer_data.closing_debit_balance,
    customer_data.closing_credit_balance
  FROM new_session,
  (VALUES 
    ('KUNDE001', 'Acme Corporation AS', 25000.00, 20000.00, 25000.00, 0.00),
    ('KUNDE002', 'Beta Solutions Ltd', 15750.50, 12000.00, 15750.50, 0.00),
    ('KUNDE003', 'Gamma Industries', 8200.25, 5000.00, 8200.25, 0.00)
  ) AS customer_data(customer_id, customer_name, closing_balance_netto, opening_balance_netto, closing_debit_balance, closing_credit_balance)
  RETURNING 1
),
-- Insert test SAF-T suppliers with balances
supplier_inserts AS (
  INSERT INTO saft_suppliers (
    client_id, import_session_id, supplier_id, supplier_name,
    closing_balance_netto, opening_balance_netto,
    closing_debit_balance, closing_credit_balance  
  )
  SELECT
    'db422dac-dd79-4a62-a34c-05166f77ce42',
    new_session.id,
    supplier_data.supplier_id,
    supplier_data.supplier_name,
    supplier_data.closing_balance_netto,
    supplier_data.opening_balance_netto,
    supplier_data.closing_debit_balance,
    supplier_data.closing_credit_balance
  FROM new_session,
  (VALUES
    ('LEVERANDOR001', 'Office Supplies AS', -12500.00, -10000.00, 0.00, 12500.00),
    ('LEVERANDOR002', 'Tech Equipment Norge', -8750.75, -7500.00, 0.00, 8750.75),
    ('LEVERANDOR003', 'Consulting Partners', -5200.50, -4000.00, 0.00, 5200.50)
  ) AS supplier_data(supplier_id, supplier_name, closing_balance_netto, opening_balance_netto, closing_debit_balance, closing_credit_balance)
  RETURNING 1
)
SELECT 'SAF-T test data inserted successfully' as result;