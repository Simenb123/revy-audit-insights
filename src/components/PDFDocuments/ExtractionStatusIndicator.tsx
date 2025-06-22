
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, RefreshCw, FileText } from 'lucide-react';
import { PDFDocument } from '@/types/pdf';

interface ExtractionStatusIndicatorProps {
  document: PDFDocument;
}

const ExtractionStatusIndicator = ({ document }: ExtractionStatusIndicatorProps) => {
  const getStatusInfo = () => {
    switch (document.text_extraction_status) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800',
          text: 'Tekst ekstrahert',
          description: 'AI kan nå lese dette dokumentet'
        };
      case 'processing':
        return {
          icon: RefreshCw,
          color: 'bg-blue-100 text-blue-800',
          text: 'Prosesserer...',
          description: 'Ekstraherer tekst med AI'
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-800',
          text: 'Venter',
          description: 'Klar for tekstekstraksjon'
        };
      case 'failed':
        return {
          icon: AlertCircle,
          color: 'bg-red-100 text-red-800',
          text: 'Feilet',
          description: 'Tekstekstraksjon feilet'
        };
      default:
        return {
          icon: FileText,
          color: 'bg-gray-100 text-gray-800',
          text: 'Ikke prosessert',
          description: 'Tekst ikke ekstrahert ennå'
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
