import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Brain, AlertTriangle, Lightbulb, TrendingUp, ChevronDown, Clock } from "lucide-react";

export interface AIInsight {
  type: 'anomaly' | 'pattern' | 'risk' | 'recommendation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedTransactions: string[];
  recommendedAction: string;
  confidence: number;
}

export interface AIAnalysisResult {
  insights: AIInsight[];
  summary: {
    totalTransactionsAnalyzed: number;
    anomaliesFound: number;
    overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    keyFindings: string[];
  };
  metadata: {
    analysisType: string;
    modelUsed: string;
    processingTime: number;
    timestamp: string;
  };
}

interface AIAnalysisResultsProps {
  results: AIAnalysisResult | null;
  isLoading?: boolean;
  onRetry?: () => void;
}

export const AIAnalysisResults: React.FC<AIAnalysisResultsProps> = ({ 
  results, 
  isLoading, 
  onRetry 
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse" />
            AI-Transaksjonsanalyse
          </CardTitle>
          <CardDescription>AI analyserer transaksjonsdata...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted rounded" />
              ))}
            </div>
          </div>
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
            AI-Transaksjonsanalyse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>Ingen AI-analyse tilgjengelig. Kjør analyse først.</span>
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Start AI-analyse
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Lightbulb className="h-4 w-4 text-info" />;
    }
  };

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'anomaly':
        return '🔍';
      case 'pattern':
        return '📊';
      case 'risk':
        return '⚠️';
      case 'recommendation':
        return '💡';
      default:
        return '🤖';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'anomaly': 'Anomali',
      'pattern': 'Mønster',
      'risk': 'Risiko',
      'recommendation': 'Anbefaling'
    };
    return labels[type] || type;
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'text-destructive';
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-warning';
      default:
        return 'text-success';
    }
  };

  const highPriorityInsights = results.insights.filter(insight => 
    insight.severity === 'critical' || insight.severity === 'high'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI-Transaksjonsanalyse
        </CardTitle>
        <CardDescription className="flex items-center gap-4">
          <span>
            {results.summary.totalTransactionsAnalyzed.toLocaleString('no-NO')} transaksjoner analysert
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {results.metadata.processingTime}ms
          </span>
          <Badge variant="outline">{results.metadata.modelUsed}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sammendrag */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analyseoversikt
          </h4>
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{results.insights.length}</div>
              <div className="text-sm text-muted-foreground">Innsikter</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{results.summary.anomaliesFound}</div>
              <div className="text-sm text-muted-foreground">Anomalier</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getRiskLevelColor(results.summary.overallRiskLevel)}`}>
                {results.summary.overallRiskLevel.toUpperCase()}
              </div>
              <div className="text-sm text-muted-foreground">Samlet risiko</div>
            </div>
          </div>
        </div>

        {/* Hovedfunn */}
        {results.summary.keyFindings.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Hovedfunn</h4>
            <div className="space-y-2">
              {results.summary.keyFindings.map((finding, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span className="text-sm text-blue-800">{finding}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Høyprioritet innsikter */}
        {highPriorityInsights.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Høyprioritet innsikter ({highPriorityInsights.length})
            </h4>
            <div className="space-y-2">
              {highPriorityInsights.map((insight, index) => (
                <Alert key={index} className="border-destructive/50 bg-destructive/5">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">{insight.title}</div>
                    <div className="text-sm">{insight.description}</div>
                    {insight.recommendedAction && (
                      <div className="text-sm font-medium mt-2 text-destructive">
                        Anbefaling: {insight.recommendedAction}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Alle innsikter */}
        <div>
          <h4 className="font-medium mb-3">Alle innsikter ({results.insights.length})</h4>
          <div className="space-y-3">
            {results.insights.map((insight, index) => (
              <Collapsible key={index}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between p-4 h-auto border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <span className="text-lg">{getTypeIcon(insight.type)}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getSeverityColor(insight.severity) as any}>
                            {insight.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {getTypeLabel(insight.type)}
                          </Badge>
                        </div>
                        <div className="font-medium">{insight.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Tillitsgrad: {(insight.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-2">
                  <div className="p-4 bg-muted/30 rounded-lg ml-8 space-y-3">
                    <div>
                      <div className="font-medium text-sm mb-1">Beskrivelse:</div>
                      <div className="text-sm text-muted-foreground">{insight.description}</div>
                    </div>
                    
                    {insight.recommendedAction && (
                      <div>
                        <div className="font-medium text-sm mb-1">Anbefalt handling:</div>
                        <div className="text-sm text-muted-foreground">{insight.recommendedAction}</div>
                      </div>
                    )}
                    
                    {insight.affectedTransactions.length > 0 && (
                      <div>
                        <div className="font-medium text-sm mb-1">
                          Berørte transaksjoner ({insight.affectedTransactions.length}):
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {insight.affectedTransactions.slice(0, 5).join(', ')}
                          {insight.affectedTransactions.length > 5 && '...'}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        {results.insights.length === 0 && (
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              AI-analysen fant ingen spesielle anomalier eller mønstre i transaksjonsdataene. 
              Dette indikerer normale transaksjonsmønstre.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};