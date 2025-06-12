
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, AlertCircle, Eye, RotateCcw, Trash2 } from 'lucide-react';
import { usePDFConversions } from '@/hooks/usePDFConversions';

interface ConversionProgressProps {
  onPreview?: (jobId: string) => void;
  onRetry?: (jobId: string) => void;
}

const ConversionProgress = ({ onPreview, onRetry }: ConversionProgressProps) => {
  const { conversions, isLoading, retryConversion, deleteConversion } = usePDFConversions();

  const handleRetry = async (jobId: string) => {
    try {
      await retryConversion.mutateAsync(jobId);
      onRetry?.(jobId);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      await deleteConversion.mutateAsync(jobId);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return 'bg-blue-500';
      case 'processing': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing': 
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
      case 'completed': 
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed': 
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'uploading': return 'Laster opp';
      case 'processing': return 'Behandler';
      case 'completed': return 'Fullført';
      case 'failed': return 'Feilet';
      default: return 'Ukjent';
    }
  };

  const getConversionTypeLabel = (type: string) => {
    switch (type) {
      case 'full': return 'Full konvertering';
      case 'summary': return 'Sammendrag';
      case 'checklist': return 'Sjekkliste';
      default: return 'Ukjent';
    }
  };

  const formatTimeEstimate = (minutes?: number) => {
    if (!minutes || minutes <= 0) return 'Ferdig snart';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}t ${mins}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Konverteringsstatus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Konverteringsstatus
          {conversions && conversions.length > 0 && (
            <Badge variant="outline" className="ml-2">
              {conversions.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!conversions || conversions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Ingen konverteringsjobber ennå
          </p>
        ) : (
          <div className="space-y-4">
            {conversions.map((job) => (
              <div key={job.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <h4 className="font-medium">{job.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {getConversionTypeLabel(job.conversion_type)}
                    </Badge>
                    <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                      {getStatusLabel(job.status)}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {job.file_name} • {job.category?.name || 'Ukjent kategori'}
                </p>
                
                {(job.status === 'uploading' || job.status === 'processing') && (
                  <div className="space-y-2">
                    <Progress value={job.progress} className="w-full" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{job.progress}% fullført</span>
                      {job.estimated_time && job.estimated_time > 0 && (
                        <span>Ca. {formatTimeEstimate(job.estimated_time)} igjen</span>
                      )}
                    </div>
                  </div>
                )}
                
                {job.status === 'failed' && job.error_message && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                    <p className="text-sm text-red-800">{job.error_message}</p>
                  </div>
                )}
                
                <div className="flex gap-2 mt-3">
                  {job.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPreview?.(job.id)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Forhåndsvis
                    </Button>
                  )}
                  
                  {job.status === 'failed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetry(job.id)}
                      disabled={retryConversion.isPending}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Prøv igjen
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(job.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={deleteConversion.isPending}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Slett
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground mt-2">
                  Opprettet: {new Date(job.created_at).toLocaleString('nb-NO')}
                  {job.completed_at && (
                    <> • Fullført: {new Date(job.completed_at).toLocaleString('nb-NO')}</>
                  )}
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
