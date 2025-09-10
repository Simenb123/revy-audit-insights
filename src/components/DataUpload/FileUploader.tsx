import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { processShareholderFile } from '@/utils/shareholderImportProcessor';
import { uploadAndStartImport, type UploadProgressCallback } from '@/lib/upload/uploadShareholderFile';
import ImportStatus from './ImportStatus';
import UploadZone from './UploadZone';
import FileInfo from './FileInfo';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock } from 'lucide-react';

const ShareholderFileUploader = ({ year }: { year: number }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLargeFile, setIsLargeFile] = useState(false);
  const [showRateLimitWarning, setShowRateLimitWarning] = useState(false);
  const { toast } = useToast();
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };
  
  const handleFiles = async (files: FileList) => {
    const file = files[0];
    
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      setError('Filtypen støttes ikke. Vennligst last opp Excel eller CSV.');
      toast({
        title: "Feil filtype",
        description: "Vennligst last opp en Excel eller CSV fil.",
        variant: "destructive"
      });
      return;
    }

    // Check if large file (> 6MB) to show appropriate messaging
    const isLarge = file.size > 6 * 1024 * 1024;
    setIsLargeFile(isLarge);
    
    setError(null);
    setIsUploading(true);
    setUploadSuccess(false);
    setProgress(0);
    setUploadProgress(0);
    setProcessedRows(0);
    setCurrentMessage('');
    setFileName(file.name);
    setShowRateLimitWarning(false);
    
    try {
      if (isLarge) {
        // Use new TUS upload for large files
        setCurrentMessage('Forbereder opplasting av stor fil...');
        
        const mapping = {
          orgnr: 'orgnr',
          selskap: 'selskap', 
          aksjeklasse: 'aksjeklasse',
          navn_aksjonaer: 'navn_aksjonaer',
          fodselsaar_orgnr: 'fodselsaar_orgnr',
          landkode: 'landkode',
          antall_aksjer: 'antall_aksjer'
        };

        await uploadAndStartImport(file, {
          mapping,
          onProgress: (progress) => {
            setUploadProgress(progress.percentage);
            setCurrentMessage(`Laster opp fil: ${progress.percentage}%`);
          }
        });

        setUploadProgress(100);
        setCurrentMessage('Opplasting fullført. Starter databehandling...');
        setIsUploading(false);
        setUploadSuccess(true);
        
        toast({
          title: "Opplasting fullført",
          description: "Stor fil lastet opp. Databehandling pågår i bakgrunnen.",
        });

      } else {
        // Use existing processor for smaller files
        await processShareholderFile(file, year, {
          onProgress: (current: number, total: number, message: string) => {
            setProgress(current);
            setCurrentMessage(message);
            
            if (message.includes('⚠️ Stor fil detektert')) {
              setShowRateLimitWarning(true);
              const timeMatch = message.match(/ca\. (\d+) minutter/)
              if (timeMatch) {
                setEstimatedTime(parseInt(timeMatch[1]))
              }
            }
          },
          onBatchComplete: (batchNumber: number, totalBatches: number, batchResults: any) => {
            console.log(`Batch ${batchNumber}/${totalBatches} completed:`, batchResults);
          },
          onComplete: (results: any) => {
            setIsUploading(false);
            setUploadSuccess(true);
            setProcessedRows(results.imported);
            setTotalRows(results.totalRows);
            setCurrentMessage(`Import fullført! ${results.imported} av ${results.totalRows} rader importert.`);
            
            toast({
              title: "Import fullført",
              description: `${results.imported} av ${results.totalRows} aksjonærrader ble importert.`,
              variant: results.imported > 0 ? "default" : "destructive"
            });
          },
          onError: (errorMessage: string) => {
            setError(errorMessage);
            setIsUploading(false);
            
            toast({
              title: "Importfeil",
              description: "Det oppstod en feil under importen av filen.",
              variant: "destructive"
            });
          }
        });
      }
    } catch (error: any) {
      console.error('Error processing shareholder file:', error);
      setError(error.message || 'Ukjent feil ved prosessering av filen');
      setIsUploading(false);
      
      toast({
        title: "Importfeil", 
        description: error.message?.includes('Payload too large') 
          ? "Filen er for stor. Prøv å dele den opp i mindre filer."
          : "Det oppstod en feil under importen av filen.",
        variant: "destructive"
      });
    }
  };
  
  const resetUploader = () => {
    setError(null);
    setUploadSuccess(false);
    setProgress(0);
    setUploadProgress(0);
    setProcessedRows(0);
    setCurrentMessage('');
    setShowRateLimitWarning(false);
    setIsLargeFile(false);
    setEstimatedTime(0);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Last opp aksjonærdata for {year}</CardTitle>
        <CardDescription>
          Dra og slipp aksjonærfil, eller klikk for å velge fil. Støtter CSV og Excel format.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(showRateLimitWarning || isLargeFile) && (
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-800">
                {isLargeFile ? 'Stor fil detektert' : 'Stor fil detektert'}
              </span>
            </div>
            <div className="text-sm text-orange-700 space-y-2">
              {isLargeFile ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      TUS Upload
                    </Badge>
                    <span>Bruker resumable upload for stor fil</span>
                  </div>
                  <p className="text-xs">
                    Filer over 6MB bruker TUS-protokollen for pålitelig opplasting.
                  </p>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Opplasting:</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-orange-200 rounded-full h-1.5">
                        <div 
                          className="bg-orange-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      ~{estimatedTime} min
                    </Badge>
                    <span>Importen vil ta tid pga. rate limiting</span>
                  </div>
                  <p className="text-xs">
                    Data prosesseres i store batch(er) med pauser mellom (8,000 rader per batch, 2.5s pause).
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {isUploading || uploadSuccess || error ? (
          <ImportStatus
            isImporting={isUploading}
            hasError={!!error}
            errorDetails={error || ''}
            progress={progress}
            processedRows={processedRows}
            totalRows={totalRows}
            successCount={processedRows}
            fileName={fileName}
            debug={currentMessage ? [{ message: currentMessage, timestamp: new Date().toLocaleTimeString() }] : []}
          />
        ) : (
          <UploadZone
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileSelect={handleFileInput}
          />
        )}
      </CardContent>
      <CardFooter>
        <FileInfo 
          showReset={error !== null || uploadSuccess}
          onReset={resetUploader}
        />
      </CardFooter>
    </Card>
  );
};

export default ShareholderFileUploader;