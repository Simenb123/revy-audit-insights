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

// Enhanced column mapping with Norwegian language support and content analysis
export function suggestColumnMappings(
  headers: string[],
  fieldDefinitions: FieldDefinition[],
  sampleData?: string[][],
  historicalMappings?: Record<string, string>
): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const normalizedHeader = normalizeNorwegianText(header);
    
    let bestMatch: { field: FieldDefinition; confidence: number } | null = null;
    
    // Check historical mappings first
    if (historicalMappings && historicalMappings[header]) {
      const historicalField = fieldDefinitions.find(f => f.key === historicalMappings[header]);
      if (historicalField) {
        bestMatch = { field: historicalField, confidence: 0.95 };
      }
    }
    
    // If no historical match, analyze header and content
    if (!bestMatch) {
      for (const field of fieldDefinitions) {
        const confidence = calculateFieldConfidence(header, normalizedHeader, field, sampleData?.[i]);
        
        if (confidence > 0.3 && (!bestMatch || confidence > bestMatch.confidence)) {
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

// Normalize Norwegian text for better matching
function normalizeNorwegianText(text: string): string {
  return text.toLowerCase().trim()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate confidence score for field matching
function calculateFieldConfidence(
  originalHeader: string,
  normalizedHeader: string,
  field: FieldDefinition,
  sampleData?: string[]
): number {
  let confidence = 0;
  
  // 1. Exact alias match (highest confidence)
  const exactMatch = field.aliases.find(alias => 
    normalizeNorwegianText(alias) === normalizedHeader
  );
  if (exactMatch) {
    confidence = 1.0;
  } else {
    // 2. Partial alias matching with Norwegian awareness
    let bestAliasMatch = 0;
    for (const alias of field.aliases) {
      const normalizedAlias = normalizeNorwegianText(alias);
      
      // Check if header contains alias or vice versa
      if (normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader)) {
        const similarity = Math.min(normalizedAlias.length, normalizedHeader.length) / 
                          Math.max(normalizedAlias.length, normalizedHeader.length);
        bestAliasMatch = Math.max(bestAliasMatch, similarity * 0.85);
      }
      
      // Fuzzy matching for common misspellings
      const fuzzyScore = calculateFuzzyMatch(normalizedHeader, normalizedAlias);
      bestAliasMatch = Math.max(bestAliasMatch, fuzzyScore * 0.7);
    }
    confidence = bestAliasMatch;
  }
  
  // 3. Content-based validation (boost confidence if data matches expected type)
  if (sampleData && sampleData.length > 0 && confidence > 0.4) {
    const contentValidation = validateContentType(sampleData, field.type);
    if (contentValidation > 0.8) {
      confidence = Math.min(confidence * 1.2, 1.0); // Boost confidence
    } else if (contentValidation < 0.3) {
      confidence *= 0.6; // Reduce confidence for type mismatch
    }
  }
  
  // 4. Norwegian-specific patterns
  confidence = applyNorwegianPatterns(originalHeader, field, confidence);
  
  return Math.min(confidence, 1.0);
}

// Simple fuzzy matching for misspellings
function calculateFuzzyMatch(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  
  const distance = levenshteinDistance(str1, str2);
  return (maxLen - distance) / maxLen;
}

// Levenshtein distance calculation
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Validate if content matches expected data type
function validateContentType(sampleData: string[], expectedType: 'text' | 'number' | 'date'): number {
  const validSamples = sampleData.filter(val => val && val.trim()).slice(0, 5);
  if (validSamples.length === 0) return 0.5;
  
  let validCount = 0;
  
  for (const value of validSamples) {
    const trimmedValue = value.trim();
    
    switch (expectedType) {
      case 'number':
        // Handle Norwegian number formats (comma as decimal separator)
        const normalizedNumber = trimmedValue.replace(/\s/g, '').replace(',', '.');
        if (!isNaN(Number(normalizedNumber)) && normalizedNumber !== '') {
          validCount++;
        }
        break;
      case 'date':
        // Try various date formats
        const datePatterns = [
          /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/, // DD.MM.YYYY or DD/MM/YYYY
          /^\d{4}[./-]\d{1,2}[./-]\d{1,2}$/, // YYYY.MM.DD
          /^\d{1,2}\.\s?\w+\s?\d{4}$/ // DD. Month YYYY (Norwegian)
        ];
        
        if (datePatterns.some(pattern => pattern.test(trimmedValue)) || !isNaN(Date.parse(trimmedValue))) {
          validCount++;
        }
        break;
      case 'text':
        // Text is always valid, but prefer non-numeric content
        if (isNaN(Number(trimmedValue.replace(/[^\d.,-]/g, '')))) {
          validCount++;
        } else {
          validCount += 0.5; // Partial credit for numeric text
        }
        break;
    }
  }
  
  return validCount / validSamples.length;
}

// Apply Norwegian-specific matching patterns
function applyNorwegianPatterns(header: string, field: FieldDefinition, currentConfidence: number): number {
  const lowerHeader = header.toLowerCase();
  
  // Norwegian accounting terms
  const norwegianPatterns: Record<string, string[]> = {
    'account_number': ['konto', 'kontonr', 'kontonummer', 'kto'],
    'account_name': ['kontonavn', 'beskrivelse', 'tekst', 'navn'],
    'debit_balance': ['debet', 'soll', 'dr', 'driftskost'],
    'credit_balance': ['kredit', 'have', 'cr', 'driftsinnt'],
    'opening_balance': ['ingående', 'åpning', 'start', 'periode_start'],
    'closing_balance': ['utgående', 'avslutning', 'slutt', 'periode_slutt'],
    'account_type': ['type', 'art', 'kategori', 'gruppe']
  };
  
  if (norwegianPatterns[field.key]) {
    for (const pattern of norwegianPatterns[field.key]) {
      if (lowerHeader.includes(pattern)) {
        return Math.max(currentConfidence, 0.8);
      }
    }
  }
  
  return currentConfidence;
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