import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedUploadProvider, LargeDatasetUploader } from '@/components/Upload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Users, Building, TrendingUp } from 'lucide-react';

interface EnhancedShareholdersUploadProps {
  onComplete?: (results: any[]) => void;
  clientId?: string;
}

const EnhancedShareholdersUpload: React.FC<EnhancedShareholdersUploadProps> = ({
  onComplete,
  clientId
}) => {
  const handleUploadComplete = (results: any[]) => {
    console.log('Upload completed:', results);
    if (onComplete) {
      onComplete(results);
    }
  };

  const handleProgress = (progress: { percent: number; status: string; eta?: number }) => {
    console.log('Upload progress:', progress);
  };

  return (
    <div className="space-y-6">
      {/* Information Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Aksjonærregister Import - Optimalisert for Store Datasett</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Støtter millioner av rader</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>CSV og Excel formater</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Sanntids fremgangssporing</span>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Upload Interface */}
      <AdvancedUploadProvider onProgress={(session) => console.log('Session progress:', session)}>
        <LargeDatasetUploader
          uploadType="shareholders"
          acceptedFileTypes={['.csv', '.xlsx', '.xls']}
          maxFileSize={500 * 1024 * 1024} // 500MB
          enableWebWorker={true}
          enableStreaming={true}
          chunkSize={1000}
          onComplete={handleUploadComplete}
          onProgress={handleProgress}
        />
      </AdvancedUploadProvider>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Filformat og Krav</CardTitle>
          <CardDescription>
            Viktige retningslinjer for vellykket import
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Støttede filformater:</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>CSV-filer (.csv) - Anbefalt for store datasett</li>
              <li>Excel-filer (.xlsx, .xls) - Opptil 500MB</li>
              <li>Automatisk deteksjon av separatorer og encoding</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Påkrevde kolonner:</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li><strong>Organisasjonsnummer:</strong> 9-sifret orgnr for selskap</li>
              <li><strong>Selskapsnavn:</strong> Navn på selskapet</li>
              <li><strong>Eier navn:</strong> Navn på aksjonær</li>
              <li><strong>Antall aksjer:</strong> Numerisk verdi</li>
              <li><strong>Aksjeklasse:</strong> Type aksje (A, B, osv.)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Ytelsesoptimalisering:</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Web Worker teknologi for rask behandling</li>
              <li>Intelligente batch-operasjoner</li>
              <li>Automatisk validering og feilhåndtering</li>
              <li>Pause/resume funksjonalitet for store filer</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedShareholdersUpload;