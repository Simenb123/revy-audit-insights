export interface A07Row {
  beskrivelse: string;
  fordel: string;
  beloep: number;
  orgnr?: string;
  ansattFnr?: string;
  navn?: string;
  antall?: number;
  trekkpliktig?: boolean;
  aga?: boolean;
  opptjStart?: string;
  opptjSlutt?: string;
}

export interface A07ParseResult {
  rows: A07Row[];
  totals: Record<string, number>;
  errors?: string[];
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
 * Enhanced version that supports both simple and detailed parsing
 */
export function parseA07(jsonData: any, codeMappings: AmeldingCodeMap[]): A07ParseResult {
  const rows: A07Row[] = [];
  const totals: Record<string, number> = {};
  const errors: string[] = [];

  // Initialize totals for all internal codes
  codeMappings.forEach(mapping => {
    totals[mapping.internal_code] = 0;
  });

  if (!jsonData || !Array.isArray(jsonData)) {
    // Try parsing from A07 JSON structure if it's not a simple array
    if (jsonData?.mottatt?.oppgave?.virksomhet) {
      return parseA07FromJSON(jsonData, codeMappings);
    }
    return { rows, totals, errors: ['Ingen gyldig A07 data funnet'] };
  }

  jsonData.forEach((item: any, index: number) => {
    try {
      if (item.beskrivelse && item.fordel && typeof item.beloep === 'number') {
        const row: A07Row = {
          beskrivelse: item.beskrivelse,
          fordel: norm(item.fordel), // Normalize fordel
          beloep: item.beloep,
          orgnr: item.orgnr,
          ansattFnr: item.ansattFnr,
          navn: item.navn,
          antall: item.antall,
          trekkpliktig: item.trekkpliktig,
          aga: item.aga,
          opptjStart: item.opptjStart,
          opptjSlutt: item.opptjSlutt
        };
        
        rows.push(row);

        // Find mapping to internal code and sum up totals
        const mapping = codeMappings.find(m => norm(m.a07) === norm(item.beskrivelse));
        if (mapping) {
          totals[mapping.internal_code] = (totals[mapping.internal_code] || 0) + item.beloep;
        } else {
          errors.push(`Rad ${index + 1}: Ukjent A07-kode '${item.beskrivelse}'`);
        }
      }
    } catch (error) {
      errors.push(`Rad ${index + 1}: Feil ved parsing - ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    }
  });

  return { rows, totals, errors };
}

/**
 * Parse A07 from full JSON structure (from the new parser)
 */
function parseA07FromJSON(a07Data: any, codeMappings: AmeldingCodeMap[]): A07ParseResult {
  const rows: A07Row[] = [];
  const totals: Record<string, number> = {};
  const errors: string[] = [];

  // Initialize totals for all internal codes
  codeMappings.forEach(mapping => {
    totals[mapping.internal_code] = 0;
  });

  try {
    const orgs = a07Data?.mottatt?.oppgave?.virksomhet ?? [];
    
    if (!Array.isArray(orgs) || orgs.length === 0) {
      errors.push("Ingen virksomheter funnet i A07 data");
      return { rows, totals, errors };
    }

    for (const v of orgs) {
      const orgnr = String(v?.norskIdentifikator ?? "");
      const people = v?.inntektsmottaker ?? [];
      
      if (!Array.isArray(people)) {
        errors.push(`Ingen inntektsmottakere funnet for virksomhet ${orgnr}`);
        continue;
      }

      for (const p of people) {
        const ansattFnr = String(p?.norskIdentifikator ?? "");
        const navn = String(p?.identifiserendeInformasjon?.navn ?? "");
        const incomes = p?.inntekt ?? [];
        
        if (!Array.isArray(incomes)) {
          continue;
        }

        for (const inc of incomes) {
          try {
            const fordel = norm(inc?.fordel);
            const li = inc?.loennsinntekt ?? {};
            const beskrivelse = String(li?.beskrivelse ?? "");
            const antall = typeof li?.antall === "number" ? li.antall : undefined;
            const beloep = Number(inc?.beloep ?? 0) || 0;

            const row: A07Row = {
              orgnr,
              ansattFnr,
              navn,
              beskrivelse,
              fordel,
              beloep,
              antall,
              trekkpliktig: !!inc?.inngaarIGrunnlagForTrekk,
              aga: !!inc?.utloeserArbeidsgiveravgift,
              opptjStart: inc?.startdatoOpptjeningsperiode || undefined,
              opptjSlutt: inc?.sluttdatoOpptjeningsperiode || undefined,
            };

            rows.push(row);

            // Update totals per beskrivelse and internal code
            const mapping = codeMappings.find(m => norm(m.a07) === norm(beskrivelse));
            if (mapping) {
              totals[mapping.internal_code] = (totals[mapping.internal_code] || 0) + beloep;
            } else if (beskrivelse) {
              errors.push(`Ukjent A07-kode: ${beskrivelse}`);
            }
          } catch (error) {
            errors.push(`Feil ved parsing av inntekt for ${navn}: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
          }
        }
      }
    }
  } catch (error) {
    errors.push(`Kritisk feil ved parsing av A07 data: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
  }

  return { rows, totals, errors };
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