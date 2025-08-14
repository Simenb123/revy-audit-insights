import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Brain, 
  Clock, 
  CheckCircle,
  Play,
  RefreshCw
} from 'lucide-react';
import AnalysisGuideCard from '@/components/AnalysisGuideCard';
import AnalysisStatusCard from '@/components/AnalysisStatusCard';
import { useAnalysisSessions, useAnalysisSessionsForClient } from '@/hooks/useAnalysisSessions';
import { analysisService } from '@/services/analysisService';
import { toast } from 'sonner';
import { formatNorwegianNumber } from '@/utils/fileProcessing';

interface AnalysisPanelProps {
  clientId: string;
  dataVersionId?: string;
  filteredData?: any[];
  filterStats?: any;
  className?: string;
}

export const AnalysisPanel = ({ 
  clientId, 
  dataVersionId, 
  filteredData, 
  filterStats,
  className = "" 
}: AnalysisPanelProps) => {
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
  const [basicAnalysisResults, setBasicAnalysisResults] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string | null>(null);
  
  const { createSession } = useAnalysisSessions();
  const { data: sessions, refetch: refetchSessions } = useAnalysisSessionsForClient(clientId);

  const analysisTypes = [
    {
      id: 'basic_transaction',
      name: 'Grunnleggende transaksjonsanalyse',
      description: 'Analyserer transaksjonsfordelinger og mønstre',
      icon: BarChart3,
      implementation: 'typescript',
      estimatedTime: '< 1 min'
    },
    {
      id: 'transaction_patterns',
      name: 'Avanserte transaksjonsmønstre',
      description: 'AI-basert analyse av transaksjonsanomalier',
      icon: Brain,
      implementation: 'python',
      estimatedTime: '2-5 min'
    },
    {
      id: 'risk_analysis',
      name: 'Risikoanalyse',
      description: 'Identifiserer potensielle risikoområder',
      icon: AlertTriangle,
      implementation: 'python',
      estimatedTime: '3-7 min'
    },
    {
      id: 'financial_ratios',
      name: 'Finansielle nøkkeltall',
      description: 'Beregner viktige økonomiske indikatorer',
      icon: TrendingUp,
      implementation: 'python',
      estimatedTime: '1-3 min'
    }
  ];

  const runBasicAnalysis = async () => {
    if (!dataVersionId) {
      setAnalysisError('Ingen dataversjon valgt. Velg en dataversjon først.');
      toast.error('Ingen dataversjon valgt');
      return;
    }

    setActiveAnalysis('basic_transaction');
    setAnalysisError(null);
    
    try {
      const results = await analysisService.performBasicTransactionAnalysis({
        clientId,
        dataVersionId,
        analysisType: 'transaction_patterns',
        filterCriteria: filterStats
      });
      
      setBasicAnalysisResults(results);
      setLastAnalysisTime(new Date().toISOString());
      setAnalysisError(null);
      toast.success('Grunnleggende analyse fullført');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ukjent feil ved analyse';
      setAnalysisError(`Analysefeil: ${errorMessage}`);
      toast.error('Feil ved kjøring av analyse');
      console.error('Analysis failed:', error);
    } finally {
      setActiveAnalysis(null);
    }
  };

  const runAdvancedAnalysis = async (analysisType: string) => {
    if (!dataVersionId) {
      setAnalysisError('Ingen dataversjon valgt. Velg en dataversjon først.');
      toast.error('Ingen dataversjon valgt');
      return;
    }

    setActiveAnalysis(analysisType);
    setAnalysisError(null);

    try {
      // Create analysis session
      const session = await createSession.mutateAsync({
        clientId,
        sessionType: analysisType,
        analysisConfig: {
          filterCriteria: filterStats,
          dataVersionId,
          implementationType: 'python_placeholder'
        },
        dataVersionId
      });

      // Run advanced analysis (placeholder for now)
      const results = await analysisService.performAdvancedAnalysis({
        clientId,
        dataVersionId,
        analysisType: analysisType as any,
        filterCriteria: filterStats
      });

      // Store results
      await analysisService.storeAnalysisResults(session.id, [results]);
      
      setLastAnalysisTime(new Date().toISOString());
      setAnalysisError(null);
      toast.success('Avansert analyse planlagt - Python-integrasjon kommer snart');
      refetchSessions();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ukjent feil ved avansert analyse';
      setAnalysisError(`Avansert analysefeil: ${errorMessage}. Dette kan skyldes at AI-tjenesten er utilgjengelig.`);
      toast.error('Feil ved oppstart av avansert analyse');
      console.error('Advanced analysis failed:', error);
    } finally {
      setActiveAnalysis(null);
    }
  };

  const handleAnalysisSelect = (analysisType: string) => {
    if (analysisType === 'basic_transaction') {
      runBasicAnalysis();
    } else {
      runAdvancedAnalysis(analysisType);
    }
  };

  const handleRetryAnalysis = () => {
    setAnalysisError(null);
    if (basicAnalysisResults) {
      runBasicAnalysis();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'running': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const isDataReady = !!dataVersionId && !!filterStats;
  const totalAnalysesRun = (sessions?.length || 0) + (basicAnalysisResults ? 1 : 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Analysis Status */}
      <AnalysisStatusCard
        dataLoading={!isDataReady}
        analysisRunning={!!activeAnalysis}
        analysisError={analysisError}
        lastAnalysisTime={lastAnalysisTime}
        totalAnalysesRun={totalAnalysesRun}
        onRetry={handleRetryAnalysis}
      />

      {/* Analysis Guide */}
      <AnalysisGuideCard
        isDataReady={isDataReady}
        currentAnalysisCount={totalAnalysesRun}
        onAnalysisSelect={handleAnalysisSelect}
      />

      {/* Analysis Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Dataanalyse</span>
          </CardTitle>
          <CardDescription>
            Kjør analyser på {filteredData ? 'filtrerte' : 'alle'} regnskapsdata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Data Summary */}
          {filterStats && (
            <Alert>
              <AlertDescription>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium">Transaksjoner</div>
                    <div className="text-lg">{filterStats.filteredCount.toLocaleString('nb-NO')}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Balanse</div>
                    <div className="text-lg">{formatNorwegianNumber(filterStats.filteredBalance)} kr</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Status</div>
                    <div className="text-lg">
                      {Math.abs(filterStats.filteredBalance) < 1 ? '✅ I balanse' : '⚠️ Ubalanse'}
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Analysis Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisTypes.map((analysis) => {
              const Icon = analysis.icon;
              const isActive = activeAnalysis === analysis.id;
              const isBasic = analysis.implementation === 'typescript';
              
              return (
                <Card key={analysis.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Icon className="w-6 h-6 text-primary" />
                      <div className="flex space-x-2">
                        <Badge variant={isBasic ? 'default' : 'outline'}>
                          {isBasic ? 'TypeScript' : 'Python'}
                        </Badge>
                        <Badge variant="secondary">
                          {analysis.estimatedTime}
                        </Badge>
                      </div>
                    </div>
                    
                    <h3 className="font-medium mb-1">{analysis.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {analysis.description}
                    </p>
                    
                    <Button 
                      size="sm" 
                      className="w-full"
                      disabled={isActive || !dataVersionId}
                      onClick={() => isBasic ? runBasicAnalysis() : runAdvancedAnalysis(analysis.id)}
                    >
                      {isActive ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Kjører...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Kjør analyse
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Basic Analysis Results */}
      {basicAnalysisResults && (
        <Card>
          <CardHeader>
            <CardTitle>Grunnleggende analyse - Resultater</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium">Totalt antall transaksjoner</div>
                <div className="text-2xl font-bold">
                  {basicAnalysisResults.total_transactions.toLocaleString('nb-NO')}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Periode</div>
                <div className="text-lg">
                  {new Date(basicAnalysisResults.date_range.start).toLocaleDateString('nb-NO')} - 
                  {new Date(basicAnalysisResults.date_range.end).toLocaleDateString('nb-NO')}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Unike kontoer</div>
                <div className="text-2xl font-bold">
                  {basicAnalysisResults.account_distribution.length}
                </div>
              </div>
            </div>
            
            {basicAnalysisResults.account_distribution.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Mest aktive kontoer</h4>
                <div className="space-y-1">
                  {basicAnalysisResults.account_distribution.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.account}</span>
                      <span>{item.count} transaksjoner</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Analysis Sessions */}
      {sessions && sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tidligere analyser</CardTitle>
            <CardDescription>
              Oversikt over kjørte analysesessjoner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(session.status)}
                    <div>
                      <div className="font-medium">
                        {analysisTypes.find(t => t.id === session.session_type)?.name || session.session_type}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(session.started_at).toLocaleString('nb-NO')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusVariant(session.status)}>
                      {session.status}
                    </Badge>
                    {session.status === 'running' && (
                      <Progress value={session.progress_percentage} className="w-16" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisPanel;