import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  FileText,
  Scale,
  BookOpen,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { SmartEmbeddingsProcessor, type EmbeddingProcessingStatus } from '@/services/smartEmbeddingsProcessor';

const EmbeddingsBatchProcessor: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processor] = useState(() => new SmartEmbeddingsProcessor());
  const [processingStatus, setProcessingStatus] = useState<EmbeddingProcessingStatus>({
    total: 0,
    processed: 0,
    failed: 0,
    inProgress: false,
    currentBatch: 0,
    totalBatches: 0,
    estimatedTimeRemaining: 0
  });

  useEffect(() => {
    loadStats();
    
    // Set up status updates from the smart processor
    processor.onStatusUpdate(setProcessingStatus);
  }, [processor]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const currentStats = await processor.getOverallStats();
      setStats(currentStats);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Feil ved lasting av statistikk');
    } finally {
      setIsLoading(false);
    }
  };

  const startSmartProcessing = async () => {
    try {
      toast.info('Starter smart embeddings-prosessering...');
      
      const result = await processor.processAllMissingEmbeddings({
        batchSize: 8, // Smaller batches for better control
        delayBetweenBatches: 3000, // 3 seconds between batches
        maxRetries: 2,
        prioritizeByImportance: true
      });
      
      if (result.success) {
        toast.success(result.message);
        await loadStats(); // Refresh stats
      } else {
        toast.error('Prosessering feilet');
      }
    } catch (error) {
      console.error('Smart processing error:', error);
      toast.error('Feil ved smart prosessering');
    }
  };

  const handleProcessAll = async (type: string) => {
    toast.info('Smart prosessering anbefales for bedre kontroll');
  };

  if (isLoading && !stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Laster statistikk...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalMissing = stats?.total_missing || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Embeddings Status
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              disabled={isLoading}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Oppdater
            </Button>
          </CardTitle>
          <CardDescription>
            Oversikt over manglende embeddings som påvirker AI Revy's søkekvalitet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalMissing === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Alle embeddings er generert! AI Revy har full tilgang til kunnskapsbasen.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{totalMissing} embeddings mangler!</strong> Dette påvirker AI-søkekvaliteten negativt.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Smart Processing Section */}
      <Card className="border-primary/20 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Smart Embeddings Prosessering
            <Badge variant="secondary">Anbefalt</Badge>
          </CardTitle>
          <CardDescription>
            Automatisk prosessering av alle manglende embeddings med smart prioritering og batch-behandling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {processingStatus.inProgress ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Batch {processingStatus.currentBatch} av {processingStatus.totalBatches}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((processingStatus.processed / processingStatus.total) * 100)}% fullført
                </span>
              </div>
              
              <Progress 
                value={(processingStatus.processed / processingStatus.total) * 100} 
                className="w-full"
              />
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-green-600">{processingStatus.processed}</div>
                  <div className="text-muted-foreground">Fullført</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-blue-600">
                    {processingStatus.total - processingStatus.processed - processingStatus.failed}
                  </div>
                  <div className="text-muted-foreground">Gjenstår</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-red-600">{processingStatus.failed}</div>
                  <div className="text-muted-foreground">Feilet</div>
                </div>
              </div>
              
              {processingStatus.estimatedTimeRemaining > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Estimert tid gjenstår: {Math.round(processingStatus.estimatedTimeRemaining / 1000 / 60)} min
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {totalMissing > 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{totalMissing} embeddings mangler!</strong> 
                    Smart prosessering vil behandle disse med optimal hastighet og prioritering.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Alle embeddings er oppdaterte! 🎉
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={startSmartProcessing} 
                disabled={isLoading || !totalMissing}
                className="w-full"
                size="lg"
              >
                <Zap className="mr-2 h-4 w-4" />
                Start smart prosessering
                {totalMissing > 0 && ` (${totalMissing} elementer)`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-blue-500" />
                Kunnskapsartikler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {stats.knowledge_articles?.missing_embeddings || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">mangler embeddings</p>
                </div>
                <Badge variant={stats.knowledge_articles?.missing_embeddings === 0 ? "secondary" : "destructive"}>
                  {stats.knowledge_articles?.missing_embeddings === 0 ? 'Komplett' : 'Mangler'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="h-4 w-4 text-purple-500" />
                Lovbestemmelser
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {stats.legal_provisions?.missing_embeddings || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">mangler embeddings</p>
                </div>
                <Badge variant={stats.legal_provisions?.missing_embeddings === 0 ? "secondary" : "destructive"}>
                  {stats.legal_provisions?.missing_embeddings === 0 ? 'Komplett' : 'Kritisk'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-green-500" />
                Juridiske dokumenter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {stats.legal_documents?.missing_embeddings || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">mangler embeddings</p>
                </div>
                <Badge variant={stats.legal_documents?.missing_embeddings === 0 ? "secondary" : "destructive"}>
                  {stats.legal_documents?.missing_embeddings === 0 ? 'Komplett' : 'Mangler'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Individual Processing */}
      {totalMissing > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Manuell prosessering</CardTitle>
            <CardDescription>
              Prosesser spesifikke kategorier individuelt (ikke anbefalt - bruk smart prosessering over)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Button
                variant="outline"
                onClick={() => handleProcessAll('knowledge_articles')}
                disabled={isLoading || !stats?.knowledge_articles?.missing_embeddings}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Prosesser artikler
              </Button>
              <Button
                variant="outline" 
                onClick={() => handleProcessAll('legal_provisions')}
                disabled={isLoading || !stats?.legal_provisions?.missing_embeddings}
              >
                <Scale className="mr-2 h-4 w-4" />
                Prosesser bestemmelser
              </Button>
              <Button
                variant="outline"
                onClick={() => handleProcessAll('legal_documents')}
                disabled={isLoading || !stats?.legal_documents?.missing_embeddings}
              >
                <FileText className="mr-2 h-4 w-4" />
                Prosesser dokumenter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmbeddingsBatchProcessor;