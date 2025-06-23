
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Brain, CheckCircle } from 'lucide-react';
import { ClientDocument } from '@/hooks/useClientDocuments';
import { useClientTextExtraction } from '@/hooks/useClientTextExtraction';

interface BulkTextExtractionProps {
  documents: ClientDocument[];
  onUpdate?: () => void;
}

const BulkTextExtraction = ({ documents, onUpdate }: BulkTextExtractionProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentDocument, setCurrentDocument] = useState<string>('');
  const { extractAndAnalyzeDocument } = useClientTextExtraction();

  console.log('🔄 [BULK_EXTRACTION] Component rendered with:', {
    totalDocuments: documents.length,
    documentStatuses: documents.map(d => ({
      id: d.id,
      name: d.file_name,
      status: d.text_extraction_status,
      hasExtractedText: !!d.extracted_text,
      extractedTextLength: d.extracted_text?.length || 0
    }))
  });

  // Enhanced logic to determine which documents need processing
  const documentsNeedingProcessing = documents.filter(doc => {
    // Check if status is not completed, or if completed but has no real text content
    const statusNeedsProcessing = !doc.text_extraction_status || 
                                 doc.text_extraction_status === 'pending' || 
                                 doc.text_extraction_status === 'failed';
    
    // Check if status is completed but text is empty, null, or an error message
    const hasInvalidText = doc.text_extraction_status === 'completed' && (
      !doc.extracted_text || 
      doc.extracted_text.length < 50 ||
      doc.extracted_text.startsWith('[Kunne ikke') ||
      doc.extracted_text.startsWith('[Tekstekstraksjon feilet')
    );
    
    const needsProcessing = statusNeedsProcessing || hasInvalidText;
    
    console.log('🔍 [BULK_EXTRACTION] Document check:', {
      fileName: doc.file_name,
      status: doc.text_extraction_status,
      hasText: !!doc.extracted_text,
      textLength: doc.extracted_text?.length || 0,
      textPreview: doc.extracted_text?.substring(0, 50) || 'No text',
      statusNeedsProcessing,
      hasInvalidText,
      needsProcessing
    });
    
    return needsProcessing;
  });

  console.log('📊 [BULK_EXTRACTION] Processing status:', {
    total: documents.length,
    needingProcessing: documentsNeedingProcessing.length,
    shouldShowButton: documentsNeedingProcessing.length > 0,
    documentDetails: documentsNeedingProcessing.map(d => ({
      name: d.file_name,
      status: d.text_extraction_status,
      reason: !d.text_extraction_status ? 'no status' : 
              d.text_extraction_status === 'pending' ? 'pending' :
              d.text_extraction_status === 'failed' ? 'failed' :
              'invalid text content'
    }))
  });

  const handleBulkProcessing = async () => {
    if (documentsNeedingProcessing.length === 0) {
      console.log('⚠️ [BULK_EXTRACTION] No documents to process');
      return;
    }
    
    console.log('🚀 [BULK_EXTRACTION] Starting bulk processing of', documentsNeedingProcessing.length, 'documents');
    setIsProcessing(true);
    setProgress(0);
    
    for (let i = 0; i < documentsNeedingProcessing.length; i++) {
      const doc = documentsNeedingProcessing[i];
      console.log('🔄 [BULK_EXTRACTION] Processing document:', doc.file_name);
      setCurrentDocument(doc.file_name);
      
      try {
        await extractAndAnalyzeDocument(doc.id);
        console.log('✅ [BULK_EXTRACTION] Successfully processed:', doc.file_name);
      } catch (error) {
        console.error('❌ [BULK_EXTRACTION] Failed to process', doc.file_name, ':', error);
      }
      
      const newProgress = ((i + 1) / documentsNeedingProcessing.length) * 100;
      setProgress(newProgress);
      console.log('📈 [BULK_EXTRACTION] Progress:', newProgress.toFixed(1) + '%');
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsProcessing(false);
    setCurrentDocument('');
    console.log('🎉 [BULK_EXTRACTION] Bulk processing completed');
    
    if (onUpdate) {
      onUpdate();
    }
  };

  // Show success state if no documents need processing
  if (documentsNeedingProcessing.length === 0) {
    console.log('✅ [BULK_EXTRACTION] All documents processed - showing success state');
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Alle dokumenter er prosessert!</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            AI kan nå lese og analysere alle dine dokumenter.
          </p>
        </CardContent>
      </Card>
    );
  }

  console.log('🎯 [BULK_EXTRACTION] Showing processing interface for', documentsNeedingProcessing.length, 'documents');

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Brain className="h-5 w-5" />
          Bulk AI-prosessering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-purple-700">
          <strong>{documentsNeedingProcessing.length}</strong> dokumenter venter på AI-prosessering
        </div>
        
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Prosesserer: {currentDocument}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
        
        <Button 
          onClick={handleBulkProcessing}
          disabled={isProcessing}
          className="w-full flex items-center gap-2"
        >
          <Zap className="h-4 w-4" />
          {isProcessing ? 'Prosesserer...' : `Prosesser alle ${documentsNeedingProcessing.length} dokumenter`}
        </Button>
        
        <div className="text-xs text-purple-600">
          💡 Frontend-basert prosessering gir umiddelbare resultater
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkTextExtraction;
