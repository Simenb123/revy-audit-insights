import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UploadZone from '@/components/DataUpload/UploadZone';
import { Progress } from '@/components/ui/progress';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { convertAccountType } from '@/utils/accountTypeMapping';
import AccountCSVMapping from './AccountCSVMapping';

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
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    processed: number;
    errors: string[];
  } | null>(null);
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [showMapping, setShowMapping] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setUploadResult(null);

    if (selectedFile.name.toLowerCase().endsWith('.csv')) {
      const parsed = await parseCSVFile(selectedFile);
      setCsvData(parsed);
      setShowMapping(true);
    } else {
      const accounts = await processExcelFile(selectedFile);
      uploadChartOfAccounts(accounts, selectedFile);
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

  const parseCSVFile = async (
    file: File
  ): Promise<{ headers: string[]; rows: Record<string, string>[] }> => {
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map(f => f.replace(/^"|"$/g, ''));
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(line => {
      const values = parseLine(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });
      return obj;
    });
    return { headers, rows };
  };

  const handleMappingComplete = (mapping: Record<string, string>) => {
    if (!csvData || !file) return;
    setShowMapping(false);
    const getColumn = (field: string) =>
      Object.keys(mapping).find(col => mapping[col] === field);
    const accounts: AccountRow[] = csvData.rows
      .map(row => ({
        account_number: row[getColumn('account_number') || '']?.toString() || '',
        account_name: row[getColumn('account_name') || ''] || '',
        account_type: row[getColumn('account_type') || ''] || 'asset',
      }))
      .filter(a => a.account_number && a.account_name);
    uploadChartOfAccounts(accounts, file);
  };

  const handleMappingCancel = () => {
    setShowMapping(false);
    setCsvData(null);
    setFile(null);
  };

  const uploadChartOfAccounts = async (accounts: AccountRow[], source: File) => {
    if (!clientId) return;

    setIsUploading(true);
    setProgress(0);
    
    try {
      setProgress(25);

      // Create upload batch record
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data: batch, error: batchError } = await supabase
        .from('upload_batches')
        .insert({
          client_id: clientId,
          user_id: userId,
          batch_type: 'chart_of_accounts',
          file_name: source.name,
          file_size: source.size,
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
        account_type: convertAccountType(account.account_type) as "eiendeler" | "gjeld" | "egenkapital" | "resultat",
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
      logger.error('Upload error:', error);
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

  if (showMapping && csvData) {
    return (
      <AccountCSVMapping
        headers={csvData.headers}
        sampleData={csvData.rows}
        onComplete={handleMappingComplete}
        onCancel={handleMappingCancel}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Last opp kontoplan
        </CardTitle>
        <CardDescription>
          Last opp kontoplan fra Excel- eller CSV-fil
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <UploadZone
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileSelect={onFileSelect}
        />

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
