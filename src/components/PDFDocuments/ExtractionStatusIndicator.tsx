
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, RefreshCw, FileText, Eye } from 'lucide-react';
import { PDFDocument } from '@/types/pdf';

interface ExtractionStatusIndicatorProps {
  document: PDFDocument;
}

const ExtractionStatusIndicator = ({ document }: ExtractionStatusIndicatorProps) => {
  const getStatusInfo = () => {
    switch (document.text_extraction_status) {
      case 'completed':
        // Check if we actually have meaningful extracted text
        const extractedText = document.extracted_text;
        const hasRealText = extractedText && 
          typeof extractedText === 'string' &&
          extractedText.length > 50 &&
          !extractedText.startsWith('[Kunne ikke');
        
        return {
          icon: hasRealText ? CheckCircle : Eye,
          color: hasRealText ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800',
          text: hasRealText ? 'AI kan lese' : 'Begrenset tekst',
          description: hasRealText 
            ? 'AI kan nå lese og analysere dette dokumentet'
            : 'Lite tekst funnet - kan være skannet eller bildebasert'
        };
      case 'processing':
        return {
          icon: RefreshCw,
          color: 'bg-blue-100 text-blue-800',
          text: 'AI leser...',
          description: 'Avansert AI-analyse pågår med OpenAI Vision'
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-800',
          text: 'Venter',
          description: 'Klar for AI-assistert tekstekstraksjon'
        };
      case 'failed':
        return {
          icon: AlertCircle,
          color: 'bg-red-100 text-red-800',
          text: 'Feilet',
          description: 'AI-tekstekstraksjon feilet - prøv igjen'
        };
      default:
        return {
          icon: FileText,
          color: 'bg-gray-100 text-gray-800',
          text: 'Ikke prosessert',
          description: 'Trykk "Ekstraher innhold" for AI-analyse'
        };
    }
  };

  const status = getStatusInfo();
  const Icon = status.icon;

  return (
    <div className="flex items-center gap-1" title={status.description}>
      <Badge className={`text-xs ${status.color} flex items-center gap-1`}>
        <Icon className={`h-3 w-3 ${document.text_extraction_status === 'processing' ? 'animate-spin' : ''}`} />
        {status.text}
      </Badge>
    </div>
  );
};

export default ExtractionStatusIndicator;
