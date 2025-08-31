import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Scale, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  uploadLegalDocuments, 
  uploadLegalProvisions, 
  batchUploadFromExcel,
  getLegalDocumentTypes,
  type LegalDocumentUpload,
  type LegalProvisionUpload
} from '@/services/legalDocumentsUploadService';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';

const LegalDocumentsUploader: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'single' | 'batch'>('single');
  const [documentType, setDocumentType] = useState<'documents' | 'provisions'>('documents');
  
  // Single document form state
  const [singleDoc, setSingleDoc] = useState<Partial<LegalDocumentUpload | LegalProvisionUpload>>({
    title: '',
    content: '',
    is_active: true
  });

  // Fetch legal document types
  const { data: documentTypes = [] } = useQuery({
    queryKey: ['legal-document-types'],
    queryFn: getLegalDocumentTypes
  });

  const handleSingleUpload = async () => {
    if (!singleDoc.title || !singleDoc.content) {
      toast.error('Tittel og innhold er påkrevd');
      return;
    }

    setIsUploading(true);
    try {
      if (documentType === 'documents') {
        await uploadLegalDocuments([singleDoc as LegalDocumentUpload]);
        toast.success('Juridisk dokument lastet opp!');
      } else {
        if (!(singleDoc as LegalProvisionUpload).provision_number || !(singleDoc as LegalProvisionUpload).law_identifier) {
          toast.error('Paragrafnummer og lovidentifikator er påkrevd for bestemmelser');
          return;
        }
        await uploadLegalProvisions([singleDoc as LegalProvisionUpload]);
        toast.success('Juridisk bestemmelse lastet opp!');
      }
      
      // Reset form
      setSingleDoc({
        title: '',
        content: '',
        is_active: true
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Opplasting feilet');
    } finally {
      setIsUploading(false);
    }
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            toast.error('Excel-filen er tom');
            return;
          }

          const result = await batchUploadFromExcel(jsonData, documentType);
          toast.success(`${result?.length || 0} ${documentType === 'documents' ? 'dokumenter' : 'bestemmelser'} lastet opp!`);
        } catch (error) {
          console.error('Excel processing error:', error);
          toast.error('Feil ved behandling av Excel-fil');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('File read error:', error);
      toast.error('Feil ved lesing av fil');
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Last opp juridisk innhold
          </CardTitle>
          <CardDescription>
            Last opp juridiske dokumenter og bestemmelser for AI Revy sin kunnskapsbase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload type and document type selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Opplastingstype</Label>
              <Select value={uploadType} onValueChange={(value: 'single' | 'batch') => setUploadType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Enkelt oppføring</SelectItem>
                  <SelectItem value="batch">Excel batch-opplasting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Innholdstype</Label>
              <Select value={documentType} onValueChange={(value: 'documents' | 'provisions') => setDocumentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="documents">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Juridiske dokumenter
                    </div>
                  </SelectItem>
                  <SelectItem value="provisions">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Lovbestemmelser
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {uploadType === 'single' ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Tittel *</Label>
                <Input
                  id="title"
                  value={singleDoc.title || ''}
                  onChange={(e) => setSingleDoc({...singleDoc, title: e.target.value})}
                  placeholder="Skriv inn tittel..."
                />
              </div>
              
              <div>
                <Label htmlFor="content">Innhold *</Label>
                <Textarea
                  id="content"
                  value={singleDoc.content || ''}
                  onChange={(e) => setSingleDoc({...singleDoc, content: e.target.value})}
                  placeholder="Skriv inn innhold..."
                  rows={6}
                />
              </div>

              {documentType === 'documents' ? (
                <>
                  <div>
                    <Label htmlFor="doc_number">Dokumentnummer</Label>
                    <Input
                      id="doc_number"
                      value={(singleDoc as LegalDocumentUpload).document_number || ''}
                      onChange={(e) => setSingleDoc({...singleDoc, document_number: e.target.value})}
                      placeholder="F.eks. LOV-2019-06-21-35"
                    />
                  </div>
                  <div>
                    <Label htmlFor="summary">Sammendrag</Label>
                    <Textarea
                      id="summary"
                      value={(singleDoc as LegalDocumentUpload).summary || ''}
                      onChange={(e) => setSingleDoc({...singleDoc, summary: e.target.value})}
                      placeholder="Kort sammendrag av dokumentet..."
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="provision_type">Type bestemmelse</Label>
                    <Select 
                      value={(singleDoc as LegalProvisionUpload).provision_type || 'paragraph'}
                      onValueChange={(value) => setSingleDoc({...singleDoc, provision_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paragraph">Paragraf</SelectItem>
                        <SelectItem value="section">Avsnitt</SelectItem>
                        <SelectItem value="chapter">Kapittel</SelectItem>
                        <SelectItem value="article">Artikkel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="provision_number">Paragrafnummer *</Label>
                    <Input
                      id="provision_number"
                      value={(singleDoc as LegalProvisionUpload).provision_number || ''}
                      onChange={(e) => setSingleDoc({...singleDoc, provision_number: e.target.value})}
                      placeholder="F.eks. § 4-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="law_identifier">Lovidentifikator *</Label>
                    <Input
                      id="law_identifier"
                      value={(singleDoc as LegalProvisionUpload).law_identifier || ''}
                      onChange={(e) => setSingleDoc({...singleDoc, law_identifier: e.target.value})}
                      placeholder="F.eks. revisorloven"
                    />
                  </div>
                </>
              )}

              <Button onClick={handleSingleUpload} disabled={isUploading} className="w-full">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Laster opp...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Last opp
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label htmlFor="excel-upload" className="cursor-pointer">
                    <span className="text-sm font-medium">Velg Excel-fil for batch-opplasting</span>
                    <Input
                      id="excel-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Excel-filen bør ha kolonner som: title/navn, content/innhold, 
                    {documentType === 'documents' ? 'document_number/dokumentnummer, summary/sammendrag' : 'provision_number/paragraf, law_identifier/lov'}
                  </p>
                </div>
              </div>
              
              {isUploading && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Behandler Excel-fil...</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LegalDocumentsUploader;