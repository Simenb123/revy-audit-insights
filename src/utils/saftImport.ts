import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import type { SaftResult } from './saftParser';

function jsonToCsv(rows: any[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(',')];
  for (const row of rows) {
    csv.push(headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  }
  return csv.join('\n');
}

export async function createZipFromParsed(parsed: SaftResult): Promise<Blob> {
  const zip = new JSZip();

  // CSV files
  zip.file('accounts.csv', jsonToCsv(parsed.accounts));
  zip.file('journals.csv', jsonToCsv(parsed.journals));
  zip.file('transactions.csv', jsonToCsv(parsed.transactions));

  // XLSX workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(parsed.accounts), 'Accounts');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(parsed.journals), 'Journals');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(parsed.transactions), 'Transactions');
  const xlsxBuf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  zip.file('saft.xlsx', xlsxBuf);

  return zip.generateAsync({ type: 'blob' });
}

export async function persistParsed(clientId: string, parsed: SaftResult): Promise<void> {
  // Upsert accounts into client_chart_of_accounts
  const accountRows = parsed.accounts.map(a => ({
    client_id: clientId,
    account_number: a.account_id,
    account_name: a.description || a.account_id,
    account_type: 'other',
    is_active: true
  }));

  const { data: inserted, error: accError } = await supabase
    .from('client_chart_of_accounts')
    .upsert(accountRows)
    .select('id, account_number');

  if (accError) throw accError;

  const accountMap = new Map<string, string>();
  inserted?.forEach((row: any) => accountMap.set(row.account_number, row.id));

  // Insert transactions
  const txRows = parsed.transactions
    .map(t => {
      const accountId = t.account_id ? accountMap.get(t.account_id) : undefined;
      if (!accountId) return null;
      const date = t.posting_date ? new Date(t.posting_date) : new Date();
      return {
        client_id: clientId,
        client_account_id: accountId,
        transaction_date: date.toISOString().split('T')[0],
        period_year: date.getFullYear(),
        period_month: date.getMonth() + 1,
        voucher_number: t.voucher_no || null,
        description: t.description || '',
        debit_amount: t.debit || 0,
        credit_amount: t.credit || 0,
        balance_amount: (t.debit || 0) - (t.credit || 0)
      };
    })
    .filter(Boolean) as any[];

  if (txRows.length) {
    const { error: txError } = await supabase
      .from('general_ledger_transactions')
      .insert(txRows);
    if (txError) throw txError;
  }
}

export async function uploadZipToStorage(clientId: string, zip: Blob, fileName: string): Promise<string> {
  const path = `${clientId}/${fileName}`;
  const { error } = await supabase.storage
    .from('saft-imports')
    .upload(path, zip, {
      upsert: true,
      contentType: 'application/zip'
    });
  if (error) throw error;
  return path;
}
