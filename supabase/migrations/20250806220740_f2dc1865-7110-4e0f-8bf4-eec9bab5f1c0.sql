-- Insert year-based aliases for trial balance fields
INSERT INTO field_definitions (field_key, field_label, data_type, is_required, file_type, aliases, sort_order, is_active) 
VALUES 
  ('balance_current_year', 'Saldo i år', 'number', true, 'trial_balance', 
   ARRAY['endelig [YEAR]', 'utgående [YEAR]', 'ub [YEAR]', 'sluttbalanse [YEAR]', 'saldo [YEAR]', 'endelig balanse [YEAR]'], 
   5, true),
  ('balance_last_year', 'Saldo i fjor', 'number', false, 'trial_balance', 
   ARRAY['saldo [YEAR-1]', 'ib [YEAR]', 'inngående [YEAR]', 'åpningsbalanse [YEAR]', 'startbalanse [YEAR]'], 
   6, true)
ON CONFLICT (field_key, file_type) DO UPDATE SET
  aliases = EXCLUDED.aliases,
  updated_at = now();