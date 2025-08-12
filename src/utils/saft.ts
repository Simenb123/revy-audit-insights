import * as XLSX from 'xlsx';
import { parseSaftFile, SaftResult, SaftAccount, SaftTransaction } from './saftParser';

export { parseSaftFile };
export type { SaftResult, SaftAccount, SaftTransaction };

function sheetToFile(sheet: XLSX.WorkSheet, filename: string): File {
  const csv = XLSX.utils.sheet_to_csv(sheet);
  return new File([csv], filename, { type: 'text/csv' });
}

export function toCsvFiles(data: SaftResult): File[] {
  const files: File[] = [];

  if (data.accounts?.length) {
    const sheet = XLSX.utils.json_to_sheet(data.accounts);
    files.push(sheetToFile(sheet, 'accounts.csv'));
  }

  if (data.journals?.length) {
    const sheet = XLSX.utils.json_to_sheet(data.journals);
    files.push(sheetToFile(sheet, 'journals.csv'));
  }

  if (data.transactions?.length) {
    const sheet = XLSX.utils.json_to_sheet(data.transactions);
    files.push(sheetToFile(sheet, 'transactions.csv'));
  }

  return files;
}

export async function toXlsxBlob(data: SaftResult): Promise<Blob> {
  const wb = XLSX.utils.book_new();

  if (data.accounts?.length) {
    const sheet = XLSX.utils.json_to_sheet(data.accounts);
    XLSX.utils.book_append_sheet(wb, sheet, 'Accounts');
  }

  if (data.journals?.length) {
    const sheet = XLSX.utils.json_to_sheet(data.journals);
    XLSX.utils.book_append_sheet(wb, sheet, 'Journals');
  }

  if (data.transactions?.length) {
    const sheet = XLSX.utils.json_to_sheet(data.transactions);
    XLSX.utils.book_append_sheet(wb, sheet, 'Transactions');
  }

  const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}
