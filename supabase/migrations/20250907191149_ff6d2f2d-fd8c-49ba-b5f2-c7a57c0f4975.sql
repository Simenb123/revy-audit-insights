-- Activate the existing version for LUFT DESIGN AS and refresh AR/AP aggregates
UPDATE accounting_data_versions 
SET is_active = true 
WHERE client_id = 'db422dac-dd79-4a62-a34c-05166f77ce42' 
AND id = 'dffee541-f344-43f0-90cd-54b2c977e893';

-- Call the refresh function to populate AR/AP balances
SELECT refresh_ar_ap_aggregates('dffee541-f344-43f0-90cd-54b2c977e893');