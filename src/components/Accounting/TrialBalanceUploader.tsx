
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import FileDropZone from '../common/FileDropZone';
import { toast } from '@/components/ui/use-toast';

interface TrialBalanceUploaderProps {
  clientId: string;
  onUploadComplete?: () => void;
}

const TrialBalanceUploader = ({ clientId, onUploadComplete }: TrialBalanceUploaderProps) => {
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
      return validTypes.includes(file.type) && file.size <= 50 * 1024 * 1024; // 50MB limit
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Noen filer ble ignorert",
        description: "Kun Excel og CSV-filer under 50MB er støttet.",
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
          return prev + 10;
        });
      }, 200);

      // TODO: Replace with actual upload logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadProgress(100);
      
      toast({
        title: "Saldobalanse lastet opp",
        description: "Saldobalansen har blitt prosessert og kontoplan er opprettet.",
      });

      setSelectedFiles([]);
      onUploadComplete?.();
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Opplasting feilet",
        description: "Det oppstod en feil under opplasting av saldobalansen.",
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
            <FileSpreadsheet className="h-5 w-5" />
            Last opp Saldobalanse
          </CardTitle>
          <CardDescription>
            Saldobalansen etablerer kontostrukturen. Filen bør inneholde kolonner for kontonummer, kontonavn og balanse.
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
                <FileSpreadsheet className="h-12 w-12 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  {active ? 'Slipp saldobalanse-filen her' : 'Dra og slipp saldobalanse, eller klikk for å velge'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Excel (.xlsx, .xls) eller CSV-format, maks 50MB
                </p>
              </div>
            )}
          </FileDropZone>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Valgt fil:</Label>
              <div className="p-3 bg-muted rounded border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="text-sm font-medium">{selectedFiles[0].name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(selectedFiles[0].size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                  {!isUploading && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedFiles([])}
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Laster opp og prosesserer...</span>
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
            {isUploading ? 'Laster opp...' : 'Last opp saldobalanse'}
          </Button>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Krav til saldobalanse-fil
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Kolonne med kontonummer (f.eks. "Kontonummer", "Konto", "Account")</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Kolonne med kontonavn (f.eks. "Kontonavn", "Beskrivelse", "Description")</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Kolonne med balanse (f.eks. "Balanse", "Saldo", "Balance")</span>
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

export default TrialBalanceUploader;
