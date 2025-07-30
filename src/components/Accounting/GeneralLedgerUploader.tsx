
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, Database, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import EnhancedPreview from '@/components/DataUpload/EnhancedPreview';
import { DataManagementPanel } from '@/components/DataUpload/DataManagementPanel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useCreateVersion } from '@/hooks/useAccountingVersions';
import { useGeneralLedgerValidation } from '@/hooks/useGeneralLedgerValidation';
import { 
  processExcelFile, 
  processCSVFile, 
  FilePreview, 
  convertDataWithMapping,
  calculateAmountStatistics,
  formatNorwegianNumber
} from '@/utils/fileProcessing';

interface TransactionRow {
  date: string;
  account_number: string;
  description: string;
  debit_amount?: number;
  credit_amount?: number;
  reference?: string;
}

interface GeneralLedgerUploaderProps {
  clientId: string;
  onUploadComplete?: () => void;
}

const GeneralLedgerUploader = ({ clientId, onUploadComplete }: GeneralLedgerUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [showMapping, setShowMapping] = useState(false);
  const [convertedData, setConvertedData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<'select' | 'preview' | 'upload' | 'success'>('select');
  const [previewData, setPreviewData] = useState<{ data: any[]; totalBalance: number; balanceDifference: number; isBalanced: boolean; fileName: string } | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [amountStats, setAmountStats] = useState<any>(null);
  
  const createVersion = useCreateVersion();

  // Validation component to check voucher balance
  const ValidationResults = ({ data }: { data: any[] }) => {
    const validation = useGeneralLedgerValidation(data);
    
    if (validation.totalValidationErrors === 0) {
      return (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Alle bilag er i balanse (debet = kredit per bilag)
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="w-4 h-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          ⚠️ {validation.totalValidationErrors} bilag har ubalanse. Dette kan være normalt for hovedbok-data.
          {validation.vouchersWithImbalance.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer">Vis detaljer</summary>
              <div className="mt-2 text-xs">
                {validation.vouchersWithImbalance.slice(0, 5).map((voucher, idx) => (
                  <div key={idx}>
                    Bilag {voucher.voucherNumber}: {voucher.balance.toFixed(2)} kr ({voucher.transactionCount} transaksjoner)
                  </div>
                ))}
                {validation.vouchersWithImbalance.length > 5 && 
                  <div>...og {validation.vouchersWithImbalance.length - 5} flere</div>
                }
              </div>
            </details>
          )}
        </AlertDescription>
      </Alert>
    );
  };

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
    
    setShowMapping(false);
    
    try {
      const convertedData = convertDataWithMapping(filePreview, mapping);
      console.log('=== POST-MAPPING BALANCE CALCULATION ===');
      console.log('Converted data length:', convertedData.length);
      console.log('Sample converted rows:', convertedData.slice(0, 3));
      
      setConvertedData(convertedData);
      
      // Calculate comprehensive amount statistics
      const stats = calculateAmountStatistics(convertedData);
      setAmountStats(stats);
      
      console.log('=== AMOUNT STATISTICS ===');
      console.log(`Positive amounts: ${stats.positiveCount} (${formatNorwegianNumber(stats.positiveSum)} kr)`);
      console.log(`Negative amounts: ${stats.negativeCount} (${formatNorwegianNumber(stats.negativeSum)} kr)`);
      console.log(`Zero amounts: ${stats.zeroCount}`);
      console.log(`Missing amounts: ${stats.noAmountCount}`);
      console.log(`Conversion errors: ${stats.conversionErrors}`);
      console.log(`Total sum: ${formatNorwegianNumber(stats.totalSum)} kr`);
      
      // Enhanced balance calculation - handle both debit/credit and balance_amount
      let totalBalance = 0;
      let debitTotal = 0;
      let creditTotal = 0;
      let hasDebCred = false;
      let hasBalance = false;
      
      convertedData.forEach((t, index) => {
        // Use numbers directly from fileProcessing.ts conversion - no additional parsing needed
        const parseAmount = (value: any): number => {
          if (value === null || value === undefined) return 0;
          if (typeof value === 'number') return isNaN(value) ? 0 : value;
          return 0; // Should not happen as fileProcessing.ts converts to numbers
        };
        
        const debit = parseAmount(t.debit_amount);
        const credit = parseAmount(t.credit_amount);
        const balance = parseAmount(t.balance_amount);
        
        if (debit !== 0 || credit !== 0) hasDebCred = true;
        if (balance !== 0) hasBalance = true;
        
        debitTotal += debit;
        creditTotal += credit;
        totalBalance += balance;
        
        // Log first few transactions for debugging
        if (index < 5) {
          console.log(`Transaction ${index + 1}:`, {
            debit: debit,
            credit: credit,
            balance: balance,
            original: { debit_amount: t.debit_amount, credit_amount: t.credit_amount, balance_amount: t.balance_amount }
          });
        }
      });
      
      console.log('Balance calculation results:', {
        hasDebCred,
        hasBalance,
        debitTotal,
        creditTotal,
        totalBalance,
        debitCreditDiff: Math.abs(debitTotal - creditTotal)
      });
      
      // Determine final balance and if it's balanced
      let finalBalance;
      let isBalanced;
      const tolerance = 0.01;
      
      if (hasDebCred) {
        // Use debit/credit difference
        finalBalance = Math.abs(debitTotal - creditTotal);
        isBalanced = finalBalance <= tolerance;
      } else {
        // Use balance_amount sum
        finalBalance = Math.abs(totalBalance);
        isBalanced = finalBalance <= tolerance;
      }
      
      console.log('Final balance assessment:', { finalBalance, isBalanced });
      
      const balanceDifference = finalBalance;
      
      setPreviewData({
        data: convertedData,
        totalBalance: finalBalance,
        balanceDifference,
        isBalanced,
        fileName: selectedFile.name
      });
      
      console.log('=== CONVERTED DATA SAMPLE FOR VALIDATION ===');
      console.log('First 5 converted transactions:', convertedData.slice(0, 5));
      console.log('=== END SAMPLE ===');
      
      setStep('preview');
    } catch (error) {
      toast.error('Feil ved datakonvertering');
      console.error(error);
      setStep('select');
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !convertedData.length || !previewData) return;
    setStep('upload');
    await uploadGeneralLedger(convertedData, selectedFile);
  };

  const findOrCreateAccounts = async (accountNumbers: string[]) => {
    const uniqueAccountNumbers = [...new Set(accountNumbers)];
    const accountMapping = new Map<string, string>();

    // Get existing accounts
    const { data: existingAccounts } = await supabase
      .from('client_chart_of_accounts')
      .select('id, account_number')
      .eq('client_id', clientId)
      .in('account_number', uniqueAccountNumbers);

    // Map existing accounts
    existingAccounts?.forEach(account => {
      accountMapping.set(account.account_number, account.id);
    });

    // Find missing accounts
    const missingAccountNumbers = uniqueAccountNumbers.filter(
      num => !accountMapping.has(num)
    );

    // Create missing accounts
    if (missingAccountNumbers.length > 0) {
      const accountsToCreate = missingAccountNumbers.map(accountNumber => ({
        client_id: clientId,
        account_number: accountNumber,
        account_name: `Konto ${accountNumber}`, // Default name
        account_type: 'resultat' as const, // Default type from enum
        is_active: true
      }));

      const { data: newAccounts, error } = await supabase
        .from('client_chart_of_accounts')
        .insert(accountsToCreate)
        .select('id, account_number');

      if (error) throw error;

      // Map new accounts
      newAccounts?.forEach(account => {
        accountMapping.set(account.account_number, account.id);
      });

      toast.info(`${missingAccountNumbers.length} nye kontoer ble opprettet automatisk`);
    }

    return accountMapping;
  };

  const uploadGeneralLedger = async (transactions: any[], file: File) => {
    if (!clientId || !previewData) return;

    try {
      setUploadProgress(10);

      // Create upload batch record
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data: batch, error: batchError } = await supabase
        .from('upload_batches')
        .insert({
          client_id: clientId,
          user_id: userId,
          batch_type: 'general_ledger',
          file_name: file.name,
          file_size: file.size,
          total_records: transactions.length,
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) throw batchError;
      setUploadProgress(20);

      // Create new version
      const version = await createVersion.mutateAsync({
        clientId,
        fileName: file.name,
        uploadBatchId: batch.id,
        totalTransactions: transactions.length,
        totalDebitAmount: 0, // Not used for general ledger
        totalCreditAmount: 0, // Not used for general ledger
        balanceDifference: previewData.balanceDifference,
        metadata: {
          isBalanced: previewData.isBalanced,
          totalBalance: previewData.totalBalance,
          uploadDate: new Date().toISOString()
        }
      });

      setVersionId(version.id);
      setUploadProgress(30);

      // Get all unique account numbers from transactions
      const accountNumbers = transactions
        .map(t => t.account_number?.toString())
        .filter(Boolean) as string[];

      // Find or create accounts and get UUID mapping
      const accountMapping = await findOrCreateAccounts(accountNumbers);
      setUploadProgress(40);

      // Insert transactions into general_ledger_transactions table
      let successful = 0;
      const batchSize = 100; // Process in batches for better performance
      
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batchTransactions = transactions.slice(i, Math.min(i + batchSize, transactions.length));
        
        // Prepare transactions for insertion
        const transactionsToInsert = batchTransactions
          .map(transaction => {
            const accountNumber = transaction.account_number?.toString();
            const accountId = accountMapping.get(accountNumber);
            
            if (!accountId) {
              console.warn(`No account ID found for account number: ${accountNumber}`);
              return null;
            }

            const transactionDate = new Date(transaction.date);
            
            // Use amounts directly from fileProcessing.ts - no additional parsing needed
            const parseAmount = (value: any): number => {
              if (value === undefined || value === null) return 0;
              if (typeof value === 'number') return isNaN(value) ? 0 : value;
              // Should not reach here as fileProcessing.ts converts to numbers
              console.warn(`Unexpected non-number value in parseAmount: ${typeof value} = ${value}`);
              return 0;
            };
            
            // Extract amounts - should already be converted to numbers by fileProcessing.ts
            let debitAmount = null;
            let creditAmount = null;
            let balanceAmount = 0;
            
            // Debug logging for amount extraction
            console.log(`Transaction amounts for account ${transaction.account_number}:`, {
              balance_amount: transaction.balance_amount,
              debit_amount: transaction.debit_amount,
              credit_amount: transaction.credit_amount,
              types: {
                balance: typeof transaction.balance_amount,
                debit: typeof transaction.debit_amount,
                credit: typeof transaction.credit_amount
              }
            });
            
            // Primary: Use balance_amount if it's a meaningful non-zero number
            const hasBalanceAmount = transaction.balance_amount !== undefined && 
                                   transaction.balance_amount !== null && 
                                   typeof transaction.balance_amount === 'number' && 
                                   !isNaN(transaction.balance_amount) && 
                                   transaction.balance_amount !== 0;
            
            if (hasBalanceAmount) {
              balanceAmount = transaction.balance_amount;
              console.log(`Using balance_amount: ${balanceAmount}`);
              
              // Set debit/credit based on sign
              if (balanceAmount > 0) {
                debitAmount = balanceAmount;
                creditAmount = null;
              } else if (balanceAmount < 0) {
                debitAmount = null;
                creditAmount = Math.abs(balanceAmount);
              }
            } else {
              // Fallback: Use separate debit/credit fields
              console.log(`Falling back to debit/credit fields`);
              
              const hasDebitAmount = transaction.debit_amount !== undefined && 
                                   transaction.debit_amount !== null && 
                                   typeof transaction.debit_amount === 'number' && 
                                   !isNaN(transaction.debit_amount) && 
                                   transaction.debit_amount !== 0;
              
              const hasCreditAmount = transaction.credit_amount !== undefined && 
                                    transaction.credit_amount !== null && 
                                    typeof transaction.credit_amount === 'number' && 
                                    !isNaN(transaction.credit_amount) && 
                                    transaction.credit_amount !== 0;
              
              if (hasDebitAmount) {
                debitAmount = transaction.debit_amount;
                console.log(`Using debit_amount: ${debitAmount}`);
              }
              if (hasCreditAmount) {
                creditAmount = transaction.credit_amount;
                console.log(`Using credit_amount: ${creditAmount}`);
              }
              
              // Calculate balance from debit/credit
              balanceAmount = (debitAmount || 0) - (creditAmount || 0);
            }
            
            // Final validation - ensure we have some amount
            if (debitAmount === null && creditAmount === null) {
              console.error(`No valid amounts found for transaction:`, transaction);
              return null; // Skip this transaction
            }
            
            // Extract voucher number from various possible fields
            const voucherNumber = transaction.voucher_number || 
                                 transaction.bilagsnummer || 
                                 transaction.voucher || 
                                 transaction.reference || 
                                 null;
            
            return {
              client_id: clientId,
              client_account_id: accountId,
              upload_batch_id: batch.id,
              version_id: version.id,
              transaction_date: transactionDate.toISOString().split('T')[0],
              period_year: transactionDate.getFullYear(),
              period_month: transactionDate.getMonth() + 1,
              voucher_number: voucherNumber,
              description: transaction.description || '',
              debit_amount: debitAmount,
              credit_amount: creditAmount,
              balance_amount: balanceAmount,
              reference_number: transaction.reference || null,
            };
          })
          .filter(Boolean);
        
        // Validation before insert
        if (transactionsToInsert.length === 0) {
          console.warn(`Batch ${Math.floor(i/batchSize) + 1}: No valid transactions to insert`);
          continue;
        }
        
        // Debug critical info
        const amountCheck = transactionsToInsert.slice(0, 3).map(t => ({
          account: t.client_account_id,
          version_id: t.version_id,
          balance_amount: t.balance_amount,
          debit_amount: t.debit_amount,
          credit_amount: t.credit_amount
        }));
        console.log(`Batch ${Math.floor(i/batchSize) + 1} - Inserting ${transactionsToInsert.length} transactions:`, amountCheck);
        
        try {
          const { error: insertError } = await supabase
            .from('general_ledger_transactions')
            .insert(transactionsToInsert);
            
          if (insertError) {
            console.error('Insert error:', insertError);
            throw new Error(`Database insert failed: ${insertError.message}`);
          }
          
          successful += transactionsToInsert.length;
          console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: Successfully inserted ${transactionsToInsert.length} transactions`);
        } catch (error: any) {
          console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error);
          throw error;
        }
        
        setUploadProgress(40 + ((i + batchTransactions.length) / transactions.length) * 50);
      }

      // Verify transactions were inserted
      const { data: verifyData, error: verifyError } = await supabase
        .from('general_ledger_transactions')
        .select('id, balance_amount, version_id')
        .eq('version_id', version.id)
        .limit(5);
        
      if (verifyError) {
        console.error('Verification failed:', verifyError);
        throw new Error('Could not verify transaction insertion');
      }
      
      console.log(`✅ Verification: Found ${verifyData?.length || 0} transactions for version ${version.id}`);
      console.log('Sample transactions:', verifyData);
      
      if (!verifyData || verifyData.length === 0) {
        throw new Error('No transactions were saved to the database. Please check the upload process.');
      }

      // Update batch status
      await supabase
        .from('upload_batches')
        .update({
          status: 'completed',
          processed_records: successful,
          completed_at: new Date().toISOString()
        })
        .eq('id', batch.id);

      setUploadProgress(100);
      setStep('success');
      
      toast.success(`✅ Hovedbok opplastet! ${successful} transaksjoner i versjon ${version.version_number}`);
      onUploadComplete?.();
      
    } catch (error: any) {
      toast.error(`Feil ved opplasting: ${error.message || 'Ukjent feil'}`);
      console.error('Upload error:', error);
      setStep('select');
    }
  };

  return (
    <div className="space-y-6">
      {showMapping && filePreview && (
        <EnhancedPreview
          preview={filePreview}
          fileName={selectedFile?.name || ''}
          clientId={clientId}
          fileType="general_ledger"
          onMappingComplete={handleMappingComplete}
          onCancel={() => setShowMapping(false)}
        />
      )}

      {step === 'success' && (
        <div className="space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Database className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Hovedbok lastet opp!
                </h3>
                <p className="text-green-700 mb-4">
                  {convertedData.length} transaksjoner ble importert fra {selectedFile?.name}
                </p>
                <button
                  onClick={() => {
                    setStep('select');
                    setSelectedFile(null);
                    setFilePreview(null);
                    setConvertedData([]);
                    setUploadProgress(0);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Last opp ny fil
                </button>
              </div>
            </CardContent>
          </Card>
          
          <DataManagementPanel 
            clientId={clientId}
            lastUploadSummary={{
              fileName: selectedFile?.name || '',
              recordsImported: convertedData.length,
              uploadDate: new Date().toLocaleDateString('nb-NO'),
              dataType: "Hovedbok"
            }}
          />
        </div>
      )}

      {step === 'preview' && previewData && (
        <div className="space-y-6">
          <ValidationResults data={previewData.data} />
          
          {/* Amount Statistics */}
          {amountStats && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Beløp-statistikk
                </CardTitle>
                <CardDescription>
                  Detaljert oversikt over beløp i hovedboksfilen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-3">
                    <p className="font-medium text-slate-700">Transaksjoner</p>
                    <div className="space-y-1">
                      <p>Positive beløp: <span className="font-mono">{amountStats.positiveCount}</span></p>
                      <p>Negative beløp: <span className="font-mono">{amountStats.negativeCount}</span></p>
                      <p>Null-beløp: <span className="font-mono">{amountStats.zeroCount}</span></p>
                      <p className={amountStats.noAmountCount > 0 ? "text-amber-600" : ""}>
                        Manglende beløp: <span className="font-mono">{amountStats.noAmountCount}</span>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="font-medium text-slate-700">Summer</p>
                    <div className="space-y-1">
                      <p>Sum positive: <span className="font-mono text-green-600">{formatNorwegianNumber(amountStats.positiveSum)} kr</span></p>
                      <p>Sum negative: <span className="font-mono text-red-600">{formatNorwegianNumber(amountStats.negativeSum)} kr</span></p>
                      <p className="font-bold">Total sum: <span className="font-mono">{formatNorwegianNumber(amountStats.totalSum)} kr</span></p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="font-medium text-slate-700">Kvalitet</p>
                    <div className="space-y-1">
                      <p className={amountStats.conversionErrors > 0 ? "text-red-600" : "text-green-600"}>
                        Konverteringsfeil: <span className="font-mono">{amountStats.conversionErrors}</span>
                      </p>
                      {amountStats.conversionErrors > 0 && (
                        <p className="text-red-600 text-xs">⚠️ Noen beløp kunne ikke konverteres</p>
                      )}
                      {amountStats.positiveSum === 0 && amountStats.negativeSum === 0 && amountStats.totalSum === 0 && (
                        <p className="text-red-600 text-xs font-bold">🚨 Ingen gyldige beløp funnet!</p>
                      )}
                      {amountStats.positiveSum > 0 || amountStats.negativeSum < 0 ? (
                        <p className="text-green-600 text-xs">✅ Beløp konvertert OK</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Bekreft hovedbok-opplasting
              </CardTitle>
              <CardDescription>
                Sjekk balansen før opplasting av {selectedFile?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Balance Check Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Balanse</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {previewData.totalBalance.toLocaleString('nb-NO', { 
                      style: 'currency', 
                      currency: 'NOK',
                      minimumFractionDigits: 2
                    })}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${previewData.isBalanced ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`text-sm font-medium ${previewData.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    Balanse Differanse
                  </p>
                  <p className={`text-2xl font-bold ${previewData.isBalanced ? 'text-green-800' : 'text-red-800'}`}>
                    {previewData.balanceDifference.toLocaleString('nb-NO', { 
                      style: 'currency', 
                      currency: 'NOK',
                      minimumFractionDigits: 2
                    })}
                  </p>
                </div>
              </div>

              {/* Balance Status Alert */}
              <Alert className={previewData.isBalanced ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                <div className="flex items-center gap-2">
                  {previewData.isBalanced ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  )}
                  <AlertDescription className={previewData.isBalanced ? 'text-green-800' : 'text-yellow-800'}>
                    {previewData.isBalanced 
                      ? "✅ Hovedboken har en god balanse!"
                      : `⚠️ Hovedbokens balanse avviker med ${previewData.balanceDifference.toFixed(2)} kr fra null. Dette kan være normalt for hovedbok-data.`
                    }
                  </AlertDescription>
                </div>
              </Alert>

              {/* Transaction Summary */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Opplastingssammendrag</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Antall transaksjoner:</span>
                    <span className="ml-2 font-medium">{convertedData.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Filnavn:</span>
                    <span className="ml-2 font-medium">{selectedFile?.name}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('select')}
                >
                  Avbryt
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowMapping(true)}
                  >
                    Tilbake til mapping
                  </Button>
                  <Button 
                    onClick={handleConfirmUpload}
                    className={previewData.isBalanced ? '' : 'bg-yellow-600 hover:bg-yellow-700'}
                  >
                    {previewData.isBalanced ? 'Bekreft opplasting' : 'Fortsett likevel'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'upload' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Laster opp hovedbok...</h3>
            <p className="text-muted-foreground">
              Behandler {convertedData.length} transaksjoner
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
              Last opp hovedbok
            </CardTitle>
            <CardDescription>
              Last opp Excel eller CSV-fil med hovedbok for {clientId}
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
                  <li><strong>Dato:</strong> Transaksjonsdato (påkrevd)</li>
                  <li><strong>Kontonummer:</strong> Regnskapskonto (påkrevd)</li>
                  <li><strong>Beskrivelse:</strong> Transaksjonsbeskrivelse (påkrevd)</li>
                  <li><strong>Beløp/Debet/Kredit:</strong> Transaksjonsbeløp (påkrevd)</li>
                  <li><strong>Referanse:</strong> Bilagsnummer eller referanse (valgfri)</li>
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

export default GeneralLedgerUploader;
