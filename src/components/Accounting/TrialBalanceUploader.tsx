
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import FileDropZone from '../common/FileDropZone';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface AccountRow {
  account_number: string;
  account_name: string;
  balance?: number;
  account_type?: string;
}

interface TrialBalanceUploaderProps {
  clientId: string;
  onUploadComplete?: () => void;
}

const TrialBalanceUploader = ({ clientId, onUploadComplete }: TrialBalanceUploaderProps) => {
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
      return validTypes.includes(file.type) && file.size <= 50 * 1024 * 1024; // 50MB limit
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Noen filer ble ignorert",
        description: "Kun Excel og CSV-filer under 50MB er støttet.",
        variant: "destructive"
      });
    }

    setSelectedFiles(validFiles);
  };

  const processExcelFile = async (file: File): Promise<AccountRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          const accounts: AccountRow[] = jsonData.map((row: any) => ({
            account_number: row['Kontonummer']?.toString() || row['account_number']?.toString() || '',
            account_name: row['Kontonavn'] || row['account_name'] || row['Kontonavn'] || row['Beskrivelse'] || '',
            balance: parseFloat(row['Balanse'] || row['Saldo'] || row['Balance'] || '0') || 0,
            account_type: 'asset' // Default type for trial balance accounts
          })).filter(account => account.account_number && account.account_name);
          
          resolve(accounts);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Kunne ikke lese filen'));
      reader.readAsArrayBuffer(file);
    });
  };

  const uploadTrialBalance = async (accounts: AccountRow[], file: File) => {
    try {
      const batchId = crypto.randomUUID();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create upload batch
      const { error: batchError } = await supabase
        .from('upload_batches')
        .insert({
          client_id: clientId,
          user_id: user.id,
          batch_type: 'chart_of_accounts',
          file_name: file.name,
          file_size: file.size,
          total_records: accounts.length,
          status: 'processing'
        });

      if (batchError) throw batchError;

      let processed = 0;
      let successful = 0;

      // Insert accounts with batch tracking
      for (const account of accounts) {
        try {
          const { error } = await supabase
            .from('client_chart_of_accounts')
            .insert({
              client_id: clientId,
              account_number: account.account_number,
              account_name: account.account_name,
              account_type: account.account_type,
              opening_balance: account.balance || 0,
              batch_id: batchId
            });

          if (!error) successful++;
          processed++;
          
          const progress = Math.round((processed / accounts.length) * 100);
          setUploadProgress(progress);
          setProcessedRows(processed);
          setTotalRows(accounts.length);
          setSuccessCount(successful);
          
        } catch (error) {
          console.error('Error inserting account:', error);
          processed++;
        }
      }

      // Update batch status
      await supabase
        .from('upload_batches')
        .update({
          status: 'completed',
          processed_records: successful,
          completed_at: new Date().toISOString()
        })
        .eq('id', batchId);

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
      const accounts = await processExcelFile(file);
      const successful = await uploadTrialBalance(accounts, file);
      
      toast({
        title: "Saldobalanse lastet opp",
        description: `${successful} kontoer ble opprettet fra saldobalansen.`,
      });

      setSelectedFiles([]);
      onUploadComplete?.();
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Opplasting feilet",
        description: "Det oppstod en feil under opplasting av saldobalansen.",
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
            <FileSpreadsheet className="h-5 w-5" />
            Last opp Saldobalanse
          </CardTitle>
          <CardDescription>
            Saldobalansen etablerer kontostrukturen. Filen bør inneholde kolonner for kontonummer, kontonavn og balanse.
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
                <FileSpreadsheet className="h-12 w-12 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  {active ? 'Slipp saldobalanse-filen her' : 'Dra og slipp saldobalanse, eller klikk for å velge'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Excel (.xlsx, .xls) eller CSV-format, maks 50MB
                </p>
              </div>
            )}
          </FileDropZone>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Valgt fil:</Label>
              <div className="p-3 bg-muted rounded border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="text-sm font-medium">{selectedFiles[0].name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(selectedFiles[0].size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                  {!isUploading && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedFiles([])}
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Laster opp og prosesserer...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <Button 
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="w-full"
          >
            {isUploading ? 'Laster opp...' : 'Last opp saldobalanse'}
          </Button>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Krav til saldobalanse-fil
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Kolonne med kontonummer (f.eks. "Kontonummer", "Konto", "Account")</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Kolonne med kontonavn (f.eks. "Kontonavn", "Beskrivelse", "Description")</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Kolonne med balanse (f.eks. "Balanse", "Saldo", "Balance")</span>
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

export default TrialBalanceUploader;
