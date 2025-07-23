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
    
    setShowMapping(false);
    setStep('upload');
    
    try {
      const convertedData = convertDataWithMapping(filePreview, mapping);
      setConvertedData(convertedData);
      await uploadTrialBalance(convertedData, selectedFile);
    } catch (error) {
      toast.error('Feil ved datakonvertering');
      console.error(error);
      setStep('select');
    }
  };

  const uploadTrialBalance = async (accounts: any[], file: File) => {
    if (!clientId) return;

    try {
      setUploadProgress(10);

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
      setUploadProgress(30);

      // Insert accounts with progress tracking
      let successful = 0;
      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        
        try {
          const { error: insertError } = await supabase
            .from('client_chart_of_accounts')
            .upsert({
              client_id: clientId,
              account_number: account.account_number?.toString() || '',
              account_name: account.account_name?.toString() || '',
              account_type: 'asset',
              is_active: true
            }, { 
              onConflict: 'client_id,account_number',
              ignoreDuplicates: false 
            });

          if (!insertError) {
            successful++;
          }
        } catch (error) {
          console.error(`Error inserting account:`, error);
        }
        
        setUploadProgress(30 + ((i + 1) / accounts.length) * 60);
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
      
      toast.success(`${successful} av ${accounts.length} kontoer ble importert`);
      onUploadComplete?.();
      
    } catch (error: any) {
      toast.error('Feil ved opplasting');
      console.error(error);
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
          uploadedData={convertedData}
          dataType="trial_balance"
          clientId={clientId}
          onStartOver={() => {
            setStep('select');
            setSelectedFile(null);
            setFilePreview(null);
            setConvertedData([]);
            setShowMapping(false);
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