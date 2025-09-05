import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, FileCheck, Database, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { parseSaftFile } from '@/utils/saftParser';
import { createZipFromParsed, persistParsed, uploadZipToStorage } from '@/utils/saftImport';
import { validateSaftData, quickValidation, type ValidationResults } from '@/utils/saftValidation';
import { SaftValidationReport } from './SaftValidationReport';
import SaftExportManager from './SaftExportManager';
import SaftWorker from '@/workers/saft.worker?worker';
import { useParams } from 'react-router-dom';
import { useClientLookup } from '@/hooks/useClientLookup';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  error?: string;
}

const EnhancedSaftImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadToSupabase, setUploadToSupabase] = useState(true);
  const [generateExports, setGenerateExports] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  const { clientId: clientIdParam, orgNumber } = useParams<{ clientId?: string; orgNumber?: string }>();
  const { data: lookup } = useClientLookup(orgNumber);
  const clientId = clientIdParam || lookup?.id || '';

  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'upload', label: 'Fil opplasting', status: 'pending' },
    { id: 'parse', label: 'SAF-T parsing', status: 'pending' },
    { id: 'validate', label: 'Validering', status: 'pending' },
    { id: 'persist', label: 'Database lagring', status: 'pending' },
    { id: 'export', label: 'Generering av eksporter', status: 'pending' },
    { id: 'complete', label: 'Fullført', status: 'pending' }
  ]);

  const updateStep = (stepId: string, updates: Partial<ProcessingStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationResults(null);
      setParsedData(null);
      setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })));
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setCurrentStep(0);
    const baseName = file.name.replace(/\.(xml|zip)$/i, '');
    const threshold = 5 * 1024 * 1024; // 5MB

    try {
      // Step 1: File upload
      updateStep('upload', { status: 'processing', progress: 50 });
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate upload time
      updateStep('upload', { status: 'completed', progress: 100 });
      setCurrentStep(1);

      // Step 2: Parse SAF-T file
      updateStep('parse', { status: 'processing', progress: 0 });
      let parsed: any;
      let zip: Blob;

      if (file.size > threshold && typeof Worker !== 'undefined') {
        const worker = new SaftWorker();
        const result: { parsed: any; zip: Blob; error?: string } = await new Promise((resolve, reject) => {
          worker.onmessage = (e: MessageEvent<any>) => {
            worker.terminate();
            if (e.data.error) reject(new Error(e.data.error));
            else resolve({ parsed: e.data.parsed, zip: e.data.zip });
          };
          worker.postMessage({ file });
        });
        parsed = result.parsed;
        zip = result.zip;
      } else {
        parsed = await parseSaftFile(file);
        zip = await createZipFromParsed(parsed);
      }

      setParsedData(parsed);
      updateStep('parse', { status: 'completed', progress: 100 });
      setCurrentStep(2);

      // Step 3: Validation
      updateStep('validate', { status: 'processing', progress: 0 });
      const validation = validateSaftData(parsed);
      setValidationResults(validation);
      
      const quickCheck = quickValidation(parsed);
      if (!quickCheck.canImport && !dryRun) {
        updateStep('validate', { 
          status: 'error', 
          error: `Kritiske feil funnet: ${quickCheck.criticalIssues.join(', ')}` 
        });
        toast.error('SAF-T fil kan ikke importeres pga. kritiske feil');
        return;
      }

      updateStep('validate', { status: 'completed', progress: 100 });
      setCurrentStep(3);

      // If dry run, stop here
      if (dryRun) {
        updateStep('complete', { status: 'completed' });
        toast.success('Dry-run fullført. Ingen data ble lagret.');
        return;
      }

      // Step 4: Database persistence
      if (uploadToSupabase) {
        if (!clientId) {
          updateStep('persist', { 
            status: 'error', 
            error: 'Ingen klient-kontekst funnet' 
          });
          toast.error('Kan ikke lagre til database uten valgt klient');
          return;
        }

        updateStep('persist', { status: 'processing', progress: 0 });
        await persistParsed(clientId, parsed, file.name);
        updateStep('persist', { status: 'completed', progress: 100 });
        setCurrentStep(4);
      } else {
        updateStep('persist', { status: 'completed', progress: 100 });
        setCurrentStep(4);
      }

      // Step 5: Generate exports
      if (generateExports) {
        updateStep('export', { status: 'processing', progress: 0 });
        
        // Generate and download XLSX
        const { toXlsxBlob } = await import('@/utils/saft');
        const xlsx = await toXlsxBlob(parsed);
        downloadBlob(xlsx, `${baseName}.xlsx`);
        
        updateStep('export', { status: 'processing', progress: 50 });

        // Upload ZIP to storage if we have client context
        if (clientId && uploadToSupabase) {
          await uploadZipToStorage(clientId, zip, `${baseName}.zip`);
        }
        
        updateStep('export', { status: 'completed', progress: 100 });
        setCurrentStep(5);
      } else {
        updateStep('export', { status: 'completed', progress: 100 });
        setCurrentStep(5);
      }

      // Step 6: Complete
      updateStep('complete', { status: 'completed' });
      
      toast.success(
        `SAF-T import fullført! ` +
        `${parsed.accounts?.length || 0} kontoer, ` +
        `${parsed.transactions?.length || 0} transaksjoner importert.`
      );

    } catch (err: any) {
      console.error(err);
      const currentStepId = steps[currentStep]?.id;
      if (currentStepId) {
        updateStep(currentStepId, { 
          status: 'error', 
          error: err.message || 'Ukjent feil' 
        });
      }
      toast.error(`Feil under import: ${err.message || 'Ukjent feil'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Avansert SAF-T Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="saft-file">Velg SAF-T fil (.xml eller .zip)</Label>
            <input 
              id="saft-file"
              type="file" 
              accept=".xml,.zip" 
              onChange={handleFileChange}
              disabled={isProcessing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="upload-supabase"
                checked={uploadToSupabase}
                onCheckedChange={(v) => setUploadToSupabase(!!v)}
                disabled={isProcessing}
              />
              <Label htmlFor="upload-supabase">Lagre til database</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="generate-exports"
                checked={generateExports}
                onCheckedChange={(v) => setGenerateExports(!!v)}
                disabled={isProcessing}
              />
              <Label htmlFor="generate-exports">Generer XLSX eksport</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="dry-run"
                checked={dryRun}
                onCheckedChange={(v) => setDryRun(!!v)}
                disabled={isProcessing}
              />
              <Label htmlFor="dry-run">Dry-run (kun validering)</Label>
            </div>
          </div>

          {/* Warnings */}
          {uploadToSupabase && !clientId && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Ingen klient funnet i URL. Gå inn via en klient for å lagre til database.
              </AlertDescription>
            </Alert>
          )}

          {dryRun && (
            <Alert>
              <AlertDescription>
                Dry-run modus: Filen vil bli validert uten å lagre data.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Button */}
          <Button 
            onClick={handleImport} 
            disabled={!file || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Behandler...' : dryRun ? 'Valider SAF-T' : 'Importer SAF-T'}
          </Button>
        </CardContent>
      </Card>

      {/* Processing Steps */}
      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle>Behandlingsstatus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-3">
                  {getStepIcon(step)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={step.status === 'error' ? 'text-red-600' : ''}>{step.label}</span>
                      <Badge variant={
                        step.status === 'completed' ? 'default' :
                        step.status === 'error' ? 'destructive' :
                        step.status === 'processing' ? 'secondary' : 'outline'
                      }>
                        {step.status === 'processing' ? 'Pågår' :
                         step.status === 'completed' ? 'Fullført' :
                         step.status === 'error' ? 'Feil' : 'Venter'}
                      </Badge>
                    </div>
                    {step.progress !== undefined && step.status === 'processing' && (
                      <Progress value={step.progress} className="mt-1" />
                    )}
                    {step.error && (
                      <p className="text-sm text-red-600 mt-1">{step.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {validationResults && (
        <Tabs defaultValue="validation" className="w-full">
          <TabsList>
            <TabsTrigger value="validation">Validering</TabsTrigger>
            {parsedData && <TabsTrigger value="summary">Sammendrag</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="validation">
            <SaftValidationReport results={validationResults} />
          </TabsContent>
          
          {parsedData && (
            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>SAF-T Innhold</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{parsedData.accounts?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Kontoer</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{parsedData.transactions?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Transaksjoner</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{parsedData.customers?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Kunder</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{parsedData.suppliers?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Leverandører</div>
                    </div>
                  </div>
                  
                  {parsedData.header && (
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Header Informasjon</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>SAF-T Versjon: {parsedData.header.file_version}</div>
                        <div>Software: {parsedData.header.software}</div>
                        <div>Opprettet: {parsedData.header.created}</div>
                        <div>Periode: {parsedData.header.start} - {parsedData.header.end}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Export Manager */}
          {clientId && (
            <SaftExportManager clientId={clientId} />
          )}
        </Tabs>
      )}
    </div>
  );
};

export default EnhancedSaftImport;