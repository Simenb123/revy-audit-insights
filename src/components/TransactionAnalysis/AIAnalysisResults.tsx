
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Target,
  BarChart3,
  FileText,
  Lightbulb,
  Shield
} from 'lucide-react';

interface AIInsight {
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  details?: string;
  recommendation?: string;
}

interface AIAnalysisResult {
  summary: string;
  insights: AIInsight[];
  riskScore: number;
  confidence: number;
  recommendations: string[];
  patterns?: any[];
  anomalies?: any[];
  trends?: any[];
}

interface AIAnalysisResultsProps {
  results: AIAnalysisResult | null;
  isLoading?: boolean;
  error?: string | null;
}

export const AIAnalysisResults: React.FC<AIAnalysisResultsProps> = ({ 
  results, 
  isLoading, 
  error 
}) => {
  console.log('AIAnalysisResults - Props:', { results, isLoading, error });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse" />
            AI-Analyse pågår...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={33} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Analyserer transaksjonsdata med GPT-5...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Analyse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Ingen AI-analyse tilgjengelig. Kjør analyse først.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
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
      'critical': 'Kritisk',
      'high': 'Høy',
      'medium': 'Middels',
      'low': 'Lav'
    };
    return labels[severity] || severity;
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-destructive';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-warning';
    return 'text-success';
  };

  const getRiskScoreLabel = (score: number) => {
    if (score >= 80) return 'Høy risiko';
    if (score >= 60) return 'Middels-høy risiko';
    if (score >= 40) return 'Middels risiko';
    return 'Lav risiko';
  };

  // Safely access insights with fallback to empty array
  const insights = results.insights || [];
  const recommendations = results.recommendations || [];
  const patterns = results.patterns || [];
  const anomalies = results.anomalies || [];
  const trends = results.trends || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI-Analyse Resultater
        </CardTitle>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Risikoscore:</span>
            <Badge variant="outline" className={getRiskScoreColor(results.riskScore || 0)}>
              {results.riskScore || 0}/100
            </Badge>
            <span className="text-sm text-muted-foreground">
              ({getRiskScoreLabel(results.riskScore || 0)})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Konfidensgrad:</span>
            <Badge variant="outline">
              {results.confidence || 0}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="summary">Sammendrag</TabsTrigger>
            <TabsTrigger value="insights">
              Innsikter ({insights.length})
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              Anbefalinger ({recommendations.length})
            </TabsTrigger>
            <TabsTrigger value="patterns">
              Mønstre ({patterns.length})
            </TabsTrigger>
            <TabsTrigger value="anomalies">
              Avvik ({anomalies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-6">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Analyse-sammendrag
                </h4>
                <p className="text-sm leading-relaxed">
                  {results.summary || 'Ingen sammendrag tilgjengelig.'}
                </p>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{insights.length}</div>
                  <div className="text-sm text-muted-foreground">Innsikter</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{recommendations.length}</div>
                  <div className="text-sm text-muted-foreground">Anbefalinger</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{patterns.length}</div>
                  <div className="text-sm text-muted-foreground">Mønstre</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-destructive">{anomalies.length}</div>
                  <div className="text-sm text-muted-foreground">Avvik</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <div className="space-y-4">
              {insights.length > 0 ? (
                <>
                  <h4 className="font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    AI-Innsikter ({insights.length})
                  </h4>
                  <div className="space-y-3">
                    {insights.map((insight, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityColor(insight.severity) as any}>
                              {getSeverityLabel(insight.severity)}
                            </Badge>
                            <span className="font-medium">{insight.category}</span>
                          </div>
                          <Badge variant="outline">
                            {insight.confidence}% sikkerhet
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {insight.description}
                        </p>
                        {insight.details && (
                          <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            <strong>Detaljer:</strong> {insight.details}
                          </p>
                        )}
                        {insight.recommendation && (
                          <p className="text-xs text-primary bg-primary/10 p-2 rounded mt-2">
                            <strong>Anbefaling:</strong> {insight.recommendation}
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
                    Ingen spesifikke innsikter identifisert i denne analysen.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="mt-6">
            <div className="space-y-4">
              {recommendations.length > 0 ? (
                <>
                  <h4 className="font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    AI-Anbefalinger ({recommendations.length})
                  </h4>
                  <div className="space-y-2">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{rec}</p>
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

          <TabsContent value="patterns" className="mt-6">
            <div className="space-y-4">
              {patterns.length > 0 ? (
                <>
                  <h4 className="font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Identifiserte mønstre ({patterns.length})
                  </h4>
                  <div className="space-y-3">
                    {patterns.map((pattern, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="font-medium text-sm mb-2">
                          Mønster #{index + 1}
                        </div>
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(pattern, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Ingen spesifikke mønstre identifisert i dataene.
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
                        <div className="font-medium text-sm mb-2 text-destructive">
                          Avvik #{index + 1}
                        </div>
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(anomaly, null, 2)}
                        </pre>
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
  );
};
