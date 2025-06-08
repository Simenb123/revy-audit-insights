
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ColumnMappingInterface from './ColumnMappingInterface';

interface CSVUploaderProps {
  clientId?: string;
  onUploadSuccess?: (filename: string, recordCount: number) => void;
}

interface ParsedCSVData {
  headers: string[];
  data: Record<string, string>[];
}

const CSVUploader = ({ clientId, onUploadSuccess }: CSVUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedCSVData | null>(null);
  const [showMapping, setShowMapping] = useState(false);
  const { toast } = useToast();

  const parseCSVFile = async (file: File): Promise<ParsedCSVData> => {
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
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      }).filter(row => Object.values(row).some(value => value.trim() !== ''));

      console.log('Parsed CSV data:', data);
      
      return { headers, data };
    } catch (error) {
      console.error('Error parsing CSV:', error);
      throw error;
    }
  };

  const processTransactionData = async (data: any[], mapping: Record<string, string>) => {
    console.log('Processing transaction data with mapping:', mapping);
    console.log('Client ID:', clientId);
    
    if (!clientId) {
      throw new Error('Ingen klient valgt for import');
    }
    
    // Transform data based on mapping
    const transformedData = data.map(row => {
      const transformed: any = {};
      
      Object.entries(mapping).forEach(([fileColumn, standardField]) => {
        let value = row[fileColumn];
        
        // Clean and format data based on field type
        if (standardField === 'transaction_date') {
          // Handle different date formats
          if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              transformed[standardField] = date.toISOString().split('T')[0];
            }
          }
        } else if (standardField === 'debit_amount' || standardField === 'credit_amount' || standardField === 'balance_amount') {
          // Clean numeric values
          if (value) {
            const numericValue = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
            transformed[standardField] = numericValue;
          }
        } else {
          transformed[standardField] = value || '';
        }
      });
      
      return transformed;
    });

    // Get client accounts for validation
    const { data: clientAccounts } = await supabase
      .from('client_chart_of_accounts')
      .select('id, account_number')
      .eq('client_id', clientId);

    const accountMap = new Map(
      clientAccounts?.map(acc => [acc.account_number, acc.id]) || []
    );

    // Create upload batch record
    const { data: batch, error: batchError } = await supabase
      .from('upload_batches')
      .insert({
        client_id: clientId,
        user_id: (await supabase.auth.getUser()).data.user?.id!,
        batch_type: 'general_ledger',
        file_name: fileName,
        file_size: 0, // CSV file size not tracked here
        total_records: transformedData.length,
        status: 'processing'
      })
      .select()
      .single();

    if (batchError) throw batchError;

    // Process transactions
    let processed = 0;
    const errors: string[] = [];

    const transactionsToInsert = transformedData
      .map(tx => {
        const clientAccountId = accountMap.get(tx.account_number);
        if (!clientAccountId) {
          errors.push(`Konto ${tx.account_number} ikke funnet i kontoplan`);
          return null;
        }

        const txDate = new Date(tx.transaction_date);
        return {
          client_id: clientId,
          client_account_id: clientAccountId,
          transaction_date: txDate.toISOString().split('T')[0],
          period_year: txDate.getFullYear(),
          period_month: txDate.getMonth() + 1,
          voucher_number: tx.voucher_number,
          description: tx.description,
          debit_amount: tx.debit_amount || 0,
          credit_amount: tx.credit_amount || 0,
          balance_amount: tx.balance_amount,
          upload_batch_id: batch.id,
        };
      })
      .filter(Boolean);

    if (transactionsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('general_ledger_transactions')
        .insert(transactionsToInsert);

      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`);
      } else {
        processed = transactionsToInsert.length;
      }
    }

    // Update batch status
    await supabase
      .from('upload_batches')
      .update({
        status: processed > 0 ? 'completed' : 'failed',
        processed_records: processed,
        error_records: errors.length,
        error_log: errors.join('\n'),
        completed_at: new Date().toISOString()
      })
      .eq('id', batch.id);

    if (errors.length > 0) {
      console.warn('Processing errors:', errors);
    }

    return processed;
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
      const parsed = await parseCSVFile(file);
      setParsedData(parsed);
      setShowMapping(true);
      
      toast({
        title: "CSV lastet inn",
        description: `${parsed.headers.length} kolonner og ${parsed.data.length} rader funnet`,
      });
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
  }, [toast]);

  const handleMappingComplete = async (mapping: Record<string, string>) => {
    if (!parsedData) return;
    
    setIsUploading(true);
    try {
      const recordCount = await processTransactionData(parsedData.data, mapping);
      setUploadSuccess(true);
      setShowMapping(false);
      
      if (onUploadSuccess) {
        onUploadSuccess(fileName, recordCount);
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Behandlingsfeil",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMappingCancel = () => {
    setShowMapping(false);
    setParsedData(null);
    setFileName('');
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
    setParsedData(null);
    setShowMapping(false);
  };

  if (showMapping && parsedData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            CSV Kolonnemapping - {fileName}
          </CardTitle>
          <CardDescription>
            Map kolonnene fra filen din til standardfeltene som kreves for import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ColumnMappingInterface
            fileColumns={parsedData.headers}
            sampleData={parsedData.data}
            onMappingComplete={handleMappingComplete}
            onCancel={handleMappingCancel}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          CSV Opplaster
        </CardTitle>
        <CardDescription>
          Last opp CSV-fil med regnskapsdata
          {clientId && ' for valgt klient'}
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
