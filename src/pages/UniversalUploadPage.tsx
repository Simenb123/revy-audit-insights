import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

import UploadTypeSelector from '@/components/Upload/UploadTypeSelector';
import UniversalUploader from '@/components/Upload/UniversalUploader';
import ValidationSummary from '@/components/Upload/ValidationSummary';

import { UploadTypeConfig, ProcessingResult } from '@/types/upload';
import { getUploadConfig } from '@/config/uploadTypes';
import { toast } from 'sonner';

const UniversalUploadPage: React.FC = () => {
  const { clientId, uploadType } = useParams<{ clientId: string; uploadType?: string }>();
  const { data: client, isLoading } = useClientDetails(clientId || '');
  const { setSelectedClientId } = useFiscalYear();
  
  const [selectedConfig, setSelectedConfig] = useState<UploadTypeConfig | null>(
    uploadType ? getUploadConfig(uploadType) : null
  );
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [step, setStep] = useState<'select' | 'upload' | 'complete'>(() => {
    return uploadType ? 'upload' : 'select';
  });

  // Set fiscal year context when client loads
  React.useEffect(() => {
    if (client?.id) {
      setSelectedClientId(client.id);
    }
  }, [client?.id, setSelectedClientId]);

  const handleConfigSelect = (config: UploadTypeConfig) => {
    setSelectedConfig(config);
    setStep('upload');
  };

  const handleUploadComplete = (result: ProcessingResult) => {
    setProcessingResult(result);
    setStep('complete');
    
    if (result.success) {
      toast.success(`${selectedConfig?.name} opplastet!`);
    }
  };

  const handleStartOver = () => {
    setSelectedConfig(null);
    setProcessingResult(null);
    setStep('select');
  };

  const handleBackToUpload = () => {
    setProcessingResult(null);
    setStep('upload');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Klient ikke funnet</h1>
            <p className="text-muted-foreground">
              Kunne ikke finne klient med ID {clientId}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <StickyClientLayout
      clientName={client.company_name || client.name}
      orgNumber={client.org_number}
      pageTitle={selectedConfig ? `Upload ${selectedConfig.name}` : 'Data Upload'}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            
            {/* Step 1: Upload Type Selection */}
            {step === 'select' && (
              <UploadTypeSelector
                onSelect={handleConfigSelect}
                selectedType={selectedConfig?.id}
              />
            )}

            {/* Step 2: File Upload and Processing */}
            {step === 'upload' && selectedConfig && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleStartOver}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Velg annen type
                  </Button>
                  <div>
                    <h2 className="text-lg font-semibold">{selectedConfig.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedConfig.description}
                    </p>
                  </div>
                </div>

                <UniversalUploader
                  config={selectedConfig}
                  clientId={client.id}
                  onComplete={handleUploadComplete}
                  onCancel={handleStartOver}
                />
              </div>
            )}

            {/* Step 3: Results */}
            {step === 'complete' && processingResult && selectedConfig && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {processingResult.success ? 'Upload fullført!' : 'Upload feilet'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedConfig.name} - {client.company_name || client.name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleBackToUpload}>
                      Last opp mer
                    </Button>
                    <Button variant="outline" onClick={handleStartOver}>
                      Velg ny type
                    </Button>
                  </div>
                </div>

                <ValidationSummary
                  data={{
                    fileName: `${selectedConfig.name} Upload`,
                    totalRows: processingResult.processedRows,
                    validRows: processingResult.validRows,
                    invalidRows: processingResult.invalidRows,
                    skippedRows: processingResult.skippedRows,
                    results: processingResult.validationResults,
                    downloadLinks: processingResult.downloadLinks
                  }}
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </StickyClientLayout>
  );
};

export default UniversalUploadPage;