
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

  const documentsNeedingProcessing = documents.filter(doc => 
    doc.text_extraction_status === 'pending' || 
    doc.text_extraction_status === 'failed' ||
    doc.text_extraction_status === null
  );

  const handleBulkProcessing = async () => {
    if (documentsNeedingProcessing.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    for (let i = 0; i < documentsNeedingProcessing.length; i++) {
      const doc = documentsNeedingProcessing[i];
      setCurrentDocument(doc.file_name);
      
      try {
        await extractAndAnalyzeDocument(doc.id);
      } catch (error) {
        console.error(`Failed to process ${doc.file_name}:`, error);
      }
      
      setProgress(((i + 1) / documentsNeedingProcessing.length) * 100);
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsProcessing(false);
    setCurrentDocument('');
    
    if (onUpdate) {
      onUpdate();
    }
  };

  if (documentsNeedingProcessing.length === 0) {
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
          💡 Frontend-basert prosessering gir umiddelbar feedback og bedre ytelse
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkTextExtraction;
