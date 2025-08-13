-- Add missing VAT columns to general_ledger_transactions table
ALTER TABLE public.general_ledger_transactions 
ADD COLUMN IF NOT EXISTS vat_code TEXT,
ADD COLUMN IF NOT EXISTS vat_rate NUMERIC,
ADD COLUMN IF NOT EXISTS vat_base NUMERIC,
ADD COLUMN IF NOT EXISTS vat_debit NUMERIC,
ADD COLUMN IF NOT EXISTS vat_credit NUMERIC;

-- Add indexes for better performance on VAT queries
CREATE INDEX IF NOT EXISTS idx_general_ledger_transactions_vat_code 
ON public.general_ledger_transactions(vat_code);

-- Add comments for documentation
COMMENT ON COLUMN public.general_ledger_transactions.vat_code IS 'VAT code from SAF-T data';
COMMENT ON COLUMN public.general_ledger_transactions.vat_rate IS 'VAT rate percentage';
COMMENT ON COLUMN public.general_ledger_transactions.vat_base IS 'VAT calculation base amount';
COMMENT ON COLUMN public.general_ledger_transactions.vat_debit IS 'VAT debit amount';
COMMENT ON COLUMN public.general_ledger_transactions.vat_credit IS 'VAT credit amount';