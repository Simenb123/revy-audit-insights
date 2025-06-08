
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CSVUploaderProps {
  clientOrgNumber?: string;
  onUploadSuccess?: (filename: string, recordCount: number) => void;
}

const CSVUploader = ({ clientOrgNumber, onUploadSuccess }: CSVUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const { toast } = useToast();

  const processCSVFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('CSV-filen er tom');
      }

      // Parse CSV headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      console.log('CSV headers:', headers);

      // Parse data rows
      const dataRows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      console.log('Parsed CSV data:', dataRows);
      
      // If client org number is provided, try to find the client
      let clientId = null;
      if (clientOrgNumber) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('org_number', clientOrgNumber)
          .single();
        
        if (clientError || !client) {
          throw new Error(`Kunne ikke finne klient med org.nr: ${clientOrgNumber}`);
        }
        clientId = client.id;
      }

      // Determine data type based on headers and process accordingly
      if (headers.includes('Konto') || headers.includes('Account')) {
        await processGeneralLedgerData(dataRows, clientId);
      } else if (headers.includes('Kontonummer') || headers.includes('AccountNumber')) {
        await processTrialBalanceData(dataRows, clientId);
      } else {
        throw new Error('Ukjent CSV-format. Forventer kolonner som "Konto", "Kontonummer" etc.');
      }

      return dataRows.length;
    } catch (error) {
      console.error('Error processing CSV:', error);
      throw error;
    }
  };

  const processGeneralLedgerData = async (data: any[], clientId: string | null) => {
    // Implementation for general ledger data
    console.log('Processing general ledger data:', data.length, 'records');
    toast({
      title: "CSV behandlet",
      description: `${data.length} hovedbok-transaksjoner identifisert`,
    });
  };

  const processTrialBalanceData = async (data: any[], clientId: string | null) => {
    // Implementation for trial balance data
    console.log('Processing trial balance data:', data.length, 'records');
    toast({
      title: "CSV behandlet", 
      description: `${data.length} saldobalanse-poster identifisert`,
    });
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Feil filtype",
        description: "Vennligst last opp en CSV-fil",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setFileName(file.name);
    
    try {
      const recordCount = await processCSVFile(file);
      setUploadSuccess(true);
      
      toast({
        title: "CSV lastet opp",
        description: `${recordCount} poster behandlet fra ${file.name}`,
      });

      if (onUploadSuccess) {
        onUploadSuccess(file.name, recordCount);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Opplastingsfeil",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [clientOrgNumber, onUploadSuccess, toast]);

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
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const resetUploader = () => {
    setUploadSuccess(false);
    setFileName('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          CSV Opplaster
        </CardTitle>
        <CardDescription>
          Last opp CSV-fil med regnskapsdata
          {clientOrgNumber && ` for ${clientOrgNumber}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {uploadSuccess ? (
          <div className="text-center p-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Fil lastet opp!</p>
            <p className="text-muted-foreground mb-4">{fileName}</p>
            <Button onClick={resetUploader} variant="outline">
              Last opp ny fil
            </Button>
          </div>
        ) : (
          <div 
            className={`
              border-2 border-dashed rounded-lg p-6 text-center
              transition-colors duration-200 cursor-pointer
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
              ${isUploading ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              id="csv-upload" 
              className="hidden" 
              onChange={handleFileInput}
              accept=".csv"
              disabled={isUploading}
            />
            
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                {isUploading ? 'Behandler fil...' : 'Dra og slipp CSV-fil her'}
              </p>
              <p className="text-muted-foreground mb-4">
                eller klikk for å velge fil
              </p>
              <Button variant="outline" disabled={isUploading}>
                Velg CSV-fil
              </Button>
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CSVUploader;
