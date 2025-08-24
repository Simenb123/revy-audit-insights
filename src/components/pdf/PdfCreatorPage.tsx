import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ValidationPanel } from './ValidationPanel';
import { CompanySelector } from './CompanySelector';
import { readTableFile } from '@/utils/pdf-import';
import { mapRow, groupsToPayloads } from '@/utils/pdf-map';
import { BilagPayload } from '@/types/bilag';
import { useToast } from '@/hooks/use-toast';
import { uploadPdfToStorage, downloadPdf } from '@/services/pdf-storage';
import { FileText, Upload, Download, Eye, Archive } from 'lucide-react';
import { useBulkPDFExport } from '@/hooks/useBulkPDFExport';
import { BulkExportDialog } from './BulkExportDialog';
import { PDFViewer } from '@react-pdf/renderer';
import { PdfInvoiceDocument } from './PdfInvoiceDocument';
import { PdfPaymentDocument } from './PdfPaymentDocument';
import { PdfJournalDocument } from './PdfJournalDocument';
import { UniversalUploader } from '@/components/Upload';
import { getUploadConfig } from '@/config/uploadTypes';
import { ProcessingResult } from '@/types/upload';

export const PdfCreatorPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [bilagGroups, setBilagGroups] = useState<Record<string, any[]>>({});
  const [payloads, setPayloads] = useState<BilagPayload[]>([]);
  const [selectedBilag, setSelectedBilag] = useState<string>('');
  const [selskapInfo, setSelskapInfo] = useState({
    navn: '',
    orgnr: '',
    mvaRegistrert: true,
    adresse: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [showBulkExportDialog, setShowBulkExportDialog] = useState(false);
  
  const { toast } = useToast();
  const { progress, exportAllToPDF, resetProgress } = useBulkPDFExport();
  
  // Get PDF Creator upload configuration
  const uploadConfig = getUploadConfig('pdf-creator');

  // Handle upload completion from UniversalUploader
  const handleUploadComplete = async (result: ProcessingResult) => {
    toast({
      title: "Data behandlet!",
      description: `${result.processedRows} rader behandlet, ${Object.keys(bilagGroups).length} bilag generert.`,
    });
    setShowUploader(false);
  };

  // Store original data and mapping for debug export
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Process uploaded data (called from UniversalUploader)
  const processUploadedData = async (file: File, mapping: Record<string, string>) => {
    try {
      const data = await readTableFile(file);
      
      // Store for debugging
      setOriginalData(data);
      setColumnMapping(mapping);
      
      // Map the columns according to user mapping
      const mappedData = data.map(row => {
        const mappedRow: any = {};
        Object.entries(mapping).forEach(([sourceCol, targetField]) => {
          if (targetField) {
            // Include all mapped columns, even if source data is undefined
            mappedRow[targetField] = row[sourceCol] !== undefined ? row[sourceCol] : '';
          }
        });
        return mappedRow;
      });
      
      setRows(mappedData);

      // Group by bilag
      const groups: Record<string, any[]> = {};
      mappedData.forEach(row => {
        const mapped = mapRow(row);
        const key = mapped.bilag?.toString() || mapped.fakturanummer || 'ukjent';
        if (!groups[key]) groups[key] = [];
        groups[key].push(mapped);
      });

      setBilagGroups(groups);

      // Generate payloads
      const generated = groupsToPayloads(groups, selskapInfo);
      setPayloads(generated);

      return {
        success: true,
        processedRows: mappedData.length,
        validRows: mappedData.length,
        invalidRows: 0,
        skippedRows: 0,
        validationResults: [
          {
            type: 'success' as const,
            message: `${mappedData.length} rader behandlet og ${Object.keys(groups).length} bilag generert`,
            count: mappedData.length
          }
        ]
      };
    } catch (error) {
      throw error;
    }
  };

  const selectedPayload = payloads.find(p => p.bilag.toString() === selectedBilag);
  // Use mapped columns from user mapping instead of data-derived columns
  const detectedColumns = Object.values(columnMapping).filter(Boolean);
  const mvaSatser = [...new Set(rows.map(r => r.mva_sats).filter(Boolean))];

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/mal_bilag.csv';
    link.download = 'mal_bilag.csv';
    link.click();
  };

  const handlePreviewPdf = () => {
    setShowPreview(true);
  };

  const handleDownloadPdf = async () => {
    if (!selectedPayload) return;
    
    try {
      const blob = await downloadPdf(selectedPayload);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedPayload.doknr || selectedPayload.bilag}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF lastet ned!",
        description: "PDF-filen er lagret lokalt.",
      });
    } catch (error) {
      toast({
        title: "Nedlasting feilet",
        description: error instanceof Error ? error.message : 'Ukjent feil',
        variant: "destructive"
      });
    }
  };

  const handleUploadToSupabase = async () => {
    if (!selectedPayload) return;
    
    setUploading(true);
    try {
      // For demo, using a placeholder client ID
      // In real use, this would come from context or props
      const clientId = 'demo-client-id';
      
      const voucher = await uploadPdfToStorage(selectedPayload, clientId);
      
      toast({
        title: "PDF lastet opp!",
        description: `Bilag ${voucher.bilag} er lagret i Supabase.`,
      });
    } catch (error) {
      toast({
        title: "Opplasting feilet",
        description: error instanceof Error ? error.message : 'Ukjent feil',
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleBulkExport = async () => {
    if (payloads.length === 0) {
      toast({
        title: "Ingen bilag å eksportere",
        description: "Last opp regnskapsdata først for å generere bilag.",
        variant: "destructive"
      });
      return;
    }

    setShowBulkExportDialog(true);
    resetProgress();
    await exportAllToPDF(payloads);
  };

  const renderPdfDocument = () => {
    if (!selectedPayload) return null;

    switch (selectedPayload.type) {
      case 'salgsfaktura':
      case 'leverandorfaktura':
        return <PdfInvoiceDocument payload={selectedPayload} />;
      case 'kundebetaling':
      case 'leverandorbetaling':
      case 'bankbilag':
        return <PdfPaymentDocument payload={selectedPayload} />;
      case 'diversebilag':
      default:
        return <PdfJournalDocument payload={selectedPayload} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">PDF Creator</h1>
          <p className="text-muted-foreground">
            Generer PDF-bilag fra Excel/CSV regnskapsdata
          </p>
        </div>
      </div>

      {/* Company Info */}
      <CompanySelector 
        selskapInfo={selskapInfo}
        setSelskapInfo={setSelskapInfo}
      />

      {/* File Upload */}
      {showUploader && uploadConfig ? (
        <UniversalUploader 
          config={{
            ...uploadConfig,
            customProcessor: processUploadedData
          }}
          onComplete={handleUploadComplete}
          onCancel={() => setShowUploader(false)}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Regnskapsdata lastet opp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowUploader(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Last opp ny fil
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Last ned CSV-mal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Panel */}
      {!showUploader && rows.length > 0 && (
        <ValidationPanel
          rows={rows}
          bilagGroups={bilagGroups}
          detectedColumns={detectedColumns}
          mvaSatser={mvaSatser}
          originalData={originalData}
          columnMapping={columnMapping}
        />
      )}

      {/* Bilag Selection */}
      {!showUploader && payloads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Velg bilag for forhåndsvisning</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedBilag} onValueChange={setSelectedBilag}>
              <SelectTrigger>
                <SelectValue placeholder="Velg et bilag..." />
              </SelectTrigger>
              <SelectContent>
                {payloads.map(payload => (
                  <SelectItem key={payload.bilag.toString()} value={payload.bilag.toString()}>
                    {payload.type} - {payload.bilag} ({payload.doknr})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Selected Bilag Details */}
      {!showUploader && selectedPayload && (
        <Card>
          <CardHeader>
            <CardTitle>Bilagsdetaljer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Type:</strong> {selectedPayload.type}</div>
              <div><strong>Bilag:</strong> {selectedPayload.bilag}</div>
              <div><strong>Dato:</strong> {selectedPayload.dato}</div>
              <div><strong>Motpart:</strong> {selectedPayload.motpart || 'N/A'}</div>
              {selectedPayload.linjer && (
                <div className="col-span-2">
                  <strong>Linjer:</strong> {selectedPayload.linjer.length} stk
                </div>
              )}
              {selectedPayload.belop && (
                <div><strong>Beløp:</strong> {selectedPayload.belop} kr</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {!showUploader && selectedPayload && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Button onClick={handlePreviewPdf}>
                <Eye className="h-4 w-4 mr-2" />
                Forhåndsvis PDF
              </Button>
              <Button variant="outline" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4 mr-2" />
                Last ned PDF
              </Button>
              <Button variant="outline" onClick={handleUploadToSupabase} disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Laster opp...' : 'Last opp til Supabase'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {!showUploader && payloads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Masse-handlinger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button 
                onClick={handleBulkExport}
                disabled={progress.isRunning}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Archive className="h-4 w-4 mr-2" />
                Last ned alle som ZIP ({payloads.length} bilag)
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Eksporterer alle {payloads.length} bilag til en organisert ZIP-fil sortert etter bilagstype.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bulk Export Progress Dialog */}
      <BulkExportDialog
        open={showBulkExportDialog}
        onOpenChange={setShowBulkExportDialog}
        progress={progress}
        onCancel={() => {
          // Note: Cancellation logic could be added to useBulkPDFExport if needed
          setShowBulkExportDialog(false);
          resetProgress();
        }}
      />

      {/* PDF Preview Modal */}
      {showPreview && selectedPayload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">PDF Forhåndsvisning</h3>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Lukk
              </Button>
            </div>
            <div className="border">
              <PDFViewer width="100%" height="600px">
                {renderPdfDocument()}
              </PDFViewer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};