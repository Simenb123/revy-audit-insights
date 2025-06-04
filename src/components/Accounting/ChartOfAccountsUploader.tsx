
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ChartOfAccountsUploaderProps {
  clientId: string;
  onUploadComplete?: () => void;
}

interface AccountRow {
  account_number: string;
  account_name: string;
  account_type: string;
  parent_account_number?: string;
}

const ChartOfAccountsUploader = ({ clientId, onUploadComplete }: ChartOfAccountsUploaderProps) => {
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
            account_name: row['Kontonavn'] || row['account_name'] || '',
            account_type: row['Kontotype'] || row['account_type'] || 'asset',
            parent_account_number: row['Overordnet konto'] || row['parent_account'] || undefined,
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

  const uploadChartOfAccounts = async () => {
    if (!file || !clientId) return;

    setIsUploading(true);
    setProgress(0);
    
    try {
      // Process the Excel file
      const accounts = await processExcelFile(file);
      setProgress(25);

      // Create upload batch record
      const { data: batch, error: batchError } = await supabase
        .from('upload_batches')
        .insert({
          client_id: clientId,
          user_id: (await supabase.auth.getUser()).data.user?.id!,
          batch_type: 'chart_of_accounts',
          file_name: file.name,
          file_size: file.size,
          total_records: accounts.length,
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) throw batchError;
      setProgress(50);

      // Insert accounts
      const accountsToInsert = accounts.map(account => ({
        client_id: clientId,
        account_number: account.account_number,
        account_name: account.account_name,
        account_type: account.account_type,
        is_active: true
      }));

      const { data: insertedAccounts, error: insertError } = await supabase
        .from('client_chart_of_accounts')
        .upsert(accountsToInsert, { 
          onConflict: 'client_id,account_number',
          ignoreDuplicates: false 
        })
        .select();

      if (insertError) throw insertError;
      setProgress(75);

      // Update batch status
      await supabase
        .from('upload_batches')
        .update({
          status: 'completed',
          processed_records: insertedAccounts?.length || 0,
          completed_at: new Date().toISOString()
        })
        .eq('id', batch.id);

      setProgress(100);
      
      setUploadResult({
        success: true,
        message: `${insertedAccounts?.length || 0} kontoer ble lastet opp`,
        processed: insertedAccounts?.length || 0,
        errors: []
      });

      toast({
        title: "Kontoplan lastet opp",
        description: `${insertedAccounts?.length || 0} kontoer ble importert`,
      });

      onUploadComplete?.();
      
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
          Last opp kontoplan
        </CardTitle>
        <CardDescription>
          Last opp kontoplan fra Excel-fil. Filen må inneholde kolonnene: Kontonummer, Kontonavn, Kontotype
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
            onClick={uploadChartOfAccounts}
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
              Prosesserer kontoplan... {progress}%
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
              <ul className="mt-2 list-disc list-inside text-sm">
                {uploadResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartOfAccountsUploader;
