
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  FileText, 
  Eye,
  RotateCcw 
} from 'lucide-react';
import { ClientDocument } from '@/hooks/useClientDocuments';

interface DocumentStatusIndicatorProps {
  document: ClientDocument;
  onRetryExtraction?: (documentId: string) => void;
  isRetrying?: boolean;
}

const DocumentStatusIndicator = ({ 
  document, 
  onRetryExtraction,
  isRetrying = false 
}: DocumentStatusIndicatorProps) => {
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
          text: hasRealText ? 'AI kan lese' : 'Begrenset innhold',
          description: hasRealText 
            ? `AI kan lese og analysere dette dokumentet (${extractedText.length} tegn)`
            : 'Lite tekst funnet - kan være skannet eller bildebasert',
          showRetry: !hasRealText
        };
      case 'processing':
        return {
          icon: RefreshCw,
          color: 'bg-blue-100 text-blue-800',
          text: 'AI prosesserer...',
          description: 'Avansert AI-analyse pågår med OpenAI Vision',
          showRetry: false
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-800',
          text: 'Venter',
          description: 'Klar for AI-assistert tekstekstraksjon',
          showRetry: false
        };
      case 'failed':
        return {
          icon: AlertCircle,
          color: 'bg-red-100 text-red-800',
          text: 'Feilet',
          description: 'AI-tekstekstraksjon feilet - prøv igjen',
          showRetry: true
        };
      default:
        return {
          icon: FileText,
          color: 'bg-gray-100 text-gray-800',
          text: 'Ikke prosessert',
          description: 'Trykk "Ekstraher innhold" for AI-analyse',
          showRetry: false
        };
    }
  };

  const status = getStatusInfo();
  const Icon = status.icon;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1" title={status.description}>
        <Badge className={`text-xs ${status.color} flex items-center gap-1`}>
          <Icon className={`h-3 w-3 ${
            document.text_extraction_status === 'processing' || isRetrying ? 'animate-spin' : ''
          }`} />
          {status.text}
        </Badge>
      </div>
      
      {status.showRetry && onRetryExtraction && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRetryExtraction(document.id)}
          disabled={isRetrying}
          className="h-6 px-2 text-xs"
        >
          <RotateCcw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Prøver...' : 'Prøv igjen'}
        </Button>
      )}
    </div>
  );
};

export default DocumentStatusIndicator;
