-- Add additional columns to store AR/AP and document/currency fields from SAF-T
ALTER TABLE public.general_ledger_transactions
  ADD COLUMN IF NOT EXISTS customer_id text,
  ADD COLUMN IF NOT EXISTS supplier_id text,
  ADD COLUMN IF NOT EXISTS document_number text,
  ADD COLUMN IF NOT EXISTS value_date date,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS cid text,
  ADD COLUMN IF NOT EXISTS currency_code text,
  ADD COLUMN IF NOT EXISTS amount_currency numeric,
  ADD COLUMN IF NOT EXISTS exchange_rate numeric;

-- Optional indexes for common filters (lightweight)
CREATE INDEX IF NOT EXISTS idx_glt_customer_id ON public.general_ledger_transactions (customer_id);
CREATE INDEX IF NOT EXISTS idx_glt_supplier_id ON public.general_ledger_transactions (supplier_id);
CREATE INDEX IF NOT EXISTS idx_glt_document_number ON public.general_ledger_transactions (document_number);
