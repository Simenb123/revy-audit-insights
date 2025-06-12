
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, AlertCircle, Eye, RotateCcw, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConversionJob {
  id: string;
  file_name: string;
  title: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  category_id: string;
  conversion_type: 'full' | 'summary' | 'checklist';
  created_at: string;
  estimated_time?: number;
  error_message?: string;
  completed_at?: string;
}

interface ConversionProgressProps {
  onPreview?: (jobId: string) => void;
  onRetry?: (jobId: string) => void;
}

const ConversionProgress = ({ onPreview, onRetry }: ConversionProgressProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversion jobs
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['pdf-conversions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_conversions')
        .select(`
          *,
          category:knowledge_categories(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ConversionJob[];
    },
    refetchInterval: (data) => {
      // Refetch every 2 seconds if there are processing jobs
      const hasProcessing = data?.some(job => 
        job.status === 'uploading' || job.status === 'processing'
      );
      return hasProcessing ? 2000 : false;
    }
  });

  const handleRetry = async (jobId: string) => {
    try {
      const job = jobs?.find(j => j.id === jobId);
      if (!job) return;

      // Reset job status to processing
      const { error } = await supabase
        .from('pdf_conversions')
        .update({ 
          status: 'processing', 
          progress: 0, 
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      // Start conversion process
      const { error: functionError } = await supabase.functions.invoke('pdf-converter', {
        body: {
          conversionId: jobId,
          filePath: job.file_path,
          conversionType: job.conversion_type,
          title: job.title,
          categoryId: job.category_id
        }
      });

      if (functionError) throw functionError;

      toast({
        title: "Konvertering startet på nytt",
        description: `${job.title} er nå i konverteringskøen.`,
      });

      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['pdf-conversions'] });

      onRetry?.(jobId);
    } catch (error) {
      console.error('Retry failed:', error);
      toast({
        title: "Kunne ikke starte på nytt",
        description: "Det oppstod en feil ved omstart av konvertering.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      const job = jobs?.find(j => j.id === jobId);
      if (!job) return;

      // Delete the conversion record
      const { error } = await supabase
        .from('pdf_conversions')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      // Also delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('pdf-documents')
        .remove([job.file_path]);

      if (storageError) {
        console.warn('Could not delete file from storage:', storageError);
      }

      toast({
        title: "Konverteringsjobb slettet",
        description: `${job.title} er fjernet.`,
      });

      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['pdf-conversions'] });
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: "Kunne ikke slette",
        description: "Det oppstod en feil ved sletting av konverteringsjobb.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: ConversionJob['status']) => {
    switch (status) {
      case 'uploading': return 'bg-blue-500';
      case 'processing': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: ConversionJob['status']) => {
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

  const getStatusLabel = (status: ConversionJob['status']) => {
    switch (status) {
      case 'uploading': return 'Laster opp';
      case 'processing': return 'Behandler';
      case 'completed': return 'Fullført';
      case 'failed': return 'Feilet';
    }
  };

  const getConversionTypeLabel = (type: ConversionJob['conversion_type']) => {
    switch (type) {
      case 'full': return 'Full konvertering';
      case 'summary': return 'Sammendrag';
      case 'checklist': return 'Sjekkliste';
    }
  };

  const formatTimeEstimate = (minutes: number) => {
    if (minutes <= 0) return 'Ferdig snart';
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
          {jobs && jobs.length > 0 && (
            <Badge variant="outline" className="ml-2">
              {jobs.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!jobs || jobs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
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
                  {job.file_name} • {(job as any).category?.name || 'Ukjent kategori'}
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
