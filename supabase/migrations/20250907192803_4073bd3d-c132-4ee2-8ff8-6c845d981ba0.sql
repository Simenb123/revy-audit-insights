-- Add test SAF-T customer and supplier data to demonstrate balance reading
-- First, create test import session
INSERT INTO saft_import_sessions (id, client_id, file_name, file_size, import_status, saft_version, processing_started_at, created_by, metadata)
VALUES (
  'test-session-001',
  'db422dac-dd79-4a62-a34c-05166f77ce42',
  'Test SAF-T import',
  1000000,
  'completed',
  '1.3',
  now(),
  auth.uid(),
  '{"test": "demo_data"}'::jsonb
);

-- Insert test SAF-T customers with balances  
INSERT INTO saft_customers (
  client_id, import_session_id, customer_id, customer_name, 
  closing_balance_netto, opening_balance_netto,
  closing_debit_balance, closing_credit_balance
) VALUES 
(
  'db422dac-dd79-4a62-a34c-05166f77ce42',
  'test-session-001', 
  'KUNDE001',
  'Acme Corporation AS',
  25000.00,
  20000.00,
  25000.00,
  0.00
),
(
  'db422dac-dd79-4a62-a34c-05166f77ce42',
  'test-session-001',
  'KUNDE002', 
  'Beta Solutions Ltd',
  15750.50,
  12000.00,
  15750.50,
  0.00
),
(
  'db422dac-dd79-4a62-a34c-05166f77ce42',
  'test-session-001',
  'KUNDE003',
  'Gamma Industries',
  8200.25,
  5000.00,
  8200.25,
  0.00
);

-- Insert test SAF-T suppliers with balances
INSERT INTO saft_suppliers (
  client_id, import_session_id, supplier_id, supplier_name,
  closing_balance_netto, opening_balance_netto,
  closing_debit_balance, closing_credit_balance  
) VALUES
(
  'db422dac-dd79-4a62-a34c-05166f77ce42',
  'test-session-001',
  'LEVERANDOR001',
  'Office Supplies AS',
  -12500.00,
  -10000.00,
  0.00,
  12500.00
),
(
  'db422dac-dd79-4a62-a34c-05166f77ce42',
  'test-session-001',
  'LEVERANDOR002',
  'Tech Equipment Norge',
  -8750.75,
  -7500.00,
  0.00,
  8750.75
),
(
  'db422dac-dd79-4a62-a34c-05166f77ce42',
  'test-session-001',
  'LEVERANDOR003',
  'Consulting Partners',
  -5200.50,
  -4000.00,
  0.00,
  5200.50
);

-- Now refresh AR/AP aggregates using the SAF-T balance fallback method
SELECT refresh_ar_ap_aggregates('dffee541-f344-43f0-90cd-54b2c977e893');