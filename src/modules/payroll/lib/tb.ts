import * as XLSX from 'xlsx';

export interface GLEntry {
  account: string;
  text: string;
  date?: Date;
  amount: number;
}

export interface TBParseOptions {
  accCol: string;
  textCol: string;
  amtCol: string;
  dateCol?: string;
}

export interface TBWorksheet {
  name: string;
  data: any[][];
}

/**
 * Read XLSX/CSV file and extract worksheets
 */
export function readSpreadsheet(file: File): Promise<TBWorksheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const worksheets: TBWorksheet[] = workbook.SheetNames.map(name => {
          const worksheet = workbook.Sheets[name];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: null,
            raw: false 
          });
          
          return {
            name,
            data: jsonData as any[][]
          };
        });
        
        resolve(worksheets);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Normalize numeric values from various formats
 */
export function normalizeAmount(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  let str = String(value).trim();
  
  // Handle Norwegian number formats
  str = str.replace(/\u00A0/g, ' '); // Replace NBSP
  str = str.replace(/\s/g, ''); // Remove spaces (thousand separators)
  
  // Handle parentheses as negative
  const isNegative = str.includes('(') && str.includes(')');
  str = str.replace(/[()]/g, '');
  
  // Replace comma with dot for decimal
  str = str.replace(',', '.');
  
  // Remove any non-numeric characters except dot and minus
  str = str.replace(/[^0-9.-]/g, '');
  
  const num = parseFloat(str) || 0;
  return isNegative ? -num : num;
}

/**
 * Convert trial balance data to GL entries
 */
export function tbToGL(
  worksheetData: any[][],
  options: TBParseOptions,
  startRow: number = 1
): GLEntry[] {
  const entries: GLEntry[] = [];
  
  if (!worksheetData || worksheetData.length === 0) {
    return entries;
  }
  
  // Find column indices from header row
  const headerRow = worksheetData[0] || [];
  const accountColIndex = headerRow.findIndex((col: any) => 
    String(col).toLowerCase().includes(options.accCol.toLowerCase())
  );
  const textColIndex = headerRow.findIndex((col: any) => 
    String(col).toLowerCase().includes(options.textCol.toLowerCase())
  );
  const amountColIndex = headerRow.findIndex((col: any) => 
    String(col).toLowerCase().includes(options.amtCol.toLowerCase())
  );
  const dateColIndex = options.dateCol ? headerRow.findIndex((col: any) => 
    String(col).toLowerCase().includes(options.dateCol.toLowerCase())
  ) : -1;
  
  if (accountColIndex === -1 || textColIndex === -1 || amountColIndex === -1) {
    throw new Error('Could not find required columns in worksheet');
  }
  
  // Process data rows
  for (let i = startRow; i < worksheetData.length; i++) {
    const row = worksheetData[i];
    if (!row || row.length === 0) continue;
    
    const account = String(row[accountColIndex] || '').trim();
    const text = String(row[textColIndex] || '').trim();
    const amount = normalizeAmount(row[amountColIndex]);
    
    if (!account || amount === 0) continue;
    
    const entry: GLEntry = {
      account,
      text,
      amount
    };
    
    // Parse date if available
    if (dateColIndex >= 0 && row[dateColIndex]) {
      try {
        const dateValue = row[dateColIndex];
        if (dateValue instanceof Date) {
          entry.date = dateValue;
        } else {
          // Try to parse various date formats
          entry.date = new Date(dateValue);
        }
      } catch {
        // Ignore date parsing errors
      }
    }
    
    entries.push(entry);
  }
  
  return entries;
}

/**
 * Filter GL entries for payroll accounts (5xxx range) and accrual accounts (294x/295x)
 */
export function filterPayrollEntries(entries: GLEntry[]): {
  payroll: GLEntry[];
  accruals: GLEntry[];
} {
  const payroll: GLEntry[] = [];
  const accruals: GLEntry[] = [];
  
  entries.forEach(entry => {
    const accountNum = entry.account.replace(/\D/g, ''); // Extract digits only
    const firstDigit = accountNum.charAt(0);
    const first3Digits = accountNum.substring(0, 3);
    
    if (firstDigit === '5') {
      payroll.push(entry);
    } else if (first3Digits === '294' || first3Digits === '295') {
      accruals.push(entry);
    }
  });
  
  return { payroll, accruals };
}

/**
 * Get preview data for worksheet
 */
export function getWorksheetPreview(
  worksheetData: any[][],
  maxRows: number = 10
): any[][] {
  return worksheetData.slice(0, maxRows);
}