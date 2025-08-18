import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Clock, RefreshCw, Play, Pause, Loader2, Info, Target, BarChart3, FileText, Lightbulb, Shield, Download, Eye, ExternalLink, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { AnalysisProgressIndicator } from './AnalysisProgressIndicator';
import { useAnalysisProgress } from '@/hooks/useAnalysisProgress';
import { useAIAnalysisSessions, useAIAnalysisSessionsForClient, useAIAnalysisSession } from '@/hooks/useAIAnalysisSessions';
import { DrilldownDialog } from './DrilldownDialog';
import { ReportExportDialog } from './ReportExportDialog';
import { AnalysisInsightsCard } from './AnalysisInsightsCard';
import { AnalysisMetricsCard } from './AnalysisMetricsCard';
import { QuickActionsPanel } from './QuickActionsPanel';
import { AnalysisStatusIndicator } from './AnalysisStatusIndicator';

interface AIAnalysisResultsProps {
  clientId: string;
  selectedVersion?: string;
}

interface AIResult {
  summary?: {
    total_transactions?: number;
    analysis_date?: string;
    message?: string;
    data_version?: string;
    analysis_chunks?: number;
  };
  insights?: Array<{
    category: string;
    observation: string;
    significance: 'high' | 'medium' | 'low';
  }>;
  recommendations?: Array<{
    area: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    reasoning?: string;
  }>;
  risk_factors?: Array<{
    risk: string;
    description: string;
    likelihood: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
  }>;
  anomalies?: Array<{
    transaction_date: string;
    description: string;
    amount: number;
    reason: string;
    severity: 'high' | 'medium' | 'low';
  }>;
}

export const AIAnalysisResults: React.FC<AIAnalysisResultsProps> = ({ 
  clientId, 
  selectedVersion 
}) => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [drilldownDialog, setDrilldownDialog] = useState<{
    open: boolean;
    type: 'voucher' | 'account' | 'transaction';
    identifier: string;
    title: string;
    description?: string;
  }>({ open: false, type: 'voucher', identifier: '', title: '' });
  const [exportDialog, setExportDialog] = useState(false);
  const { progress, initializeProgress, startStep, updateStepProgress, completeStep, failStep, reset } = useAnalysisProgress();
  
  // Hooks for AI analysis sessions
  const { createSession, cancelSession } = useAIAnalysisSessions();
  const { data: sessions, refetch: refetchSessions } = useAIAnalysisSessionsForClient(clientId);
  const { data: activeSession } = useAIAnalysisSession(activeSessionId || '');

  // Get the latest completed session for this version
  const latestSession = sessions?.find(s => 
    s.status === 'completed' && 
    (s.data_version_id === selectedVersion || (!selectedVersion && !s.data_version_id))
  );

  const results = latestSession?.result_data as AIResult | null;
  const isLoading = activeSession?.status === 'running' || activeSession?.status === 'pending';
  const error = activeSession?.error_message;

  // Update progress based on active session
  useEffect(() => {
    if (activeSession && activeSession.status === 'running') {
      // Initialize progress if not already done
      if (!progress.isRunning) {
        initializeProgress([
          { id: 'fetch', label: 'Henter transaksjonsdata' },
          { id: 'prepare', label: 'Forbereder data' },
          { id: 'analyze', label: 'AI-analyse' },
          { id: 'combine', label: 'Kombinerer resultater' },
          { id: 'cache', label: 'Lagrer resultater' }
        ]);
      }

      // Update progress based on session
      const progressPercent = activeSession.progress_percentage || 0;
      const currentStep = activeSession.current_step || '';
      
      // Map session steps to our progress steps
      if (currentStep.includes('Henter')) {
        updateStepProgress('fetch', progressPercent);
      } else if (currentStep.includes('Forbereder')) {
        updateStepProgress('prepare', progressPercent);
      } else if (currentStep.includes('Analyserer') || currentStep.includes('AI-analyse')) {
        updateStepProgress('analyze', progressPercent);
      } else if (currentStep.includes('Kombinerer')) {
        updateStepProgress('combine', progressPercent);
      } else if (currentStep.includes('Lagrer') || currentStep.includes('fullført')) {
        updateStepProgress('cache', progressPercent);
      }
    }

    if (activeSession?.status === 'completed') {
      completeStep('cache');
      setActiveSessionId(null);
      refetchSessions();
    }

    if (activeSession?.status === 'failed') {
      failStep('analyze', activeSession.error_message || 'Ukjent feil');
      setActiveSessionId(null);
    }
  }, [activeSession]);

  const startAnalysis = async () => {
    try {
      const session = await createSession.mutateAsync({
        clientId,
        dataVersionId: selectedVersion,
        sessionType: 'ai_transaction_analysis',
        analysisConfig: {
          analysisType: 'comprehensive',
          includeRiskAnalysis: true,
          includeAnomalyDetection: true
        }
      });

      setActiveSessionId(session.id);
      
      // Start the actual analysis
      const response = await supabase.functions.invoke('ai-transaction-analysis-v2', {
        body: {
          sessionId: session.id,
          clientId,
          versionId: selectedVersion,
          analysisType: 'transaction_analysis'
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success('AI-analyse startet');
    } catch (error) {
      console.error('Error starting analysis:', error);
      toast.error('Kunne ikke starte AI-analyse');
    }
  };

  const handleCancelAnalysis = async () => {
    if (activeSessionId) {
      try {
        await cancelSession.mutateAsync(activeSessionId);
        setActiveSessionId(null);
        reset();
      } catch (error) {
        console.error('Error cancelling analysis:', error);
        toast.error('Kunne ikke avbryte analyse');
      }
    }
  };

  const handleRestartAnalysis = async () => {
    reset();
    await startAnalysis();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      'high': 'Høy',
      'medium': 'Middels',
      'low': 'Lav'
    };
    return labels[severity] || severity;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const handleDrilldown = (type: 'voucher' | 'account' | 'transaction', identifier: string, title: string, description?: string) => {
    setDrilldownDialog({
      open: true,
      type,
      identifier,
      title,
      description
    });
  };

  const handleExport = () => {
    setExportDialog(true);
  };

  // Loading or status state
  if (isLoading || activeSession) {
    return (
      <div className="space-y-6">
        <AnalysisStatusIndicator
          status={activeSession?.status || 'pending'}
          progress={activeSession?.progress_percentage || 0}
          currentStep={activeSession?.current_step}
          error={activeSession?.error_message}
          startedAt={activeSession?.started_at}
          completedAt={activeSession?.completed_at}
          onStart={startAnalysis}
          onCancel={handleCancelAnalysis}
          onRestart={handleRestartAnalysis}
          isLoading={isLoading}
        />
        {progress.isRunning && (
          <Card>
            <CardContent className="p-4">
              <AnalysisProgressIndicator progress={progress} />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            AI-Analyse feilet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={handleRestartAnalysis} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Prøv igjen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No results state
  if (!results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Analyse
          </CardTitle>
          <CardDescription>
            Kjør en omfattende AI-analyse av transaksjonsdataene
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Ingen AI-analyse tilgjengelig for den valgte dataversjonen. Klikk "Start AI-analyse" for å kjøre en ny analyse.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button onClick={startAnalysis} disabled={isLoading}>
              <Play className="h-4 w-4 mr-2" />
              Start AI-analyse
            </Button>
            
            {sessions && sessions.length > 0 && (
              <Button variant="outline" onClick={() => refetchSessions()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Oppdater
              </Button>
            )}
          </div>

          {sessions && sessions.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Tidligere analyser:</h4>
              <div className="space-y-2">
                {sessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="text-sm">
                      <span className="font-medium">{session.session_type}</span>
                      <span className="text-muted-foreground ml-2">
                        {new Date(session.started_at).toLocaleDateString('no-NO')}
                      </span>
                    </div>
                    <Badge variant={session.status === 'completed' ? 'success' : session.status === 'failed' ? 'destructive' : 'secondary'}>
                      {session.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Results state
  const insights = results.insights || [];
  const recommendations = results.recommendations || [];
  const riskFactors = results.risk_factors || [];
  const anomalies = results.anomalies || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AnalysisStatusIndicator
            status="completed"
            startedAt={latestSession?.started_at}
            completedAt={latestSession?.completed_at}
            onStart={startAnalysis}
            onCancel={handleCancelAnalysis}
            onRestart={handleRestartAnalysis}
          />

          <AnalysisMetricsCard
            summary={results.summary}
            insights={insights}
            recommendations={recommendations}
            riskFactors={riskFactors}
            anomalies={anomalies}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Detaljerte resultater
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="insights" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="insights">
                    Innsikter ({insights.length})
                  </TabsTrigger>
                  <TabsTrigger value="recommendations">
                    Anbefalinger ({recommendations.length})
                  </TabsTrigger>
                  <TabsTrigger value="risks">
                    Risikoer ({riskFactors.length})
                  </TabsTrigger>
                  <TabsTrigger value="anomalies">
                    Avvik ({anomalies.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="mt-6">
                  <AnalysisInsightsCard
                    insights={insights}
                    onDrilldown={handleDrilldown}
                  />
                </TabsContent>

                <TabsContent value="recommendations" className="mt-6">
                  <div className="space-y-4">
                    {recommendations.length > 0 ? (
                      <>
                        <h4 className="font-medium flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          AI-Anbefalinger ({recommendations.length})
                        </h4>
                        <div className="space-y-3">
                          {recommendations.map((rec, index) => (
                            <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant={getPriorityColor(rec.priority) as any}>
                                    {getSeverityLabel(rec.priority)}
                                  </Badge>
                                  <span className="font-medium">{rec.area}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDrilldown('account', rec.area, `Anbefaling: ${rec.area}`, rec.recommendation)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {rec.recommendation}
                              </p>
                              {rec.reasoning && (
                                <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                  <strong>Begrunnelse:</strong> {rec.reasoning}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Ingen spesifikke anbefalinger generert fra denne analysen.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="risks" className="mt-6">
                  <div className="space-y-4">
                    {riskFactors.length > 0 ? (
                      <>
                        <h4 className="font-medium flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Identifiserte risikoer ({riskFactors.length})
                        </h4>
                        <div className="space-y-3">
                          {riskFactors.map((risk, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <span className="font-medium">{risk.risk}</span>
                                <div className="flex gap-2">
                                  <Badge variant={getSeverityColor(risk.likelihood) as any}>
                                    Sannsynlighet: {getSeverityLabel(risk.likelihood)}
                                  </Badge>
                                  <Badge variant={getSeverityColor(risk.impact) as any}>
                                    Påvirkning: {getSeverityLabel(risk.impact)}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {risk.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <Alert>
                        <CheckCircle className="h-4 w-4 text-success" />
                        <AlertDescription>
                          Ingen kritiske risikoer identifisert - dette er positivt!
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="anomalies" className="mt-6">
                  <div className="space-y-4">
                    {anomalies.length > 0 ? (
                      <>
                        <h4 className="font-medium flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          Identifiserte avvik ({anomalies.length})
                        </h4>
                        <div className="space-y-3">
                          {anomalies.map((anomaly, index) => (
                            <div key={index} className="p-4 border-l-4 border-destructive bg-destructive/5 rounded">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <span className="font-medium">{anomaly.description}</span>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(anomaly.transaction_date).toLocaleDateString('no-NO')} • 
                                    {anomaly.amount.toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}
                                  </div>
                                </div>
                                <Badge variant={getSeverityColor(anomaly.severity) as any}>
                                  {getSeverityLabel(anomaly.severity)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {anomaly.reason}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <Alert>
                        <CheckCircle className="h-4 w-4 text-success" />
                        <AlertDescription>
                          Ingen avvik identifisert - dette er positivt!
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <QuickActionsPanel
            onExport={handleExport}
            onRefresh={handleRestartAnalysis}
            onDrilldown={handleDrilldown}
            insights={insights}
            recommendations={recommendations}
            riskFactors={riskFactors}
            anomalies={anomalies}
          />
        </div>
      </div>

      <DrilldownDialog
        open={drilldownDialog.open}
        onOpenChange={(open) => setDrilldownDialog(prev => ({ ...prev, open }))}
        type={drilldownDialog.type}
        identifier={drilldownDialog.identifier}
        clientId={clientId}
        versionId={selectedVersion}
        title={drilldownDialog.title}
        description={drilldownDialog.description}
      />

      <ReportExportDialog
        open={exportDialog}
        onOpenChange={setExportDialog}
        aiResults={results}
        clientId={clientId}
        clientName="Klient"
        versionId={selectedVersion}
      />
    </div>
  );
};