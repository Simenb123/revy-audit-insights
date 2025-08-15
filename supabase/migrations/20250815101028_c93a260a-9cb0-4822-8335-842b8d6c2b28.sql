-- Create database indexes for better sorting performance
CREATE INDEX IF NOT EXISTS idx_general_ledger_date_account 
ON general_ledger_transactions USING btree (client_id, version_id, transaction_date, client_account_id);

CREATE INDEX IF NOT EXISTS idx_general_ledger_voucher 
ON general_ledger_transactions USING btree (client_id, version_id, voucher_number) 
WHERE voucher_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_general_ledger_debit_credit
ON general_ledger_transactions USING btree (client_id, version_id, debit_amount, credit_amount);