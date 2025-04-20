
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { Progress } from "@/components/ui/progress";
import { AlertCircle, FileSpreadsheet, Check } from 'lucide-react';

const ExcelImporter = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const { toast } = useToast();

  const processOrgNumber = async (orgNumber: string) => {
    try {
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
          registration_date: company.registreringsdatoEnhetsregisteret?.split('T')[0] || null
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

      const reader = new FileReader();
      reader.onload = async (e) => {
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

        toast({
          title: "Import fullført",
          description: `${successful} av ${rows.length} klienter ble importert.`,
          variant: successful > 0 ? "default" : "destructive"
        });
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Importfeil",
        description: "Det oppstod en feil under importen. Sjekk konsollen for detaljer.",
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
          {!isImporting ? (
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
            <div className="space-y-4">
              <Progress value={progress} />
              <p className="text-sm text-center">
                Behandler {processedRows} av {totalRows} klienter...
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelImporter;
