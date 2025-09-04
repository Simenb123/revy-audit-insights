import * as XLSX from 'xlsx';
import { validateFile } from './fileValidation';

/**
 * Secure wrapper for XLSX parsing to mitigate CVE vulnerabilities
 * TODO: Consider moving XLSX parsing to Web Worker or server-side when SheetJS patches become available
 */

const MAX_FILE_SIZE = 100_000_000; // 100MB limit
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];

export function validateXlsxFile(file: File): void {
  validateFile(file, ALLOWED_EXTENSIONS, MAX_FILE_SIZE);
}

export async function parseXlsxSafely(file: File): Promise<XLSX.WorkBook> {
  validateXlsxFile(file);
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    return XLSX.read(arrayBuffer, { 
      type: 'array',
      // Add security options to limit parsing scope
      cellText: false, // Disable text processing to reduce attack surface
      cellDates: true, // Allow date parsing
      cellNF: false, // Disable number format processing
      sheetStubs: false, // Don't create stub cells
      WTF: false // Disable "What The Format" mode for stricter parsing
    });
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getWorksheetDataSafely(workbook: XLSX.WorkBook, sheetName?: string): any[] {
  const worksheetName = sheetName || workbook.SheetNames[0];
  
  if (!worksheetName || !workbook.Sheets[worksheetName]) {
    throw new Error('No valid worksheet found');
  }

  const worksheet = workbook.Sheets[worksheetName];
  
  try {
    return XLSX.utils.sheet_to_json(worksheet, {
      defval: '', // Default value for empty cells
      header: 'A', // Use column letters as keys
      raw: false, // Convert everything to strings for safety
      range: 0 // Start from first row
    });
  } catch (error) {
    throw new Error(`Failed to convert worksheet to JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}