-- Add new field definitions for splitting regnskapsnr into resultat and balanse
INSERT INTO public.field_definitions (key, label, required, field_type, aliases) VALUES 
('regnskapsnr_resultat', 'Regnskapsnummer (Resultat)', false, 'text', '["resultat", "rs", "regnskap_resultat", "result", "resultatregnskap", "income_statement"]'),
('regnskapsnr_balanse', 'Regnskapsnummer (Balanse)', false, 'text', '["balanse", "bs", "regnskap_balanse", "balance", "balanseregnskap", "balance_sheet"]');