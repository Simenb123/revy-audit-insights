import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';

interface AnalysisMetricsCardProps {
  summary?: {
    total_transactions?: number;
    analysis_date?: string;
    message?: string;
    data_version?: string;
    analysis_chunks?: number;
  };
  insights: Array<{ significance: string }>;
  recommendations: Array<{ priority: string }>;
  riskFactors: Array<{ likelihood: string; impact: string }>;
  anomalies: Array<{ severity: string }>;
}

export const AnalysisMetricsCard: React.FC<AnalysisMetricsCardProps> = ({
  summary,
  insights,
  recommendations,
  riskFactors,
  anomalies
}) => {
  const getMetricsCards = () => {
    const totalInsights = insights.length;
    const highInsights = insights.filter(i => i.significance === 'high').length;
    const criticalRecommendations = recommendations.filter(r => r.priority === 'high').length;
    const highRisks = riskFactors.filter(r => r.likelihood === 'high' || r.impact === 'high').length;
    const criticalAnomalies = anomalies.filter(a => a.severity === 'high').length;

    return [
      {
        label: 'Totale innsikter',
        value: totalInsights,
        trend: highInsights > 0 ? 'warning' : 'positive',
        icon: Activity,
        subtitle: `${highInsights} høy betydning`
      },
      {
        label: 'Anbefalinger',
        value: recommendations.length,
        trend: criticalRecommendations > 0 ? 'warning' : 'neutral',
        icon: TrendingUp,
        subtitle: `${criticalRecommendations} kritiske`
      },
      {
        label: 'Risikoer',
        value: riskFactors.length,
        trend: highRisks > 2 ? 'danger' : highRisks > 0 ? 'warning' : 'positive',
        icon: AlertTriangle,
        subtitle: `${highRisks} høy risiko`
      },
      {
        label: 'Avvik',
        value: anomalies.length,
        trend: criticalAnomalies > 0 ? 'danger' : anomalies.length > 5 ? 'warning' : 'positive',
        icon: TrendingDown,
        subtitle: `${criticalAnomalies} kritiske`
      }
    ];
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'positive': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'danger': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'positive': return 'success';
      case 'warning': return 'warning';
      case 'danger': return 'destructive';
      default: return 'secondary';
    }
  };

  const metrics = getMetricsCards();

  return (
    <div className="space-y-4">
      {summary?.message && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-primary mb-1">Analyse-sammendrag</h4>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {summary.message}
                </p>
                {summary.total_transactions && (
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{summary.total_transactions.toLocaleString()} transaksjoner</span>
                    {summary.analysis_date && (
                      <span>{new Date(summary.analysis_date).toLocaleDateString('no-NO')}</span>
                    )}
                    {summary.analysis_chunks && (
                      <span>{summary.analysis_chunks} analyse-deler</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <IconComponent className={`h-5 w-5 ${getTrendColor(metric.trend)}`} />
                  <Badge variant={getTrendBadge(metric.trend) as any} className="text-xs">
                    {metric.trend === 'positive' ? 'Bra' : metric.trend === 'warning' ? 'Obs' : 'Kritisk'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-primary">
                    {metric.value}
                  </div>
                  <div className="text-xs font-medium text-foreground/70">
                    {metric.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metric.subtitle}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};