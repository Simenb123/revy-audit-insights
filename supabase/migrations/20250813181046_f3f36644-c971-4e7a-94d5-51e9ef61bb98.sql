-- Add missing general_ledger field definitions and enrich aliases for better auto-mapping
-- 1) Insert new field_definitions for general_ledger if they don't already exist
WITH new_defs AS (
  SELECT * FROM (
    VALUES
      ('customer_id',       'Kunde-ID',               'text',   false, 'general_ledger', ARRAY['customerid','customer_id','kundenr','kundenummer','debitor','debitor_id','debitornr','debitornummer']),
      ('supplier_id',       'Leverandør-ID',          'text',   false, 'general_ledger', ARRAY['supplierid','supplier_id','leverandor','leverandør','leverandornr','leverandornummer','kreditor','kreditor_id','kreditornr','kreditornummer']),
      ('document_number',   'Dokumentnummer',         'text',   false, 'general_ledger', ARRAY['documentno','document_no','doknr','dok_nr','dokumentnr','dokumentnummer','fakturanr','faktura_nr','invoice_no','invoice','voucher','bilagsnr','bilagsnummer']),
      ('reference_number',  'Referansenummer',        'text',   false, 'general_ledger', ARRAY['reference','reference_no','ref','referanse','kid','kidnr','kid_nr','kid-nummer']),
      ('journal_id',        'Journal-ID',             'text',   false, 'general_ledger', ARRAY['journal','journalnr','journal_no','journalid','batch','batch_no','bunke']),
      ('record_id',         'Oppførings-ID',          'text',   false, 'general_ledger', ARRAY['record','record_id','entry','entry_id','entryno','entry_no','lopenr','løpenr','lopenummer','løpenummer','line_no','lineid']),
      ('value_date',        'Verdidato',              'date',   false, 'general_ledger', ARRAY['verdidato','value_date','valutadato','value date']),
      ('due_date',          'Forfallsdato',           'date',   false, 'general_ledger', ARRAY['forfallsdato','forfall','due_date','due date']),
      ('cid',               'CID/KID',                 'text',   false, 'general_ledger', ARRAY['cid','kid','kundeidentifikasjon','betaling_id','payment_id']),
      ('currency_code',     'Valutakode',             'text',   false, 'general_ledger', ARRAY['valuta','valutakode','currency','currencycode','currency_code','curr']),
      ('amount_currency',   'Beløp i valuta',         'number', false, 'general_ledger', ARRAY['belop_valuta','beløp_valuta','foreign_amount','amount_currency','beløp i valuta','belop i valuta']),
      ('exchange_rate',     'Valutakurs',             'number', false, 'general_ledger', ARRAY['valutakurs','kurs','exchange_rate','fx_rate','fx'])
  ) AS t(field_key, field_label, data_type, is_required, file_type, aliases)
),
filtered AS (
  SELECT nd.*, ROW_NUMBER() OVER (ORDER BY nd.field_key) AS rn
  FROM new_defs nd
  LEFT JOIN public.field_definitions fd
    ON fd.file_type = nd.file_type
   AND fd.field_key = nd.field_key
  WHERE fd.id IS NULL
)
INSERT INTO public.field_definitions
  (field_key, field_label, data_type, is_required, file_type, aliases, sort_order, is_active)
SELECT
  f.field_key,
  f.field_label,
  f.data_type::text,
  f.is_required,
  f.file_type,
  f.aliases,
  COALESCE((SELECT MAX(sort_order) FROM public.field_definitions WHERE file_type = 'general_ledger'), 0) + f.rn,
  true
FROM filtered f;

-- 2) Enrich aliases for existing core general_ledger fields (no-ops if rows don't exist)
UPDATE public.field_definitions SET aliases = (
  SELECT ARRAY(SELECT DISTINCT x FROM UNNEST(COALESCE(aliases, ARRAY[]::text[]) || ARRAY['konto','kontonr','kontonummer','accountid','account_id']) AS x)
) WHERE file_type = 'general_ledger' AND field_key = 'account_number';

UPDATE public.field_definitions SET aliases = (
  SELECT ARRAY(SELECT DISTINCT x FROM UNNEST(COALESCE(aliases, ARRAY[]::text[]) || ARRAY['kontonavn','beskrivelse','tekst','accountname','account_name','description','line_text','description_text']) AS x)
) WHERE file_type = 'general_ledger' AND field_key = 'account_name';

UPDATE public.field_definitions SET aliases = (
  SELECT ARRAY(SELECT DISTINCT x FROM UNNEST(COALESCE(aliases, ARRAY[]::text[]) || ARRAY['dato','bilagsdato','transdato','transactiondate','posting_date','posteringdato','bkg_dato']) AS x)
) WHERE file_type = 'general_ledger' AND field_key = 'transaction_date';

UPDATE public.field_definitions SET aliases = (
  SELECT ARRAY(SELECT DISTINCT x FROM UNNEST(COALESCE(aliases, ARRAY[]::text[]) || ARRAY['bilag','bilagsnr','bilagsnummer','voucher','voucher_no','documentno','document_no','doknr','dok_nr']) AS x)
) WHERE file_type = 'general_ledger' AND field_key = 'voucher_number';

UPDATE public.field_definitions SET aliases = (
  SELECT ARRAY(SELECT DISTINCT x FROM UNNEST(COALESCE(aliases, ARRAY[]::text[]) || ARRAY['debet','dr','debetbelop','debetbeløp','debet_amount','amount_debit']) AS x)
) WHERE file_type = 'general_ledger' AND field_key = 'debit_amount';

UPDATE public.field_definitions SET aliases = (
  SELECT ARRAY(SELECT DISTINCT x FROM UNNEST(COALESCE(aliases, ARRAY[]::text[]) || ARRAY['kredit','cr','kreditbelop','kreditbeløp','credit_amount','amount_credit']) AS x)
) WHERE file_type = 'general_ledger' AND field_key = 'credit_amount';
