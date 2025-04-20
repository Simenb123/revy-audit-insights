
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { Progress } from "@/components/ui/progress";
import { AlertCircle, FileSpreadsheet, Check, Users, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuditPhase } from '@/types/revio';

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
  const [debug, setDebug] = useState<string[]>([]);
  const { toast } = useToast();

  const processOrgNumber = async (orgNumber: string) => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        const errorMsg = 'No authenticated user found';
        console.error(errorMsg);
        setDebug(prev => [...prev, errorMsg]);
        return null;
      }
      
      setDebug(prev => [...prev, `Fetching data for org number: ${orgNumber}`]);
      
      // Log detailed authentication information
      setDebug(prev => [...prev, `Using auth: User ID: ${session.user.id.substring(0, 8)}... with role: ${session.user.role}`]);
      
      const { data: response, error: invokeError } = await supabase.functions.invoke('brreg', {
        body: { query: orgNumber }
      });
      
      if (invokeError) {
        const errorMsg = `Error calling brreg function: ${invokeError.message}`;
        console.error(errorMsg);
        setDebug(prev => [...prev, errorMsg]);
        return null;
      }

      if (!response) {
        const errorMsg = `No response from brreg function for org number: ${orgNumber}`;
        console.error(errorMsg);
        setDebug(prev => [...prev, errorMsg]);
        return null;
      }

      setDebug(prev => [...prev, `Brreg response received: ${JSON.stringify(response).substring(0, 150)}...`]);

      if (!response._embedded?.enheter?.[0]) {
        const errorMsg = `No company data found for org number: ${orgNumber}`;
        console.warn(errorMsg);
        setDebug(prev => [...prev, errorMsg]);
        return null;
      }

      const company = response._embedded.enheter[0];
      setDebug(prev => [...prev, `Found company: ${company.navn} with org number: ${company.organisasjonsnummer}`]);
      
      // Inserting client data with detailed logging
      setDebug(prev => [...prev, `Attempting to insert client with org number: ${orgNumber} for user ID: ${session.user.id.substring(0, 8)}...`]);
      
      // Log the data being inserted for debugging
      const clientData = {
        name: company.navn,
        company_name: company.navn,
        org_number: company.organisasjonsnummer,
        phase: 'engagement' as AuditPhase, // Fix: Explicitly cast to AuditPhase
        progress: 0,
        industry: company.naeringskode1?.beskrivelse || null,
        registration_date: company.registreringsdatoEnhetsregisteret?.split('T')[0] || null,
        user_id: session.user.id
      };
      
      setDebug(prev => [...prev, `Client data to insert: ${JSON.stringify(clientData)}`]);
      
      const { data: client, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          const errorMsg = `Client with org number ${orgNumber} already exists`;
          console.log(errorMsg);
          setDebug(prev => [...prev, errorMsg]);
          return null;
        }
        const errorMsg = `Error inserting client: ${error.message} (${error.code}) - Details: ${JSON.stringify(error.details || {})}`;
        console.error(errorMsg);
        setDebug(prev => [...prev, errorMsg]);
        throw error;
      }

      setDebug(prev => [...prev, `Successfully inserted client with ID: ${client.id}`]);
      return client;
    } catch (error) {
      const errorMsg = `Error processing org number ${orgNumber}: ${(error as Error).message}`;
      console.error(errorMsg);
      setDebug(prev => [...prev, errorMsg]);
      return null;
    }
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
      setDebug(['Starting import...', `File: ${file.name} (${file.size} bytes)`]);

      // Check authentication first with detailed logging
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        const errorMsg = `Auth error: ${authError.message} (${authError.name})`;
        setDebug(prev => [...prev, errorMsg]);
        throw new Error(errorMsg);
      }
      
      if (!session || !session.user) {
        const errorMsg = 'User is not authenticated. Please log in before importing.';
        setDebug(prev => [...prev, errorMsg]);
        throw new Error(errorMsg);
      }

      setDebug(prev => [...prev, `Authenticated as user: ${session.user.id.substring(0, 8)}... (${session.user.email})`]);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          
          setDebug(prev => [...prev, `Excel file read successfully. Sheet name: ${workbook.SheetNames[0]}`]);
          
          // Extract rows with detailed logging
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 'A' });
          setDebug(prev => [...prev, `Raw data rows: ${jsonData.length}`]);
          
          const rows: string[] = jsonData
            .map(row => {
              const value = (row as any).A?.toString().trim();
              return value;
            })
            .filter(Boolean);

          setDebug(prev => [...prev, `Filtered rows: ${rows.length}`]);
          setDebug(prev => [...prev, `First 5 org numbers: ${rows.slice(0, 5).join(', ')}`]);
          
          setTotalRows(rows.length);

          let successful = 0;
          for (let i = 0; i < rows.length; i++) {
            const orgNumber = rows[i];
            setDebug(prev => [...prev, `Processing row ${i+1}: org number ${orgNumber}`]);
            
            const result = await processOrgNumber(orgNumber);
            if (result) {
              successful++;
              setDebug(prev => [...prev, `Successfully added client: ${result.name} (${result.id})`]);
            }
            
            setProcessedRows(i + 1);
            setProgress(((i + 1) / rows.length) * 100);
          }

          setSuccessCount(successful);
          setImportComplete(true);
          setDebug(prev => [...prev, `Import complete. ${successful} of ${rows.length} clients imported successfully.`]);

          // Notify parent component of successful import
          if (onImportSuccess) {
            onImportSuccess({
              filename: file.name,
              importedCount: successful
            });
          }

          toast({
            title: "Import fullført",
            description: `${successful} av ${rows.length} klienter ble importert.`,
            variant: successful > 0 ? "default" : "destructive"
          });
        } catch (error) {
          console.error('Error processing file:', error);
          setHasError(true);
          setErrorDetails((error as Error).message || 'Ukjent feil ved prosessering av filen');
          setDebug(prev => [...prev, `Fatal error: ${(error as Error).message}`]);
          setDebug(prev => [...prev, `Stack trace: ${(error as Error).stack}`]);
          
          toast({
            title: "Importfeil",
            description: "Det oppstod en feil under importen av filen.",
            variant: "destructive"
          });
        } finally {
          setIsImporting(false);
        }
      };

      reader.onerror = (error) => {
        setDebug(prev => [...prev, `FileReader error: ${reader.error?.message || 'Unknown error'}`]);
        setHasError(true);
        setErrorDetails('Feil ved lesing av fil');
        setIsImporting(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Import error:', error);
      setHasError(true);
      setErrorDetails((error as Error).message || 'Ukjent feil');
      setDebug(prev => [...prev, `Error starting import: ${(error as Error).message}`]);
      
      toast({
        title: "Importfeil",
        description: "Det oppstod en feil under importen. Sjekk konsollen for detaljer.",
        variant: "destructive"
      });
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
          ) : isImporting ? (
            <div className="space-y-4">
              <Progress value={progress} />
              <p className="text-sm text-center">
                Behandler {processedRows} av {totalRows} klienter...
              </p>
            </div>
          ) : hasError ? (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-red-100 bg-red-50 rounded-lg">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-red-800">Import feilet</h3>
              <p className="text-center text-red-700 mt-2 mb-4">
                {errorDetails || 'Det oppstod en feil under importen.'}
              </p>
              <div className="w-full bg-red-50 border border-red-200 rounded-md p-3 max-h-48 overflow-y-auto text-xs font-mono text-red-800">
                {debug.map((log, i) => (
                  <div key={i} className="pb-1">{log}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-green-100 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-green-800">Import fullført</h3>
              <p className="text-center text-green-700 mt-2">
                {successCount} av {totalRows} klienter ble importert til databasen fra filen {fileName}
              </p>
              {successCount > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded flex items-start gap-2 text-sm">
                  <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-700">Du kan nå se dine importerte klienter i klientoversikten.</p>
                  </div>
                </div>
              )}
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 mt-4 max-h-48 overflow-y-auto text-xs font-mono">
                {debug.map((log, i) => (
                  <div key={i} className="pb-1">{log}</div>
                ))}
              </div>
            </div>
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
