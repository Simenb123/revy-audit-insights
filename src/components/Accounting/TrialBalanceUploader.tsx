import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, Database, AlertCircle, Calendar, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import EnhancedPreview from '@/components/DataUpload/EnhancedPreview';
import { DataManagementPanel } from '@/components/DataUpload/DataManagementPanel';
import { useAccountingYear } from '@/hooks/useAccountingYear';
import { useAvailableVersions } from '@/hooks/useAvailableVersions';
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
  const { accountingYear } = useAccountingYear(clientId);
  const { data: availableVersions, isLoading: versionsLoading } = useAvailableVersions(clientId);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [showMapping, setShowMapping] = useState(false);
  const [convertedData, setConvertedData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<'select' | 'upload' | 'success'>('select');
  const [periodYear, setPeriodYear] = useState<string>('2024');
  const [periodStartDate, setPeriodStartDate] = useState<string>('2024-01-01');
  const [periodEndDate, setPeriodEndDate] = useState<string>('2024-12-31');
  const [version, setVersion] = useState<string>('v1');
  const [customVersion, setCustomVersion] = useState<string>('');
  const [showCustomVersion, setShowCustomVersion] = useState(false);

  // Update default values when accounting year changes
  React.useEffect(() => {
    if (accountingYear) {
      setPeriodYear(accountingYear.toString());
      setPeriodStartDate(`${accountingYear}-01-01`);
      setPeriodEndDate(`${accountingYear}-12-31`);
    }
  }, [accountingYear]);

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

    // Use custom version if provided, otherwise use selected version
    const finalVersion = showCustomVersion && customVersion ? customVersion : version;

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
          // Parse numeric values safely with improved Norwegian format handling
          const parseNumber = (value: any): number => {
            if (value === null || value === undefined || value === '') return 0;
            
            const originalValue = value.toString().trim();
            console.log(`🔢 Parsing number: "${originalValue}"`);
            
            // Remove whitespace and non-numeric characters except commas, periods, and minus
            let cleanValue = originalValue.replace(/\s/g, '').replace(/[^\d,.-]/g, '');
            
            // Handle Norwegian number formats
            if (cleanValue.includes(',') && cleanValue.includes('.')) {
              // Both comma and period - determine which is decimal separator
              const lastComma = cleanValue.lastIndexOf(',');
              const lastPeriod = cleanValue.lastIndexOf('.');
              
              if (lastComma > lastPeriod) {
                // Comma is decimal separator: "1.234,56"
                cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
              } else {
                // Period is decimal separator: "1,234.56"
                cleanValue = cleanValue.replace(/,/g, '');
              }
            } else if (cleanValue.includes(',')) {
              // Only comma - check if it's likely a decimal separator
              const parts = cleanValue.split(',');
              if (parts.length === 2 && parts[1].length <= 2) {
                // Likely decimal separator: "1234,56"
                cleanValue = cleanValue.replace(',', '.');
              } else {
                // Likely thousands separator: "1,234"
                cleanValue = cleanValue.replace(/,/g, '');
              }
            }
            
            const parsed = parseFloat(cleanValue);
            const result = isNaN(parsed) ? 0 : parsed;
            
            console.log(`🔢 "${originalValue}" -> "${cleanValue}" -> ${result}`);
            return result;
          };

          const openingBalance = parseNumber(account.opening_balance);
          const debitTurnover = parseNumber(account.debit_turnover);
          const creditTurnover = parseNumber(account.credit_turnover);
          const closingBalance = parseNumber(account.closing_balance);

          console.log(`Account ${accountNumber} values:`, {
            openingBalance,
            debitTurnover,
            creditTurnover,
            closingBalance,
            accountId
          });

          const trialBalanceData = {
            client_id: clientId,
            client_account_id: accountId,
            upload_batch_id: batch.id,
            period_year: parseInt(periodYear),
            period_start_date: periodStartDate,
            period_end_date: periodEndDate,
            opening_balance: openingBalance,
            debit_turnover: debitTurnover,
            credit_turnover: creditTurnover,
            closing_balance: closingBalance,
            version: finalVersion
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="period-year" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Regnskapsår
                </Label>
                <Select value={periodYear} onValueChange={setPeriodYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg år" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - 5 + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="period-start">Periode startdato</Label>
                <Input
                  id="period-start"
                  type="date"
                  value={periodStartDate}
                  onChange={(e) => setPeriodStartDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="period-end">Periode sluttdato</Label>
                <Input
                  id="period-end"
                  type="date"
                  value={periodEndDate}
                  onChange={(e) => setPeriodEndDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="version">Versjon</Label>
                {!showCustomVersion ? (
                  <div className="flex gap-2">
                    <Select value={version} onValueChange={setVersion}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Velg versjon" />
                      </SelectTrigger>
                      <SelectContent>
                        {(availableVersions || ['v1']).map((v) => (
                          <SelectItem key={v} value={v}>
                            {v.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomVersion(true)}
                      className="px-3"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="f.eks. v6, interim1, etc."
                      value={customVersion}
                      onChange={(e) => setCustomVersion(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCustomVersion(false);
                        setCustomVersion('');
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                )}
              </div>
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