import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, Activity, Download, FileSpreadsheet } from 'lucide-react';
import { analysisService } from '@/services/analysisService';
import { ControlTestResults } from './ControlTestResults';
import { RiskScoringResults } from './RiskScoringResults';
import { TransactionFlowAnalysis } from './TransactionFlowAnalysis';
import { AIAnalysisResults } from './AIAnalysisResults';
import { ReportGeneratorPanel } from './ReportGeneratorPanel';
import { AnalysisConfigurationPanel } from './AnalysisConfigurationPanel';
import { AnalysisProgressIndicator } from './AnalysisProgressIndicator';
import { AnalysisOptimizationPanel } from '@/components/AnalysisOptimizationPanel';
import { ReportData } from '@/services/reportGenerationService';
import { AnalysisConfiguration } from '@/services/analysisConfigurationService';
import { useAnalysisProgress } from '@/hooks/useAnalysisProgress';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

interface ComprehensiveAnalysisDashboardProps {
  clientId: string;
  dataVersionId: string;
}

export function ComprehensiveAnalysisDashboard({ 
  clientId, 
  dataVersionId 
}: ComprehensiveAnalysisDashboardProps) {
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfiguration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);
  
  const { progress, initializeProgress, startStep, updateStepProgress, completeStep, failStep, reset } = useAnalysisProgress();
  const performanceMetrics = usePerformanceMonitor('ComprehensiveAnalysisDashboard');

  const runComprehensiveAnalysis = async () => {
    setLoading(true);
    setError(null);
    reset();
    
    // Initialize progress steps
    initializeProgress([
      { id: 'init', label: 'Initialiserer analyse' },
      { id: 'fetch_data', label: 'Henter transaksjonsdata' },
      { id: 'basic_analysis', label: 'Utfører grunnleggende analyse' },
      { id: 'control_tests', label: 'Kjører kontrolltester' },
      { id: 'risk_scoring', label: 'Beregner risikoskårer' },
      { id: 'ai_analysis', label: 'Utfører AI-analyse' },
      { id: 'compile_results', label: 'Kompilerer resultater' },
      { id: 'completed', label: 'Analyse fullført' }
    ]);
    
    try {
      const results = await analysisService.performComprehensiveAnalysis({
        clientId,
        dataVersionId,
        analysisType: 'risk_analysis',
        customConfig: analysisConfig,
        progressCallback: (step: string, progressPercent: number) => {
          if (step === 'init') startStep('init');
          else if (step === 'fetch_data') {
            completeStep('init');
            startStep('fetch_data');
          } else if (step === 'basic_analysis') {
            completeStep('fetch_data');
            startStep('basic_analysis');
          } else if (step === 'control_tests') {
            completeStep('basic_analysis');
            startStep('control_tests');
          } else if (step === 'risk_scoring') {
            completeStep('control_tests');
            startStep('risk_scoring');
          } else if (step === 'ai_analysis') {
            completeStep('risk_scoring');
            startStep('ai_analysis');
          } else if (step === 'compile_results') {
            completeStep('ai_analysis');
            startStep('compile_results');
          } else if (step === 'completed') {
            completeStep('compile_results');
            startStep('completed');
            completeStep('completed');
          }
        }
      });
      
      setAnalysisResults(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analyse feilet';
      setError(errorMessage);
      failStep(progress.currentStep || 'unknown', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId && dataVersionId) {
      runComprehensiveAnalysis();
    }
  }, [clientId, dataVersionId]);

  const getOverallRiskLevel = () => {
    if (!analysisResults) return 'unknown';
    
    const { controlTests, riskScoring } = analysisResults;
    
    // Check for critical control failures
    const criticalFailures = controlTests?.filter((test: any) => 
      test.result === 'FAIL' && test.severity === 'HIGH'
    )?.length || 0;
    
    // Check overall risk score
    const overallRisk = riskScoring?.overallRisk || 0;
    
    if (criticalFailures > 0 || overallRisk > 0.7) return 'high';
    if (overallRisk > 0.4) return 'medium';
    return 'low';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const handleExcelExport = async (type: 'analysis' | 'transactions') => {
    if (!analysisResults) return;
    
    setIsExporting(true);
    try {
      const { exportAnalysisToExcel, exportTransactionsToExcel } = await import('@/utils/excelExport');
      
      if (type === 'analysis') {
        await exportAnalysisToExcel({
          clientName: 'Klient', // Should come from props
          reportDate: new Date().toLocaleDateString('nb-NO'),
          fiscalYear: '2024',
          basicAnalysis: analysisResults.basicAnalysis,
          controlTests: analysisResults.controlTests,
          riskScoring: analysisResults.riskScoring,
          aiAnalysis: analysisResults.aiAnalysis
        });
      } else {
        // Note: This would need actual transaction data - placeholder for now
        await exportTransactionsToExcel([], 'Klient_transaksjoner');
      }
    } catch (error) {
      console.error('Excel export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getAnalysisSummary = () => {
    if (!analysisResults) return null;
    
    const { basicAnalysis, controlTests, riskScoring, aiAnalysis } = analysisResults;
    
    const passedTests = controlTests?.filter((test: any) => test.result === 'PASS')?.length || 0;
    const totalTests = controlTests?.length || 0;
    const highRiskTransactions = riskScoring?.transactionRisks?.filter((t: any) => t.riskScore > 0.7)?.length || 0;
    
    return {
      totalTransactions: basicAnalysis?.total_transactions || 0,
      testsPassed: `${passedTests}/${totalTests}`,
      overallRisk: riskScoring?.overallRisk || 0,
      highRiskTransactions,
      aiInsights: aiAnalysis?.recommendations?.length || 0
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Kjører omfattende analyse...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const summary = getAnalysisSummary();
  const riskLevel = getOverallRiskLevel();

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      {(loading || progress.steps.length > 0) && (
        <AnalysisProgressIndicator progress={progress} />
      )}
      
      {/* Performance Monitor (Development Only) */}
      {process.env.NODE_ENV === 'development' && !performanceMetrics.isLoading && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Performance Metrics (Dev)</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div>Render Time: {performanceMetrics.metrics.renderTime.toFixed(2)}ms</div>
            <div>Load Time: {performanceMetrics.metrics.loadTime.toFixed(2)}ms</div>
            {performanceMetrics.metrics.memoryUsage && (
              <div>Memory Usage: {performanceMetrics.metrics.memoryUsage.toFixed(2)}MB</div>
            )}
            {performanceMetrics.warnings.length > 0 && (
              <div className="text-amber-600">
                Warnings: {performanceMetrics.warnings.join(', ')}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Analysis Overview */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totale transaksjoner</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalTransactions.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kontrolltester</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.testsPassed}</div>
              <p className="text-xs text-muted-foreground">Bestått/Totalt</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risikoskåre</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">{(summary.overallRisk * 100).toFixed(0)}%</div>
                <Badge variant={getRiskColor(riskLevel)}>
                  {riskLevel.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Høyrisiko transaksjoner</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.highRiskTransactions}</div>
              <p className="text-xs text-muted-foreground">Krever oppmerksomhet</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analysis Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Detaljert analyse</CardTitle>
          <CardDescription>
            Komplett analyse av transaksjonsdata med kontrolltester, risikoskåring og AI-innsikter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Oversikt</TabsTrigger>
              <TabsTrigger value="controls">Kontrolltester</TabsTrigger>
              <TabsTrigger value="risk">Risikoskåring</TabsTrigger>
              <TabsTrigger value="flow">Transaksjonsflyt</TabsTrigger>
              <TabsTrigger value="ai">AI-analyse</TabsTrigger>
              <TabsTrigger value="report">Rapport</TabsTrigger>
              <TabsTrigger value="config">Innstillinger</TabsTrigger>
              <TabsTrigger value="optimization">Optimalisering</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Analyse sammendrag</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Dataperiode:</span>
                      <span className="font-medium">
                        {analysisResults?.basicAnalysis?.date_range?.start} - {analysisResults?.basicAnalysis?.date_range?.end}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Antall kontoer:</span>
                      <span className="font-medium">
                        {analysisResults?.basicAnalysis?.account_distribution?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gjennomsnittlig beløp:</span>
                      <span className="font-medium">
                        {analysisResults?.basicAnalysis?.amount_statistics?.average?.toLocaleString('nb-NO', { 
                          style: 'currency', 
                          currency: 'NOK' 
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hovedfunn</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisResults?.aiAnalysis?.key_findings?.map((finding: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{finding}</span>
                        </div>
                      )) || (
                        <p className="text-muted-foreground text-sm">Ingen spesifikke funn identifisert</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="controls">
              {analysisResults?.controlTests && (
                <ControlTestResults results={analysisResults.controlTests} />
              )}
            </TabsContent>

            <TabsContent value="risk">
              {analysisResults?.riskScoring && (
                <RiskScoringResults results={analysisResults.riskScoring} />
              )}
            </TabsContent>

            <TabsContent value="flow">
              <TransactionFlowAnalysis 
                data={null}
                isLoading={false}
              />
            </TabsContent>

            <TabsContent value="ai">
              {analysisResults?.aiAnalysis && (
                <AIAnalysisResults results={analysisResults.aiAnalysis} />
              )}
            </TabsContent>

            <TabsContent value="report">
              <ReportGeneratorPanel 
                reportData={analysisResults ? {
                  clientName: 'Klient', // This should come from props
                  reportDate: new Date().toLocaleDateString('nb-NO'),
                  fiscalYear: '2024',
                  basicAnalysis: analysisResults.basicAnalysis,
                  controlTests: analysisResults.controlTests,
                  riskScoring: analysisResults.riskScoring,
                  aiAnalysis: analysisResults.aiAnalysis
                } : null}
                isLoading={loading}
              />
            </TabsContent>

            <TabsContent value="config">
              <AnalysisConfigurationPanel 
                currentConfig={analysisConfig || undefined}
                onConfigurationChange={setAnalysisConfig}
              />
            </TabsContent>

            <TabsContent value="optimization">
              <AnalysisOptimizationPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button onClick={runComprehensiveAnalysis} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyserer...
            </>
          ) : (
            'Kjør ny analyse'
          )}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={!analysisResults || isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eksporterer...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Eksporter
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem 
              onClick={() => {
                if (analysisResults) {
                  import('@/utils/reportExport').then(({ exportAnalysisReportToPDF }) => {
                    exportAnalysisReportToPDF({
                      reportData: {
                        clientName: 'Klient',
                        reportDate: new Date().toLocaleDateString('nb-NO'),
                        fiscalYear: '2024',
                        basicAnalysis: analysisResults.basicAnalysis,
                        controlTests: analysisResults.controlTests,
                        riskScoring: analysisResults.riskScoring,
                        aiAnalysis: analysisResults.aiAnalysis
                      },
                      analysisType: 'comprehensive',
                      dateRange: {
                        start: analysisResults.basicAnalysis?.date_range?.start || 'N/A',
                        end: analysisResults.basicAnalysis?.date_range?.end || 'N/A'
                      }
                    });
                  });
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              PDF Rapport
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExcelExport('analysis')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel Analyse
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExcelExport('transactions')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel Transaksjoner
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}