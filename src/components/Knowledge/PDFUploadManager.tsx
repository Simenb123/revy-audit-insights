
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUp, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PDFUploadManagerProps {
  onUploadComplete?: (articleData: any) => void;
}

const PDFUploadManager = ({ onUploadComplete }: PDFUploadManagerProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [conversionType, setConversionType] = useState<'full' | 'summary' | 'checklist'>('full');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      // Auto-suggest title from filename
      const fileName = selectedFile.name.replace('.pdf', '');
      setTitle(fileName);
    } else {
      toast({
        title: "Ugyldig filtype",
        description: "Kun PDF-filer er støttet.",
        variant: "destructive"
      });
    }
  };

  const handleUpload = async () => {
    if (!file || !title || !category) {
      toast({
        title: "Manglende informasjon",
        description: "Fyll ut alle påkrevde felt.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate PDF processing - in real implementation this would:
      // 1. Upload PDF to Supabase Storage
      // 2. Extract text content using PDF parsing
      // 3. Structure content based on conversion type
      // 4. Create knowledge article
      
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing
      
      const articleData = {
        title,
        category,
        conversionType,
        fileName: file.name,
        status: 'processed'
      };
      
      toast({
        title: "PDF konvertert!",
        description: `${title} er nå tilgjengelig som strukturert artikkel.`,
      });
      
      onUploadComplete?.(articleData);
      
      // Reset form
      setFile(null);
      setTitle('');
      setCategory('');
      setConversionType('full');
      
    } catch (error) {
      toast({
        title: "Konvertering feilet",
        description: "Det oppstod en feil under konvertering av PDF.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          PDF til Strukturert Artikkel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div>
          <Label htmlFor="pdf-upload">PDF-dokument</Label>
          <Input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
          {file && (
            <p className="text-sm text-muted-foreground mt-1">
              Valgt: {file.name} ({Math.round(file.size / 1024)} KB)
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title">Artikkel tittel *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="F.eks: ISA 315 - Risikovurdering"
            disabled={isProcessing}
          />
        </div>

        {/* Category Selection */}
        <div>
          <Label htmlFor="category">Kategori *</Label>
          <Select value={category} onValueChange={setCategory} disabled={isProcessing}>
            <SelectTrigger>
              <SelectValue placeholder="Velg kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="regnskapsloven">Regnskapsloven</SelectItem>
              <SelectItem value="revisorloven">Revisorloven</SelectItem>
              <SelectItem value="isa-200-299">ISA 200-299 Generelle prinsipper</SelectItem>
              <SelectItem value="isa-300-499">ISA 300-499 Risikovurdering</SelectItem>
              <SelectItem value="isa-500-599">ISA 500-599 Revisjonshandlinger</SelectItem>
              <SelectItem value="isa-600-699">ISA 600-699 Spesielle områder</SelectItem>
              <SelectItem value="isa-700-799">ISA 700-799 Rapportering</SelectItem>
              <SelectItem value="rsa">RSA</SelectItem>
              <SelectItem value="nrs">NRS</SelectItem>
              <SelectItem value="ifrs">IFRS</SelectItem>
              <SelectItem value="sjekklister">Sjekklister</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conversion Type */}
        <div>
          <Label htmlFor="conversion-type">Konverteringstype</Label>
          <Select value={conversionType} onValueChange={(value: any) => setConversionType(value)} disabled={isProcessing}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full konvertering - Strukturert artikkel med alle detaljer</SelectItem>
              <SelectItem value="summary">Sammendrag - Nøkkelpunkter og referanser</SelectItem>
              <SelectItem value="checklist">Sjekkliste - Interaktiv arbeidsmal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conversion Info */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Konverteringsprosess:</p>
              <ul className="list-disc list-inside text-blue-800 mt-1 space-y-1">
                <li>Teksten ekstraheres og struktureres automatisk</li>
                <li>Paragrafer og seksjoner identifiseres</li>
                <li>Cross-referanser og lenker opprettes</li>
                <li>Innholdet optimaliseres for søk og AI-bruk</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <Button 
          onClick={handleUpload} 
          disabled={!file || !title || !category || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Konverterer PDF...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Konverter til strukturert artikkel
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PDFUploadManager;
