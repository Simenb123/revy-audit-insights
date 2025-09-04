import * as XLSX from 'xlsx';

// Normalize Norwegian characters for comparison (ø→oe, å→aa, æ→ae)
export const norm = (s?: string): string => 
  (s ?? "").toLowerCase()
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/æ/g, 'ae');

export interface A07Row {
  orgnr: string;
  ansattFnr: string;
  navn: string;
  beskrivelse: string;     // A07-kode, eks 'fastloenn'
  fordel: string;          // 'kontantytelse' | 'naturalytelse' | 'utgiftsgodtgjoerelse'
  beloep: number;
  antall?: number;
  trekkpliktig: boolean;
  aga: boolean;
  opptjStart?: string;
  opptjSlutt?: string;
}

export interface A07ParseResult {
  rows: A07Row[];
  totals: Record<string, number>;
  errors: string[];
}

/**
 * Extract employee income rows from A07 JSON structure
 * Flattens nested structure: oppgave.virksomhet[].inntektsmottaker[].inntekt[]
 */
export function extractEmployeeIncomeRows(a07: any): A07ParseResult {
  const rows: A07Row[] = [];
  const totals: Record<string, number> = {};
  const errors: string[] = [];

  try {
    const orgs = a07?.mottatt?.oppgave?.virksomhet ?? [];
    
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
            // Normalize fordel for consistent comparison
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

            // Update totals per beskrivelse
            if (beskrivelse) {
              totals[beskrivelse] = (totals[beskrivelse] || 0) + beloep;
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
 * Validate A07 rows against control totals from summary data
 */
export function validateA07Totals(rows: A07Row[], a07: any): { isValid: boolean; discrepancies: string[] } {
  const discrepancies: string[] = [];
  
  try {
    // Get summary totals from oppsummerteVirksomheter
    const summaryIncomes = a07?.mottatt?.oppgave?.oppsummerteVirksomheter?.inntekt ?? [];
    const summaryTotals: Record<string, number> = {};
    
    for (const income of summaryIncomes) {
      const beskrivelse = String(income?.loennsinntekt?.beskrivelse ?? "");
      const beloep = Number(income?.beloep ?? 0) || 0;
      
      if (beskrivelse) {
        summaryTotals[beskrivelse] = (summaryTotals[beskrivelse] || 0) + beloep;
      }
    }

    // Calculate totals from extracted rows
    const extractedTotals: Record<string, number> = {};
    for (const row of rows) {
      if (row.beskrivelse) {
        extractedTotals[row.beskrivelse] = (extractedTotals[row.beskrivelse] || 0) + row.beloep;
      }
    }

    // Compare totals
    const allCodes = new Set([...Object.keys(summaryTotals), ...Object.keys(extractedTotals)]);
    
    for (const code of allCodes) {
      const summaryAmount = summaryTotals[code] || 0;
      const extractedAmount = extractedTotals[code] || 0;
      const difference = Math.abs(summaryAmount - extractedAmount);
      
      if (difference > 0.01) { // Allow for small rounding differences
        discrepancies.push(
          `${code}: Oppsummering ${summaryAmount.toFixed(2)} vs Uttrukket ${extractedAmount.toFixed(2)} (diff: ${difference.toFixed(2)})`
        );
      }
    }
  } catch (error) {
    discrepancies.push(`Feil ved validering av totaler: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
  }

  return {
    isValid: discrepancies.length === 0,
    discrepancies
  };
}

/**
 * Write A07 rows to Excel using proper structure (not JSON dump)
 */
export function writeA07RowsToXlsx(
  rows: A07Row[], 
  fileName = "A07-ansattlinjer.xlsx",
  validation?: { isValid: boolean; discrepancies: string[] }
): void {
  try {
    // Prepare data as array of arrays for better Excel compatibility
    const headers = [
      "Orgnr", "Ansatt FNR", "Navn", "Beskrivelse", "Fordel", 
      "Beløp", "Antall", "Trekkpliktig", "AGA", "Opptj. Start", "Opptj. Slutt"
    ];
    
    const data = rows.map(r => [
      r.orgnr, 
      r.ansattFnr, 
      r.navn, 
      r.beskrivelse, 
      r.fordel,
      r.beloep, 
      r.antall ?? "", 
      r.trekkpliktig ? "Ja" : "Nei", 
      r.aga ? "Ja" : "Nei", 
      r.opptjStart ?? "", 
      r.opptjSlutt ?? ""
    ]);
    
    const aoa = [headers, ...data];
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    
    // Auto-size columns
    const colWidths = headers.map((_, index) => {
      const maxLength = Math.max(
        headers[index].length,
        ...data.map(row => String(row[index] || "").length)
      );
      return { wch: Math.min(maxLength + 2, 50) }; // Cap at 50 characters
    });
    ws['!cols'] = colWidths;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "A07 Ansattlinjer");
    
    // Add validation sheet if there are discrepancies
    if (validation && validation.discrepancies.length > 0) {
      const validationHeaders = ["Beskrivelse", "Problem"];
      const validationData = validation.discrepancies.map(disc => [
        disc.split(":")[0],
        disc.split(":")[1]?.trim() || disc
      ]);
      
      const validationAoa = [validationHeaders, ...validationData];
      const validationWs = XLSX.utils.aoa_to_sheet(validationAoa);
      XLSX.utils.book_append_sheet(wb, validationWs, "Valideringsfeil");
    }
    
    // Save file
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    throw new Error(`Feil ved Excel-eksport: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
  }
}

/**
 * Create comprehensive A07 export with multiple sheets
 */
export function exportComprehensiveA07Data(
  rows: A07Row[],
  rawData: any,
  clientName: string,
  validation?: { isValid: boolean; discrepancies: string[] }
): void {
  try {
    const wb = XLSX.utils.book_new();
    
    // Main data sheet
    const headers = [
      "Orgnr", "Ansatt FNR", "Navn", "Beskrivelse", "Fordel", 
      "Beløp", "Antall", "Trekkpliktig", "AGA", "Opptj. Start", "Opptj. Slutt"
    ];
    
    const data = rows.map(r => [
      r.orgnr, r.ansattFnr, r.navn, r.beskrivelse, r.fordel,
      r.beloep, r.antall ?? "", 
      r.trekkpliktig ? "Ja" : "Nei", 
      r.aga ? "Ja" : "Nei", 
      r.opptjStart ?? "", r.opptjSlutt ?? ""
    ]);
    
    const mainAoa = [headers, ...data];
    const mainWs = XLSX.utils.aoa_to_sheet(mainAoa);
    XLSX.utils.book_append_sheet(wb, mainWs, "Ansattlinjer");
    
    // Summary by code
    const summaryData: Record<string, { count: number; total: number }> = {};
    rows.forEach(row => {
      if (!summaryData[row.beskrivelse]) {
        summaryData[row.beskrivelse] = { count: 0, total: 0 };
      }
      summaryData[row.beskrivelse].count++;
      summaryData[row.beskrivelse].total += row.beloep;
    });
    
    const summaryHeaders = ["A07 Kode", "Antall Linjer", "Total Beløp"];
    const summaryRows = Object.entries(summaryData)
      .sort(([,a], [,b]) => b.total - a.total)
      .map(([code, data]) => [code, data.count, data.total]);
    
    const summaryAoa = [summaryHeaders, ...summaryRows];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryAoa);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Sammendrag");
    
    // Validation sheet if needed
    if (validation && validation.discrepancies.length > 0) {
      const validationHeaders = ["Problem"];
      const validationRows = validation.discrepancies.map(disc => [disc]);
      const validationAoa = [validationHeaders, ...validationRows];
      const validationWs = XLSX.utils.aoa_to_sheet(validationAoa);
      XLSX.utils.book_append_sheet(wb, validationWs, "Valideringsfeil");
    }
    
    // Save with descriptive filename
    const fileName = `A07_Detaljert_${clientName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    throw new Error(`Feil ved omfattende Excel-eksport: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
  }
}