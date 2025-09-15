-- Create basic trial balance mappings for testing formula calculations
-- Map some revenue accounts to standard line 19 (Sum driftsinntekter)
INSERT INTO trial_balance_mappings (client_id, account_number, statement_line_number, created_at)
VALUES 
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '3010', '19', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '3020', '19', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '3101', '19', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '3102', '19', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '3103', '19', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '3106', '19', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '3109', '19', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '3110', '19', now());

-- Map major asset accounts to standard line 665 (Sum eiendeler)  
INSERT INTO trial_balance_mappings (client_id, account_number, statement_line_number, created_at)
VALUES
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '1010', '665', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '1070', '665', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '1302', '665', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '1303', '665', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '1304', '665', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '1321', '665', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '1325', '665', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '1326', '665', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '1331', '665', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '1370', '665', now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '1530', '665', now());