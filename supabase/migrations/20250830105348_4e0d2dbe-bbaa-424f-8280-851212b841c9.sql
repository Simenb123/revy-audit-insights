-- Fikse indekser uten predicate funksjoner
DROP INDEX IF EXISTS idx_general_ledger_transactions_analysis;
DROP INDEX IF EXISTS idx_trial_balances_analysis; 
DROP INDEX IF EXISTS idx_ai_analysis_cache_lookup;

-- Opprett indekser uten WHERE clauses med funksjoner
CREATE INDEX IF NOT EXISTS idx_general_ledger_transactions_analysis 
ON public.general_ledger_transactions (client_id, transaction_date, account_number, version_id);

CREATE INDEX IF NOT EXISTS idx_trial_balances_analysis
ON public.trial_balances (client_id, period_year, version, client_account_id);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_lookup
ON public.ai_analysis_cache (client_id, analysis_type, config_hash, expires_at);