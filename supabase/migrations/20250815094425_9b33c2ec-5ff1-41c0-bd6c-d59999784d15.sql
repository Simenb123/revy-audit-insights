-- Create database indexes for better sorting performance
CREATE INDEX IF NOT EXISTS idx_general_ledger_account_number 
ON general_ledger_transactions USING btree (client_id, version_id, (client_chart_of_accounts.account_number));

CREATE INDEX IF NOT EXISTS idx_general_ledger_date_account 
ON general_ledger_transactions USING btree (client_id, version_id, transaction_date, client_account_id);

CREATE INDEX IF NOT EXISTS idx_general_ledger_voucher 
ON general_ledger_transactions USING btree (client_id, version_id, voucher_number) 
WHERE voucher_number IS NOT NULL;