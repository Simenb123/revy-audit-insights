import * as XLSX from 'xlsx';

export function exportArrayToXlsx(filename: string, records: any[]) {
  const safeName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  const ws = XLSX.utils.json_to_sheet(records);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, safeName);
}
