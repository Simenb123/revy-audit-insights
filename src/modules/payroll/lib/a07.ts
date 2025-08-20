export interface A07Row {
  beskrivelse: string;
  fordel: string;
  beloep: number;
}

export interface A07ParseResult {
  rows: A07Row[];
  totals: Record<string, number>;
}

export interface ValidationError {
  rowIndex: number;
  beskrivelse: string;
  error: string;
}

export interface AmeldingCode {
  id: string;
  label: string;
  expected_fordel: string;
  aliases: string[];
}

export interface AmeldingCodeMap {
  a07: string;
  internal_code: string;
}

// Normalize Norwegian characters for comparison (ø→oe, å→aa, æ→ae)
export const norm = (s: string): string => 
  s?.toLowerCase()
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/æ/g, 'ae') || '';

/**
 * Parse A07 JSON data and convert to structured format
 */
export function parseA07(jsonData: any, codeMappings: AmeldingCodeMap[]): A07ParseResult {
  const rows: A07Row[] = [];
  const totals: Record<string, number> = {};

  // Initialize totals for all internal codes
  codeMappings.forEach(mapping => {
    totals[mapping.internal_code] = 0;
  });

  if (!jsonData || !Array.isArray(jsonData)) {
    return { rows, totals };
  }

  jsonData.forEach((item: any) => {
    if (item.beskrivelse && item.fordel && typeof item.beloep === 'number') {
      const row: A07Row = {
        beskrivelse: item.beskrivelse,
        fordel: item.fordel,
        beloep: item.beloep
      };
      
      rows.push(row);

      // Find mapping to internal code and sum up totals
      const mapping = codeMappings.find(m => m.a07 === item.beskrivelse);
      if (mapping) {
        totals[mapping.internal_code] = (totals[mapping.internal_code] || 0) + item.beloep;
      }
    }
  });

  return { rows, totals };
}

/**
 * Validate A07 rows against expected fordel types from database
 */
export function validateA07(
  rows: A07Row[], 
  codes: AmeldingCode[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  rows.forEach((row, index) => {
    // Find matching code in database (normalize for comparison)
    const normalizedBeskrivelse = norm(row.beskrivelse);
    const matchingCode = codes.find(code => 
      norm(code.id) === normalizedBeskrivelse || 
      code.aliases.some(alias => norm(alias) === normalizedBeskrivelse)
    );

    if (!matchingCode) {
      errors.push({
        rowIndex: index,
        beskrivelse: row.beskrivelse,
        error: `Ukjent beskrivelse: ${row.beskrivelse}`
      });
      return;
    }

    // Normalize fordel for comparison (handle both ø and oe variants)
    const normalizedRowFordel = norm(row.fordel);
    const normalizedExpectedFordel = norm(matchingCode.expected_fordel);

    if (normalizedRowFordel !== normalizedExpectedFordel) {
      errors.push({
        rowIndex: index,
        beskrivelse: row.beskrivelse,
        error: `Forventet fordel '${matchingCode.expected_fordel}', fikk '${row.fordel}'`
      });
    }
  });

  return errors;
}

/**
 * Get internal code for A07 beskrivelse
 */
export function getInternalCodeForA07(
  beskrivelse: string, 
  codeMappings: AmeldingCodeMap[]
): string | undefined {
  const normalizedBeskrivelse = norm(beskrivelse);
  const mapping = codeMappings.find(m => norm(m.a07) === normalizedBeskrivelse);
  return mapping?.internal_code;
}