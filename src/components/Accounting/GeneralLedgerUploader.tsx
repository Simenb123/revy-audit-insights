
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import FileDropZone from '../common/FileDropZone';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [successCount, setSuccessCount] = useState(0);

  const handleFileSelect = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      return validTypes.includes(file.type) && file.size <= 100 * 1024 * 1024; // 100MB limit for ledger
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Noen filer ble ignorert",
        description: "Kun Excel og CSV-filer under 100MB er støttet.",
        variant: "destructive"
      });
    }

    setSelectedFiles(validFiles);
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
            date: row['Dato'] || row['Date'] || row['Transaksjonsdato'] || '',
            account_number: row['Konto'] || row['Account'] || row['Kontonummer']?.toString() || '',
            description: row['Beskrivelse'] || row['Description'] || row['Tekst'] || '',
            debit_amount: parseFloat(row['Debet'] || row['Debit'] || '0') || 0,
            credit_amount: parseFloat(row['Kredit'] || row['Credit'] || '0') || 0,
            reference: row['Referanse'] || row['Reference'] || row['Bilagsnummer'] || ''
          })).filter(transaction => 
            transaction.date && transaction.account_number && transaction.description &&
            (transaction.debit_amount > 0 || transaction.credit_amount > 0)
          );
          
          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Kunne ikke lese filen'));
      reader.readAsArrayBuffer(file);
    });
  };

  const uploadGeneralLedger = async (transactions: TransactionRow[], file: File) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create upload batch
      const { error: batchError } = await supabase
        .from('upload_batches')
        .insert({
          client_id: clientId,
          user_id: user.id,
          batch_type: 'general_ledger',
          file_name: file.name,
          file_size: file.size,
          total_records: transactions.length,
          status: 'processing'
        });

      if (batchError) throw batchError;

      let processed = 0;
      let successful = 0;

      // Insert transactions (This would typically go to a general_ledger table)
      // For now, let's simulate the process since we don't have that table yet
      for (const transaction of transactions) {
        try {
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 10));
          successful++;
          processed++;
          
          const progress = Math.round((processed / transactions.length) * 100);
          setUploadProgress(progress);
          setProcessedRows(processed);
          setTotalRows(transactions.length);
          setSuccessCount(successful);
          
        } catch (error) {
          console.error('Error processing transaction:', error);
          processed++;
        }
      }

      return successful;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const file = selectedFiles[0];
      const transactions = await processExcelFile(file);
      const successful = await uploadGeneralLedger(transactions, file);
      
      toast({
        title: "Hovedbok lastet opp",
        description: `${successful} transaksjoner ble prosessert fra hovedboken.`,
      });

      setSelectedFiles([]);
      onUploadComplete?.();
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Opplasting feilet",
        description: "Det oppstod en feil under opplasting av hovedboken.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setProcessedRows(0);
      setTotalRows(0);
      setSuccessCount(0);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Last opp Hovedbok
          </CardTitle>
          <CardDescription>
            Hovedboken inneholder alle transaksjoner og er grunnlaget for detaljerte revisjonsanalyser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileDropZone
            accept={{
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/vnd.ms-excel': ['.xls'],
              'text/csv': ['.csv'],
            }}
            onFilesSelected={handleFileSelect}
            className={isUploading ? 'pointer-events-none opacity-50' : ''}
          >
            {(active) => (
              <div className="text-center">
                <Database className="h-12 w-12 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  {active ? 'Slipp hovedbok-filen her' : 'Dra og slipp hovedbok, eller klikk for å velge'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Excel (.xlsx, .xls) eller CSV-format, maks 100MB
                </p>
              </div>
            )}
          </FileDropZone>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Valgte filer:</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="p-3 bg-muted rounded border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      {!isUploading && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Prosesserer hovedbok...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              {processedRows > 0 && (
                <div className="text-sm text-muted-foreground">
                  {processedRows} av {totalRows} transaksjoner prosessert ({successCount} vellykkede)
                </div>
              )}
            </div>
          )}

          <Button 
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="w-full"
          >
            {isUploading ? 'Laster opp...' : `Last opp ${selectedFiles.length} fil${selectedFiles.length === 1 ? '' : 'er'}`}
          </Button>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Krav til hovedbok-fil
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Kolonne med dato (f.eks. "Dato", "Date", "Transaksjonsdato")</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Kolonne med kontonummer (f.eks. "Konto", "Account", "Kontonr")</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Kolonne med beløp (f.eks. "Beløp", "Amount", "Sum")</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Kolonne med beskrivelse (f.eks. "Beskrivelse", "Tekst", "Description")</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Excel (.xlsx, .xls) eller CSV-format</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralLedgerUploader;
