import * as XLSX from 'xlsx';

/**
 * Normalize header for consistent field matching
 */
export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[æå]/g, 'aa')
    .replace(/ø/g, 'oe')
    .replace(/[^\w_]/g, '');
}

/**
 * Parse a date from various formats including Excel serials
 */
function parseDate(value: any): string | null {
  if (!value) return null;
  
  // Handle Excel serial numbers
  if (typeof value === 'number' && isFinite(value) && value > 1000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const ms = Math.round(value * 86400 * 1000);
    const date = new Date(excelEpoch.getTime() + ms);
    return date.toISOString().slice(0, 10);
  }
  
  // Handle string dates
  if (typeof value === 'string') {
    // Handle d.m.yyyy format (with or without leading zeros)
    const ddmmyyyy = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try standard ISO date parsing
    const date = new Date(value);
    if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
      return date.toISOString().slice(0, 10);
    }
  }
  
  return null;
}

/**
 * Parse Norwegian number format (handles spaces and commas)
 */
export function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const str = String(value)
    .replace(/\s/g, '') // Remove spaces
    .replace(',', '.'); // Replace comma with dot
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Detect CSV delimiter
 */
function detectDelimiter(content: string): string {
  const sample = content.split('\n').slice(0, 5).join('\n');
  const semicolon = (sample.match(/;/g) || []).length;
  const comma = (sample.match(/,/g) || []).length;
  
  return semicolon > comma ? ';' : ',';
}

/**
 * Parse CSV content manually
 */
function parseCSV(content: string): any[] {
  const delimiter = detectDelimiter(content);
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
  const rows: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      const normalizedHeader = normalizeHeader(header);
      const value = values[index] || '';
      
      // Parse dates for date fields
      if (['fakturadato', 'forfallsdato', 'leveringsdato', 'dato'].includes(normalizedHeader)) {
        const parsedDate = parseDate(value);
        row[normalizedHeader] = parsedDate || value;
      } else {
        // Try to parse as number if it looks like one
        const numValue = parseNumber(value);
        row[normalizedHeader] = numValue !== 0 || value === '0' ? numValue : value;
      }
    });
    
    rows.push(row);
  }
  
  return rows;
}

/**
 * Read Excel or CSV file and return normalized rows
 */
export async function readTableFile(file: File): Promise<any[]> {
  try {
    // Try Excel first
    if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      
      // Normalize headers
      return jsonData.map(row => {
        const normalizedRow: any = {};
        Object.entries(row).forEach(([key, value]) => {
          const normalizedKey = normalizeHeader(String(key));
          // Attempt to parse dates for date fields
          if (['fakturadato', 'forfallsdato', 'leveringsdato', 'dato'].includes(normalizedKey)) {
            const parsedDate = parseDate(value);
            normalizedRow[normalizedKey] = parsedDate || value;
          } else {
            // Try to parse as number for numeric fields
            const numValue = parseNumber(value);
            normalizedRow[normalizedKey] = numValue !== 0 || value === '0' ? numValue : value;
          }
        });
        return normalizedRow;
      });
    }
    
    // Fallback to CSV
    const content = await file.text();
    return parseCSV(content);
    
  } catch (error) {
    console.error('Error reading file:', error);
    throw new Error(`Kunne ikke lese filen: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
  }
}