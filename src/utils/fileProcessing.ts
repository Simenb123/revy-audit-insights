import * as XLSX from 'xlsx';
import { parseXlsxSafely, getWorksheetDataSafely } from '@/utils/secureXlsx';

export interface FilePreview {
  headers: string[];
  rows: any[][]; // Preview rows (limited)
  allRows: any[][]; // Full dataset for processing
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
    key: 'opening_balance',
    label: 'Inngående saldo',
    required: false,
    type: 'number',
    aliases: [
      'inngående', 'ingående', 'åpning', 'opening', 'start', 'initial', 
      'åpningssaldo', 'startsaldo', 'inngående_saldo', 'åpningsbalanse', 
      'startbalanse', 'primo', 'primo_saldo'
    ]
  },
  {
    key: 'debit_turnover',
    label: 'Debet omsetning',
    required: false,
    type: 'number',
    aliases: ['debet', 'debit', 'skal', 'dr', 'debet_omsetning', 'debit_turnover', 'omsetning_debet']
  },
  {
    key: 'credit_turnover',
    label: 'Kredit omsetning',
    required: false,
    type: 'number',
    aliases: ['kredit', 'credit', 'have', 'haver', 'cr', 'kredit_omsetning', 'credit_turnover', 'omsetning_kredit']
  },
  {
    key: 'closing_balance',
    label: 'Saldo i år',
    required: true,
    type: 'number',
    aliases: [
      'saldo i år', 'saldo_i_år', 'årets_saldo', 'årets saldo', 'års_saldo', 'årssaldo',
      'utgående', 'avslutning', 'closing', 'slutt', 'final', 'saldo', 'balance', 
      'sluttsaldo', 'sluttbalanse', 'saldo i_år', 'saldoiår', 'saldo_år'
    ]
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
    key: 'balance_amount',
    label: 'Beløp',
    required: false,
    type: 'number',
    aliases: [
      'beløp', 'amount', 'balance', 'balance_amount', 'saldo', 'belop', 'belopkr', 'beløpkr', 'kr', 'sum',
      'beløp nok', 'beløp kr', 'beløp_kr', 'beløp_nok', 'lokalt_beløp', 'local_amount',
      'transbeløp', 'transaksjon_beløp', 'transaction_amount', 'totalbeløp', 'total_amount',
      'periode_beløp', 'nettobeløp', 'netto_beløp', 'brutto_beløp', 'bruttobeløp'
    ]
  },
  {
    key: 'voucher_number',
    label: 'Bilagsnummer',
    required: false,
    type: 'text',
    aliases: [
      'bilagsnummer', 'voucher_number', 'voucher', 'bilag', 'bilagsnr', 'dokument', 'document',
      'bilag_nummer', 'bilagsnummer_id', 'voucher_id', 'dok_nummer', 'dokument_nummer',
      'bilagnr', 'bilagsnr.', 'bilagsnummer.', 'voucher_nr', 'vouchernr'
    ]
  },
  {
    key: 'reference',
    label: 'Referanse',
    required: false,
    type: 'text',
    aliases: ['referanse', 'reference', 'ref', 'external_reference']
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
    console.log('=== PROCESSING EXCEL FILE ===');
    console.log('File name:', file.name);
    console.log('File size:', file.size);
    
    const workbook = await parseXlsxSafely(file);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('Excel parsed successfully, rows:', jsonData.length);
    
    if (jsonData.length === 0) {
      throw new Error('Filen inneholder ingen data');
    }
    
    const headers = (jsonData[0] as any[]).map(h => h?.toString() || '');
    const allRows = jsonData.slice(1).map(row => 
      (row as any[]).map(cell => cell?.toString() || '')
    );
    
    console.log(`Excel file processed: ${allRows.length} total rows`);
    
    return {
      headers,
      rows: allRows.slice(0, 10), // Preview first 10 rows
      allRows: allRows, // Full dataset for processing
      hasHeaders: true,
      totalRows: allRows.length
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
    
    console.log(`CSV file processed: ${rows.length} total rows`);
    
    return {
      headers,
      rows: rows.slice(0, 10), // Preview first 10 rows
      allRows: rows, // Full dataset for processing
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
  const suggestions: ColumnMapping[] = [];

  for (const header of headers) {
    let bestMatch: FieldDefinition | null = null;
    let bestConfidence = 0;

    // Check historical mappings first with higher confidence
    if (historicalMappings && historicalMappings[header]) {
      const historicalField = fieldDefinitions.find(f => f.key === historicalMappings[header]);
      if (historicalField) {
        suggestions.push({
          sourceColumn: header,
          targetField: historicalField.key,
          confidence: 0.98 // Very high confidence for exact historical matches
        });
        continue;
      }
    }

    // Enhanced matching with context awareness
    for (const field of fieldDefinitions) {
      let confidence = calculateFieldConfidence(header, normalizeNorwegianText(header), field);
      
      // Apply Norwegian pattern matching
      confidence = applyNorwegianPatterns(header, field, confidence);
      
      // Apply context-based matching (e.g., account number patterns)
      confidence = applyContextualMatching(header, field, confidence, sampleData, headers);
      
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestMatch = field;
      }
    }

    // Enhanced content validation if sample data is available
    if (bestMatch && sampleData && sampleData.length > 0) {
      const columnIndex = headers.indexOf(header);
      if (columnIndex !== -1) {
        const columnData = sampleData.map(row => row[columnIndex] || '').filter(val => val.trim() !== '');
        const contentConfidence = validateContentType(columnData, bestMatch.type);
        
        // Apply smart content-based confidence adjustment
        if (contentConfidence > 0.8) {
          bestConfidence = Math.min(bestConfidence * 1.1, 1.0); // Boost confidence for good content match
        } else if (contentConfidence < 0.5) {
          bestConfidence = bestConfidence * 0.7; // Reduce confidence for poor content match
        } else {
          bestConfidence = bestConfidence * contentConfidence;
        }
      }
    }

    // Lower threshold for better suggestions
    if (bestMatch && bestConfidence > 0.25) {
      suggestions.push({
        sourceColumn: header,
        targetField: bestMatch.key,
        confidence: Math.min(bestConfidence, 0.99) // Cap at 99% to reserve 100% for perfect matches
      });
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
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

// Apply context-based matching for better pattern recognition
function applyContextualMatching(
  header: string, 
  field: FieldDefinition, 
  currentConfidence: number, 
  sampleData?: string[][], 
  headers?: string[]
): number {
  const lowerHeader = header.toLowerCase();
  
  // Enhanced Norwegian accounting patterns with contextual awareness
  const contextualPatterns: Record<string, {
    patterns: string[];
    contextBoosts: { pattern: string; boost: number }[];
    contentValidators?: (data: string[]) => number;
  }> = {
    'account_number': {
      patterns: ['konto', 'kontonr', 'kontonummer', 'kto', 'account_no', 'acc_no'],
      contextBoosts: [
        { pattern: 'nummer', boost: 0.15 },
        { pattern: 'nr', boost: 0.1 },
        { pattern: 'no', boost: 0.1 }
      ],
      contentValidators: (data) => {
        // Account numbers are typically 4-8 digit patterns
        const validAccountNumbers = data.filter(val => /^\d{4,8}$/.test(val.trim())).length;
        return validAccountNumbers / Math.max(data.length, 1);
      }
    },
    'account_name': {
      patterns: ['navn', 'name', 'beskrivelse', 'description', 'tekst', 'text'],
      contextBoosts: [
        { pattern: 'konto', boost: 0.2 },
        { pattern: 'account', boost: 0.15 }
      ]
    },
    'opening_balance': {
      patterns: ['inngående', 'ingående', 'åpning', 'opening', 'start', 'initial'],
      contextBoosts: [
        { pattern: 'saldo', boost: 0.2 },
        { pattern: 'balance', boost: 0.15 },
        { pattern: 'periode', boost: 0.1 }
      ]
    },
    'closing_balance': {
      patterns: ['utgående', 'avslutning', 'closing', 'slutt', 'final'],
      contextBoosts: [
        { pattern: 'saldo', boost: 0.2 },
        { pattern: 'balance', boost: 0.15 },
        { pattern: 'periode', boost: 0.1 }
      ]
    },
    'debit_amount': {
      patterns: ['debet', 'debit', 'skal', 'dr'],
      contextBoosts: [
        { pattern: 'beløp', boost: 0.15 },
        { pattern: 'amount', boost: 0.15 },
        { pattern: 'sum', boost: 0.1 }
      ]
    },
    'credit_amount': {
      patterns: ['kredit', 'credit', 'have', 'haver', 'cr'],
      contextBoosts: [
        { pattern: 'beløp', boost: 0.15 },
        { pattern: 'amount', boost: 0.15 },
        { pattern: 'sum', boost: 0.1 }
      ]
    }
  };

  const fieldPattern = contextualPatterns[field.key];
  if (!fieldPattern) return currentConfidence;

  let boost = 0;

  // Check main patterns
  for (const pattern of fieldPattern.patterns) {
    if (lowerHeader.includes(pattern)) {
      boost = Math.max(boost, 0.3);
      break;
    }
  }

  // Apply context boosts
  for (const contextBoost of fieldPattern.contextBoosts) {
    if (lowerHeader.includes(contextBoost.pattern)) {
      boost += contextBoost.boost;
    }
  }

  // Content validation boost
  if (fieldPattern.contentValidators && sampleData && headers) {
    const columnIndex = headers.indexOf(header);
    if (columnIndex !== -1 && sampleData.length > 0) {
      const columnData = sampleData.map(row => row[columnIndex] || '').filter(val => val.trim());
      const contentScore = fieldPattern.contentValidators(columnData);
      if (contentScore > 0.7) {
        boost += 0.2;
      }
    }
  }

  return Math.min(currentConfidence + boost, 1.0);
}

// Apply Norwegian-specific matching patterns
function applyNorwegianPatterns(header: string, field: FieldDefinition, currentConfidence: number): number {
  const lowerHeader = header.toLowerCase();
  
  // Enhanced Norwegian accounting terms with regional variations
  const norwegianPatterns: Record<string, string[]> = {
    'account_number': ['konto', 'kontonr', 'kontonummer', 'kto', 'kontokode'],
    'account_name': ['kontonavn', 'kontobeskrivelse', 'kontotekst', 'navn', 'beskrivelse'],
    'debit_amount': ['debet', 'soll', 'dr', 'driftskost', 'skal'],
    'credit_amount': ['kredit', 'have', 'haver', 'cr', 'driftsinnt'],
    'opening_balance': ['inngående', 'ingående', 'åpningssaldo', 'startsaldo', 'periode_start'],
    'closing_balance': ['utgående', 'sluttsaldo', 'sluttbalanse', 'periode_slutt'],
    'account_type': ['kontotype', 'type', 'art', 'kategori', 'gruppe', 'kontokategori'],
    'transaction_date': ['dato', 'bilagsdato', 'transaksjonsdato', 'regnskapsdato'],
    'voucher_number': ['bilagsnr', 'bilagsnummer', 'dok_nr', 'dokumentnummer', 'ref'],
    'description': ['beskrivelse', 'bilagstekst', 'tekst', 'forklaring', 'notater'],
    'amount': ['beløp', 'sum', 'verdi', 'total'],
    'vat_code': ['mva', 'mvakode', 'mva_kode', 'skatt']
  };
  
  if (norwegianPatterns[field.key]) {
    for (const pattern of norwegianPatterns[field.key]) {
      if (lowerHeader.includes(pattern)) {
        return Math.max(currentConfidence, 0.75);
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

// Enhanced Norwegian number conversion with detailed logging
function convertNorwegianNumber(value: string): number | null {
  if (!value || typeof value !== 'string') {
    console.log(`convertNorwegianNumber: Invalid input: ${value} (type: ${typeof value})`);
    return null;
  }
  
  const originalValue = value;
  console.log(`convertNorwegianNumber: Converting "${originalValue}"`);
  
  // Remove any whitespace
  let cleanValue = value.trim();
  
  // Handle Norwegian number format: 123.456,78 or 123 456,78
  // Replace space thousands separators and dot thousands separators
  cleanValue = cleanValue.replace(/\s+/g, ''); // Remove spaces
  console.log(`After removing spaces: "${cleanValue}"`);
  
  // If it contains both . and , the last comma is decimal separator
  if (cleanValue.includes(',') && cleanValue.includes('.')) {
    // Format like 1.234.567,89 -> 1234567.89
    const lastCommaIndex = cleanValue.lastIndexOf(',');
    const beforeComma = cleanValue.substring(0, lastCommaIndex).replace(/\./g, '');
    const afterComma = cleanValue.substring(lastCommaIndex + 1);
    cleanValue = beforeComma + '.' + afterComma;
    console.log(`Converted dot+comma format: "${cleanValue}"`);
  } else if (cleanValue.includes(',') && !cleanValue.includes('.')) {
    // Format like 1234567,89 or 1 234 567,89 -> 1234567.89
    cleanValue = cleanValue.replace(',', '.');
    console.log(`Converted comma format: "${cleanValue}"`);
  } else if (cleanValue.includes('.')) {
    // Check if it's thousands separator or decimal
    const dotIndex = cleanValue.lastIndexOf('.');
    const afterDot = cleanValue.substring(dotIndex + 1);
    
    // If more than 2 digits after dot, it's likely thousands separator
    if (afterDot.length > 2) {
      cleanValue = cleanValue.replace(/\./g, '');
      console.log(`Treated dots as thousands separators: "${cleanValue}"`);
    }
    // If exactly 2 digits and there are multiple dots, last one is decimal
    else if (cleanValue.split('.').length > 2) {
      const parts = cleanValue.split('.');
      const decimal = parts.pop();
      cleanValue = parts.join('') + '.' + decimal;
      console.log(`Multiple dots format: "${cleanValue}"`);
    } else {
      console.log(`Single dot format preserved: "${cleanValue}"`);
    }
  }
  
  const parsed = parseFloat(cleanValue);
  const result = isNaN(parsed) ? null : parsed;
  console.log(`convertNorwegianNumber: "${originalValue}" -> "${cleanValue}" -> ${result}`);
  return result;
}

// Convert data based on mapping
export function convertDataWithMapping(
  preview: FilePreview,
  mappings: Record<string, string>
): any[] {
  console.log('=== CONVERTDATAWITHMAPPING DEBUG START ===');
  console.log('Preview object:', {
    totalRows: preview.totalRows,
    headers: preview.headers,
    rowsLength: preview.rows?.length,
    allRowsLength: preview.allRows?.length,
    hasAllRows: !!preview.allRows
  });
  
  const headerIndexMap = preview.headers.reduce((acc, header, index) => {
    acc[header] = index;
    return acc;
  }, {} as Record<string, number>);
  
  // CRITICAL: Always use allRows for full dataset, fallback to rows only if allRows is not available
  const dataRows = preview.allRows || preview.rows;
  
  console.log('=== DATA ROWS SELECTION ===');
  console.log('Using allRows:', !!preview.allRows);
  console.log('Selected dataRows length:', dataRows.length);
  console.log('First 3 data rows:', dataRows.slice(0, 3));
  console.log('Last 3 data rows:', dataRows.slice(-3));
  
  console.log('=== MAPPING CONVERSION ===');
  console.log('Mappings to apply:', mappings);
  console.log('Header index map:', headerIndexMap);
  
  const convertedData = dataRows.map((row, index) => {
    const convertedRow: any = {};
    
    for (const [sourceColumn, targetField] of Object.entries(mappings)) {
      const columnIndex = headerIndexMap[sourceColumn];
      if (columnIndex !== undefined && row[columnIndex] !== undefined) {
        let value = row[columnIndex];
        
        // Enhanced data conversion for different field types
        if (targetField.includes('amount') || targetField === 'balance_amount') {
          // Handle Norwegian number format and convert to number
          if (value !== null && value !== undefined && value !== '') {
            value = convertNorwegianNumber(value.toString());
            if (value === null) {
              console.warn(`Failed to convert amount value: "${row[columnIndex]}" in column ${sourceColumn}`);
              value = 0;
            }
          } else {
            value = 0;
          }
        } else if (targetField === 'date') {
          // Handle date conversion
          if (value && !isNaN(Date.parse(value))) {
            value = new Date(value).toISOString().split('T')[0];
          }
        }
        
        convertedRow[targetField] = value;
      }
    }
    
    // Log progress for large datasets
    if (index === 0 || index === dataRows.length - 1 || index % 50 === 0) {
      console.log(`Converting row ${index + 1}/${dataRows.length}:`, convertedRow);
    }
    
    return convertedRow;
  });
  
  console.log('=== CONVERSION COMPLETE ===');
  console.log(`Successfully converted ${convertedData.length} rows`);
  console.log('First converted row:', convertedData[0]);
  console.log('Last converted row:', convertedData[convertedData.length - 1]);
  console.log('=== CONVERTDATAWITHMAPPING DEBUG END ===');
  
  return convertedData;
}