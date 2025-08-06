-- Add new field definitions for splitting regnskapsnr into resultat and balanse
INSERT INTO public.field_definitions (field_key, field_label, is_required, data_type, file_type, aliases, sort_order) VALUES 
('regnskapsnr_resultat', 'Regnskapsnummer (Resultat)', false, 'text', 'trial_balance', '["resultat", "rs", "regnskap_resultat", "result", "resultatregnskap", "income_statement"]', 15),
('regnskapsnr_balanse', 'Regnskapsnummer (Balanse)', false, 'text', 'trial_balance', '["balanse", "bs", "regnskap_balanse", "balance", "balanseregnskap", "balance_sheet"]', 16);