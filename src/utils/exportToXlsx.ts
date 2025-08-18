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
