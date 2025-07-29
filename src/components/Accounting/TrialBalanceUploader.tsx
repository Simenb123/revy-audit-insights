import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, Database, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import EnhancedPreview from '@/components/DataUpload/EnhancedPreview';
import { DataManagementPanel } from '@/components/DataUpload/DataManagementPanel';
import { useAccountingYear } from '@/hooks/useAccountingYear';
import AccountingYearHeader from '@/components/AccountingYearHeader';
// Removed useAvailableVersions since versions are now auto-generated
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
  // Get accounting year for auto-generating version and period dates
  const { accountingYear, isLoading: yearLoading } = useAccountingYear(clientId || '');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [showMapping, setShowMapping] = useState(false);
  const [convertedData, setConvertedData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<'select' | 'upload' | 'success'>('select');
  // Manual version and period inputs removed - now auto-generated

  // Period dates automatically derived from accounting year

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

    // Auto-generate version based on existing uploads for this year
    let finalVersion = 'v1';
    try {
      const { data: existingVersions } = await supabase
        .from('trial_balances')
        .select('version')
        .eq('client_id', clientId)
        .gte('period_start_date', `${accountingYear}-01-01`)
        .lt('period_start_date', `${accountingYear + 1}-01-01`)
        .order('version', { ascending: false })
        .limit(1);

      if (existingVersions && existingVersions.length > 0) {
        const latestVersion = existingVersions[0].version;
        const versionNumber = parseInt(latestVersion.replace('v', '')) + 1;
        finalVersion = `v${versionNumber}`;
      }
    } catch (error) {
      console.warn('Could not determine version, using v1:', error);
    }

    console.log(`📄 Auto-generated version: ${finalVersion} for year ${accountingYear}`);

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
      const mappingErrors: string[] = [];

      console.log('=== ACCOUNT MAPPING PHASE ===');
      console.log(`Processing ${accounts.length} accounts for mapping`);

      for (const account of accounts) {
        const accountNumber = account.account_number?.toString();
        console.log('Processing account:', { accountNumber, account_name: account.account_name });
        
        if (!accountNumber) {
          console.warn('Skipping account with no account_number:', account);
          mappingErrors.push(`Account missing account_number: ${JSON.stringify(account)}`);
          continue;
        }

        // Check if account exists, create if not
        const { data: existingAccount, error: searchError } = await supabase
          .from('client_chart_of_accounts')
          .select('id')
          .eq('client_id', clientId)
          .eq('account_number', accountNumber)
          .maybeSingle();

        if (searchError) {
          console.error('Error searching for account:', accountNumber, searchError);
          mappingErrors.push(`Error searching account ${accountNumber}: ${searchError.message}`);
          continue;
        }

        let accountId = existingAccount?.id;

        if (!existingAccount) {
          console.log(`Creating new account: ${accountNumber} - ${account.account_name}`);
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
            console.error('Error creating account:', accountNumber, createError);
            mappingErrors.push(`Error creating account ${accountNumber}: ${createError.message}`);
            continue;
          }
          accountId = newAccount.id;
          chartOfAccountsCreated++;
          console.log(`Successfully created account ${accountNumber} with ID: ${accountId}`);
        } else {
          console.log(`Using existing account ${accountNumber} with ID: ${accountId}`);
        }

        accountMapping.set(accountNumber, accountId);
      }

      console.log('=== ACCOUNT MAPPING COMPLETE ===');
      console.log(`Account mapping size: ${accountMapping.size}`);
      console.log(`New accounts created: ${chartOfAccountsCreated}`);
      console.log(`Mapping errors: ${mappingErrors.length}`);
      if (mappingErrors.length > 0) {
        console.error('Account mapping errors:', mappingErrors);
      }

      setUploadProgress(40);

      // Now insert trial balance data
      let trialBalanceInserted = 0;
      const currentYear = new Date().getFullYear();
      const currentDate = new Date().toISOString().split('T')[0];
      const insertionErrors: string[] = [];

      console.log('=== TRIAL BALANCE INSERTION PHASE ===');
      console.log(`Inserting trial balance data for ${accounts.length} accounts`);
      console.log(`Current year: ${currentYear}, Current date: ${currentDate}`);

      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        const accountNumber = account.account_number?.toString();
        const accountId = accountMapping.get(accountNumber);

        console.log(`Processing trial balance for account ${i + 1}/${accounts.length}: ${accountNumber}`);

        if (!accountId) {
          console.warn(`Skipping account ${accountNumber} - no account ID found in mapping`);
          insertionErrors.push(`Account ${accountNumber} has no mapped account ID`);
          continue;
        }

        try {
          console.log(`🔍 Raw account data for ${accountNumber}:`, {
            account,
            opening_balance: account.opening_balance,
            debit_turnover: account.debit_turnover,
            credit_turnover: account.credit_turnover,
            closing_balance: account.closing_balance
          });

          // Enhanced Norwegian number format parsing
          const parseNumber = (value: any): number => {
            if (value === null || value === undefined || value === '') return 0;
            
            const originalValue = value.toString().trim();
            console.log(`🔢 Parsing number: "${originalValue}" (type: ${typeof value})`);
            
            // If it's already a number, return it
            if (typeof value === 'number' && !isNaN(value)) {
              console.log(`🔢 Already a number: ${value}`);
              return value;
            }
            
            // Handle string values
            let cleanValue = originalValue
              .replace(/\s+/g, '') // Remove all whitespace
              .replace(/[^\d,.-]/g, ''); // Keep only digits, comma, period, minus
            
            // If empty after cleaning, return 0
            if (!cleanValue || cleanValue === '-') return 0;
            
            // Handle negative values (parentheses or minus sign)
            let isNegative = false;
            if (originalValue.includes('(') && originalValue.includes(')')) {
              isNegative = true;
              cleanValue = cleanValue.replace(/[()]/g, '');
            } else if (cleanValue.startsWith('-')) {
              isNegative = true;
              cleanValue = cleanValue.substring(1);
            }
            
            // Norwegian format detection and conversion
            if (cleanValue.includes(',') && cleanValue.includes('.')) {
              // Both comma and period present
              const lastComma = cleanValue.lastIndexOf(',');
              const lastPeriod = cleanValue.lastIndexOf('.');
              
              if (lastComma > lastPeriod) {
                // Comma is decimal: "1.234.567,89" or "1.234,89"
                cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
              } else {
                // Period is decimal: "1,234,567.89" or "1,234.89"  
                cleanValue = cleanValue.replace(/,/g, '');
              }
            } else if (cleanValue.includes(',')) {
              // Only comma present
              const parts = cleanValue.split(',');
              if (parts.length === 2 && parts[1].length <= 2 && parts[0].length >= 1) {
                // Likely decimal: "1234,56" or "5,67"
                cleanValue = cleanValue.replace(',', '.');
              } else {
                // Likely thousands separator: "1,234" or "1,234,567"
                cleanValue = cleanValue.replace(/,/g, '');
              }
            }
            // If only period and appears to be thousands separator, remove it
            else if (cleanValue.includes('.') && !cleanValue.match(/\.\d{1,2}$/)) {
              // Pattern like "1.234" (not "1.23" or "1.2")
              cleanValue = cleanValue.replace(/\./g, '');
            }
            
            let parsed = parseFloat(cleanValue);
            
            // Apply negative sign
            if (isNegative) {
              parsed = -parsed;
            }
            
            const result = isNaN(parsed) ? 0 : parsed;
            
            console.log(`🔢 "${originalValue}" -> "${cleanValue}" -> ${result} (negative: ${isNegative})`);
            return result;
          };

          // Parse saldo values - prioritize closing_balance, fall back to balance_current_year
          const openingBalance = parseNumber(account.opening_balance || account.balance_last_year);
          const closingBalance = parseNumber(account.closing_balance || account.balance_current_year || account.saldo);
          
          console.log(`💰 Parsed balances for ${accountNumber}:`, {
            opening_balance: openingBalance,
            closing_balance: closingBalance,
            raw_data: {
              opening_balance: account.opening_balance,
              closing_balance: account.closing_balance,
              balance_current_year: account.balance_current_year,
              balance_last_year: account.balance_last_year,
              saldo: account.saldo
            }
          });

          const trialBalanceData = {
            client_id: clientId,
            client_account_id: accountId,
            opening_balance: openingBalance,
            closing_balance: closingBalance,
            debit_turnover: 0, // Not used for trial balance
            credit_turnover: 0, // Not used for trial balance
            period_start_date: `${accountingYear}-01-01`,
            period_end_date: `${accountingYear}-12-31`,
            period_year: accountingYear,
            version: finalVersion,
            upload_batch_id: batch.id
          };

          console.log(`Upserting trial balance data:`, trialBalanceData);

          const { data: insertedData, error: trialBalanceError } = await supabase
            .from('trial_balances')
            .upsert(trialBalanceData, {
              onConflict: 'client_id,client_account_id,period_start_date,period_end_date,version',
              ignoreDuplicates: false
            })
            .select();

          if (!trialBalanceError) {
            trialBalanceInserted++;
            console.log(`✅ Successfully inserted trial balance for account ${accountNumber}:`, insertedData);
          } else {
            console.error(`❌ Error inserting trial balance for account ${accountNumber}:`, trialBalanceError);
            insertionErrors.push(`Account ${accountNumber}: ${trialBalanceError.message}`);
          }
        } catch (error) {
          console.error(`❌ Exception processing account ${accountNumber}:`, error);
          insertionErrors.push(`Account ${accountNumber}: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        setUploadProgress(40 + ((i + 1) / accounts.length) * 50);
      }

      console.log('=== TRIAL BALANCE INSERTION COMPLETE ===');
      console.log(`Successfully inserted: ${trialBalanceInserted} records`);
      console.log(`Insertion errors: ${insertionErrors.length}`);
      if (insertionErrors.length > 0) {
        console.error('Trial balance insertion errors:', insertionErrors);
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
      
      toast.success(`${trialBalanceInserted} saldobalanse-poster (${finalVersion}) og ${chartOfAccountsCreated} nye kontoer ble importert for ${accountingYear}`);
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
              Last opp Excel eller CSV-fil med saldobalanse for regnskapsåret {accountingYear}
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

            <AccountingYearHeader 
              clientId={clientId || ''} 
              variant="full"
              showSelector={false}
            />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-600">
                📄 Versjon genereres automatisk basert på antall opplastninger for dette året
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Påkrevd format
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Filen må inneholde følgende kolonner:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Kontonr:</strong> Unikt kontonummer (påkrevd)</li>
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