
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
import { 
  processExcelFile, 
  processCSVFile, 
  FilePreview, 
  convertDataWithMapping
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
  const [balanceCheck, setBalanceCheck] = useState<{ isBalanced: boolean; totalDebit: number; totalCredit: number; difference: number } | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);
  
  const createVersion = useCreateVersion();

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
      setConvertedData(convertedData);
      
      // Calculate balance check
      const totalDebit = convertedData.reduce((sum, t) => sum + (t.debit_amount || 0), 0);
      const totalCredit = convertedData.reduce((sum, t) => sum + (t.credit_amount || 0), 0);
      const difference = Math.abs(totalDebit - totalCredit);
      const isBalanced = difference < 0.01; // Allow for small rounding errors
      
      setBalanceCheck({
        isBalanced,
        totalDebit,
        totalCredit,
        difference
      });
      
      setStep('preview');
    } catch (error) {
      toast.error('Feil ved datakonvertering');
      console.error(error);
      setStep('select');
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !convertedData.length) return;
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
    if (!clientId || !balanceCheck) return;

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
        totalDebitAmount: balanceCheck.totalDebit,
        totalCreditAmount: balanceCheck.totalCredit,
        balanceDifference: balanceCheck.difference,
        metadata: {
          isBalanced: balanceCheck.isBalanced,
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
            return {
              client_id: clientId,
              client_account_id: accountId,
              upload_batch_id: batch.id,
              version_id: version.id, // Link to version
              transaction_date: transactionDate.toISOString().split('T')[0],
              period_year: transactionDate.getFullYear(),
              period_month: transactionDate.getMonth() + 1,
              voucher_number: transaction.reference || null,
              description: transaction.description || '',
              debit_amount: transaction.debit_amount || null,
              credit_amount: transaction.credit_amount || null,
              balance_amount: (transaction.debit_amount || 0) - (transaction.credit_amount || 0),
              reference_number: transaction.reference || null,
            };
          })
          .filter(Boolean);
        
        try {
          const { error: insertError } = await supabase
            .from('general_ledger_transactions')
            .insert(transactionsToInsert);
            
          if (insertError) {
            console.error('Error inserting batch:', insertError);
            throw insertError;
          } else {
            successful += transactionsToInsert.length;
          }
        } catch (error) {
          console.error(`Error processing batch:`, error);
          throw error;
        }
        
        setUploadProgress(40 + ((i + batchTransactions.length) / transactions.length) * 50);
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
      
      toast.success(`Ny versjon av hovedbok opprettet med ${successful} transaksjoner`);
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

      {step === 'preview' && balanceCheck && (
        <div className="space-y-6">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Debet</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {balanceCheck.totalDebit.toLocaleString('nb-NO', { 
                      style: 'currency', 
                      currency: 'NOK',
                      minimumFractionDigits: 2
                    })}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Total Kredit</p>
                  <p className="text-2xl font-bold text-green-800">
                    {balanceCheck.totalCredit.toLocaleString('nb-NO', { 
                      style: 'currency', 
                      currency: 'NOK',
                      minimumFractionDigits: 2
                    })}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${balanceCheck.isBalanced ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`text-sm font-medium ${balanceCheck.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    Differanse
                  </p>
                  <p className={`text-2xl font-bold ${balanceCheck.isBalanced ? 'text-green-800' : 'text-red-800'}`}>
                    {balanceCheck.difference.toLocaleString('nb-NO', { 
                      style: 'currency', 
                      currency: 'NOK',
                      minimumFractionDigits: 2
                    })}
                  </p>
                </div>
              </div>

              {/* Balance Status Alert */}
              <Alert className={balanceCheck.isBalanced ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                <div className="flex items-center gap-2">
                  {balanceCheck.isBalanced ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  )}
                  <AlertDescription className={balanceCheck.isBalanced ? 'text-green-800' : 'text-yellow-800'}>
                    {balanceCheck.isBalanced 
                      ? "✅ Hovedboken er balansert - debet og kredit stemmer overens!"
                      : `⚠️ Hovedboken er ikke balansert. Differanse på ${balanceCheck.difference.toFixed(2)} kr. Dette kan indikere feil i dataene.`
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
                    className={balanceCheck.isBalanced ? '' : 'bg-yellow-600 hover:bg-yellow-700'}
                  >
                    {balanceCheck.isBalanced ? 'Bekreft opplasting' : 'Fortsett likevel'}
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
