
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Clock, CheckCircle, AlertCircle, Download } from 'lucide-react';

interface PDFConversion {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  title: string;
  category_id: string;
  conversion_type: 'full' | 'summary' | 'checklist';
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  extracted_text?: string;
  structured_content?: any;
  error_message?: string;
  estimated_time?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  category?: { name: string };
}

interface PDFConversionWorkflowProps {
  conversions?: PDFConversion[];
  onRetry?: (conversionId: string) => void;
  onDelete?: (conversionId: string) => void;
}

const PDFConversionWorkflow: React.FC<PDFConversionWorkflowProps> = ({ 
  conversions = [], 
  onRetry, 
  onDelete 
}) => {
  const getStatusIcon = (status: PDFConversion['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: PDFConversion['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'secondary';
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">PDF-konverteringer</h3>
        <Badge variant="outline">
          {conversions.filter(c => c.status === 'completed').length} av {conversions.length} fullført
        </Badge>
      </div>

      {conversions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ingen PDF-konverteringer funnet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversions.map((conversion) => (
            <Card key={conversion.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(conversion.status)}
                  <CardTitle className="text-sm">{conversion.title}</CardTitle>
                </div>
                <Badge variant={getStatusColor(conversion.status)}>
                  {conversion.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{conversion.file_name}</span>
                  <span>{Math.round(conversion.file_size / 1024)} KB</span>
                </div>

                {(conversion.status === 'uploading' || conversion.status === 'processing') && (
                  <div className="space-y-2">
                    <Progress value={conversion.progress} className="w-full" />
                    <p className="text-xs text-muted-foreground">
                      {conversion.progress}% fullført
                      {conversion.estimated_time && ` • Ca. ${conversion.estimated_time} min igjen`}
                    </p>
                  </div>
                )}

                {conversion.status === 'failed' && conversion.error_message && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {conversion.error_message}
                  </div>
                )}

                {conversion.status === 'completed' && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 mr-1" />
                      Last ned
                    </Button>
                    <span className="text-xs text-green-600">
                      Fullført {conversion.completed_at && new Date(conversion.completed_at).toLocaleDateString('no-NO')}
                    </span>
                  </div>
                )}

                {conversion.status === 'failed' && onRetry && (
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onRetry(conversion.id)}
                    >
                      Prøv igjen
                    </Button>
                    {onDelete && (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => onDelete(conversion.id)}
                      >
                        Slett
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PDFConversionWorkflow;
