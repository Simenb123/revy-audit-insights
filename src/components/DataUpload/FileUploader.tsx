import { logger } from '@/utils/logger';

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
import { processExcelFile } from '@/utils/excelProcessor';
import ImportStatus from './ImportStatus';
import UploadZone from './UploadZone';
import FileInfo from './FileInfo';

const FileUploader = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [fileName, setFileName] = useState<string>('');
  const [debug, setDebug] = useState<{ message: string; timestamp: string; }[]>([]);
  const { toast } = useToast();
  
  const addLog = (message: string) => {
    setDebug(prev => [...prev, {
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };
  
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
    
    setError(null);
    setIsUploading(true);
    setProgress(0);
    setProcessedRows(0);
    setSuccessCount(0);
    setDebug([]);
    setFileName(file.name);
    
    addLog('Starting import...');
    addLog(`File: ${file.name} (${file.size} bytes)`);
    
    try {
      await processExcelFile(
        file,
        addLog,
        {
          onProgress: (processed: number, total: number) => {
            setProcessedRows(processed);
            setTotalRows(total);
            setProgress((processed / total) * 100);
          },
          onSuccess: (successful: number, total: number) => {
            setSuccessCount(successful);
            setIsUploading(false);
            setUploadSuccess(true);
            addLog(`Import complete. ${successful} of ${total} clients imported successfully.`);
            
            toast({
              title: "Import fullført",
              description: `${successful} av ${total} klienter ble importert.`,
              variant: successful > 0 ? "default" : "destructive"
            });
          }
        }
      );
    } catch (error) {
      logger.error('Error processing file:', error);
      setError((error as Error).message || 'Ukjent feil ved prosessering av filen');
      setIsUploading(false);
      addLog(`Fatal error: ${(error as Error).message}`);
      
      toast({
        title: "Importfeil",
        description: "Det oppstod en feil under importen av filen.",
        variant: "destructive"
      });
    }
  };
  
  const resetUploader = () => {
    setError(null);
    setUploadSuccess(false);
    setProgress(0);
    setProcessedRows(0);
    setSuccessCount(0);
    setDebug([]);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Last opp regnskapsdata</CardTitle>
        <CardDescription>
          Dra og slipp saldobalanse eller hovedbok, eller klikk for å velge fil
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isUploading || uploadSuccess || error ? (
          <ImportStatus
            isImporting={isUploading}
            hasError={!!error}
            errorDetails={error || ''}
            progress={progress}
            processedRows={processedRows}
            totalRows={totalRows}
            successCount={successCount}
            fileName={fileName}
            debug={debug}
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

export default FileUploader;
