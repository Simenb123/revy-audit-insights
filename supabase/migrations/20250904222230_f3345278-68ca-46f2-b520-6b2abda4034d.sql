-- Seed basic mapping rules for VITAMAIL AS client
INSERT INTO public.mapping_rules (
  client_id,
  account,
  code,
  strategy,
  weight,
  keywords,
  regex,
  priority,
  created_at,
  updated_at
) VALUES 
  -- Core payroll accounts
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '5000', 'fastlon', 'exclusive', 10, '["fastlønn", "grunnlønn"]', '5000', 1, now(), now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '5010', 'timelon', 'exclusive', 10, '["timelønn", "overtid"]', '5010', 1, now(), now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '5020', 'fasttillegg', 'exclusive', 10, '["tillegg", "fast tillegg"]', '5020', 1, now(), now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '5290', 'fri_telefon', 'exclusive', 10, '["telefon", "fri telefon"]', '5290', 1, now(), now()),
  
  -- Accrual accounts (294x/295x patterns)
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '2945', 'feriepenger', 'split', 8, '["feriepenger"]', '294[0-9]', 2, now(), now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '2950', 'feriepenger', 'split', 8, '["feriepenger"]', '295[0-9]', 2, now(), now()),
  
  -- Bonus and other income
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '5030', 'bonus', 'exclusive', 9, '["bonus", "provisjon"]', '5030', 1, now(), now()),
  ('8e5a5e79-8510-4e80-98a0-65e6548585ef', '5040', 'annet', 'exclusive', 7, '["annet", "diverse"]', '504[0-9]', 3, now(), now())
ON CONFLICT (client_id, account, code) DO UPDATE SET
  strategy = EXCLUDED.strategy,
  weight = EXCLUDED.weight,
  keywords = EXCLUDED.keywords,
  regex = EXCLUDED.regex,
  priority = EXCLUDED.priority,
  updated_at = now();