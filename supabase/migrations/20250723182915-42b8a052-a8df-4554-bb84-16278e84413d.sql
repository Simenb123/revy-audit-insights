-- Add field definitions for chart of accounts
INSERT INTO public.field_definitions (field_key, field_label, data_type, is_required, file_type, aliases, sort_order) VALUES
('account_number', 'Kontonummer', 'text', true, 'chart_of_accounts', ARRAY['kontonummer', 'konto_nummer', 'konto nr', 'account_no', 'account_number', 'kontonr', 'kto_nr'], 1),
('account_name', 'Kontonavn', 'text', true, 'chart_of_accounts', ARRAY['kontonavn', 'konto_navn', 'beskrivelse', 'account_name', 'description', 'navn', 'tekst'], 2),
('account_type', 'Kontotype', 'text', false, 'chart_of_accounts', ARRAY['kontotype', 'konto_type', 'type', 'account_type', 'gruppe', 'category'], 3),
('parent_account', 'Hovedkonto', 'text', false, 'chart_of_accounts', ARRAY['hovedkonto', 'parent_account', 'overordnet', 'gruppe_konto', 'parent'], 4),
('is_active', 'Aktiv', 'text', false, 'chart_of_accounts', ARRAY['aktiv', 'active', 'is_active', 'status'], 5),
('vat_code', 'MVA-kode', 'text', false, 'chart_of_accounts', ARRAY['mva_kode', 'mva-kode', 'mvakode', 'vat_code', 'tax_code', 'skattekode'], 6);

-- Add more comprehensive aliases for existing trial_balance fields
UPDATE public.field_definitions 
SET aliases = ARRAY['kontonummer', 'konto_nummer', 'konto nr', 'account_no', 'account_number', 'kontonr', 'kto_nr', 'konto', 'nr']
WHERE field_key = 'account_number' AND file_type = 'trial_balance';

UPDATE public.field_definitions 
SET aliases = ARRAY['kontonavn', 'konto_navn', 'beskrivelse', 'account_name', 'description', 'navn', 'tekst', 'konto_beskrivelse']
WHERE field_key = 'account_name' AND file_type = 'trial_balance';

UPDATE public.field_definitions 
SET aliases = ARRAY['inngående_saldo', 'inngaaende_saldo', 'opening_balance', 'saldo_inn', 'startsaldo', 'åpningssaldo', 'aapningssaldo']
WHERE field_key = 'opening_balance' AND file_type = 'trial_balance';

UPDATE public.field_definitions 
SET aliases = ARRAY['debet', 'debit', 'debet_beløp', 'debit_amount', 'debet_sum', 'dr']
WHERE field_key = 'debit_amount' AND file_type = 'trial_balance';

UPDATE public.field_definitions 
SET aliases = ARRAY['kredit', 'credit', 'kredit_beløp', 'credit_amount', 'kredit_sum', 'kr', 'cr']
WHERE field_key = 'credit_amount' AND file_type = 'trial_balance';

UPDATE public.field_definitions 
SET aliases = ARRAY['utgående_saldo', 'utgaaende_saldo', 'closing_balance', 'saldo_ut', 'sluttsaldo', 'sluttbalanse']
WHERE field_key = 'closing_balance' AND file_type = 'trial_balance';

-- Add more comprehensive aliases for general_ledger fields
UPDATE public.field_definitions 
SET aliases = ARRAY['dato', 'date', 'transaksjonsdato', 'transaction_date', 'bilagsdato', 'voucher_date']
WHERE field_key = 'transaction_date' AND file_type = 'general_ledger';

UPDATE public.field_definitions 
SET aliases = ARRAY['bilagsnummer', 'bilag_nummer', 'voucher_number', 'document_number', 'bilag', 'dok_nr', 'ref']
WHERE field_key = 'voucher_number' AND file_type = 'general_ledger';

UPDATE public.field_definitions 
SET aliases = ARRAY['beskrivelse', 'description', 'tekst', 'transaksjonsbeskrivelse', 'transaction_description', 'bilagstekst']
WHERE field_key = 'description' AND file_type = 'general_ledger';

UPDATE public.field_definitions 
SET aliases = ARRAY['beløp', 'amount', 'sum', 'belop', 'value', 'verdi']
WHERE field_key = 'amount' AND file_type = 'general_ledger';