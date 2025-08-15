import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  BarChart3, 
  Activity, 
  Brain,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Gauge
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PredictiveAnalyticsProps {
  clientId: string;
  fiscalYear?: number;
}

interface RiskFactor {
  category: string;
  factor: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  riskScore: number;
  evidence: string[];
  recommendations: string[];
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface PredictiveInsight {
  type: 'risk' | 'opportunity' | 'trend' | 'anomaly' | 'compliance';
  title: string;
  description: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  impact: 'minimal' | 'moderate' | 'significant' | 'severe';
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  actionRequired: boolean;
  recommendations: string[];
  supportingData: any[];
}

interface AnalysisResults {
  summary?: {
    analysisDate: string;
    clientId: string;
    overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    dataQuality: number;
    analysisConfidence: number;
  };
  riskAssessment?: {
    riskFactors: RiskFactor[];
    overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    insights: PredictiveInsight[];
  };
  trendPrediction?: any;
  anomalyDetection?: any;
  benchmarking?: any;
  recommendations?: Array<{
    category: string;
    priority: string;
    recommendation: string;
    basedOn: string;
  }>;
}

export function PredictiveAnalytics({ clientId, fiscalYear }: PredictiveAnalyticsProps) {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<string>('comprehensive');
  const [lastAnalysisDate, setLastAnalysisDate] = useState<Date | null>(null);

  // Load analysis on component mount
  useEffect(() => {
    if (clientId) {
      performAnalysis('comprehensive');
    }
  }, [clientId]);

  const performAnalysis = async (analysisType: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predictive-analytics', {
        body: {
          clientId,
          analysisType,
          fiscalYear,
          includeHistoricalData: true,
          compareWithBenchmarks: true
        }
      });

      if (error) {
        console.error('Predictive analytics error:', error);
        throw error;
      }

      setAnalysisResults(data);
      setLastAnalysisDate(new Date());
    } catch (error) {
      console.error('Failed to perform predictive analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'medium': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'secondary';
      case 'medium': return 'default';
      case 'high': return 'destructive';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 animate-pulse text-primary" />
              Utfører prediktiv analyse...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysisResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prediktiv Analyse</CardTitle>
          <CardDescription>
            AI-drevet risikovurdering og trendanalyse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Ingen analyseresultater tilgjengelig
            </p>
            <Button onClick={() => performAnalysis('comprehensive')}>
              <Brain className="h-4 w-4 mr-2" />
              Start analyse
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prediktiv Analyse</h1>
          <p className="text-muted-foreground">
            AI-drevet risikovurdering og innsikter
            {lastAnalysisDate && (
              <span className="ml-2">
                • Sist oppdatert: {lastAnalysisDate.toLocaleString('nb-NO')}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => performAnalysis(selectedAnalysisType)}
            disabled={isLoading}
          >
            <Activity className="h-4 w-4 mr-2" />
            Oppdater analyse
          </Button>
        </div>
      </div>

      {/* Summary Dashboard */}
      {analysisResults.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Samlet risiko</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    {getRiskIcon(analysisResults.summary.overallRiskLevel)}
                    {analysisResults.summary.overallRiskLevel.toUpperCase()}
                  </p>
                </div>
                <Gauge className="h-8 w-8 text-muted-foreground" />
              </div>
              <Progress 
                value={(analysisResults.summary.riskScore / 10) * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Datakvalitet</p>
                  <p className="text-2xl font-bold">{analysisResults.summary.dataQuality}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
              <Progress value={analysisResults.summary.dataQuality} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Analyse-konfidensgrad</p>
                  <p className="text-2xl font-bold">{analysisResults.summary.analysisConfidence}%</p>
                </div>
                <Brain className="h-8 w-8 text-green-500" />
              </div>
              <Progress value={analysisResults.summary.analysisConfidence} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Anbefalinger</p>
                  <p className="text-2xl font-bold">{analysisResults.recommendations?.length || 0}</p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="risk" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Risiko
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trender
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Anomalier
          </TabsTrigger>
          <TabsTrigger value="benchmarks" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Benchmarks
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Anbefalinger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="risk" className="space-y-6">
          {analysisResults.riskAssessment ? (
            <>
              {/* Risk Factors */}
              <Card>
                <CardHeader>
                  <CardTitle>Identifiserte risikofaktorer</CardTitle>
                  <CardDescription>
                    AI-identifiserte risikoområder for revisjonen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResults.riskAssessment.riskFactors.map((factor, index) => (
                      <Card key={index} className={`p-4 ${getRiskLevelColor(factor.riskLevel)}`}>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{factor.category}</Badge>
                              <Badge variant={
                                factor.riskLevel === 'critical' ? 'destructive' :
                                factor.riskLevel === 'high' ? 'destructive' :
                                factor.riskLevel === 'medium' ? 'default' : 'secondary'
                              }>
                                {factor.riskLevel.toUpperCase()}
                              </Badge>
                              <div className="flex items-center gap-1">
                                {factor.trend === 'increasing' && <TrendingUp className="h-4 w-4 text-red-500" />}
                                {factor.trend === 'decreasing' && <TrendingDown className="h-4 w-4 text-green-500" />}
                                {factor.trend === 'stable' && <Activity className="h-4 w-4 text-blue-500" />}
                              </div>
                            </div>
                            
                            <h3 className="font-medium">{factor.factor}</h3>
                            
                            <div className="text-sm space-y-1">
                              <p><strong>Sannsynlighet:</strong> {Math.round(factor.probability * 100)}%</p>
                              <p><strong>Påvirkning:</strong> {Math.round(factor.impact * 100)}%</p>
                              <p><strong>Risikoscore:</strong> {factor.riskScore.toFixed(1)}/10</p>
                            </div>
                            
                            {factor.evidence.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-sm font-medium">Bevis:</p>
                                <ul className="text-sm space-y-1">
                                  {factor.evidence.map((evidence, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="w-1 h-1 bg-current rounded-full mt-2" />
                                      {evidence}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {factor.recommendations.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-sm font-medium">Anbefalinger:</p>
                                <ul className="text-sm space-y-1">
                                  {factor.recommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <Target className="h-3 w-3 mt-1" />
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Insights */}
              {analysisResults.riskAssessment.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Risikoinnsikter</CardTitle>
                    <CardDescription>
                      AI-genererte innsikter basert på risikoanalysen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysisResults.riskAssessment.insights.map((insight, index) => (
                        <Alert key={index}>
                          <div className="flex items-start gap-3">
                            {insight.type === 'risk' && <AlertTriangle className="h-5 w-5" />}
                            {insight.type === 'opportunity' && <TrendingUp className="h-5 w-5" />}
                            {insight.type === 'compliance' && <Shield className="h-5 w-5" />}
                            
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center justify-between">
                                <AlertTitle>{insight.title}</AlertTitle>
                                <div className="flex items-center gap-2">
                                  <Badge variant={getUrgencyColor(insight.urgency)}>
                                    {insight.urgency}
                                  </Badge>
                                  <Badge variant="outline">
                                    {Math.round(insight.confidence * 100)}% sikkerhet
                                  </Badge>
                                  {insight.actionRequired && (
                                    <Badge variant="destructive">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Handling kreves
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <AlertDescription>{insight.description}</AlertDescription>
                              
                              {insight.recommendations.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">Anbefalte tiltak:</p>
                                  <ul className="text-sm space-y-1">
                                    {insight.recommendations.map((rec, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="w-1 h-1 bg-current rounded-full mt-2" />
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Ingen risikoanalyse tilgjengelig</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Utfør en analyse for å se risikofaktorer
                </p>
                <Button onClick={() => performAnalysis('risk_assessment')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Analyser risiko
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardContent className="p-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Trendanalyse</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Kommer snart - AI-drevet trendprediksjon
              </p>
              <Button onClick={() => performAnalysis('trend_prediction')} disabled>
                <TrendingUp className="h-4 w-4 mr-2" />
                Analyser trender
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies">
          <Card>
            <CardContent className="p-12 text-center">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Anomalideteksjon</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Kommer snart - AI-drevet anomaliidentifikasjon
              </p>
              <Button onClick={() => performAnalysis('anomaly_detection')} disabled>
                <Zap className="h-4 w-4 mr-2" />
                Finn anomalier
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks">
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Benchmarking</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Kommer snart - Sammenligning med bransjestandard
              </p>
              <Button onClick={() => performAnalysis('benchmarking')} disabled>
                <BarChart3 className="h-4 w-4 mr-2" />
                Sammenlign resultater
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          {analysisResults.recommendations ? (
            <Card>
              <CardHeader>
                <CardTitle>AI-genererte anbefalinger</CardTitle>
                <CardDescription>
                  Handlingsrettede anbefalinger basert på analysen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResults.recommendations.map((rec, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{rec.category}</Badge>
                              <Badge variant={
                                rec.priority === 'high' ? 'destructive' :
                                rec.priority === 'medium' ? 'default' : 'secondary'
                              }>
                                {rec.priority} prioritet
                              </Badge>
                            </div>
                            
                            <p className="font-medium">{rec.recommendation}</p>
                            <p className="text-sm text-muted-foreground">
                              Basert på: {rec.basedOn}
                            </p>
                          </div>
                          
                          <Target className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Ingen anbefalinger tilgjengelig</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Utfør en fullstendig analyse for å få anbefalinger
                </p>
                <Button onClick={() => performAnalysis('comprehensive')}>
                  <Target className="h-4 w-4 mr-2" />
                  Generer anbefalinger
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}