
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const processExcelFile = async (file: File): Promise<TrialBalanceRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          const balances: TrialBalanceRow[] = jsonData.map((row: any) => ({
            account_number: row['Kontonummer']?.toString() || row['account_number']?.toString() || '',
            period_end_date: row['Periode'] || row['period_end_date'] || '',
            opening_balance: parseFloat(row['Inngående saldo'] || row['opening_balance'] || '0') || 0,
            debit_turnover: parseFloat(row['Debet omsetning'] || row['debit_turnover'] || '0') || 0,
            credit_turnover: parseFloat(row['Kredit omsetning'] || row['credit_turnover'] || '0') || 0,
            closing_balance: parseFloat(row['Utgående saldo'] || row['closing_balance'] || '0') || 0,
          })).filter(bal => bal.account_number && bal.period_end_date);
          
          resolve(balances);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Kunne ikke lese filen'));
      reader.readAsArrayBuffer(file);
    });
  };

  const uploadTrialBalance = async () => {
    if (!file || !clientId) return;

    setIsUploading(true);
    setProgress(0);
    
    try {
      // Process the Excel file
      const balances = await processExcelFile(file);
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
          batch_type: 'trial_balance',
          file_name: file.name,
          file_size: file.size,
          total_records: balances.length,
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) throw batchError;
      setProgress(50);

      // Process balances
      const errors: string[] = [];
      const balancesToInsert = balances
        .map(bal => {
          const clientAccountId = accountMap.get(bal.account_number);
          if (!clientAccountId) {
            errors.push(`Konto ${bal.account_number} ikke funnet i kontoplan`);
            return null;
          }

          const periodDate = new Date(bal.period_end_date);
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
        })
        .filter(Boolean);

      setProgress(75);

      let processed = 0;
      if (balancesToInsert.length > 0) {
        const { data: insertedBalances, error: insertError } = await supabase
          .from('trial_balances')
          .upsert(balancesToInsert, { 
            onConflict: 'client_id,client_account_id,period_end_date',
            ignoreDuplicates: false 
          })
          .select();

        if (insertError) {
          errors.push(`Insert error: ${insertError.message}`);
        } else {
          processed = insertedBalances?.length || 0;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Last opp saldobalanse
        </CardTitle>
        <CardDescription>
          Last opp saldobalanse fra Excel-fil. Filen må inneholde: Kontonummer, Periode, saldoer og omsetning
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
