
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, CheckCircle } from 'lucide-react';

interface DocumentAnalysisIndicatorProps {
  isAnalyzing?: boolean;
  documentsFound?: number;
  analysisComplete?: boolean;
}

const DocumentAnalysisIndicator: React.FC<DocumentAnalysisIndicatorProps> = ({
  isAnalyzing = false,
  documentsFound = 0,
  analysisComplete = false
}) => {
  if (!isAnalyzing && documentsFound === 0) return null;

  return (
    <Card className="mb-2 border-blue-200 bg-blue-50">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">Søker etter relevante dokumenter...</span>
            </>
          ) : analysisComplete ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">
                Dokumentanalyse fullført
              </span>
              {documentsFound > 0 && (
                <Badge variant="secondary" className="ml-2">
                  <FileText className="h-3 w-3 mr-1" />
                  {documentsFound} dokument{documentsFound !== 1 ? 'er' : ''} funnet
                </Badge>
              )}
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                Analyserer dokumentinnhold...
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentAnalysisIndicator;
