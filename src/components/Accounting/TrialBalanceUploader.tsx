
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface TrialBalanceUploaderProps {
  clientId: string;
}

interface TrialBalanceRow {
  account_number: string;
  period_end_date: string;
  opening_balance?: number;
  debit_turnover?: number;
  credit_turnover?: number;
  closing_balance?: number;
}

const TrialBalanceUploader = ({ clientId }: TrialBalanceUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    processed: number;
    errors: string[];
  } | null>(null);
  const [hasChartOfAccounts, setHasChartOfAccounts] = useState<boolean | null>(null);

  // Check if client has chart of accounts when component loads
  React.useEffect(() => {
    const checkChartOfAccounts = async () => {
      console.log('Checking if client has chart of accounts...');
      const { data: accounts, error } = await supabase
        .from('client_chart_of_accounts')
        .select('id')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Error checking chart of accounts:', error);
        return;
      }

      const hasAccounts = accounts && accounts.length > 0;
      console.log('Client has chart of accounts:', hasAccounts);
      setHasChartOfAccounts(hasAccounts);
    };

    if (clientId) {
      checkChartOfAccounts();
    }
  }, [clientId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    console.log('File selected:', selectedFile?.name, selectedFile?.size);
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const processExcelFile = async (file: File): Promise<TrialBalanceRow[]> => {
    console.log('Processing Excel file:', file.name);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          console.log('File reader loaded successfully');
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          console.log('Workbook loaded, sheets:', workbook.SheetNames);
          
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          console.log('Excel data parsed, rows:', jsonData.length);
          console.log('First few rows:', jsonData.slice(0, 3));
          
          const balances: TrialBalanceRow[] = jsonData.map((row: any, index) => {
            console.log(`Processing row ${index}:`, row);
            return {
              account_number: row['Kontonummer']?.toString() || row['account_number']?.toString() || '',
              period_end_date: row['Periode'] || row['period_end_date'] || '',
              opening_balance: parseFloat(row['Inngående saldo'] || row['opening_balance'] || '0') || 0,
              debit_turnover: parseFloat(row['Debet omsetning'] || row['debit_turnover'] || '0') || 0,
              credit_turnover: parseFloat(row['Kredit omsetning'] || row['credit_turnover'] || '0') || 0,
              closing_balance: parseFloat(row['Utgående saldo'] || row['closing_balance'] || '0') || 0,
            };
          }).filter(bal => {
            const isValid = bal.account_number && bal.period_end_date;
            console.log(`Row valid: ${isValid}`, bal);
            return isValid;
          });
          
          console.log('Processed balances:', balances.length);
          resolve(balances);
        } catch (error) {
          console.error('Error processing Excel file:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        console.error('FileReader error:', reader.error);
        reject(new Error('Kunne ikke lese filen'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  const uploadTrialBalance = async () => {
    if (!file || !clientId) {
      console.error('Missing file or clientId:', { file: !!file, clientId });
      return;
    }

    console.log('Starting upload for client:', clientId);
    setIsUploading(true);
    setProgress(0);
    
    try {
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(`Autentiseringsfeil: ${authError.message}`);
      }
      if (!user) {
        console.error('No authenticated user');
        throw new Error('Du må være logget inn for å laste opp data');
      }
      console.log('User authenticated:', user.id);

      // Process the Excel file
      console.log('Processing Excel file...');
      const balances = await processExcelFile(file);
      setProgress(25);
      console.log('Excel processing complete, balances:', balances.length);

      // Get client accounts for validation
      console.log('Fetching client accounts for validation...');
      const { data: clientAccounts, error: accountsError } = await supabase
        .from('client_chart_of_accounts')
        .select('id, account_number')
        .eq('client_id', clientId);

      if (accountsError) {
        console.error('Error fetching client accounts:', accountsError);
        throw new Error(`Feil ved henting av kontoplan: ${accountsError.message}`);
      }

      console.log('Client accounts fetched:', clientAccounts?.length || 0);
      
      // Check if no accounts exist
      if (!clientAccounts || clientAccounts.length === 0) {
        throw new Error('Ingen kontoplan funnet for denne klienten. Du må laste opp kontoplan før du kan laste opp saldobalanse.');
      }

      const accountMap = new Map(
        clientAccounts.map(acc => [acc.account_number, acc.id])
      );

      // Create upload batch record
      console.log('Creating upload batch...');
      const { data: batch, error: batchError } = await supabase
        .from('upload_batches')
        .insert({
          client_id: clientId,
          user_id: user.id,
          batch_type: 'trial_balance',
          file_name: file.name,
          file_size: file.size,
          total_records: balances.length,
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) {
        console.error('Batch creation error:', batchError);
        throw new Error(`Feil ved opprettelse av batch: ${batchError.message}`);
      }
      console.log('Batch created:', batch.id);
      setProgress(50);

      // Process balances
      const errors: string[] = [];
      const balancesToInsert = balances
        .map((bal, index) => {
          const clientAccountId = accountMap.get(bal.account_number);
          if (!clientAccountId) {
            const error = `Konto ${bal.account_number} ikke funnet i kontoplan`;
            console.warn(error);
            errors.push(error);
            return null;
          }

          try {
            const periodDate = new Date(bal.period_end_date);
            if (isNaN(periodDate.getTime())) {
              const error = `Ugyldig dato for konto ${bal.account_number}: ${bal.period_end_date}`;
              console.warn(error);
              errors.push(error);
              return null;
            }

            return {
              client_id: clientId,
              client_account_id: clientAccountId,
              period_end_date: periodDate.toISOString().split('T')[0],
              period_year: periodDate.getFullYear(),
              opening_balance: bal.opening_balance || 0,
              debit_turnover: bal.debit_turnover || 0,
              credit_turnover: bal.credit_turnover || 0,
              closing_balance: bal.closing_balance || 0,
              upload_batch_id: batch.id,
            };
          } catch (error) {
            const errorMsg = `Feil ved prosessering av rad ${index + 1}: ${error}`;
            console.error(errorMsg);
            errors.push(errorMsg);
            return null;
          }
        })
        .filter(Boolean);

      console.log('Balances to insert:', balancesToInsert.length);
      setProgress(75);

      let processed = 0;
      if (balancesToInsert.length > 0) {
        console.log('Inserting trial balances...');
        const { data: insertedBalances, error: insertError } = await supabase
          .from('trial_balances')
          .upsert(balancesToInsert, { 
            onConflict: 'client_id,client_account_id,period_end_date',
            ignoreDuplicates: false 
          })
          .select();

        if (insertError) {
          console.error('Insert error:', insertError);
          errors.push(`Insert error: ${insertError.message}`);
        } else {
          processed = insertedBalances?.length || 0;
          console.log('Successfully inserted:', processed);
        }
      }

      // Update batch status
      console.log('Updating batch status...');
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

      setProgress(100);
      
      setUploadResult({
        success: processed > 0,
        message: `${processed} saldobalanser ble lastet opp`,
        processed,
        errors: errors.slice(0, 10)
      });

      toast({
        title: processed > 0 ? "Saldobalanse lastet opp" : "Feil ved opplasting",
        description: `${processed} saldobalanser ble importert${errors.length > 0 ? ` (${errors.length} feil)` : ''}`,
        variant: processed > 0 ? "default" : "destructive"
      });
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: error.message || 'Det oppstod en feil under opplastingen',
        processed: 0,
        errors: [error.message]
      });

      toast({
        title: "Feil ved opplasting",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Show warning if no chart of accounts
  if (hasChartOfAccounts === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Last opp saldobalanse
          </CardTitle>
          <CardDescription>
            Last opp saldobalanse fra Excel-fil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Info className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Kontoplan må lastes opp først</h4>
              <p className="text-sm text-amber-700 mt-1">
                Du må laste opp kontoplan i "Kontoplan"-taben før du kan laste opp saldobalanse. 
                Saldobalansen trenger kontoplanen for å validere kontonumrene.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Last opp saldobalanse
        </CardTitle>
        <CardDescription>
          Last opp saldobalanse fra Excel-fil. Filen må inneholde kolonner: Kontonummer, Periode, Inngående saldo, Debet omsetning, Kredit omsetning, Utgående saldo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <Button
            onClick={uploadTrialBalance}
            disabled={!file || isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Laster opp...' : 'Last opp'}
          </Button>
        </div>

        {file && (
          <div className="text-sm text-muted-foreground">
            Valgt fil: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">
              Prosesserer saldobalanse... {progress}%
            </p>
          </div>
        )}

        {uploadResult && (
          <div className={`p-4 rounded-lg border ${
            uploadResult.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {uploadResult.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{uploadResult.message}</span>
            </div>
            {uploadResult.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">Feil som oppstod:</p>
                <ul className="mt-1 list-disc list-inside text-sm">
                  {uploadResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrialBalanceUploader;
