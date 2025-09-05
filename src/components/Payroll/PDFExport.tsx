import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface ReconciliationItem {
  description: string;
  payrollAmount?: number;
  glAmount?: number;
  discrepancy?: number;
  status: 'match' | 'minor_discrepancy' | 'major_discrepancy';
  accounts: Array<{ number: string; name: string; }>;
}

interface ReconciliationData {
  items: ReconciliationItem[];
}

interface PDFExportProps {
  reconciliationData: ReconciliationData;
  clientName: string;
  orgNumber?: string;
  onExport?: () => void;
}

export const PDFExport: React.FC<PDFExportProps> = ({
  reconciliationData,
  clientName,
  orgNumber,
  onExport
}) => {
  const generatePDFReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kontrolloppstilling lønn - ${clientName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.4; color: #333; }
            .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { color: #6b7280; margin-bottom: 5px; }
            .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .summary-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
            .summary-title { font-weight: bold; margin-bottom: 8px; color: #374151; }
            .summary-value { font-size: 18px; font-weight: bold; }
            .match-rate { color: #059669; }
            .discrepancy { color: #dc2626; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table th, .table td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
            .table th { background-color: #f9fafb; font-weight: bold; }
            .amount { text-align: right; font-family: monospace; }
            .notes { background-color: #f8fafc; border-radius: 8px; padding: 15px; margin-top: 20px; }
            .notes-title { font-weight: bold; margin-bottom: 10px; }
            .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Kontrolloppstilling lønn</div>
            <div class="subtitle">${clientName}</div>
            ${orgNumber ? `<div class="subtitle">Org.nr: ${orgNumber}</div>` : ''}
            <div class="subtitle">Generert: ${new Date().toLocaleDateString('nb-NO')}</div>
          </div>
          
          <div class="summary">
            <div class="summary-card">
              <div class="summary-title">Totalt antall poster</div>
              <div class="summary-value">${reconciliationData.items.length}</div>
            </div>
            <div class="summary-card">
              <div class="summary-title">Perfekte treff</div>
              <div class="summary-value match-rate">${reconciliationData.items.filter((item: ReconciliationItem) => item.status === 'match').length}</div>
            </div>
            <div class="summary-card">
              <div class="summary-title">Små avvik</div>
              <div class="summary-value">${reconciliationData.items.filter((item: ReconciliationItem) => item.status === 'minor_discrepancy').length}</div>
            </div>
            <div class="summary-card">
              <div class="summary-title">Store avvik</div>
              <div class="summary-value discrepancy">${reconciliationData.items.filter((item: ReconciliationItem) => item.status === 'major_discrepancy').length}</div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Beskrivelse</th>
                <th>A07 Beløp</th>
                <th>GL Beløp</th>
                <th>Avvik</th>
                <th>Status</th>
                <th>Kontoer</th>
              </tr>
            </thead>
            <tbody>
              ${reconciliationData.items.map((item: ReconciliationItem) => `
                <tr>
                  <td>${item.description}</td>
                  <td class="amount">${item.payrollAmount?.toLocaleString('nb-NO') || '-'}</td>
                  <td class="amount">${item.glAmount?.toLocaleString('nb-NO') || '-'}</td>
                  <td class="amount ${item.discrepancy && item.discrepancy !== 0 ? 'discrepancy' : ''}">${item.discrepancy?.toLocaleString('nb-NO') || '0'}</td>
                  <td>${item.status === 'match' ? '✓ Treff' : item.status === 'minor_discrepancy' ? '⚠ Lite avvik' : '❌ Stort avvik'}</td>
                  <td>${item.accounts.map((acc: { number: string; name: string }) => `${acc.number} ${acc.name}`).join(', ')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="notes">
            <div class="notes-title">Sammendrag</div>
            <p>Denne rapporten viser avstemmingen mellom A07-melding og saldoliste for lønnsdata.</p>
            <p>Store avvik bør undersøkes nærmere og eventuelt justeres gjennom mapping-regler.</p>
            ${reconciliationData.items.filter((item: ReconciliationItem) => item.status === 'major_discrepancy').length > 0 ? 
              '<p><strong>Anbefaling:</strong> Det er identifisert store avvik som krever oppmerksomhet.</p>' : 
              '<p><strong>Status:</strong> Avstemmingen viser akseptable avvik innenfor normale grenser.</p>'
            }
          </div>

          <div class="footer">
            Rapport generert av Revio kontrolloppstilling system
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
    
    onExport?.();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generatePDFReport}
    >
      <FileText className="h-4 w-4 mr-1" />
      PDF Rapport
    </Button>
  );
};