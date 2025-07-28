import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, Database, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import EnhancedPreview from '@/components/DataUpload/EnhancedPreview';
import { DataManagementPanel } from '@/components/DataUpload/DataManagementPanel';
import { 
  processExcelFile, 
  processCSVFile, 
  FilePreview, 
  convertDataWithMapping
} from '@/utils/fileProcessing';

interface AccountRow {
  account_number: string;
  account_name: string;
  balance_current_year?: number;
  balance_last_year?: number;
}

interface TrialBalanceUploaderProps {
  clientId: string;
  onUploadComplete?: () => void;
}

const TrialBalanceUploader = ({ clientId, onUploadComplete }: TrialBalanceUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [showMapping, setShowMapping] = useState(false);
  const [convertedData, setConvertedData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<'select' | 'upload' | 'success'>('select');

  const handleFileSelect = async (file: File) => {
    const extension = file.name.toLowerCase().split('.').pop();
    
    if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
      toast.error('Kun Excel (.xlsx, .xls) og CSV-filer er støttet');
      return;
    }

    setSelectedFile(file);
    
    try {
      let preview: FilePreview;
      if (extension === 'csv') {
        preview = await processCSVFile(file);
      } else {
        preview = await processExcelFile(file);
      }
      setFilePreview(preview);
      setShowMapping(true);
    } catch (error) {
      toast.error('Feil ved lesing av fil');
      console.error(error);
    }
  };

  const handleMappingComplete = async (mapping: Record<string, string>) => {
    if (!filePreview || !selectedFile) return;
    
    console.log('=== TRIAL BALANCE MAPPING COMPLETE ===');
    console.log('File preview data:', {
      totalRows: filePreview.totalRows,
      previewRowsLength: filePreview.rows?.length,
      allRowsLength: filePreview.allRows?.length,
      hasAllRows: !!filePreview.allRows
    });
    console.log('Applied mapping:', mapping);
    
    setShowMapping(false);
    setStep('upload');
    
    try {
      const convertedData = convertDataWithMapping(filePreview, mapping);
      console.log('=== CONVERSION RESULT ===');
      console.log(`Converted ${convertedData.length} rows from original ${filePreview.totalRows} total rows`);
      
      setConvertedData(convertedData);
      await uploadTrialBalance(convertedData, selectedFile);
    } catch (error) {
      console.error('=== CONVERSION ERROR ===', error);
      toast.error('Feil ved datakonvertering');
      setStep('select');
    }
  };

  const uploadTrialBalance = async (accounts: any[], file: File) => {
    if (!clientId) return;

    try {
      setUploadProgress(10);
      console.log('Starting trial balance upload for', accounts.length, 'accounts');

      // Create upload batch record
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data: batch, error: batchError } = await supabase
        .from('upload_batches')
        .insert({
          client_id: clientId,
          user_id: userId,
          batch_type: 'trial_balance',
          file_name: file.name,
          file_size: file.size,
          total_records: accounts.length,
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) throw batchError;
      setUploadProgress(20);

      // First, ensure chart of accounts exists
      let chartOfAccountsCreated = 0;
      const accountMapping = new Map<string, string>();

      for (const account of accounts) {
        const accountNumber = account.account_number?.toString();
        if (!accountNumber) continue;

        // Check if account exists, create if not
        const { data: existingAccount } = await supabase
          .from('client_chart_of_accounts')
          .select('id')
          .eq('client_id', clientId)
          .eq('account_number', accountNumber)
          .single();

        let accountId = existingAccount?.id;

        if (!existingAccount) {
          const { data: newAccount, error: createError } = await supabase
            .from('client_chart_of_accounts')
            .insert({
              client_id: clientId,
              account_number: accountNumber,
              account_name: account.account_name?.toString() || `Konto ${accountNumber}`,
              account_type: 'eiendeler' as const,
              is_active: true
            })
            .select('id')
            .single();

          if (createError) {
            console.error('Error creating account:', createError);
            continue;
          }
          accountId = newAccount.id;
          chartOfAccountsCreated++;
        }

        accountMapping.set(accountNumber, accountId);
      }

      setUploadProgress(40);

      // Now insert trial balance data
      let trialBalanceInserted = 0;
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        const accountNumber = account.account_number?.toString();
        const accountId = accountMapping.get(accountNumber);

        if (!accountId) continue;

        try {
          // Parse numeric values safely
          const parseNumber = (value: any): number => {
            if (value === null || value === undefined || value === '') return 0;
            const str = value.toString().replace(/\s/g, '').replace(',', '.');
            const num = parseFloat(str);
            return isNaN(num) ? 0 : num;
          };

          const openingBalance = parseNumber(account.opening_balance);
          const debitTurnover = parseNumber(account.debit_turnover);
          const creditTurnover = parseNumber(account.credit_turnover);
          const closingBalance = parseNumber(account.closing_balance);

          const { error: trialBalanceError } = await supabase
            .from('trial_balances')
            .upsert({
              client_id: clientId,
              client_account_id: accountId,
              upload_batch_id: batch.id,
              period_year: currentYear,
              period_month: currentMonth,
              period_end_date: new Date().toISOString().split('T')[0],
              opening_balance: openingBalance,
              debit_turnover: debitTurnover,
              credit_turnover: creditTurnover,
              closing_balance: closingBalance
            }, {
              onConflict: 'client_id,client_account_id,period_year,period_month',
              ignoreDuplicates: false
            });

          if (!trialBalanceError) {
            trialBalanceInserted++;
          } else {
            console.error('Error inserting trial balance:', trialBalanceError);
          }
        } catch (error) {
          console.error(`Error processing account ${accountNumber}:`, error);
        }
        
        setUploadProgress(40 + ((i + 1) / accounts.length) * 50);
      }

      // Update batch status
      await supabase
        .from('upload_batches')
        .update({
          status: 'completed',
          processed_records: trialBalanceInserted,
          completed_at: new Date().toISOString()
        })
        .eq('id', batch.id);

      setUploadProgress(100);
      setStep('success');
      
      toast.success(`${trialBalanceInserted} saldobalanse-poster og ${chartOfAccountsCreated} nye kontoer ble importert`);
      onUploadComplete?.();
      
    } catch (error: any) {
      toast.error('Feil ved opplasting: ' + error.message);
      console.error('Upload error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {showMapping && filePreview && (
        <EnhancedPreview
          preview={filePreview}
          fileName={selectedFile?.name || ''}
          clientId={clientId}
          fileType="trial_balance"
          onMappingComplete={handleMappingComplete}
          onCancel={() => setShowMapping(false)}
        />
      )}

      {step === 'success' && (
        <DataManagementPanel 
          clientId={clientId}
          lastUploadSummary={{
            fileName: selectedFile?.name || '',
            recordsImported: convertedData.length,
            uploadDate: new Date().toLocaleDateString('nb-NO'),
            dataType: "Saldobalanse"
          }}
        />
      )}

      {step === 'upload' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Laster opp saldobalanse...</h3>
            <p className="text-muted-foreground">
              Behandler {convertedData.length} kontoer
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <Progress value={uploadProgress} className="mb-2" />
            <p className="text-sm text-center text-muted-foreground">
              {uploadProgress}% fullført
            </p>
          </div>
        </div>
      )}

      {!showMapping && step !== 'success' && step !== 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Last opp saldobalanse
            </CardTitle>
            <CardDescription>
              Last opp Excel eller CSV-fil med saldobalanse for {clientId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                Klikk for å velge fil eller dra og slipp her
              </p>
              <p className="text-muted-foreground mb-4">
                Excel (.xlsx) eller CSV-filer opptil 100MB
              </p>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Påkrevd format
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Filen må inneholde følgende kolonner:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Kontonummer:</strong> Unikt kontonummer (påkrevd)</li>
                  <li><strong>Kontonavn:</strong> Beskrivende navn for kontoen (påkrevd)</li>
                  <li><strong>Saldo i fjor:</strong> Inngående saldo (valgfri)</li>
                  <li><strong>Saldo i år:</strong> Utgående saldo (påkrevd)</li>
                </ul>
                <p className="mt-2 text-xs">
                  Kolonnenavn kan variere - AI-assistenten vil hjelpe deg med mapping.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrialBalanceUploader;