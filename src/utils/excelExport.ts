import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { ControlTestResult } from '@/services/controlTestSuite';
import type { RiskScoringResults } from '@/services/riskScoringService';

interface ExcelAnalysisData {
  basicAnalysis: any;
  controlTests: ControlTestResult[];
  riskScoring: RiskScoringResults;
  aiAnalysis?: any;
  metadata: {
    clientName?: string;
    periodStart?: string;
    periodEnd?: string;
    generatedAt: string;
    analysisSummary?: string;
  };
}

export class ExcelExportService {
  
  /**
   * Export comprehensive analysis to Excel workbook with multiple sheets
   */
  static async exportAnalysisToExcel(
    data: ExcelAnalysisData,
    filename: string = 'transaksjonsanalyse'
  ): Promise<void> {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Executive Summary
      this.addExecutiveSummarySheet(workbook, data);
      
      // Sheet 2: Control Tests
      this.addControlTestsSheet(workbook, data.controlTests);
      
      // Sheet 3: Risk Analysis
      this.addRiskAnalysisSheet(workbook, data.riskScoring);
      
      // Sheet 4: AI Insights (if available)
      if (data.aiAnalysis) {
        this.addAIInsightsSheet(workbook, data.aiAnalysis);
      }
      
      // Sheet 5: Transaction Statistics
      this.addTransactionStatsSheet(workbook, data.basicAnalysis);
      
      // Sheet 6: Raw Data
      this.addRawDataSheet(workbook, data);
      
      // Generate and download the file
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        compression: true 
      });
      
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const timestamp = new Date().toISOString().split('T')[0];
      saveAs(blob, `${filename}_${timestamp}.xlsx`);
      
    } catch (error) {
      console.error('Excel export failed:', error);
      throw new Error('Kunne ikke eksportere til Excel: ' + error.message);
    }
  }

  private static addExecutiveSummarySheet(workbook: XLSX.WorkBook, data: ExcelAnalysisData) {
    const summaryData = [
      ['TRANSAKSJONSANALYSE - SAMMENDRAG', ''],
      ['', ''],
      ['Rapport generert:', data.metadata.generatedAt],
      ['Klient:', data.metadata.clientName || 'Ikke spesifisert'],
      ['Periode:', `${data.metadata.periodStart || 'N/A'} - ${data.metadata.periodEnd || 'N/A'}`],
      ['', ''],
      ['HOVEDTALL', ''],
      ['Totalt antall transaksjoner:', data.basicAnalysis?.total_transactions || 0],
      ['Antall kontoer:', data.basicAnalysis?.account_distribution?.length || 0],
      ['Høyrisiko transaksjoner:', data.riskScoring?.highRiskTransactions?.length || 0],
      ['', ''],
      ['KONTROLLTESTER', ''],
      ['Totalt antall tester:', data.controlTests?.length || 0],
      ['Bestått tester:', data.controlTests?.filter(test => test.passed)?.length || 0],
      ['Feilede tester:', data.controlTests?.filter(test => !test.passed)?.length || 0],
      ['', ''],
      ['AI-ANALYSE', ''],
      ['AI-modell brukt:', data.aiAnalysis?.metadata?.modelUsed || 'Ikke utført'],
      ['Antall innsikter:', data.aiAnalysis?.insights?.length || 0],
      ['Anomalier funnet:', data.aiAnalysis?.summary?.anomaliesFound || 0],
      ['Overall AI-risikovurdering:', data.aiAnalysis?.summary?.overallRiskLevel || 'Ikke vurdert']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Style the header
    if (worksheet['A1']) {
      worksheet['A1'].s = {
        font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } }
      };
    }
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 },
      { wch: 20 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sammendrag');
  }

  private static addControlTestsSheet(workbook: XLSX.WorkBook, controlTests: ControlTestResult[]) {
    if (!controlTests || controlTests.length === 0) {
      const worksheet = XLSX.utils.aoa_to_sheet([['Ingen kontrolltester tilgjengelig']]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Kontrolltester');
      return;
    }

    const headers = [
      'Test navn',
      'Status',
      'Feilantall',
      'Alvorlighetsgrad',
      'Beskrivelse',
      'Detaljer'
    ];

    const rows = controlTests.map(test => [
      test.testName,
      test.passed ? 'BESTÅTT' : 'FEILET',
      test.errorCount,
      test.severity,
      test.description,
      Array.isArray(test.details) 
        ? test.details.map(d => typeof d === 'string' ? d : JSON.stringify(d)).join('; ')
        : String(test.details || '')
    ]);

    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Test navn
      { wch: 10 }, // Status
      { wch: 12 }, // Feilantall
      { wch: 15 }, // Alvorlighetsgrad
      { wch: 30 }, // Beskrivelse
      { wch: 50 }  // Detaljer
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kontrolltester');
  }

  private static addRiskAnalysisSheet(workbook: XLSX.WorkBook, riskScoring: RiskScoringResults) {
    if (!riskScoring) {
      const worksheet = XLSX.utils.aoa_to_sheet([['Ingen risikoanalyse tilgjengelig']]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Risikoanalyse');
      return;
    }

    const summaryData = [
      ['RISIKOANALYSE', ''],
      ['', ''],
      ['Totalt antall transaksjoner:', riskScoring.totalTransactions],
      ['Høyrisiko transaksjoner:', riskScoring.highRiskTransactions?.length || 0],
      ['Risikokategorier:', `${Object.keys(riskScoring.riskDistribution || {}).length} kategorier`],
      ['', ''],
      ['RISIKOFORDELING', ''],
      ['Lav risiko:', riskScoring.riskDistribution?.low || 0],
      ['Medium risiko:', riskScoring.riskDistribution?.medium || 0],
      ['Høy risiko:', riskScoring.riskDistribution?.high || 0],
      ['Kritisk risiko:', riskScoring.riskDistribution?.critical || 0],
      ['', '']
    ];

    // Add top risk factors if available
    if (riskScoring.topRiskFactors && riskScoring.topRiskFactors.length > 0) {
      summaryData.push(['TOPP RISIKOFAKTORER', '']);
      riskScoring.topRiskFactors.forEach(factorData => {
        summaryData.push([
          factorData.factor?.name || 'Ukjent risikofaktor',
          factorData.frequency || 0
        ]);
      });
      summaryData.push(['', '']);
    }

    // Add recommendations if available (assuming they exist in the future)
    const recommendations = (riskScoring as any).recommendations;
    if (recommendations && Array.isArray(recommendations) && recommendations.length > 0) {
      summaryData.push(['ANBEFALINGER', '']);
      recommendations.forEach((rec: string) => {
        summaryData.push([rec, '']);
      });
    }

    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 },
      { wch: 20 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Risikoanalyse');
  }

  private static addAIInsightsSheet(workbook: XLSX.WorkBook, aiAnalysis: any) {
    const headers = [
      'Type',
      'Alvorlighetsgrad',
      'Tittel',
      'Beskrivelse',
      'Anbefalt handling',
      'Konfidens',
      'Påvirkede transaksjoner'
    ];

    const rows = (aiAnalysis.insights || []).map((insight: any) => [
      insight.type,
      insight.severity,
      insight.title,
      insight.description,
      insight.recommendedAction,
      insight.confidence,
      Array.isArray(insight.affectedTransactions) 
        ? insight.affectedTransactions.join(', ') 
        : String(insight.affectedTransactions || '')
    ]);

    const summaryRows = [
      ['AI-ANALYSE SAMMENDRAG', ''],
      ['Modell brukt:', aiAnalysis.metadata?.modelUsed || 'Ikke spesifisert'],
      ['Prosesseringstid:', `${aiAnalysis.metadata?.processingTime || 0}ms`],
      ['Timestamp:', aiAnalysis.metadata?.timestamp || 'Ikke spesifisert'],
      ['Antall innsikter:', aiAnalysis.insights?.length || 0],
      ['Anomalier funnet:', aiAnalysis.summary?.anomaliesFound || 0],
      ['Overall risiko:', aiAnalysis.summary?.overallRiskLevel || 'Ikke vurdert'],
      ['', ''],
      ['HOVEDFUNN:', ''],
      ...(aiAnalysis.summary?.keyFindings || []).map((finding: string) => [finding, '']),
      ['', ''],
      ['DETALJERTE INNSIKTER:', ''],
      ['', '']
    ];

    const worksheetData = [...summaryRows, headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Type
      { wch: 15 }, // Alvorlighetsgrad
      { wch: 25 }, // Tittel
      { wch: 40 }, // Beskrivelse
      { wch: 30 }, // Anbefalt handling
      { wch: 10 }, // Konfidens
      { wch: 30 }  // Påvirkede transaksjoner
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AI-Innsikter');
  }

  private static addTransactionStatsSheet(workbook: XLSX.WorkBook, basicAnalysis: any) {
    if (!basicAnalysis) {
      const worksheet = XLSX.utils.aoa_to_sheet([['Ingen transaksjonsstatistikk tilgjengelig']]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksjonsstatistikk');
      return;
    }

    const statsData = [
      ['TRANSAKSJONSSTATISTIKK', ''],
      ['', ''],
      ['Totalt antall transaksjoner:', basicAnalysis.total_transactions || 0],
      ['Datoperiode start:', basicAnalysis.date_range?.start || 'N/A'],
      ['Datoperiode slutt:', basicAnalysis.date_range?.end || 'N/A'],
      ['', ''],
      ['BELØPSSTATISTIKK', ''],
      ['Totalt antall poster:', basicAnalysis.amount_statistics?.total_count || 0],
      ['Sum:', basicAnalysis.amount_statistics?.sum?.toLocaleString('no-NO') || 0],
      ['Gjennomsnitt:', basicAnalysis.amount_statistics?.average?.toLocaleString('no-NO') || 0],
      ['Minimum:', basicAnalysis.amount_statistics?.min?.toLocaleString('no-NO') || 0],
      ['Maksimum:', basicAnalysis.amount_statistics?.max?.toLocaleString('no-NO') || 0],
      ['Positive beløp:', basicAnalysis.amount_statistics?.positive_count || 0],
      ['Negative beløp:', basicAnalysis.amount_statistics?.negative_count || 0],
      ['', ''],
      ['KONTOFORDELING', ''],
      ['Konto', 'Antall transaksjoner']
    ];

    // Add account distribution
    if (basicAnalysis.account_distribution) {
      basicAnalysis.account_distribution.forEach((acc: any) => {
        statsData.push([acc.account, acc.count]);
      });
    }

    statsData.push(['', '']);
    statsData.push(['MÅNEDLIG SAMMENDRAG', '']);
    statsData.push(['Måned', 'Antall', 'Sum']);

    // Add monthly summary
    if (basicAnalysis.monthly_summary) {
      basicAnalysis.monthly_summary.forEach((month: any) => {
        statsData.push([
          month.month, 
          month.count, 
          month.sum?.toLocaleString('no-NO') || 0
        ]);
      });
    }

    const worksheet = XLSX.utils.aoa_to_sheet(statsData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 },
      { wch: 20 },
      { wch: 20 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksjonsstatistikk');
  }

  private static addRawDataSheet(workbook: XLSX.WorkBook, data: ExcelAnalysisData) {
    const rawData = [
      ['RAW DATA EXPORT', ''],
      ['', ''],
      ['Dette arket inneholder rådata for videre analyse', ''],
      ['Generert:', data.metadata.generatedAt],
      ['', ''],
      ['Basic Analysis Data:', ''],
      [JSON.stringify(data.basicAnalysis, null, 2)],
      ['', ''],
      ['Control Tests Data:', ''],
      [JSON.stringify(data.controlTests, null, 2)],
      ['', ''],
      ['Risk Scoring Data:', ''],
      [JSON.stringify(data.riskScoring, null, 2)],
      ['', ''],
      ['AI Analysis Data:', ''],
      [JSON.stringify(data.aiAnalysis, null, 2)]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rawData);
    
    // Set column width
    worksheet['!cols'] = [
      { wch: 100 },
      { wch: 20 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Raw Data');
  }

  /**
   * Export transaction data to Excel for detailed analysis
   */
  static async exportTransactionData(
    transactions: any[],
    filename: string = 'transaksjoner'
  ): Promise<void> {
    if (!transactions || transactions.length === 0) {
      throw new Error('Ingen transaksjonsdata å eksportere');
    }

    try {
      const headers = [
        'ID',
        'Dato', 
        'Kontonummer',
        'Kontonavn',
        'Beskrivelse',
        'Debet',
        'Kredit',
        'Saldo',
        'Bilagsnummer',
        'Referanse',
        'Analyseområde'
      ];

      const rows = transactions.map(tx => [
        tx.id,
        tx.transaction_date,
        tx.client_chart_of_accounts?.account_number || '',
        tx.client_chart_of_accounts?.account_name || '',
        tx.description || '',
        tx.debit_amount || '',
        tx.credit_amount || '',
        tx.balance_amount || '',
        tx.voucher_number || '',
        tx.reference_number || '',
        tx.client_chart_of_accounts?.account_mappings?.[0]?.standard_accounts?.analysis_group || ''
      ]);

      const worksheetData = [headers, ...rows];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 15 }, // ID
        { wch: 12 }, // Dato
        { wch: 15 }, // Kontonummer
        { wch: 25 }, // Kontonavn
        { wch: 40 }, // Beskrivelse
        { wch: 15 }, // Debet
        { wch: 15 }, // Kredit
        { wch: 15 }, // Saldo
        { wch: 15 }, // Bilagsnummer
        { wch: 15 }, // Referanse
        { wch: 15 }  // Analyseområde
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksjoner');
      
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        compression: true 
      });
      
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const timestamp = new Date().toISOString().split('T')[0];
      saveAs(blob, `${filename}_${timestamp}.xlsx`);
      
    } catch (error) {
      console.error('Excel transaction export failed:', error);
      throw new Error('Kunne ikke eksportere transaksjoner til Excel: ' + error.message);
    }
  }
}

// Convenience functions for easier importing
export async function exportAnalysisToExcel(data: {
  clientName?: string;
  reportDate: string;
  fiscalYear: string;
  basicAnalysis: any;
  controlTests: any[];
  riskScoring: any;
  aiAnalysis?: any;
}): Promise<void> {
  const excelData: ExcelAnalysisData = {
    basicAnalysis: data.basicAnalysis,
    controlTests: data.controlTests,
    riskScoring: data.riskScoring,
    aiAnalysis: data.aiAnalysis,
    metadata: {
      clientName: data.clientName,
      periodStart: data.basicAnalysis?.date_range?.start,
      periodEnd: data.basicAnalysis?.date_range?.end,
      generatedAt: new Date().toLocaleString('nb-NO'),
      analysisSummary: `Analyse for ${data.clientName || 'klient'} - ${data.fiscalYear}`
    }
  };

  return ExcelExportService.exportAnalysisToExcel(excelData, `${data.clientName || 'analyse'}_${data.fiscalYear}`);
}

export async function exportTransactionsToExcel(
  transactions: any[], 
  filename: string = 'transaksjoner'
): Promise<void> {
  return ExcelExportService.exportTransactionData(transactions, filename);
}