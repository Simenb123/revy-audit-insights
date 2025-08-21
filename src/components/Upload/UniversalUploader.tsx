import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import EnhancedFileUploader, { UploadedFileInfo, FileUploadConfig } from './EnhancedFileUploader';
import SmartColumnMapper from './SmartColumnMapper';
import UploadProgressTracker, { UploadStep } from './UploadProgressTracker';
import ValidationSummary, { ValidationSummaryData } from './ValidationSummary';

import { UploadTypeConfig, UploadSession, ProcessingResult } from '@/types/upload';
import { parseFilePreview, suggestColumnMappings } from '@/utils/fileProcessing';
import { cn } from '@/lib/utils';

interface UniversalUploaderProps {
  config: UploadTypeConfig;
  clientId?: string;
  onComplete?: (result: ProcessingResult) => void;
  onCancel?: () => void;
  className?: string;
}

const UniversalUploader: React.FC<UniversalUploaderProps> = ({
  config,
  clientId,
  onComplete,
  onCancel,
  className
}) => {
  const [session, setSession] = useState<UploadSession | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState<UploadedFileInfo[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);

  // Convert config to file upload config
  const fileUploadConfig: FileUploadConfig = {
    acceptedTypes: config.acceptedFileTypes,
    maxSize: config.maxFileSize,
    maxFiles: config.maxFiles,
    autoProcess: true
  };

  // Create processing steps
  const steps: UploadStep[] = config.processingSteps.map((step, index) => ({
    ...step,
    status: index < currentStep ? 'completed' : 
           index === currentStep ? 'active' : 'pending'
  }));

  // Initialize session when files are selected
  const initializeSession = useCallback(async (selectedFiles: UploadedFileInfo[]) => {
    const newSession: UploadSession = {
      id: `session-${Date.now()}`,
      uploadType: config.id,
      files: selectedFiles.map(f => ({
        id: f.id,
        name: f.file.name,
        size: f.file.size,
        status: f.status,
        progress: f.progress,
        error: f.error
      })),
      currentStep: 0,
      mapping: {},
      validationResults: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setSession(newSession);
    setFiles(selectedFiles);
    setCurrentStep(1); // Move to file processing step
  }, [config.id]);

  // Handle file selection and processing
  const handleFilesSelected = useCallback(async (selectedFiles: UploadedFileInfo[]) => {
    setFiles(selectedFiles);
    await initializeSession(selectedFiles);
  }, [initializeSession]);

  // Process file for preview and AI suggestions
  const handleFileProcess = useCallback(async (fileInfo: UploadedFileInfo) => {
    try {
      // Update file status to processing
      setFiles(prev => prev.map(f => 
        f.id === fileInfo.id 
          ? { ...f, status: 'processing', progress: 50 }
          : f
      ));

      // Parse file for preview
      const result = await parseFilePreview(fileInfo.file);
      
      // Generate AI suggestions if enabled
      let suggestions = [];
      if (config.enableAISuggestions) {
        suggestions = await suggestColumnMappings(result.headers, config.fieldDefinitions);
        
        // Auto-apply high-confidence suggestions
        const autoMapping: Record<string, string> = {};
        suggestions.forEach(suggestion => {
          if (suggestion.confidence >= 0.8) {
            autoMapping[suggestion.sourceColumn] = suggestion.targetField;
          }
        });
        setMapping(prev => ({ ...prev, ...autoMapping }));
      }

      // Update file with preview and mark as completed
      setFiles(prev => prev.map(f => 
        f.id === fileInfo.id 
          ? { 
              ...f, 
              status: 'completed', 
              progress: 100,
              preview: {
                headers: result.headers,
                sampleRows: result.sampleRows,
                totalRows: result.totalRows
              }
            }
          : f
      ));

      // Move to mapping step if we have preview data
      if (result.headers.length > 0) {
        setCurrentStep(2);
      }

    } catch (error) {
      console.error('File processing error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileInfo.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Processing failed'
            }
          : f
      ));
      toast.error('Kunne ikke behandle fil');
    }
  }, [config.enableAISuggestions, config.fieldDefinitions]);

  // Handle file removal
  const handleFileRemove = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (files.length <= 1) {
      setCurrentStep(0);
      setMapping({});
      setSession(null);
    }
  }, [files.length]);

  // Handle mapping changes
  const handleMappingChange = useCallback((sourceColumn: string, targetField: string) => {
    setMapping(prev => ({
      ...prev,
      [sourceColumn]: targetField === 'none' ? '' : targetField
    }));
  }, []);

  // Calculate mapping status
  const getMappingStatus = useCallback(() => {
    const requiredFields = config.fieldDefinitions.filter(f => f.is_required);
    const mappedRequired = requiredFields.filter(field => 
      Object.values(mapping).includes(field.field_key)
    );
    
    return {
      total: requiredFields.length,
      mapped: mappedRequired.length,
      complete: mappedRequired.length === requiredFields.length
    };
  }, [config.fieldDefinitions, mapping]);

  // Process files with mapping
  const handleProcessFiles = useCallback(async () => {
    if (!session || files.length === 0) return;

    const mappingStatus = getMappingStatus();
    if (!mappingStatus.complete) {
      toast.error('Alle påkrevde felt må mappes før behandling');
      return;
    }

    setIsProcessing(true);
    setCurrentStep(3); // Validation step

    try {
      // Use custom processor if available, otherwise use default
      let result: ProcessingResult;
      
      if (config.customProcessor) {
        result = await config.customProcessor(files[0].file, mapping);
      } else {
        // Default processing logic
        const filePreview = files[0].preview;
        if (!filePreview) throw new Error('No file preview available');

        result = {
          success: true,
          processedRows: filePreview.totalRows,
          validRows: filePreview.totalRows,
          invalidRows: 0,
          skippedRows: 0,
          validationResults: [
            {
              type: 'success',
              message: `Successfully processed ${filePreview.totalRows} rows`,
              count: filePreview.totalRows
            }
          ]
        };
      }

      setProcessingResult(result);
      setCurrentStep(4); // Complete step

      if (result.success && onComplete) {
        onComplete(result);
      }

    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Feil under behandling av filer');
      
      const errorResult: ProcessingResult = {
        success: false,
        processedRows: 0,
        validRows: 0,
        invalidRows: 0,
        skippedRows: 0,
        validationResults: [
          {
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown processing error'
          }
        ]
      };
      setProcessingResult(errorResult);
    } finally {
      setIsProcessing(false);
    }
  }, [session, files, mapping, getMappingStatus, config.customProcessor, onComplete]);

  // Reset uploader
  const handleReset = useCallback(() => {
    setSession(null);
    setCurrentStep(0);
    setFiles([]);
    setMapping({});
    setProcessingResult(null);
    setIsProcessing(false);
  }, []);

  // Calculate overall progress
  const overallProgress = (currentStep / Math.max(steps.length - 1, 1)) * 100;

  // Get current file info for mapping
  const currentFile = files[0];
  const hasValidPreview = currentFile?.preview && currentFile.preview.headers.length > 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{config.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
            </div>
            {session && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Start på nytt
              </Button>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Progress Tracker */}
      {session && (
        <UploadProgressTracker
          steps={steps}
          currentStepIndex={currentStep}
          overallProgress={overallProgress}
          title="Upload Status"
        />
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Step 1: File Upload */}
        {currentStep <= 1 && (
          <EnhancedFileUploader
            config={fileUploadConfig}
            files={files}
            onFilesSelected={handleFilesSelected}
            onFileRemove={handleFileRemove}
            onFileProcess={handleFileProcess}
            title={`Last opp ${config.name.toLowerCase()}`}
            description={config.description}
          />
        )}

        {/* Step 2: Column Mapping */}
        {currentStep === 2 && hasValidPreview && (
          <div className="space-y-4">
            <SmartColumnMapper
              fileName={currentFile.file.name}
              headers={currentFile.preview!.headers}
              sampleRows={currentFile.preview!.sampleRows}
              mapping={mapping}
              fieldDefinitions={config.fieldDefinitions}
              suggestedMappings={[]} // Suggestions would be populated from AI service
              validationErrors={{}}
              requiredStatus={getMappingStatus()}
              onMappingChange={handleMappingChange}
            />
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tilbake
              </Button>
              <Button 
                onClick={handleProcessFiles}
                disabled={!getMappingStatus().complete || isProcessing}
              >
                Behandle filer
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Processing/Validation Results */}
        {currentStep >= 3 && processingResult && (
          <ValidationSummary
            data={{
              fileName: currentFile?.file.name || 'Unknown file',
              totalRows: processingResult.processedRows,
              validRows: processingResult.validRows,
              invalidRows: processingResult.invalidRows,
              skippedRows: processingResult.skippedRows,
              results: processingResult.validationResults,
              downloadLinks: processingResult.downloadLinks
            }}
            onClose={onCancel}
            onRetry={handleReset}
          />
        )}
      </div>
    </div>
  );
};

export default UniversalUploader;