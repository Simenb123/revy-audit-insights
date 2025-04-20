
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileType, Check, X, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { processExcelFile } from '@/utils/excelProcessor';
import DebugLog from './DebugLog';
import ImportStatus from './ImportStatus';

const FileUploader = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [importComplete, setImportComplete] = useState(false);
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
    
    // Check if the file is an Excel or CSV file
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
    setImportComplete(false);
    setDebug([]);
    setFileName(file.name);
    
    addLog('Starting import...');
    addLog(`File: ${file.name} (${file.size} bytes)`);
    
    try {
      const result = await processExcelFile(
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
            setImportComplete(true);
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
      console.error('Error processing file:', error);
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
    setImportComplete(false);
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
          <div 
            className={`
              border-2 border-dashed rounded-lg p-8 
              transition-colors duration-200 ease-in-out
              flex flex-col items-center justify-center
              ${isDragging ? 'border-revio-500 bg-revio-50' : 'border-gray-300 hover:border-revio-300'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              onChange={handleFileInput}
              accept=".xlsx,.xls,.csv"
            />
            
            <label htmlFor="file-upload" className="cursor-pointer text-center">
              <Upload size={48} className="text-revio-500 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Dra og slipp filen her, eller klikk for å velge
              </p>
              <p className="text-xs text-gray-500">
                Støtter Excel (.xlsx, .xls) og CSV-filer
              </p>
            </label>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <div className="flex items-center">
          <FileType size={20} className="text-revio-500 mr-2" />
          <span className="text-sm">Støttede formater: Excel, CSV</span>
        </div>
        
        {(error || uploadSuccess) && (
          <Button 
            variant="outline"
            onClick={resetUploader}
            size="sm"
          >
            <X size={16} className="mr-1" />
            Ny opplasting
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default FileUploader;
