import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ValidationPanel } from './ValidationPanel';
import { readTableFile } from '@/utils/pdf-import';
import { mapRow, groupsToPayloads } from '@/utils/pdf-map';
import { BilagPayload } from '@/types/bilag';
import { useToast } from '@/hooks/use-toast';
import { uploadPdfToStorage, downloadPdf } from '@/services/pdf-storage';
import { FileText, Upload, Download, Eye } from 'lucide-react';
import { PDFViewer } from '@react-pdf/renderer';
import { PdfInvoiceDocument } from './PdfInvoiceDocument';
import { PdfPaymentDocument } from './PdfPaymentDocument';
import { PdfJournalDocument } from './PdfJournalDocument';

export const PdfCreatorPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
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
  
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);

    try {
      const data = await readTableFile(uploadedFile);
      setRows(data);

      // Group by bilag
      const groups: Record<string, any[]> = {};
      data.forEach(row => {
        const mapped = mapRow(row);
        const key = mapped.bilag?.toString() || mapped.fakturanummer || 'ukjent';
        if (!groups[key]) groups[key] = [];
        groups[key].push(mapped);
      });

      setBilagGroups(groups);

      // Generate payloads
      const generated = groupsToPayloads(groups, selskapInfo);
      setPayloads(generated);

      toast({
        title: "Fil lastet opp!",
        description: `${data.length} rader og ${Object.keys(groups).length} bilag funnet.`,
      });
    } catch (error) {
      toast({
        title: "Feil ved opplasting",
        description: error instanceof Error ? error.message : 'Ukjent feil',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPayload = payloads.find(p => p.bilag.toString() === selectedBilag);
  const detectedColumns = rows.length > 0 ? Object.keys(rows[0]) : [];
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
      <Card>
        <CardHeader>
          <CardTitle>Selskapsinfo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="navn">Selskapsnavn</Label>
            <Input
              id="navn"  
              value={selskapInfo.navn}
              onChange={(e) => setSelskapInfo(prev => ({ ...prev, navn: e.target.value }))}
              placeholder="Navn på selskap"
            />
          </div>
          <div>
            <Label htmlFor="orgnr">Organisasjonsnummer</Label>
            <Input
              id="orgnr"
              value={selskapInfo.orgnr}
              onChange={(e) => setSelskapInfo(prev => ({ ...prev, orgnr: e.target.value }))}
              placeholder="999 999 999"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Textarea
              id="adresse"
              value={selskapInfo.adresse}
              onChange={(e) => setSelskapInfo(prev => ({ ...prev, adresse: e.target.value }))}
              placeholder="Gateadresse, postnummer og sted"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Last opp data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Excel/CSV fil</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={loading}
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Last ned CSV-mal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Validation Panel */}
      {rows.length > 0 && (
        <ValidationPanel
          rows={rows}
          bilagGroups={bilagGroups}
          detectedColumns={detectedColumns}
          mvaSatser={mvaSatser}
        />
      )}

      {/* Bilag Selection */}
      {payloads.length > 0 && (
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
      {selectedPayload && (
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
      {selectedPayload && (
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