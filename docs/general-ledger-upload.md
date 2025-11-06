# General Ledger Upload Process

This document explains how general ledger files are uploaded and processed in AI Revy.

## Overview

Uploading a general ledger is the second step of the accounting workflow. The client selects an Excel or CSV file and matches the file's columns to standard fields. The system converts the data to the correct number format, validates that each entry balances, and stores the transactions in `general_ledger_transactions`.

## Step by Step

1. **File selection and preview**
   - `GeneralLedgerUploader` tracks the chosen file and generates a preview.
   - CSV files are parsed with `processCSVFile`; Excel workbooks use `processExcelFile`.
   - The preview shows a mapping dialog (`EnhancedPreview`) where columns are matched to system fields. The last mapping used by the client is fetched from `upload_column_mappings` and prefilled.

2. **Data conversion**
   - Once mapping is confirmed, rows are transformed with `convertDataWithMapping`.
   - The function identifies the header row and converts Norwegian number formats via `convertNorwegianNumber`.
   - Debit, credit and balance amounts are calculated for each line.

3. **Validation and filtering**
   - `useGeneralLedgerValidation` checks that each voucher balances and displays warnings for discrepancies.
   - Users can filter out opening balances or accounts using `GeneralLedgerFilters`.

4. **Saving to the database**
   - Confirmed uploads create a record in `upload_batches` and a new version in `accounting_data_versions`.
   - Missing accounts are added to `client_chart_of_accounts` automatically.
   - Transactions are inserted into `general_ledger_transactions` in batches. When complete, the batch status is marked `completed`.

5. **Re-import on errors**
   - If column mapping or number formats were wrong, `DataReimportUtil` can remove the existing data so the file can be imported again.
   - This utility clears the affected tables and lets the user restart the upload with corrected settings.

## Related Documents

- [Accounting Upload Workflow](accounting-upload-workflow.md)
- [Upload Column Mappings](upload-column-mappings.md)


