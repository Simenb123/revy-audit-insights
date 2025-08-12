# Accounting Upload Workflow

The accounting modules handle chart of accounts, general ledger and trial balance files. Components are located in `src/components/Accounting`.

## Upload Steps

1. **Chart of Accounts** – `ChartOfAccountsUploader` accepts Excel or CSV files. CSV files prompt a column mapping step using `AccountCSVMapping`.
2. **General Ledger** – `GeneralLedgerUploader` processes Excel, CSV or SAF‑T files and inserts transactions into `general_ledger_transactions`. Transactions are validated against `client_chart_of_accounts`.
3. **Trial Balance** – `TrialBalanceUploader` imports period balances from Excel, CSV or SAF‑T. If no chart of accounts exists, missing accounts are created automatically.

Progress bars show upload status and results are written to `upload_batches` for traceability. Column mappings are saved in `upload_column_mappings` so later uploads can reuse the same structure.
