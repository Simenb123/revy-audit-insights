
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface GeneralLedgerUploaderProps {
  clientId: string;
}

interface TransactionRow {
  transaction_date: string;
  account_number: string;
  voucher_number?: string;
  description?: string;
  debit_amount?: number;
  credit_amount?: number;
  balance_amount?: number;
}

const GeneralLedgerUploader = ({ clientId }: GeneralLedgerUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    processed: number;
    errors: string[];
  } | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const processExcelFile = async (file: File): Promise<TransactionRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          const transactions: TransactionRow[] = jsonData.map((row: any) => ({
            transaction_date: row['Dato'] || row['transaction_date'] || '',
            account_number: row['Kontonummer']?.toString() || row['account_number']?.toString() || '',
            voucher_number: row['Bilagsnummer'] || row['voucher_number'] || '',
            description: row['Beskrivelse'] || row['description'] || '',
            debit_amount: parseFloat(row['Debet'] || row['debit_amount'] || '0') || 0,
            credit_amount: parseFloat(row['Kredit'] || row['credit_amount'] || '0') || 0,
            balance_amount: parseFloat(row['Saldo'] || row['balance_amount'] || '0') || undefined,
          })).filter(tx => tx.transaction_date && tx.account_number);
          
          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Kunne ikke lese filen'));
      reader.readAsArrayBuffer(file);
    });
  };

  const uploadGeneralLedger = async () => {
    if (!file || !clientId) return;

    setIsUploading(true);
    setProgress(0);
    
    try {
      // Process the Excel file
      const transactions = await processExcelFile(file);
      setProgress(25);

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
          file_name: file.name,
          file_size: file.size,
          total_records: transactions.length,
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) throw batchError;
      setProgress(50);

      // Process transactions in batches
      const batchSize = 1000;
      let processed = 0;
      const errors: string[] = [];

      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch_transactions = transactions.slice(i, i + batchSize);
        
        const transactionsToInsert = batch_transactions
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
            errors.push(`Batch ${i / batchSize + 1}: ${insertError.message}`);
          } else {
            processed += transactionsToInsert.length;
          }
        }

        setProgress(50 + (i / transactions.length) * 40);
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

      setProgress(100);
      
      setUploadResult({
        success: processed > 0,
        message: `${processed} transaksjoner ble lastet opp`,
        processed,
        errors: errors.slice(0, 10) // Show only first 10 errors
      });

      toast({
        title: processed > 0 ? "Hovedbok lastet opp" : "Feil ved opplasting",
        description: `${processed} transaksjoner ble importert${errors.length > 0 ? ` (${errors.length} feil)` : ''}`,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Last opp hovedbok
        </CardTitle>
        <CardDescription>
          Last opp hovedboktransaksjoner fra Excel-fil. Filen må inneholde: Dato, Kontonummer, Debet, Kredit
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
            onClick={uploadGeneralLedger}
            disabled={!file || isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Laster opp...' : 'Last opp'}
          </Button>
        </div>

        {isUploading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">
              Prosesserer hovedbok... {progress}%
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

export default GeneralLedgerUploader;
