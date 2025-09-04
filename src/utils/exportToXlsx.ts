import * as XLSX from 'xlsx';

export function exportArrayToXlsx(filename: string, records: any[]) {
  const safeName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  const ws = XLSX.utils.json_to_sheet(records);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, safeName);
}

export function exportMultiSheetA07Data(clientName: string, data: {
  monthlyData: any[];
  paymentData: any[];
  incomeData: any[];
  submissionData: any[];
  employeeData: any[];
}) {
  const wb = XLSX.utils.book_new();
  
  // Monthly Overview Sheet
  if (data.monthlyData.length > 0) {
    const monthlyWs = XLSX.utils.json_to_sheet(data.monthlyData);
    
    // Add totals row for monthly data
    const totalRow = {
      'Import ID': 'TOTALT',
      'Periode': '',
      'År': '',
      'Måned': '',
      'Antall ansatte': data.monthlyData.reduce((sum, row) => sum + (row['Antall ansatte'] || 0), 0),
      'Arbeidsgiveravgift': data.monthlyData.reduce((sum, row) => sum + (row['Arbeidsgiveravgift'] || 0), 0),
      'Forskuddstrekk': data.monthlyData.reduce((sum, row) => sum + (row['Forskuddstrekk'] || 0), 0),
      'Finansskatt lønn': data.monthlyData.reduce((sum, row) => sum + (row['Finansskatt lønn'] || 0), 0),
      'Opprettet': ''
    };
    
    const monthlyDataWithTotal = [...data.monthlyData, totalRow];
    const monthlyWsWithTotal = XLSX.utils.json_to_sheet(monthlyDataWithTotal);
    XLSX.utils.book_append_sheet(wb, monthlyWsWithTotal, 'Månedsoversikt');
  }
  
  // Payment Information Sheet
  if (data.paymentData.length > 0) {
    const paymentWs = XLSX.utils.json_to_sheet(data.paymentData);
    XLSX.utils.book_append_sheet(wb, paymentWs, 'Betalingsinformasjon');
  }
  
  // Income Analysis Sheet
  if (data.incomeData.length > 0) {
    // Group income data by type and calculate totals
    const incomeByType = data.incomeData.reduce((acc, item) => {
      const key = item['Inntektstype'];
      if (!acc[key]) {
        acc[key] = {
          'Inntektstype': key,
          'Beskrivelse': item['Beskrivelse'],
          'Total beløp': 0,
          'Ytelsestype': item['Ytelsestype'],
          'AGA-pliktig': item['AGA-pliktig'],
          'Trekkpliktig': item['Trekkpliktig']
        };
      }
      acc[key]['Total beløp'] += item['Beløp'] || 0;
      return acc;
    }, {});
    
    const incomeAnalysisData = Object.values(incomeByType).sort((a: any, b: any) => b['Total beløp'] - a['Total beløp']);
    
    // Add total row
    const totalIncome = incomeAnalysisData.reduce((sum: number, row: any) => sum + (row['Total beløp'] || 0), 0);
    incomeAnalysisData.push({
      'Inntektstype': 'TOTALT',
      'Beskrivelse': '',
      'Total beløp': totalIncome,
      'Ytelsestype': '',
      'AGA-pliktig': '',
      'Trekkpliktig': ''
    });
    
    const incomeWs = XLSX.utils.json_to_sheet(incomeAnalysisData);
    XLSX.utils.book_append_sheet(wb, incomeWs, 'Inntektsanalyse');
  }
  
  // Submission Details Sheet
  if (data.submissionData.length > 0) {
    const submissionWs = XLSX.utils.json_to_sheet(data.submissionData);
    XLSX.utils.book_append_sheet(wb, submissionWs, 'Innsendingsdetaljer');
  }
  
  // Employee Details Sheet
  if (data.employeeData.length > 0) {
    const employeeWs = XLSX.utils.json_to_sheet(data.employeeData);
    XLSX.utils.book_append_sheet(wb, employeeWs, 'Ansattdetaljer');
  }
  
  // Save the file
  const filename = `A07_Komplett_${clientName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportEnhancedA07Data(clientName: string, data: {
  a07DetailedRows: any[];
  monthlyData: any[];
  paymentData: any[];
  incomeData: any[];
  submissionData: any[];
  validationErrors: string[];
}) {
  const wb = XLSX.utils.book_new();
  
  // Main A07 Detailed Rows Sheet (This is the key improvement!)
  if (data.a07DetailedRows.length > 0) {
    const a07Ws = XLSX.utils.json_to_sheet(data.a07DetailedRows);
    
    // Auto-size columns for better readability
    const columnWidths = [
      { wch: 15 }, // Import ID
      { wch: 20 }, // Periode
      { wch: 12 }, // Orgnr
      { wch: 15 }, // Ansatt FNR
      { wch: 25 }, // Navn
      { wch: 20 }, // Beskrivelse
      { wch: 15 }, // Fordel
      { wch: 12 }, // Beløp
      { wch: 8 },  // Antall
      { wch: 12 }, // Trekkpliktig
      { wch: 8 },  // AGA
      { wch: 12 }, // Opptj Start
      { wch: 12 }  // Opptj Slutt
    ];
    a07Ws['!cols'] = columnWidths;
    
    XLSX.utils.book_append_sheet(wb, a07Ws, 'A07 Detaljerte Linjer');
    
    // Create summary by A07 code
    const summaryByCode: Record<string, { count: number; total: number; trekkpliktig: number; aga: number }> = {};
    
    data.a07DetailedRows.forEach(row => {
      const code = row['Beskrivelse'];
      if (!summaryByCode[code]) {
        summaryByCode[code] = { count: 0, total: 0, trekkpliktig: 0, aga: 0 };
      }
      summaryByCode[code].count++;
      summaryByCode[code].total += Number(row['Beløp']) || 0;
      if (row['Trekkpliktig'] === 'Ja') summaryByCode[code].trekkpliktig++;
      if (row['AGA'] === 'Ja') summaryByCode[code].aga++;
    });
    
    const summaryData = Object.entries(summaryByCode)
      .sort(([,a], [,b]) => b.total - a.total)
      .map(([code, stats]) => ({
        'A07 Kode': code,
        'Antall Linjer': stats.count,
        'Total Beløp': stats.total,
        'Trekkpliktige': stats.trekkpliktig,
        'AGA-pliktige': stats.aga,
        'Gjennomsnitt per linje': stats.count > 0 ? Math.round(stats.total / stats.count) : 0
      }));
    
    // Add totals row to summary
    const totalStats = Object.values(summaryByCode).reduce(
      (acc, curr) => ({
        count: acc.count + curr.count,
        total: acc.total + curr.total,
        trekkpliktig: acc.trekkpliktig + curr.trekkpliktig,
        aga: acc.aga + curr.aga
      }),
      { count: 0, total: 0, trekkpliktig: 0, aga: 0 }
    );
    
    summaryData.push({
      'A07 Kode': 'TOTALT',
      'Antall Linjer': totalStats.count,
      'Total Beløp': totalStats.total,
      'Trekkpliktige': totalStats.trekkpliktig,
      'AGA-pliktige': totalStats.aga,
      'Gjennomsnitt per linje': totalStats.count > 0 ? Math.round(totalStats.total / totalStats.count) : 0
    });
    
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'A07 Sammendrag');
  }
  
  // Monthly Overview Sheet
  if (data.monthlyData.length > 0) {
    const monthlyWs = XLSX.utils.json_to_sheet(data.monthlyData);
    XLSX.utils.book_append_sheet(wb, monthlyWs, 'Månedsoversikt');
  }
  
  // Payment Information Sheet
  if (data.paymentData.length > 0) {
    const paymentWs = XLSX.utils.json_to_sheet(data.paymentData);
    XLSX.utils.book_append_sheet(wb, paymentWs, 'Betalingsinformasjon');
  }
  
  // Income Analysis Sheet
  if (data.incomeData.length > 0) {
    const incomeWs = XLSX.utils.json_to_sheet(data.incomeData);
    XLSX.utils.book_append_sheet(wb, incomeWs, 'Inntektsanalyse');
  }
  
  // Submission Details Sheet
  if (data.submissionData.length > 0) {
    const submissionWs = XLSX.utils.json_to_sheet(data.submissionData);
    XLSX.utils.book_append_sheet(wb, submissionWs, 'Innsendingsdetaljer');
  }
  
  // Validation Errors Sheet
  if (data.validationErrors.length > 0) {
    const errorData = data.validationErrors.map((error, index) => ({
      'Feil Nr': index + 1,
      'Beskrivelse': error
    }));
    
    const errorWs = XLSX.utils.json_to_sheet(errorData);
    XLSX.utils.book_append_sheet(wb, errorWs, 'Valideringsfeil');
  }
  
  // Save the file
  const filename = `A07_Forbedret_${clientName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
