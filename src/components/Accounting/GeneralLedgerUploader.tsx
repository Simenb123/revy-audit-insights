
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import FileDropZone from '../common/FileDropZone';
import { toast } from '@/components/ui/use-toast';

interface GeneralLedgerUploaderProps {
  clientId: string;
  onUploadComplete?: () => void;
}

const GeneralLedgerUploader = ({ clientId, onUploadComplete }: GeneralLedgerUploaderProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      return validTypes.includes(file.type) && file.size <= 100 * 1024 * 1024; // 100MB limit for ledger
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Noen filer ble ignorert",
        description: "Kun Excel og CSV-filer under 100MB er støttet.",
        variant: "destructive"
      });
    }

    setSelectedFiles(validFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 5;
        });
      }, 300);

      // TODO: Replace with actual upload logic
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setUploadProgress(100);
      
      toast({
        title: "Hovedbok lastet opp",
        description: "Hovedboken har blitt prosessert og transaksjoner er importert.",
      });

      setSelectedFiles([]);
      onUploadComplete?.();
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Opplasting feilet",
        description: "Det oppstod en feil under opplasting av hovedboken.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Last opp Hovedbok
          </CardTitle>
          <CardDescription>
            Hovedboken inneholder alle transaksjoner og er grunnlaget for detaljerte revisjonsanalyser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileDropZone
            accept={{
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/vnd.ms-excel': ['.xls'],
              'text/csv': ['.csv'],
            }}
            onFilesSelected={handleFileSelect}
            className={isUploading ? 'pointer-events-none opacity-50' : ''}
          >
            {(active) => (
              <div className="text-center">
                <Database className="h-12 w-12 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  {active ? 'Slipp hovedbok-filen her' : 'Dra og slipp hovedbok, eller klikk for å velge'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Excel (.xlsx, .xls) eller CSV-format, maks 100MB
                </p>
              </div>
            )}
          </FileDropZone>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Valgte filer:</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="p-3 bg-muted rounded border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      {!isUploading && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Laster opp og prosesserer transaksjoner...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <Button 
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="w-full"
          >
            {isUploading ? 'Laster opp...' : `Last opp ${selectedFiles.length} fil${selectedFiles.length === 1 ? '' : 'er'}`}
          </Button>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Krav til hovedbok-fil
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Kolonne med dato (f.eks. "Dato", "Date", "Transaksjonsdato")</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Kolonne med kontonummer (f.eks. "Konto", "Account", "Kontonr")</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Kolonne med beløp (f.eks. "Beløp", "Amount", "Sum")</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Kolonne med beskrivelse (f.eks. "Beskrivelse", "Tekst", "Description")</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Excel (.xlsx, .xls) eller CSV-format</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralLedgerUploader;
