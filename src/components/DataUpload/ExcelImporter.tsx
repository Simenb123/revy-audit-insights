
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { Progress } from "@/components/ui/progress";
import { AlertCircle, FileSpreadsheet, Check, Users, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const ExcelImporter = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [importComplete, setImportComplete] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const { toast } = useToast();

  const processOrgNumber = async (orgNumber: string) => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        console.error('No authenticated user found');
        return null;
      }
      
      const { data: response } = await supabase.functions.invoke('brreg', {
        body: { query: orgNumber }
      });

      if (!response || !response._embedded?.enheter?.[0]) {
        console.warn(`No data found for org number: ${orgNumber}`);
        return null;
      }

      const company = response._embedded.enheter[0];
      
      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          name: company.navn,
          company_name: company.navn,
          org_number: company.organisasjonsnummer,
          phase: 'engagement',
          progress: 0,
          industry: company.naeringskode1?.beskrivelse || null,
          registration_date: company.registreringsdatoEnhetsregisteret?.split('T')[0] || null,
          user_id: session.user.id
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`Client with org number ${orgNumber} already exists`);
          return null;
        }
        throw error;
      }

      return client;
    } catch (error) {
      console.error(`Error processing org number ${orgNumber}:`, error);
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

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: string[] = XLSX.utils.sheet_to_json(firstSheet, { header: 'A' })
            .map(row => (row as any).A?.toString().trim())
            .filter(Boolean);

          setTotalRows(rows.length);

          let successful = 0;
          for (let i = 0; i < rows.length; i++) {
            const orgNumber = rows[i];
            const result = await processOrgNumber(orgNumber);
            if (result) successful++;
            
            setProcessedRows(i + 1);
            setProgress(((i + 1) / rows.length) * 100);
          }

          setSuccessCount(successful);
          setImportComplete(true);

          toast({
            title: "Import fullført",
            description: `${successful} av ${rows.length} klienter ble importert.`,
            variant: successful > 0 ? "default" : "destructive"
          });
        } catch (error) {
          console.error('Error processing file:', error);
          setHasError(true);
          setErrorDetails((error as Error).message || 'Ukjent feil ved prosessering av filen');
          toast({
            title: "Importfeil",
            description: "Det oppstod en feil under importen av filen.",
            variant: "destructive"
          });
        } finally {
          setIsImporting(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Import error:', error);
      setHasError(true);
      setErrorDetails((error as Error).message || 'Ukjent feil');
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
              <p className="text-center text-red-700 mt-2">
                {errorDetails || 'Det oppstod en feil under importen.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-green-100 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-green-800">Import fullført</h3>
              <p className="text-center text-green-700 mt-2">
                {successCount} av {totalRows} klienter ble importert til databasen
              </p>
              {successCount > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded flex items-start gap-2 text-sm">
                  <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-700">Du kan nå se dine importerte klienter i klientoversikten.</p>
                  </div>
                </div>
              )}
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
