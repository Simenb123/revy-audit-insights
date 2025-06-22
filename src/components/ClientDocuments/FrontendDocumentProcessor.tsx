
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, RefreshCw, CheckCircle, AlertCircle, Clock, Eye } from 'lucide-react';
import { ClientDocument } from '@/hooks/useClientDocuments';
import { useClientTextExtraction } from '@/hooks/useClientTextExtraction';

interface FrontendDocumentProcessorProps {
  document: ClientDocument;
  onUpdate?: () => void;
}

const FrontendDocumentProcessor = ({ document, onUpdate }: FrontendDocumentProcessorProps) => {
  const { extractAndAnalyzeDocument, isExtracting } = useClientTextExtraction();

  const handleProcess = async () => {
    const success = await extractAndAnalyzeDocument(document.id);
    if (success && onUpdate) {
      onUpdate();
    }
  };

  const getStatusInfo = () => {
    switch (document.text_extraction_status) {
      case 'completed':
        const extractedText = document.extracted_text;
        const hasRealText = extractedText && 
          typeof extractedText === 'string' &&
          extractedText.length > 50 &&
          !extractedText.startsWith('[Kunne ikke');
        
        return {
          icon: hasRealText ? CheckCircle : Eye,
          color: hasRealText ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800',
          text: hasRealText ? '✅ AI kan lese' : '⚠️ Begrenset innhold',
          canRetry: !hasRealText
        };
      case 'processing':
        return {
          icon: RefreshCw,
          color: 'bg-blue-100 text-blue-800',
          text: '🔄 Prosesserer...',
          canRetry: false
        };
      case 'failed':
        return {
          icon: AlertCircle,
          color: 'bg-red-100 text-red-800',
          text: '❌ Feilet',
          canRetry: true
        };
      default:
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-800',
          text: '⏳ Ikke prosessert',
          canRetry: true
        };
    }
  };

  const status = getStatusInfo();
  const Icon = status.icon;
  const isProcessing = isExtracting[document.id] || document.text_extraction_status === 'processing';

  return (
    <div className="flex items-center gap-2">
      <Badge className={`text-xs ${status.color} flex items-center gap-1`}>
        <Icon className={`h-3 w-3 ${isProcessing ? 'animate-spin' : ''}`} />
        {status.text}
      </Badge>
      
      {status.canRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleProcess}
          disabled={isProcessing}
          className="h-6 px-2 text-xs"
        >
          <Zap className={`h-3 w-3 mr-1 ${isProcessing ? 'animate-spin' : ''}`} />
          {isProcessing ? 'Prosesserer...' : 'Prosesser'}
        </Button>
      )}
    </div>
  );
};

export default FrontendDocumentProcessor;
