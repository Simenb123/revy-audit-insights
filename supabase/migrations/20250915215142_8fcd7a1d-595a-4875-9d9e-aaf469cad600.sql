-- Update existing mappings to map revenue accounts to line 19
UPDATE trial_balance_mappings 
SET statement_line_number = '19', updated_at = now()
WHERE client_id = '8e5a5e79-8510-4e80-98a0-65e6548585ef' 
AND account_number IN ('3010', '3020', '3101', '3102', '3103', '3106', '3109', '3110', '3700', '3900', '3902');

-- Update existing mappings to map asset accounts to line 665  
UPDATE trial_balance_mappings 
SET statement_line_number = '665', updated_at = now()
WHERE client_id = '8e5a5e79-8510-4e80-98a0-65e6548585ef' 
AND account_number IN ('1010', '1070', '1302', '1303', '1304', '1321', '1325', '1326', '1331', '1370', '1530');

-- Insert missing mappings for accounts that don't exist yet
INSERT INTO trial_balance_mappings (client_id, account_number, statement_line_number, created_at)
SELECT '8e5a5e79-8510-4e80-98a0-65e6548585ef', account_number, '19', now()
FROM (VALUES ('3290')) AS new_accounts(account_number)
WHERE NOT EXISTS (
  SELECT 1 FROM trial_balance_mappings 
  WHERE client_id = '8e5a5e79-8510-4e80-98a0-65e6548585ef' 
  AND account_number = new_accounts.account_number
);

INSERT INTO trial_balance_mappings (client_id, account_number, statement_line_number, created_at)
SELECT '8e5a5e79-8510-4e80-98a0-65e6548585ef', account_number, '665', now()
FROM (VALUES ('1005')) AS new_accounts(account_number)
WHERE NOT EXISTS (
  SELECT 1 FROM trial_balance_mappings 
  WHERE client_id = '8e5a5e79-8510-4e80-98a0-65e6548585ef' 
  AND account_number = new_accounts.account_number
);