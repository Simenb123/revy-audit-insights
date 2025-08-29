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
        ['Totalt antall transaksjoner', analysisData.transactionStatistics.totalTransactions],
        ['Gjennomsnittlig beløp', analysisData.transactionStatistics.averageAmount],
        ['Median beløp', analysisData.transactionStatistics.medianAmount],
        ['Minimum beløp', analysisData.transactionStatistics.minAmount],
        ['Maksimum beløp', analysisData.transactionStatistics.maxAmount],
        ['Standardavvik', analysisData.transactionStatistics.standardDeviation],
        ['Q1 (25%)', analysisData.transactionStatistics.q1],
        ['Q3 (75%)', analysisData.transactionStatistics.q3],
        [''],
        ['Risikoindikatorer', analysisData.riskIndicators.length]
      ];

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Sammendrag');

      // Counter account distribution sheet
      const counterAccountData = [
        ['Kontonummer', 'Kontonavn', 'Antall transaksjoner', 'Totalt beløp', 'Prosentandel'],
        ...analysisData.counterAccountDistribution.map(item => [
          item.account_number,
          item.account_name,
          item.transaction_count,
          item.total_amount,
          `${item.percentage.toFixed(2)}%`
        ])
      ];

      const counterAccountWs = XLSX.utils.aoa_to_sheet(counterAccountData);
      XLSX.utils.book_append_sheet(wb, counterAccountWs, 'Motkontofordeling');

      // Risk indicators sheet
      if (analysisData.riskIndicators.length > 0) {
        const riskData = [
          ['Type', 'Kontonummer', 'Beskrivelse', 'Risikoscore'],
          ...analysisData.riskIndicators.map(risk => [
            risk.type,
            risk.account_number,
            risk.description,
            risk.risk_score
          ])
        ];

        const riskWs = XLSX.utils.aoa_to_sheet(riskData);
        XLSX.utils.book_append_sheet(wb, riskWs, 'Risikoindikatorer');
      }

      // Outliers sheet
      if (analysisData.transactionStatistics.outliers.length > 0) {
        const outliersData = [
          ['Kontonummer', 'Beløp', 'Dato', 'Beskrivelse'],
          ...analysisData.transactionStatistics.outliers.map(outlier => [
            outlier.account_number,
            outlier.amount,
            outlier.transaction_date,
            outlier.description
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
      const stats = analysisData.transactionStatistics;
      const summary = `
POPULASJONSANALYSE - ${clientName.toUpperCase()} (${fiscalYear})

NØKKELSTATISTIKK:
• Totalt antall transaksjoner: ${stats.totalTransactions.toLocaleString('nb-NO')}
• Gjennomsnittlig beløp: ${formatCurrency(stats.averageAmount)}
• Median beløp: ${formatCurrency(stats.medianAmount)}
• Spredning: ${formatCurrency(stats.minAmount)} - ${formatCurrency(stats.maxAmount)}
• Standardavvik: ${formatCurrency(stats.standardDeviation)}

MOTKONTOFORDELING (topp 5):
${analysisData.counterAccountDistribution.slice(0, 5).map(item => 
  `• ${item.account_number} ${item.account_name}: ${item.percentage.toFixed(1)}% (${formatCurrency(item.total_amount)})`
).join('\n')}

RISIKOINDIKATORER: ${analysisData.riskIndicators.length} identifisert
${analysisData.riskIndicators.slice(0, 3).map(risk => 
  `• ${risk.description} (${risk.account_number})`
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