
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import ImportStatus from './ImportStatus';
import { processExcelFile } from '@/utils/excelProcessor';

interface LogEntry {
  message: string;
  timestamp: string;
}

interface ExcelImporterProps {
  onImportSuccess?: (data: { filename: string, importedCount: number }) => void;
}

const ExcelImporter = ({ onImportSuccess }: ExcelImporterProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [importComplete, setImportComplete] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [debug, setDebug] = useState<LogEntry[]>([]);
  const { toast } = useToast();

  const addLog = (message: string) => {
    setDebug(prev => [...prev, {
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setProgress(0);
      setProcessedRows(0);
      setSuccessCount(0);
      setImportComplete(false);
      setHasError(false);
      setErrorDetails('');
      setFileName(file.name);
      setDebug([]);
      
      addLog('Starting import...');
      addLog(`File: ${file.name} (${file.size} bytes)`);

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
            addLog(`Import complete. ${successful} of ${total} clients imported successfully.`);
            
            if (onImportSuccess) {
              onImportSuccess({
                filename: file.name,
                importedCount: successful
              });
            }

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
      setHasError(true);
      setErrorDetails((error as Error).message || 'Ukjent feil ved prosessering av filen');
      addLog(`Fatal error: ${(error as Error).message}`);
      addLog(`Stack trace: ${(error as Error).stack}`);
      
      toast({
        title: "Importfeil",
        description: "Det oppstod en feil under importen av filen.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Importer klienter fra Excel</CardTitle>
        <CardDescription>
          Last opp en Excel-fil med organisasjonsnumre i kolonne A
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {!isImporting && !importComplete && !hasError ? (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
              <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-4" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline">Velg Excel-fil</Button>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={isImporting}
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Støtter .xlsx og .xls filer
              </p>
            </div>
          ) : (
            <ImportStatus
              isImporting={isImporting}
              hasError={hasError}
              errorDetails={errorDetails}
              progress={progress}
              processedRows={processedRows}
              totalRows={totalRows}
              successCount={successCount}
              fileName={fileName}
              debug={debug}
            />
          )}
        </div>
      </CardContent>
      {(importComplete || hasError) && (
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => {
            setImportComplete(false);
            setHasError(false);
            setProgress(0);
            setProcessedRows(0);
            setSuccessCount(0);
            setErrorDetails('');
            setDebug([]);
          }}>
            Ny import
          </Button>
          {successCount > 0 && (
            <Button asChild className="gap-2">
              <Link to="/klienter">
                <Users size={16} />
                <span>Gå til klientoversikt</span>
              </Link>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default ExcelImporter;
