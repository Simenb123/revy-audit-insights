import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from '@/integrations/supabase/client';
import { FileSpreadsheet, FileText, Download, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ReportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiResults: any;
  clientId: string;
  clientName?: string;
  versionId?: string;
}

interface ExportOptions {
  includeTransactions: boolean;
  includeInsights: boolean;
  includeRecommendations: boolean;
  includeRiskFactors: boolean;
  includeAnomalies: boolean;
  maxTransactions: number;
}

export const ReportExportDialog: React.FC<ReportExportDialogProps> = ({
  open,
  onOpenChange,
  aiResults,
  clientId,
  clientName = 'Ukjent klient',
  versionId
}) => {
  const [exporting, setExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeTransactions: true,
    includeInsights: true,
    includeRecommendations: true,
    includeRiskFactors: true,
    includeAnomalies: true,
    maxTransactions: 1000
  });

  const generateFileName = (format: 'excel' | 'pdf') => {
    const date = new Date().toISOString().split('T')[0];
    const extension = format === 'excel' ? 'xlsx' : 'pdf';
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
    return `AI_Analyse_${sanitizedClientName}_${date}.${extension}`;
  };

  const fetchTransactionData = async () => {
    if (!exportOptions.includeTransactions) return [];

    try {
      let query = supabase
        .from('general_ledger_transactions')
        .select(`
          transaction_date,
          description,
          debit_amount,
          credit_amount,
          voucher_number,
          reference,
          client_chart_of_accounts!inner(
            account_number,
            account_name,
            account_type
          )
        `)
        .eq('client_id', clientId);

      if (versionId) {
        query = query.eq('version_id', versionId);
      }

      const { data, error } = await query
        .order('transaction_date', { ascending: false })
        .limit(exportOptions.maxTransactions);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      return [];
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const workbook = XLSX.utils.book_new();

      // Sammendrag-ark
      const summaryData = [
        ['AI Transaksjonsanalyse Rapport'],
        [''],
        ['Klient:', clientName],
        ['Dato:', new Date().toLocaleDateString('no-NO')],
        ['Dataversjon:', versionId || 'Siste versjon'],
        [''],
        ['Analyseoversikt:'],
        ['Total transaksjoner:', aiResults?.summary?.total_transactions || 0],
        ['Innsikter funnet:', aiResults?.insights?.length || 0],
        ['Anbefalinger gitt:', aiResults?.recommendations?.length || 0],
        ['Risikoer identifisert:', aiResults?.risk_factors?.length || 0],
        ['Avvik oppdaget:', aiResults?.anomalies?.length || 0],
      ];

      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWS, 'Sammendrag');

      // Innsikter-ark
      if (exportOptions.includeInsights && aiResults?.insights?.length > 0) {
        const insightsData = [
          ['Kategori', 'Observasjon', 'Betydning'],
          ...aiResults.insights.map((insight: any) => [
            insight.category,
            insight.observation,
            insight.significance
          ])
        ];
        const insightsWS = XLSX.utils.aoa_to_sheet(insightsData);
        XLSX.utils.book_append_sheet(workbook, insightsWS, 'Innsikter');
      }

      // Anbefalinger-ark
      if (exportOptions.includeRecommendations && aiResults?.recommendations?.length > 0) {
        const recommendationsData = [
          ['Område', 'Anbefaling', 'Prioritet', 'Begrunnelse'],
          ...aiResults.recommendations.map((rec: any) => [
            rec.area,
            rec.recommendation,
            rec.priority,
            rec.reasoning || ''
          ])
        ];
        const recommendationsWS = XLSX.utils.aoa_to_sheet(recommendationsData);
        XLSX.utils.book_append_sheet(workbook, recommendationsWS, 'Anbefalinger');
      }

      // Risikoer-ark
      if (exportOptions.includeRiskFactors && aiResults?.risk_factors?.length > 0) {
        const riskData = [
          ['Risiko', 'Beskrivelse', 'Sannsynlighet', 'Påvirkning'],
          ...aiResults.risk_factors.map((risk: any) => [
            risk.risk,
            risk.description,
            risk.likelihood,
            risk.impact
          ])
        ];
        const riskWS = XLSX.utils.aoa_to_sheet(riskData);
        XLSX.utils.book_append_sheet(workbook, riskWS, 'Risikoer');
      }

      // Avvik-ark
      if (exportOptions.includeAnomalies && aiResults?.anomalies?.length > 0) {
        const anomaliesData = [
          ['Dato', 'Beskrivelse', 'Beløp', 'Årsak', 'Alvorlighet'],
          ...aiResults.anomalies.map((anomaly: any) => [
            anomaly.transaction_date,
            anomaly.description,
            anomaly.amount,
            anomaly.reason,
            anomaly.severity
          ])
        ];
        const anomaliesWS = XLSX.utils.aoa_to_sheet(anomaliesData);
        XLSX.utils.book_append_sheet(workbook, anomaliesWS, 'Avvik');
      }

      // Transaksjoner-ark
      if (exportOptions.includeTransactions) {
        const transactions = await fetchTransactionData();
        if (transactions.length > 0) {
          const transactionData = [
            ['Dato', 'Beskrivelse', 'Kontonr', 'Kontonavn', 'Debet', 'Kredit', 'Bilag', 'Referanse'],
            ...transactions.map((t: any) => [
              t.transaction_date,
              t.description,
              t.client_chart_of_accounts?.account_number,
              t.client_chart_of_accounts?.account_name,
              t.debit_amount || 0,
              t.credit_amount || 0,
              t.voucher_number || '',
              t.reference || ''
            ])
          ];
          const transactionWS = XLSX.utils.aoa_to_sheet(transactionData);
          XLSX.utils.book_append_sheet(workbook, transactionWS, 'Transaksjoner');
        }
      }

      // Last ned fil
      const fileName = generateFileName('excel');
      XLSX.writeFile(workbook, fileName);
      toast.success('Excel-rapport eksportert');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Feil ved Excel-eksport');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('AI Transaksjonsanalyse Rapport', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Klient: ${clientName}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Dato: ${new Date().toLocaleDateString('no-NO')}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Dataversjon: ${versionId || 'Siste versjon'}`, 20, yPosition);
      yPosition += 15;

      // Sammendrag
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Sammendrag', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const summaryItems = [
        `Total transaksjoner: ${aiResults?.summary?.total_transactions || 0}`,
        `Innsikter funnet: ${aiResults?.insights?.length || 0}`,
        `Anbefalinger gitt: ${aiResults?.recommendations?.length || 0}`,
        `Risikoer identifisert: ${aiResults?.risk_factors?.length || 0}`,
        `Avvik oppdaget: ${aiResults?.anomalies?.length || 0}`
      ];

      summaryItems.forEach(item => {
        doc.text(item, 25, yPosition);
        yPosition += 6;
      });
      yPosition += 10;

      // Innsikter
      if (exportOptions.includeInsights && aiResults?.insights?.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Innsikter', 20, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        aiResults.insights.slice(0, 10).forEach((insight: any, index: number) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}. ${insight.category} (${insight.significance})`, 25, yPosition);
          yPosition += 6;
          
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(insight.observation, 160);
          doc.text(lines, 30, yPosition);
          yPosition += lines.length * 5 + 3;
        });
      }

      // Anbefalinger
      if (exportOptions.includeRecommendations && aiResults?.recommendations?.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Anbefalinger', 20, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        aiResults.recommendations.slice(0, 10).forEach((rec: any, index: number) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}. ${rec.area} (${rec.priority})`, 25, yPosition);
          yPosition += 6;
          
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(rec.recommendation, 160);
          doc.text(lines, 30, yPosition);
          yPosition += lines.length * 5 + 3;
        });
      }

      // Avvik
      if (exportOptions.includeAnomalies && aiResults?.anomalies?.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Kritiske avvik', 20, yPosition);
        yPosition += 10;

        const anomaliesTableData = aiResults.anomalies.slice(0, 20).map((anomaly: any) => [
          anomaly.transaction_date,
          anomaly.description.substring(0, 30) + '...',
          `${anomaly.amount?.toLocaleString() || 0} NOK`,
          anomaly.severity
        ]);

        (doc as any).autoTable({
          head: [['Dato', 'Beskrivelse', 'Beløp', 'Alvorlighet']],
          body: anomaliesTableData,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 66, 66] }
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Side ${i} av ${pageCount}`, 20, 290);
        doc.text(`Generert: ${new Date().toLocaleString('no-NO')}`, 120, 290);
      }

      // Last ned fil
      const fileName = generateFileName('pdf');
      doc.save(fileName);
      toast.success('PDF-rapport eksportert');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Feil ved PDF-eksport');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Eksporter AI-analyse rapport
          </DialogTitle>
          <DialogDescription>
            Velg format og innhold for rapporten du vil eksportere.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Eksportformater */}
          <div className="space-y-4">
            <h4 className="font-medium">Eksportformat</h4>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={exportToExcel}
                disabled={exporting}
                className="h-20 flex-col gap-2"
              >
                {exporting ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-6 w-6" />
                )}
                <span>Excel (.xlsx)</span>
                <span className="text-xs text-muted-foreground">Detaljerte data og analyser</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={exportToPDF}
                disabled={exporting}
                className="h-20 flex-col gap-2"
              >
                {exporting ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <FileText className="h-6 w-6" />
                )}
                <span>PDF (.pdf)</span>
                <span className="text-xs text-muted-foreground">Revisjonsrapport</span>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Innholdsvalg */}
          <div className="space-y-4">
            <h4 className="font-medium">Inkluder i rapport</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="insights"
                  checked={exportOptions.includeInsights}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeInsights: !!checked }))
                  }
                />
                <Label htmlFor="insights" className="flex items-center gap-2">
                  AI-innsikter
                  <Badge variant="secondary">{aiResults?.insights?.length || 0}</Badge>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recommendations"
                  checked={exportOptions.includeRecommendations}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeRecommendations: !!checked }))
                  }
                />
                <Label htmlFor="recommendations" className="flex items-center gap-2">
                  Anbefalinger
                  <Badge variant="secondary">{aiResults?.recommendations?.length || 0}</Badge>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="riskFactors"
                  checked={exportOptions.includeRiskFactors}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeRiskFactors: !!checked }))
                  }
                />
                <Label htmlFor="riskFactors" className="flex items-center gap-2">
                  Risikoer
                  <Badge variant="secondary">{aiResults?.risk_factors?.length || 0}</Badge>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anomalies"
                  checked={exportOptions.includeAnomalies}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeAnomalies: !!checked }))
                  }
                />
                <Label htmlFor="anomalies" className="flex items-center gap-2">
                  Avvik og anomalier
                  <Badge variant="secondary">{aiResults?.anomalies?.length || 0}</Badge>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="transactions"
                  checked={exportOptions.includeTransactions}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeTransactions: !!checked }))
                  }
                />
                <Label htmlFor="transactions">Transaksjonsdata (detaljer)</Label>
              </div>

              {exportOptions.includeTransactions && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="maxTransactions">Maksimalt antall transaksjoner</Label>
                  <Input
                    id="maxTransactions"
                    type="number"
                    value={exportOptions.maxTransactions}
                    onChange={(e) =>
                      setExportOptions(prev => ({ ...prev, maxTransactions: parseInt(e.target.value) || 1000 }))
                    }
                    className="w-32"
                    min="100"
                    max="50000"
                    step="100"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sammendrag */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Rapportsammendrag</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Klient:</span>
                <span className="font-medium">{clientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Dataversjon:</span>
                <span className="font-medium">{versionId || 'Siste versjon'}</span>
              </div>
              <div className="flex justify-between">
                <span>Eksportdato:</span>
                <span className="font-medium">{new Date().toLocaleDateString('no-NO')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};