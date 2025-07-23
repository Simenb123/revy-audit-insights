import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  processExcelFile, 
  processCSVFile, 
  TRIAL_BALANCE_FIELDS,
  convertDataWithMapping,
  FilePreview as FilePreviewType
} from '@/utils/fileProcessing';
import { FilePreview } from '@/components/DataUpload/FilePreview';
import { SmartColumnMapping } from '@/components/DataUpload/SmartColumnMapping';
import { DataManagementPanel } from '@/components/DataUpload/DataManagementPanel';
import { logger } from '@/utils/logger';

interface AccountRow {
  account_number: string;
  account_name: string;
  balance?: number;
  account_type?: string;
}

interface TrialBalanceUploaderProps {
  clientId: string;
  orgNumber?: string;
  onUploadComplete?: () => void;
}

const TrialBalanceUploader = ({ clientId, orgNumber, onUploadComplete }: TrialBalanceUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreviewType | null>(null);
  const [showMapping, setShowMapping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [step, setStep] = useState<'select' | 'preview' | 'mapping' | 'uploading' | 'success'>('select');
  const [lastUpload, setLastUpload] = useState<{
    fileName: string;
    recordsImported: number;
    uploadDate: string;
    dataType: string;
  } | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const extension = file.name.toLowerCase().split('.').pop();
      
      if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
        toast({
          title: "Ugyldig filtype",
          description: "Kun Excel (.xlsx, .xls) og CSV-filer er støttet",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      setStep('preview');
      
      try {
        let preview: FilePreviewType;
        if (extension === 'csv') {
          preview = await processCSVFile(file);
        } else {
          preview = await processExcelFile(file);
        }
        setFilePreview(preview);
      } catch (error) {
        logger.error('File processing error:', error);
        toast({
          title: "Feil ved lesing av fil",
          description: error instanceof Error ? error.message : "Ukjent feil",
          variant: "destructive"
        });
        setStep('select');
      }
    }
  };

  const handlePreviewContinue = () => {
    setStep('mapping');
    setShowMapping(true);
  };

  const handleMappingComplete = async (mapping: Record<string, string>) => {
    if (!filePreview || !selectedFile) return;
    
    setShowMapping(false);
    setStep('uploading');
    
    try {
      const convertedData = convertDataWithMapping(filePreview, mapping);
      const accounts: AccountRow[] = convertedData.map(row => ({
        account_number: row.account_number?.toString() || '',
        account_name: row.account_name?.toString() || '',
        balance: parseFloat(row.balance?.toString().replace(/[^\d.,-]/g, '') || '0'),
        account_type: row.account_type?.toString().toLowerCase() || 'asset'
      })).filter(account => account.account_number && account.account_name);
      
      await uploadTrialBalance(accounts, selectedFile);
    } catch (error) {
      logger.error('Data conversion error:', error);
      toast({
        title: "Feil ved datakonvertering",
        description: error instanceof Error ? error.message : "Ukjent feil",
        variant: "destructive"
      });
      setStep('mapping');
    }
  };

  const handleMappingCancel = () => {
    setShowMapping(false);
    setStep('preview');
  };

  const handleBackToSelect = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setStep('select');
  };

  const uploadTrialBalance = async (accounts: AccountRow[], file: File) => {
    if (!clientId) return;

    try {
      setIsUploading(true);
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

      // Insert accounts one by one with progress tracking
      let successful = 0;
      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        
        try {
          // Insert into client_chart_of_accounts with only existing columns
          const { error: insertError } = await supabase
            .from('client_chart_of_accounts')
            .upsert({
              client_id: clientId,
              account_number: account.account_number,
              account_name: account.account_name,
              account_type: account.account_type,
              is_active: true
            }, { 
              onConflict: 'client_id,account_number',
              ignoreDuplicates: false 
            });

          if (!insertError) {
            successful++;
          } else {
            logger.error(`Error inserting account ${account.account_number}:`, insertError);
          }
        } catch (error) {
          logger.error(`Error inserting account ${account.account_number}:`, error);
        }
        
        setProcessedRows(i + 1);
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
      
      // Set upload summary
      setLastUpload({
        fileName: file.name,
        recordsImported: successful,
        uploadDate: new Date().toLocaleDateString('no-NO'),
        dataType: 'Saldobalanse'
      });

      setStep('success');
      
      toast({
        title: "Saldobalanse lastet opp",
        description: `${successful} av ${accounts.length} kontoer ble importert`,
      });

      onUploadComplete?.();
      
    } catch (error: any) {
      logger.error('Upload error:', error);
      toast({
        title: "Feil ved opplasting",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Show smart column mapping
  if (showMapping && filePreview) {
    return (
      <SmartColumnMapping
        preview={filePreview}
        fieldDefinitions={TRIAL_BALANCE_FIELDS}
        onComplete={handleMappingComplete}
        onCancel={handleMappingCancel}
      />
    );
  }

  // Show enhanced file preview with inline mapping
  if (step === 'preview' && filePreview && selectedFile) {
    return (
      <div className="space-y-4">
        <FilePreview 
          preview={filePreview} 
          fileName={selectedFile.name}
          fieldDefinitions={TRIAL_BALANCE_FIELDS}
          showMapping={true}
          onMappingComplete={handleMappingComplete}
        />
        <div className="flex justify-start">
          <Button variant="outline" onClick={handleBackToSelect}>
            Tilbake til filvalg
          </Button>
        </div>
      </div>
    );
  }

  // Show uploading progress
  if (step === 'uploading') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Laster opp saldobalanse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={uploadProgress} />
          <p className="text-sm text-muted-foreground">
            Prosesserer {processedRows} rader... {uploadProgress}%
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show success view with data management
  if (step === 'success' && lastUpload) {
    return (
      <div className="space-y-4">
        <DataManagementPanel 
          clientId={clientId}
          orgNumber={orgNumber}
          lastUploadSummary={lastUpload}
        />
        <div className="flex justify-start">
          <Button onClick={handleBackToSelect}>
            Last opp ny fil
          </Button>
        </div>
      </div>
    );
  }

  // Default file selection view
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Last opp saldobalanse
        </CardTitle>
        <CardDescription>
          Last opp saldobalanse fra Excel- eller CSV-fil med intelligent kolonnegjenkjenning
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
            id="trial-balance-upload"
          />
          <label htmlFor="trial-balance-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-foreground mb-2">
              Dra og slipp filen her, eller klikk for å velge
            </p>
            <p className="text-xs text-muted-foreground">
              Støtter Excel (.xlsx, .xls) og CSV-filer
            </p>
          </label>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Påkrevde kolonner
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {TRIAL_BALANCE_FIELDS.filter(f => f.required).map(field => (
              <div key={field.key} className="flex items-center gap-2">
                <span className="w-2 h-2 bg-destructive rounded-full"></span>
                <span>{field.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Systemet gjenkjenner automatisk kolonner på norsk og engelsk
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialBalanceUploader;