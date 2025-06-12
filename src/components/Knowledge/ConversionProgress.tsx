
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, AlertCircle, Eye } from 'lucide-react';

interface ConversionJob {
  id: string;
  fileName: string;
  title: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  category: string;
  conversionType: 'full' | 'summary' | 'checklist';
  createdAt: string;
  estimatedTime?: number;
}

interface ConversionProgressProps {
  jobs: ConversionJob[];
  onPreview?: (jobId: string) => void;
  onRetry?: (jobId: string) => void;
}

const ConversionProgress = ({ jobs, onPreview, onRetry }: ConversionProgressProps) => {
  const getStatusColor = (status: ConversionJob['status']) => {
    switch (status) {
      case 'processing': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: ConversionJob['status']) => {
    switch (status) {
      case 'processing': return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getConversionTypeLabel = (type: ConversionJob['conversionType']) => {
    switch (type) {
      case 'full': return 'Full konvertering';
      case 'summary': return 'Sammendrag';
      case 'checklist': return 'Sjekkliste';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Konverteringsstatus
        </CardTitle>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Ingen konverteringsjobber ennå
          </p>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <h4 className="font-medium">{job.title}</h4>
                  </div>
                  <Badge variant="outline">
                    {getConversionTypeLabel(job.conversionType)}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {job.fileName} • {job.category}
                </p>
                
                {job.status === 'processing' && (
                  <div className="space-y-2">
                    <Progress value={job.progress} className="w-full" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{job.progress}% fullført</span>
                      {job.estimatedTime && (
                        <span>Ca. {job.estimatedTime} min igjen</span>
                      )}
                    </div>
                  </div>
                )}
                
                {job.status === 'completed' && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPreview?.(job.id)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Forhåndsvis
                    </Button>
                  </div>
                )}
                
                {job.status === 'failed' && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRetry?.(job.id)}
                    >
                      Prøv igjen
                    </Button>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-2">
                  Startet: {new Date(job.createdAt).toLocaleString('nb-NO')}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversionProgress;
