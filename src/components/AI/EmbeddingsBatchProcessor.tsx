import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, FileText, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  processAllMissingEmbeddings, 
  getMissingEmbeddingsStats, 
  type BatchProcessingStats 
} from '@/services/batchEmbeddingsService';

interface EmbeddingStats {
  knowledge_articles: number;
  legal_provisions: number;
  legal_documents: number;
}

const EmbeddingsBatchProcessor: React.FC = () => {
  const [stats, setStats] = useState<EmbeddingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingStats, setProcessingStats] = useState<BatchProcessingStats | null>(null);
  const [activeProcess, setActiveProcess] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      setIsRefreshing(true);
      const embeddingStats = await getMissingEmbeddingsStats();
      setStats(embeddingStats);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Kunne ikke laste statistikk');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const processEmbeddings = async (
    entityType: 'knowledge_articles' | 'legal_provisions' | 'legal_documents',
    batchSize: number = 10
  ) => {
    try {
      setIsLoading(true);
      setActiveProcess(entityType);
      setProcessingStats(null);

      const result = await processAllMissingEmbeddings(
        entityType,
        batchSize,
        (progress) => {
          setProcessingStats(progress);
        }
      );

      toast.success(`Fullført! Prosessert ${result.total_processed} embeddings med ${result.total_errors} feil`);
      
      // Refresh stats after processing
      await loadStats();
      
    } catch (error) {
      console.error('Error processing embeddings:', error);
      toast.error('Feil under prosessering av embeddings');
    } finally {
      setIsLoading(false);
      setActiveProcess(null);
      setProcessingStats(null);
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'knowledge_articles': return <BookOpen className="h-4 w-4" />;
      case 'legal_provisions': return <FileText className="h-4 w-4" />;
      case 'legal_documents': return <Database className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getEntityName = (entityType: string) => {
    switch (entityType) {
      case 'knowledge_articles': return 'Kunnskapsartikler';
      case 'legal_provisions': return 'Lovbestemmelser';
      case 'legal_documents': return 'Juridiske dokumenter';
      default: return entityType;
    }
  };

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Embeddings Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Laster statistikk...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalMissing = stats.knowledge_articles + stats.legal_provisions + stats.legal_documents;

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
              disabled={isRefreshing}
              className="ml-auto"
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Oppdater'}
            </Button>
          </CardTitle>
          <CardDescription>
            Oversikt over manglende embeddings som påvirker AI-søkekvaliteten
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
                {totalMissing} embeddings mangler - dette påvirker AI-søkekvaliteten negativt.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(stats).map(([entityType, count]) => (
          <Card key={entityType}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getEntityIcon(entityType)}
                  {getEntityName(entityType)}
                </div>
                <Badge variant={count === 0 ? "secondary" : "destructive"}>
                  {count === 0 ? 'OK' : `${count} mangler`}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {count > 0 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    {count} {count === 1 ? 'element mangler' : 'elementer mangler'} embeddings
                  </p>
                  
                  {activeProcess === entityType && processingStats && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Prosessert: {processingStats.total_processed}</span>
                        <span>Feil: {processingStats.total_errors}</span>
                      </div>
                      <Progress 
                        value={(processingStats.total_processed / processingStats.total_missing) * 100} 
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Batch {processingStats.batches_completed}, estimert tid igjen: {processingStats.estimated_time_remaining}s
                      </p>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => processEmbeddings(entityType as any)}
                    disabled={isLoading}
                    className="w-full"
                    variant={count > 100 ? "destructive" : "default"}
                  >
                    {activeProcess === entityType ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Prosesserer...
                      </>
                    ) : (
                      `Generer embeddings (${count})`
                    )}
                  </Button>
                </>
              )}
              
              {count === 0 && (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Alle embeddings er generert</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {totalMissing > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Anbefalte handlinger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium">Prioritering:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Kunnskapsartikler</strong> - Høy prioritet, påvirker daglige søk direkte</li>
                <li><strong>Lovbestemmelser</strong> - Kritisk for juridisk rådgivning, kan prosesseres i batches</li>
                <li><strong>Juridiske dokumenter</strong> - Lavere prioritet, men viktig for fullstendig dekning</li>
              </ol>
            </div>
            
            {stats.legal_provisions > 500 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tips:</strong> {stats.legal_provisions} lovbestemmelser tar lang tid. 
                  Vurder å prosessere i mindre batches (10-20 av gangen) for å unngå API rate limits.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmbeddingsBatchProcessor;