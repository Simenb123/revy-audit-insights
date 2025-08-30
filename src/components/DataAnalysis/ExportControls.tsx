import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Copy, FileSpreadsheet, FileText } from 'lucide-react';
import { PopulationAnalysisData } from '@/hooks/usePopulationAnalysis';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ExportControlsProps {
  analysisData: PopulationAnalysisData;
  clientName?: string;
  fiscalYear: number;
}

const ExportControls: React.FC<ExportControlsProps> = ({
  analysisData,
  clientName = 'Klient',
  fiscalYear
}) => {
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Populasjonsanalyse', `${clientName} - ${fiscalYear}`],
        [''],
        ['Nøkkelstatistikk', ''],
        ['Totalt antall kontoer', analysisData.basicStatistics.totalAccounts],
        ['Kontoer med saldo', analysisData.basicStatistics.accountsWithBalance],
        ['Total sum', analysisData.basicStatistics.totalSum],
        ['Gjennomsnittlig saldo', analysisData.basicStatistics.averageBalance],
        ['Median saldo', analysisData.basicStatistics.medianBalance],
        ['Minimum saldo', analysisData.basicStatistics.minBalance],
        ['Maksimum saldo', analysisData.basicStatistics.maxBalance],
        ['Standardavvik', analysisData.basicStatistics.stdDev],
        ['Q1 (25%)', analysisData.basicStatistics.q1],
        ['Q3 (75%)', analysisData.basicStatistics.q3],
        [''],
        ['Anomalier', analysisData.anomalyDetection.anomalies.length]
      ];

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Sammendrag');

      // Counter account distribution sheet
      const counterAccountData = [
        ['Kontonummer', 'Kontonavn', 'Antall transaksjoner', 'Totalt beløp', 'Prosentandel'],
        ...analysisData.counterAccountAnalysis.map((item) => [
          item.counterAccount,
          item.counterAccountName,
          item.transactionCount,
          item.totalAmount,
          `${item.percentage.toFixed(2)}%`
        ])
      ];

      const counterAccountWs = XLSX.utils.aoa_to_sheet(counterAccountData);
      XLSX.utils.book_append_sheet(wb, counterAccountWs, 'Motkontofordeling');

      // Anomalies sheet
      if (analysisData.anomalyDetection.anomalies.length > 0) {
        const anomaliesData = [
          ['Type', 'Kontonummer', 'Beskrivelse', 'Alvorlighetsgrad'],
          ...analysisData.anomalyDetection.anomalies.map((anomaly) => [
            anomaly.anomalyType,
            anomaly.accountNumber,
            anomaly.description,
            anomaly.severity
          ])
        ];

        const anomaliesWs = XLSX.utils.aoa_to_sheet(anomaliesData);
        XLSX.utils.book_append_sheet(wb, anomaliesWs, 'Anomalier');
      }

      // Outliers sheet
      if (analysisData.outlierDetection.outliers.length > 0) {
        const outliersData = [
          ['Kontonummer', 'Kontonavn', 'Saldo', 'Type avvik'],
          ...analysisData.outlierDetection.outliers.map((outlier) => [
            outlier.accountNumber,
            outlier.accountName,
            outlier.closingBalance,
            outlier.outlierType
          ])
        ];

        const outliersWs = XLSX.utils.aoa_to_sheet(outliersData);
        XLSX.utils.book_append_sheet(wb, outliersWs, 'Avvikere');
      }

      // Save file
      const fileName = `Populasjonsanalyse_${clientName}_${fiscalYear}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Excel-eksport fullført",
        description: `Filen "${fileName}" er lastet ned.`
      });
    } catch (error) {
      toast({
        title: "Feil ved eksport",
        description: "Kunne ikke eksportere til Excel.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      const stats = analysisData.basicStatistics;
      const summary = `
POPULASJONSANALYSE - ${clientName.toUpperCase()} (${fiscalYear})

NØKKELSTATISTIKK:
• Totalt antall kontoer: ${stats.totalAccounts.toLocaleString('nb-NO')}
• Kontoer med saldo: ${stats.accountsWithBalance.toLocaleString('nb-NO')}
• Total sum: ${formatCurrency(stats.totalSum)}
• Gjennomsnittlig saldo: ${formatCurrency(stats.averageBalance)}
• Median saldo: ${formatCurrency(stats.medianBalance)}
• Spredning: ${formatCurrency(stats.minBalance)} - ${formatCurrency(stats.maxBalance)}
• Standardavvik: ${formatCurrency(stats.stdDev)}

MOTKONTOFORDELING (topp 5):
${analysisData.counterAccountAnalysis.slice(0, 5).map((item) => 
  `• ${item.counterAccount} ${item.counterAccountName}: ${item.percentage.toFixed(1)}% (${formatCurrency(item.totalAmount)})`
).join('\n')}

ANOMALIER: ${analysisData.anomalyDetection.anomalies.length} identifisert
${analysisData.anomalyDetection.anomalies.slice(0, 3).map((anomaly) => 
  `• ${anomaly.description} (${anomaly.accountNumber})`
).join('\n')}
      `.trim();

      await navigator.clipboard.writeText(summary);
      
      toast({
        title: "Kopiert til utklippstavle",
        description: "Sammendrag av populasjonsanalyse er kopiert."
      });
    } catch (error) {
      toast({
        title: "Feil ved kopiering",
        description: "Kunne ikke kopiere til utklippstavle.",
        variant: "destructive"
      });
    }
  };

  const generatePDFReport = () => {
    // This would typically use a PDF generation library like jsPDF
    // For now, we'll show a toast indicating the feature is coming
    toast({
      title: "PDF-rapport",
      description: "PDF-eksport er under utvikling og vil være tilgjengelig snart.",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Eksporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel-rapport
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
          <Copy className="h-4 w-4 mr-2" />
          Kopier sammendrag
        </DropdownMenuItem>
        <DropdownMenuItem onClick={generatePDFReport} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2" />
          PDF-rapport
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportControls;