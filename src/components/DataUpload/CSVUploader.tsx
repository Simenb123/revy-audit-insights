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
      
      // Bedre CSV parsing som håndterer komma i verdier
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('CSV-filen er tom');
      }

      // Parse CSV med støtte for quoted fields som kan inneholde komma
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        result.push(current.trim());
        return result.map(field => field.replace(/^"|"$/g, '')); // Remove surrounding quotes
      };

      // Parse headers
      const headers = parseCSVLine(lines[0]);
      console.log('CSV headers:', headers);

      // Parse data rows
      const data = lines.slice(1).map((line, index) => {
        try {
          const values = parseCSVLine(line);
          const row: Record<string, string> = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
          });
          return row;
        } catch (error) {
          console.warn(`Error parsing line ${index + 2}:`, line);
          return null;
        }
      }).filter(row => row && Object.values(row).some(value => value.trim() !== ''));

      console.log('Parsed CSV data sample:', data.slice(0, 3));
      console.log('Total rows after filtering:', data.length);
      
      return { headers, data };
    } catch (error) {
      console.error('Error parsing CSV:', error);
      throw error;
    }
  };

  const determineAccountType = (accountNumber: string): 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' => {
    const firstDigit = accountNumber.charAt(0);
    
    switch (firstDigit) {
      case '1':
        return 'asset';
      case '2':
        return 'liability';
      case '3':
        return 'equity';
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
        return 'revenue';
      case '9':
        return 'expense';
      default:
        return 'asset';
    }
  };

  const generateAccountName = (accountNumber: string): string => {
    const firstDigit = accountNumber.charAt(0);
    
    const baseNames: Record<string, string> = {
      '1': 'Eiendeler',
      '2': 'Gjeld',
      '3': 'Egenkapital',
      '4': 'Salgsinntekt',
      '5': 'Annen inntekt',
      '6': 'Varekostnad',
      '7': 'Lønnskostnad',
      '8': 'Annen kostnad',
      '9': 'Finanskostnad'
    };
    
    const baseName = baseNames[firstDigit] || 'Ukjent konto';
    return `${baseName} ${accountNumber}`;
  };

  const createMissingAccounts = async (uniqueAccountNumbers: string[]) => {
    console.log('=== KONTOOPPRETTELSE START ===');
    console.log('Unique account numbers to check:', uniqueAccountNumbers);
    console.log('Client ID:', clientId);
    
    if (!clientId) {
      throw new Error('Ingen klient valgt for import');
    }
    
    // Hent eksisterende kontoer
    console.log('Fetching existing accounts...');
    const { data: existingAccounts, error: fetchError } = await supabase
      .from('client_chart_of_accounts')
      .select('account_number')
      .eq('client_id', clientId)
      .in('account_number', uniqueAccountNumbers);

    if (fetchError) {
      console.error('Error fetching existing accounts:', fetchError);
      throw new Error(`Kunne ikke hente eksisterende kontoer: ${fetchError.message}`);
    }

    console.log('Existing accounts:', existingAccounts);
    const existingNumbers = new Set(existingAccounts?.map(acc => acc.account_number) || []);
    const missingNumbers = uniqueAccountNumbers.filter(num => !existingNumbers.has(num));

    console.log('Missing account numbers:', missingNumbers);

    if (missingNumbers.length === 0) {
      console.log('No missing accounts to create');
      return [];
    }

    // Opprett manglende kontoer
    const accountsToCreate = missingNumbers.map(accountNumber => ({
      client_id: clientId,
      account_number: accountNumber,
      account_name: generateAccountName(accountNumber),
      account_type: determineAccountType(accountNumber),
      is_active: true
    }));

    console.log('Creating accounts:', accountsToCreate);

    const { data: newAccounts, error: createError } = await supabase
      .from('client_chart_of_accounts')
      .insert(accountsToCreate)
      .select();

    if (createError) {
      console.error('Error creating accounts:', createError);
      console.error('Create error details:', JSON.stringify(createError, null, 2));
      throw new Error(`Kunne ikke opprette manglende kontoer: ${createError.message}`);
    }

    console.log('Successfully created accounts:', newAccounts);
    console.log('=== KONTOOPPRETTELSE SLUTT ===');
    return newAccounts || [];
  };

  const findAccountByNumberOrName = (accountMap: Map<string, string>, nameMap: Map<string, string>, accountNumber?: string, accountName?: string) => {
    if (accountNumber && accountMap.has(accountNumber)) {
      return accountMap.get(accountNumber);
    }
    
    if (accountName && nameMap.has(accountName.toLowerCase())) {
      return nameMap.get(accountName.toLowerCase());
    }
    
    return null;
  };

  const parseAmount = (amountStr: string): number => {
    if (!amountStr || amountStr.trim() === '') return 0;
    
    // Håndter negative beløp med minus foran eller bak
    const cleanAmount = amountStr
      .replace(/\s/g, '') // Fjern mellomrom
      .replace(/,/g, '.') // Erstatt komma med punktum for desimal
      .replace(/[^\d.-]/g, ''); // Fjern alt annet enn tall, punktum og minus
    
    const parsed = parseFloat(cleanAmount);
    return isNaN(parsed) ? 0 : parsed;
  };

  const processTransactionData = async (data: any[], mapping: Record<string, string>) => {
    console.log('=== TRANSAKSJONSPROSESSERING START ===');
    console.log('Processing transaction data with mapping:', mapping);
    console.log('Number of transactions to process:', data.length);
    console.log('Client ID:', clientId);
    
    if (!clientId) {
      throw new Error('Ingen klient valgt for import');
    }
    
    // Transform data basert på mapping
    const transformedData = data.map((row, index) => {
      const transformed: any = {};
      
      Object.entries(mapping).forEach(([fileColumn, standardField]) => {
        let value = row[fileColumn];
        
        // Rens og formater data basert på felttype
        if (standardField === 'transaction_date') {
          if (value) {
            // Håndter norsk datoformat (dd.mm.yyyy)
            if (value.includes('.')) {
              const [day, month, year] = value.split('.');
              const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              if (!isNaN(date.getTime())) {
                transformed[standardField] = date.toISOString().split('T')[0];
              }
            } else {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                transformed[standardField] = date.toISOString().split('T')[0];
              }
            }
          }
        } else if (standardField === 'amount') {
          // Håndter enkelt beløp-kolonne
          transformed[standardField] = parseAmount(value);
        } else if (standardField === 'debit_amount' || standardField === 'credit_amount' || standardField === 'balance_amount' || standardField === 'vat_amount') {
          // Håndter separate debet/kredit kolonner
          transformed[standardField] = parseAmount(value);
        } else {
          transformed[standardField] = value || '';
        }
      });
      
      console.log(`Row ${index + 1} transformed:`, transformed);
      return transformed;
    });

    // STEG 1: Hent unike kontonummer
    const uniqueAccountNumbers = [...new Set(
      transformedData
        .map(tx => tx.account_number)
        .filter(num => num && num.trim() !== '')
    )];

    console.log('Unique account numbers found:', uniqueAccountNumbers);

    // STEG 2: Opprett manglende kontoer
    let createdAccounts: any[] = [];
    if (uniqueAccountNumbers.length > 0) {
      try {
        createdAccounts = await createMissingAccounts(uniqueAccountNumbers);
        if (createdAccounts.length > 0) {
          console.log(`Created ${createdAccounts.length} new accounts`);
          toast({
            title: "Kontoer opprettet",
            description: `${createdAccounts.length} nye kontoer ble automatisk opprettet`,
          });
        }
      } catch (error) {
        console.error('Failed to create missing accounts:', error);
        toast({
          title: "Feil ved opprettelse av kontoer",
          description: (error as Error).message,
          variant: "destructive"
        });
        throw error;
      }
    }

    // STEG 3: Hent oppdatert kontoplan
    console.log('Fetching updated client accounts...');
    const { data: clientAccounts, error: accountsError } = await supabase
      .from('client_chart_of_accounts')
      .select('id, account_number, account_name')
      .eq('client_id', clientId);

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      throw new Error(`Kunne ikke hente kontoplan: ${accountsError.message}`);
    }

    console.log('Available client accounts:', clientAccounts);

    const accountMap = new Map(
      clientAccounts?.map(acc => [acc.account_number, acc.id]) || []
    );
    
    const nameMap = new Map(
      clientAccounts?.map(acc => [acc.account_name.toLowerCase(), acc.id]) || []
    );

    // Opprett upload batch
    console.log('Creating upload batch...');
    const { data: batch, error: batchError } = await supabase
      .from('upload_batches')
      .insert({
        client_id: clientId,
        user_id: (await supabase.auth.getUser()).data.user?.id!,
        batch_type: 'general_ledger',
        file_name: fileName,
        file_size: 0,
        total_records: transformedData.length,
        status: 'processing'
      })
      .select()
      .single();

    if (batchError) {
      console.error('Error creating batch:', batchError);
      throw batchError;
    }

    console.log('Upload batch created:', batch);

    // STEG 4: Prosesser transaksjoner
    let processed = 0;
    const errors: string[] = [];

    const transactionsToInsert = transformedData
      .map((tx, index) => {
        const clientAccountId = findAccountByNumberOrName(
          accountMap, 
          nameMap, 
          tx.account_number, 
          tx.account_name
        );
        
        if (!clientAccountId) {
          const identifier = tx.account_number || tx.account_name || 'ukjent';
          const error = `Rad ${index + 1}: Konto "${identifier}" ikke funnet i kontoplan`;
          errors.push(error);
          console.warn(error);
          return null;
        }

        const txDate = new Date(tx.transaction_date);
        
        // Håndter beløp - bruk amount-feltet hvis det finnes, ellers fall tilbake til debet/kredit
        let debitAmount = 0;
        let creditAmount = 0;
        
        if (tx.amount !== undefined && tx.amount !== 0) {
          // Ny format: positive = debit, negative = credit
          if (tx.amount > 0) {
            debitAmount = tx.amount;
          } else {
            creditAmount = Math.abs(tx.amount);
          }
        } else {
          // Legacy format: separate debit/credit columns
          debitAmount = tx.debit_amount || 0;
          creditAmount = tx.credit_amount || 0;
        }
        
        const transaction = {
          client_id: clientId,
          client_account_id: clientAccountId,
          transaction_date: txDate.toISOString().split('T')[0],
          period_year: txDate.getFullYear(),
          period_month: txDate.getMonth() + 1,
          voucher_number: tx.voucher_number,
          description: tx.description || tx.customer_supplier_name,
          debit_amount: debitAmount,
          credit_amount: creditAmount,
          balance_amount: tx.balance_amount,
          upload_batch_id: batch.id,
        };

        console.log(`Transaction ${index + 1}:`, transaction);
        return transaction;
      })
      .filter(Boolean);

    console.log(`Attempting to insert ${transactionsToInsert.length} transactions`);

    if (transactionsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('general_ledger_transactions')
        .insert(transactionsToInsert);

      if (insertError) {
        console.error('Transaction insert error:', insertError);
        throw new Error(`Database error: ${insertError.message}`);
      } else {
        processed = transactionsToInsert.length;
        console.log(`Successfully inserted ${processed} transactions`);
      }
    }

    // Oppdater batch status
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

    console.log('=== TRANSAKSJONSPROSESSERING SLUTT ===');
    console.log(`Final result: ${processed} processed, ${errors.length} errors`);

    if (errors.length > 0) {
      console.warn('Processing errors:', errors.slice(0, 10));
      toast({
        title: "Delvis vellykket import",
        description: `${processed} transaksjoner importert. ${errors.length} feil oppstod.`,
        variant: errors.length > processed / 2 ? "destructive" : "default"
      });
    } else if (createdAccounts.length > 0) {
      toast({
        title: "Import fullført",
        description: `${processed} transaksjoner importert. ${createdAccounts.length} nye kontoer opprettet.`,
      });
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
