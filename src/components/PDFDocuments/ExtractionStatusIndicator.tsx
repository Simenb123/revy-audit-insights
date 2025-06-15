
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PDFDocument } from '@/types/pdf';
import { 
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';

const ExtractionStatusIndicator = ({ document }: { document: PDFDocument }) => {
  const status = document.text_extraction_status;
  if (!status) return null;
  
  const getErrorMessage = () => {
    if (status === 'failed' && document.extracted_text && typeof document.extracted_text === 'object' && 'error' in document.extracted_text) {
        return document.extracted_text.error;
    }
    return null;
  }

  const statusConfig = {
    pending: { icon: Clock, color: 'text-gray-500', label: 'Venter på analyse' },
    processing: { icon: Loader2, color: 'text-blue-500 animate-spin', label: 'Analyserer tekst...' },
    completed: { icon: CheckCircle, color: 'text-green-500', label: 'Analyse fullført' },
    failed: { icon: XCircle, color: 'text-red-500', label: 'Analyse feilet' },
  };

  const config = statusConfig[status];
  if (!config) return null;

  const Icon = config.icon;
  const errorMessage = getErrorMessage();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{config.label}</p>
          {errorMessage && (
            <div className="mt-2 border-t border-gray-200 pt-2">
              <p className="text-xs text-red-400">{errorMessage}</p>
            </div>
           )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ExtractionStatusIndicator;
