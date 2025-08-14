import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Widget, WidgetLayout } from '@/contexts/WidgetManagerContext';
import type { ReportData } from '@/services/reportGenerationService';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ExportMetadata {
  scope: string;
  fiscalYear: number;
  clientCount: number;
  exportDate: string;
  totalWidgets: number;
}

export interface AnalysisExportData {
  reportData: ReportData;
  analysisType: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export async function exportReportToPDF(widgets: Widget[], layouts: WidgetLayout[], metadata: ExportMetadata) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Revisjon Analyse Rapport', 20, 30);
  
  doc.setFontSize(12);
  doc.text(`Rapportdato: ${metadata.exportDate}`, 20, 50);
  doc.text(`Regnskapsår: ${metadata.fiscalYear}`, 20, 60);
  doc.text(`Omfang: ${metadata.scope}`, 20, 70);
  
  // Widgets table
  const widgetData = widgets.map(w => [w.title, w.type, 'Aktiv']);
  
  doc.autoTable({
    head: [['Widget', 'Type', 'Status']],
    body: widgetData,
    startY: 90,
    theme: 'grid',
    headStyles: { fillColor: [66, 66, 66] },
  });
  
  // Save PDF
  const fileName = `widget-rapport-${metadata.fiscalYear}-${Date.now()}.pdf`;
  doc.save(fileName);
}

export async function exportAnalysisReportToPDF(data: AnalysisExportData) {
  const { reportData, analysisType, dateRange } = data;
  const doc = new jsPDF();
  
  // Header with company logo area
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('REVISJONSRAPPORT', 20, 25);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Transaksjonanalyse og Risikoevaluering', 20, 35);
  
  // Client information
  doc.setFontSize(12);
  doc.text(`Klient: ${reportData.clientName}`, 20, 55);
  doc.text(`Rapportdato: ${reportData.reportDate}`, 20, 65);
  doc.text(`Regnskapsår: ${reportData.fiscalYear}`, 20, 75);
  doc.text(`Analyseperiode: ${dateRange.start} - ${dateRange.end}`, 20, 85);
  
  let currentY = 105;
  
  // Executive Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SAMMENDRAG', 20, currentY);
  currentY += 15;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (reportData.basicAnalysis) {
    const summary = [
      ['Totale transaksjoner', reportData.basicAnalysis.total_transactions?.toLocaleString() || '0'],
      ['Dataperiode', `${reportData.basicAnalysis.date_range?.start || 'N/A'} - ${reportData.basicAnalysis.date_range?.end || 'N/A'}`],
      ['Antall kontoer', reportData.basicAnalysis.account_distribution?.length?.toString() || '0'],
      ['Gjennomsnittlig beløp', reportData.basicAnalysis.amount_statistics?.average?.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' }) || 'N/A']
    ];
    
    doc.autoTable({
      body: summary,
      startY: currentY,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 100 }
      }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // Control Tests Results
  if (reportData.controlTests && reportData.controlTests.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('KONTROLLTESTER', 20, currentY);
    currentY += 15;
    
    const controlTestData = reportData.controlTests.map((test: any) => [
      test.name || 'Ukjent test',
      test.result || 'N/A',
      test.severity || 'N/A',
      test.description || ''
    ]);
    
    doc.autoTable({
      head: [['Test', 'Resultat', 'Alvorlighet', 'Beskrivelse']],
      body: controlTestData,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
      styles: { fontSize: 9 },
      columnStyles: {
        1: { 
          cellWidth: 25,
          halign: 'center'
        },
        2: { 
          cellWidth: 25,
          halign: 'center'
        },
        3: { cellWidth: 80 }
      }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // Risk Scoring
  if (reportData.riskScoring) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RISIKOSKÅRING', 20, currentY);
    currentY += 15;
    
    const total = reportData.riskScoring.totalTransactions || 0;
    const highRisk = reportData.riskScoring.riskDistribution?.high || 0;
    const critical = reportData.riskScoring.riskDistribution?.critical || 0;
    const overallRiskPercentage = total > 0 ? ((highRisk + critical) / total * 100) : 0;
    const riskLevel = overallRiskPercentage > 15 ? 'HØY' : overallRiskPercentage > 5 ? 'MEDIUM' : 'LAV';
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Totale transaksjoner: ${total.toLocaleString()}`, 20, currentY);
    currentY += 8;
    doc.text(`Høyrisiko transaksjoner: ${(highRisk + critical).toLocaleString()} (${overallRiskPercentage.toFixed(1)}%)`, 20, currentY);
    currentY += 8;
    doc.text(`Risikonivå: ${riskLevel}`, 20, currentY);
    currentY += 15;
    
    // Risk distribution table
    const riskDistData = [
      ['Lav risiko', reportData.riskScoring.riskDistribution?.low?.toLocaleString() || '0'],
      ['Medium risiko', reportData.riskScoring.riskDistribution?.medium?.toLocaleString() || '0'],
      ['Høy risiko', reportData.riskScoring.riskDistribution?.high?.toLocaleString() || '0'],
      ['Kritisk risiko', reportData.riskScoring.riskDistribution?.critical?.toLocaleString() || '0']
    ];
    
    doc.autoTable({
      head: [['Risikonivå', 'Antall transaksjoner']],
      body: riskDistData,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 50, halign: 'right' }
      }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // High risk transactions table
    if (reportData.riskScoring.highRiskTransactions && reportData.riskScoring.highRiskTransactions.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Høyrisiko transaksjoner (topp 10):', 20, currentY);
      currentY += 10;
      
      const highRiskTransactions = reportData.riskScoring.highRiskTransactions
        .slice(0, 10) // Limit to top 10
        .map((t: any) => [
          t.transactionId || 'N/A',
          (t.riskScore * 100).toFixed(1) + '%',
          t.amount?.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' }) || 'N/A',
          t.riskFactors?.join(', ') || 'N/A'
        ]);
      
      doc.autoTable({
        head: [['Transaksjon ID', 'Risikoskåre', 'Beløp', 'Risikofaktorer']],
        body: highRiskTransactions,
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] },
        styles: { fontSize: 8 },
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
    }
  }
  
  // Add new page if needed
  if (currentY > 250) {
    doc.addPage();
    currentY = 30;
  }
  
  // AI Analysis and Recommendations
  if (reportData.aiAnalysis) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AI-ANALYSE OG ANBEFALINGER', 20, currentY);
    currentY += 15;
    
    if (reportData.aiAnalysis.key_findings && reportData.aiAnalysis.key_findings.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Hovedfunn:', 20, currentY);
      currentY += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      reportData.aiAnalysis.key_findings.forEach((finding: string, index: number) => {
        const lines = doc.splitTextToSize(`• ${finding}`, 170);
        doc.text(lines, 25, currentY);
        currentY += lines.length * 5 + 3;
      });
      
      currentY += 10;
    }
    
    if (reportData.aiAnalysis.recommendations && reportData.aiAnalysis.recommendations.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Anbefalinger:', 20, currentY);
      currentY += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      reportData.aiAnalysis.recommendations.forEach((rec: any, index: number) => {
        const text = typeof rec === 'string' ? rec : rec.recommendation || rec.description || 'Anbefaling uten beskrivelse';
        const lines = doc.splitTextToSize(`${index + 1}. ${text}`, 170);
        doc.text(lines, 25, currentY);
        currentY += lines.length * 5 + 3;
      });
    }
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Side ${i} av ${pageCount}`, 20, 285);
    doc.text(`Generert: ${new Date().toLocaleString('nb-NO')}`, 120, 285);
  }
  
  // Save PDF
  const fileName = `analyse-rapport-${reportData.clientName}-${reportData.fiscalYear}-${Date.now()}.pdf`;
  doc.save(fileName);
}