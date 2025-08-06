-- Add regnskapsnr field to field_definitions for trial balance import
INSERT INTO field_definitions (field_key, field_label, data_type, is_required, file_type, aliases, sort_order, is_active) 
VALUES 
  ('regnskapsnr', 'Regnskapsnummer', 'text', false, 'trial_balance', 
   ARRAY['regnskapsnr', 'regnskapsnummer', 'standard_number', 'standard nr', 'stdnr', 'kontoplan', 'regnskap nr', 'regnskap', 'standardkonto', 'std nr'], 
   7, true)
ON CONFLICT (field_key, file_type) DO UPDATE SET
  aliases = EXCLUDED.aliases,
  updated_at = now();