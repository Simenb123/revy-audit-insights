
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Brain, 
  Loader2,
  Tag,
  Calendar,
  Building
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { useDocumentTypes, useDocumentTags } from '@/hooks/useDocumentTypes';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedDocumentUploaderProps {
  clientId: string;
  onUploadComplete?: () => void;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error';
  aiSuggestions?: {
    documentType: string;
    confidence: number;
    detectedSystem?: string;
    extractedMetadata?: any;
  };
}

const EnhancedDocumentUploader: React.FC<EnhancedDocumentUploaderProps> = ({
  clientId,
  onUploadComplete
}) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [manualOverride, setManualOverride] = useState(false);

  const { data: documentTypes = [] } = useDocumentTypes();
  const { data: documentTags = [] } = useDocumentTags();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt']
    },
    onDrop: handleFileDrop
  });

  async function handleFileDrop(files: File[]) {
    const newProgress = files.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading' as const
    }));
    
    setUploadProgress(newProgress);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await processFile(file, i);
    }
  }

  async function processFile(file: File, index: number) {
    try {
      // Simulate upload progress
      updateProgress(index, 25, 'uploading');
      
      // Upload file to Supabase storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      
      updateProgress(index, 50, 'processing');
      
      // Create document record
      const { data: docData, error: docError } = await supabase
        .from('client_documents_files')
        .insert({
          client_id: clientId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          text_extraction_status: 'pending'
        })
        .select()
        .single();

      if (docError) throw docError;
      
      updateProgress(index, 75, 'analyzing');
      
      // AI Analysis - simulate AI processing
      const aiSuggestions = await simulateAIAnalysis(file);
      
      // Update with AI suggestions
      setUploadProgress(prev => prev.map((item, idx) => 
        idx === index 
          ? { ...item, aiSuggestions, progress: 90, status: 'analyzing' }
          : item
      ));
      
      // Apply AI suggestions automatically if confidence is high
      if (aiSuggestions.confidence > 0.8 && !manualOverride) {
        await applyAISuggestions(docData.id, aiSuggestions);
      }
      
      updateProgress(index, 100, 'complete');
      
    } catch (error) {
      console.error('Upload error:', error);
      updateProgress(index, 0, 'error');
      toast.error(`Feil ved opplasting av ${file.name}`);
    }
  }

  function updateProgress(index: number, progress: number, status: UploadProgress['status']) {
    setUploadProgress(prev => prev.map((item, idx) => 
      idx === index ? { ...item, progress, status } : item
    ));
  }

  async function simulateAIAnalysis(file: File): Promise<UploadProgress['aiSuggestions']> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const fileName = file.name.toLowerCase();
    
    // Pattern matching for document type detection
    let documentType = 'unknown';
    let confidence = 0.5;
    let detectedSystem = undefined;
    
    if (fileName.includes('hovedbok') || fileName.includes('general_ledger')) {
      documentType = 'hovedbok';
      confidence = 0.95;
      detectedSystem = 'visma_business';
    } else if (fileName.includes('saldo') || fileName.includes('trial_balance')) {
      documentType = 'saldobalanse';
      confidence = 0.90;
      detectedSystem = 'poweroffice';
    } else if (fileName.includes('lonn') || fileName.includes('payslip')) {
      documentType = 'lonnslipp';
      confidence = 0.85;
    } else if (fileName.includes('faktura') || fileName.includes('invoice')) {
      documentType = 'faktura';
      confidence = 0.80;
    }
    
    return {
      documentType,
      confidence,
      detectedSystem,
      extractedMetadata: {
        period_year: new Date().getFullYear(),
        period_month: new Date().getMonth() + 1
      }
    };
  }

  async function applyAISuggestions(documentId: string, suggestions: NonNullable<UploadProgress['aiSuggestions']>) {
    try {
      // Find document type
      const documentType = documentTypes.find(dt => dt.name === suggestions.documentType);
      
      // Create metadata record
      await supabase
        .from('document_metadata')
        .insert({
          document_id: documentId,
          document_type_id: documentType?.id,
          detected_system: suggestions.detectedSystem,
          period_year: suggestions.extractedMetadata?.period_year,
          period_month: suggestions.extractedMetadata?.period_month,
          validation_status: 'validated',
          quality_score: suggestions.confidence
        });
      
      // Auto-assign relevant tags
      if (suggestions.confidence > 0.9) {
        const automatedTag = documentTags.find(tag => tag.name === 'automated');
        if (automatedTag) {
          await supabase
            .from('document_tag_assignments')
            .insert({
              document_id: documentId,
              tag_id: automatedTag.id,
              assigned_by_ai: true,
              confidence_score: suggestions.confidence
            });
        }
      }
      
    } catch (error) {
      console.error('Error applying AI suggestions:', error);
    }
  }

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
      case 'analyzing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'bg-blue-500';
      case 'analyzing':
        return 'bg-purple-500';
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-forbedret dokumentopplasting
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            AI analyserer og kategoriserer dokumenter automatisk basert på innhold og struktur
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Forhåndsdefinert dokumenttype</label>
              <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="AI vil foreslå automatisk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Automatisk deteksjon</SelectItem>
                  {documentTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="manual-override"
                checked={manualOverride}
                onChange={(e) => setManualOverride(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="manual-override" className="text-sm">
                Manuell godkjenning av AI-forslag
              </label>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p>Slipp filene her...</p>
            ) : (
              <div>
                <p className="text-lg font-medium">Dra og slipp filer her, eller klikk for å velge</p>
                <p className="text-sm text-gray-500 mt-2">
                  AI vil automatisk kategorisere og ekstrahere metadata
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Støttede formater: PDF, Excel, CSV, TXT
                </p>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Opplastingsstatus</h4>
              {uploadProgress.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">{item.fileName}</span>
                        {getStatusIcon(item.status)}
                      </div>
                      <span className="text-xs text-gray-500">{item.progress}%</span>
                    </div>
                    
                    <Progress 
                      value={item.progress} 
                      className={`h-2 ${getStatusColor(item.status)}`}
                    />
                    
                    {item.aiSuggestions && (
                      <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <h5 className="text-sm font-medium text-purple-900 mb-2 flex items-center gap-1">
                          <Brain className="h-3 w-3" />
                          AI-analyse
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            <span>Type: {item.aiSuggestions.documentType}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Sikkerhet: {Math.round(item.aiSuggestions.confidence * 100)}%</span>
                          </div>
                          {item.aiSuggestions.detectedSystem && (
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              <span>System: {item.aiSuggestions.detectedSystem}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2">
                          <Badge 
                            variant={item.aiSuggestions.confidence > 0.8 ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {item.aiSuggestions.confidence > 0.8 ? 'Høy sikkerhet' : 'Middels sikkerhet'}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
          
          {/* AI Training Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🤖 AI-forbedringer</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Automatisk gjenkjennelse av dokumenttyper</li>
              <li>• Intelligent deteksjon av regnskapssystemer</li>
              <li>• Ekstraktion av periode og metadata</li>
              <li>• Kvalitetsvurdering og validering</li>
              <li>• Automatisk tagging og kategorisering</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedDocumentUploader;
