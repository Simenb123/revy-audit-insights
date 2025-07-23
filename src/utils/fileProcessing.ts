import * as XLSX from 'xlsx';
import { parseXlsxSafely, getWorksheetDataSafely } from '@/utils/secureXlsx';

export interface FilePreview {
  headers: string[];
  rows: any[][];
  detectedDelimiter?: string;
  hasHeaders: boolean;
  totalRows: number;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
}

export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'date';
  aliases: string[];
}

// Standard field definitions for different data types
export const TRIAL_BALANCE_FIELDS: FieldDefinition[] = [
  {
    key: 'account_number',
    label: 'Kontonummer',
    required: true,
    type: 'text',
    aliases: ['kontonummer', 'account_number', 'konto', 'account', 'nummer']
  },
  {
    key: 'account_name',
    label: 'Kontonavn',
    required: true,
    type: 'text',
    aliases: ['kontonavn', 'account_name', 'navn', 'name', 'beskrivelse', 'description']
  },
  {
    key: 'balance',
    label: 'Saldo',
    required: true,
    type: 'number',
    aliases: ['saldo', 'balance', 'balanse', 'beløp', 'amount', 'sum']
  },
  {
    key: 'account_type',
    label: 'Kontotype',
    required: false,
    type: 'text',
    aliases: ['kontotype', 'account_type', 'type', 'kategori', 'category']
  }
];

export const CHART_OF_ACCOUNTS_FIELDS: FieldDefinition[] = [
  {
    key: 'account_number',
    label: 'Kontonummer',
    required: true,
    type: 'text',
    aliases: ['kontonummer', 'account_number', 'konto', 'account', 'nummer']
  },
  {
    key: 'account_name',
    label: 'Kontonavn',
    required: true,
    type: 'text',
    aliases: ['kontonavn', 'account_name', 'navn', 'name', 'beskrivelse', 'description']
  },
  {
    key: 'account_type',
    label: 'Kontotype',
    required: false,
    type: 'text',
    aliases: ['kontotype', 'account_type', 'type', 'kategori', 'category']
  },
  {
    key: 'parent_account_number',
    label: 'Overordnet konto',
    required: false,
    type: 'text',
    aliases: ['overordnet', 'parent', 'parent_account', 'hovedkonto']
  }
];

export const GENERAL_LEDGER_FIELDS: FieldDefinition[] = [
  {
    key: 'date',
    label: 'Dato',
    required: true,
    type: 'date',
    aliases: ['dato', 'date', 'bilagsdato', 'transaction_date']
  },
  {
    key: 'account_number',
    label: 'Kontonummer',
    required: true,
    type: 'text',
    aliases: ['kontonummer', 'account_number', 'konto', 'account']
  },
  {
    key: 'description',
    label: 'Beskrivelse',
    required: true,
    type: 'text',
    aliases: ['beskrivelse', 'description', 'tekst', 'text', 'bilagstekst']
  },
  {
    key: 'debit_amount',
    label: 'Debet',
    required: false,
    type: 'number',
    aliases: ['debet', 'debit', 'debit_amount', 'skal']
  },
  {
    key: 'credit_amount',
    label: 'Kredit',
    required: false,
    type: 'number',
    aliases: ['kredit', 'credit', 'credit_amount', 'haver']
  },
  {
    key: 'reference',
    label: 'Referanse',
    required: false,
    type: 'text',
    aliases: ['referanse', 'reference', 'bilagsnummer', 'voucher', 'ref']
  }
];

// Detect CSV delimiter
export function detectCSVDelimiter(text: string): string {
  const delimiters = [',', ';', '\t', '|'];
  const firstLine = text.split('\n')[0];
  
  let bestDelimiter = ',';
  let maxCount = 0;
  
  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp('\\' + delimiter, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }
  
  return bestDelimiter;
}

// Parse CSV with intelligent delimiter detection
export function parseCSV(text: string, delimiter?: string): { headers: string[]; rows: string[][] } {
  const detectedDelimiter = delimiter || detectCSVDelimiter(text);
  const lines = text.split('\n').filter(line => line.trim());
  
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === detectedDelimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(field => field.replace(/^"|"$/g, ''));
  };
  
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(parseCSVLine);
  
  return { headers, rows };
}

// Process Excel file with preview
export async function processExcelFile(file: File): Promise<FilePreview> {
  try {
    const workbook = await parseXlsxSafely(file);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) {
      throw new Error('Filen inneholder ingen data');
    }
    
    const headers = (jsonData[0] as any[]).map(h => h?.toString() || '');
    const rows = jsonData.slice(1).map(row => 
      (row as any[]).map(cell => cell?.toString() || '')
    );
    
    return {
      headers,
      rows: rows.slice(0, 10), // Preview first 10 rows
      hasHeaders: true,
      totalRows: jsonData.length - 1
    };
  } catch (error) {
    throw new Error(`Kunne ikke lese Excel-fil: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
  }
}

// Process CSV file with preview
export async function processCSVFile(file: File): Promise<FilePreview> {
  try {
    const text = await file.text();
    const delimiter = detectCSVDelimiter(text);
    const { headers, rows } = parseCSV(text, delimiter);
    
    return {
      headers,
      rows: rows.slice(0, 10), // Preview first 10 rows
      detectedDelimiter: delimiter,
      hasHeaders: true,
      totalRows: rows.length
    };
  } catch (error) {
    throw new Error(`Kunne ikke lese CSV-fil: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
  }
}

// Intelligent column mapping
export function suggestColumnMappings(
  headers: string[],
  fieldDefinitions: FieldDefinition[]
): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  
  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim();
    let bestMatch: { field: FieldDefinition; confidence: number } | null = null;
    
    for (const field of fieldDefinitions) {
      // Exact match
      if (field.aliases.some(alias => alias.toLowerCase() === normalizedHeader)) {
        bestMatch = { field, confidence: 1.0 };
        break;
      }
      
      // Partial match
      const partialMatches = field.aliases.filter(alias => 
        normalizedHeader.includes(alias.toLowerCase()) || 
        alias.toLowerCase().includes(normalizedHeader)
      );
      
      if (partialMatches.length > 0) {
        const confidence = Math.max(...partialMatches.map(alias => {
          const similarity = normalizedHeader.length > 0 ? 
            Math.min(alias.length, normalizedHeader.length) / 
            Math.max(alias.length, normalizedHeader.length) : 0;
          return similarity * 0.8; // Reduced confidence for partial matches
        }));
        
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { field, confidence };
        }
      }
    }
    
    if (bestMatch && bestMatch.confidence > 0.3) {
      mappings.push({
        sourceColumn: header,
        targetField: bestMatch.field.key,
        confidence: bestMatch.confidence
      });
    }
  }
  
  return mappings;
}

// Validate data types
export function validateDataTypes(
  rows: string[][],
  columnIndex: number,
  expectedType: 'text' | 'number' | 'date'
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const sampleSize = Math.min(rows.length, 10);
  
  for (let i = 0; i < sampleSize; i++) {
    const value = rows[i][columnIndex]?.trim();
    if (!value) continue;
    
    switch (expectedType) {
      case 'number':
        if (isNaN(Number(value.replace(/[^\d.,-]/g, '')))) {
          errors.push(`Rad ${i + 2}: "${value}" er ikke et gyldig tall`);
        }
        break;
      case 'date':
        if (isNaN(Date.parse(value))) {
          errors.push(`Rad ${i + 2}: "${value}" er ikke en gyldig dato`);
        }
        break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.slice(0, 3) // Show max 3 errors
  };
}

// Convert data based on mapping
export function convertDataWithMapping(
  preview: FilePreview,
  mappings: Record<string, string>
): any[] {
  const headerIndexMap = preview.headers.reduce((acc, header, index) => {
    acc[header] = index;
    return acc;
  }, {} as Record<string, number>);
  
  return preview.rows.map(row => {
    const convertedRow: any = {};
    
    for (const [sourceColumn, targetField] of Object.entries(mappings)) {
      const columnIndex = headerIndexMap[sourceColumn];
      if (columnIndex !== undefined && row[columnIndex] !== undefined) {
        convertedRow[targetField] = row[columnIndex];
      }
    }
    
    return convertedRow;
  });
}