-- Create performance indexes for optimized analysis
CREATE INDEX IF NOT EXISTS idx_glt_client_version_date 
ON public.general_ledger_transactions (client_id, version_id, transaction_date);

CREATE INDEX IF NOT EXISTS idx_glt_client_version_account 
ON public.general_ledger_transactions (client_id, version_id, client_account_id);

CREATE INDEX IF NOT EXISTS idx_glt_amounts 
ON public.general_ledger_transactions (client_id, version_id, debit_amount, credit_amount);

CREATE INDEX IF NOT EXISTS idx_accounting_versions_client_active 
ON public.accounting_data_versions (client_id, is_active, created_at DESC);