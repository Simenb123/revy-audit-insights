-- Check current field definitions structure first
SELECT field_key, field_label, data_type, aliases FROM public.field_definitions WHERE file_type = 'general_ledger' ORDER BY field_key;

-- Update field definitions to ensure correct data types and add missing Norwegian aliases
UPDATE public.field_definitions 
SET 
  data_type = 'number',
  aliases = aliases || ARRAY['beløp', 'beløp_kr', 'beloep', 'sum', 'kroner', 'nok', 'verdi', 'belopp']
WHERE field_key = 'balance_amount' AND file_type = 'general_ledger';

UPDATE public.field_definitions 
SET 
  data_type = 'number',
  aliases = aliases || ARRAY['debet', 'debit_beløp', 'debit_kr', 'debitbeløp', 'debitbeloep', 'db']
WHERE field_key = 'debit_amount' AND file_type = 'general_ledger';

UPDATE public.field_definitions 
SET 
  data_type = 'number', 
  aliases = aliases || ARRAY['kredit', 'credit_beløp', 'credit_kr', 'kreditbeløp', 'kreditbeloep', 'kr', 'cr']
WHERE field_key = 'credit_amount' AND file_type = 'general_ledger';

UPDATE public.field_definitions 
SET 
  data_type = 'number',
  aliases = aliases || ARRAY['mva_beløp', 'mva_kr', 'moms', 'moms_beløp', 'vat_beløp', 'avgift']
WHERE field_key = 'vat_amount' AND file_type = 'general_ledger';

-- Ensure vat_code is text with proper Norwegian aliases
UPDATE public.field_definitions 
SET 
  data_type = 'text',
  aliases = aliases || ARRAY['mva_kode', 'mva-kode', 'mvakode', 'moms_kode', 'vat_type', 'mva_type']
WHERE field_key = 'vat_code' AND file_type = 'general_ledger';

-- Add account_number aliases
UPDATE public.field_definitions 
SET 
  aliases = aliases || ARRAY['konto', 'kontonr', 'konto_nr', 'konto-nr', 'regnskap_konto', 'regnskaps_konto']
WHERE field_key = 'account_number' AND file_type = 'general_ledger';

-- Add transaction_date aliases  
UPDATE public.field_definitions 
SET 
  aliases = aliases || ARRAY['bilagsdato', 'bilag_dato', 'reg_dato', 'registrert_dato', 'transaksjons_dato']
WHERE field_key = 'transaction_date' AND file_type = 'general_ledger';

-- Add description aliases
UPDATE public.field_definitions 
SET 
  aliases = aliases || ARRAY['beskrivelse', 'tekst', 'bilagstekst', 'bilag_tekst', 'forklaring', 'kommentar']
WHERE field_key = 'description' AND file_type = 'general_ledger';