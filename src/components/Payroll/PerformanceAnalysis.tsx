import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface PerformanceMetrics {
  totalItems: number;
  perfectMatches: number;
  minorDiscrepancies: number;
  majorDiscrepancies: number;
  totalDiscrepancyAmount: number;
  accountCoverage: number;
  dataQualityScore: number;
}

interface PerformanceAnalysisProps {
  metrics: PerformanceMetrics;
  recommendations: string[];
}

export const PerformanceAnalysis: React.FC<PerformanceAnalysisProps> = ({
  metrics,
  recommendations
}) => {
  const matchRate = (metrics.perfectMatches / metrics.totalItems) * 100;
  const discrepancyRate = ((metrics.minorDiscrepancies + metrics.majorDiscrepancies) / metrics.totalItems) * 100;
  
  const getStatusColor = (rate: number, thresholds: { good: number; warning: number }) => {
    if (rate >= thresholds.good) return 'success';
    if (rate >= thresholds.warning) return 'warning';
    return 'destructive';
  };

  const getStatusIcon = (rate: number, thresholds: { good: number; warning: number }) => {
    if (rate >= thresholds.good) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (rate >= thresholds.warning) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ytelsesanalyse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Match Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Treffrate</span>
                {getStatusIcon(matchRate, { good: 90, warning: 70 })}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{matchRate.toFixed(1)}%</span>
                  <Badge variant={getStatusColor(matchRate, { good: 90, warning: 70 })}>
                    {matchRate >= 90 ? 'Utmerket' : matchRate >= 70 ? 'Bra' : 'Trenger oppmerksomhet'}
                  </Badge>
                </div>
                <Progress 
                  value={matchRate} 
                  className="h-2"
                />
              </div>
            </div>

            {/* Account Coverage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kontodekning</span>
                {getStatusIcon(metrics.accountCoverage, { good: 95, warning: 85 })}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{metrics.accountCoverage.toFixed(1)}%</span>
                  <Badge variant={getStatusColor(metrics.accountCoverage, { good: 95, warning: 85 })}>
                    {metrics.accountCoverage >= 95 ? 'Komplett' : metrics.accountCoverage >= 85 ? 'God' : 'Ufullstendig'}
                  </Badge>
                </div>
                <Progress 
                  value={metrics.accountCoverage} 
                  className="h-2"
                />
              </div>
            </div>

            {/* Data Quality */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Datakvalitet</span>
                {getStatusIcon(metrics.dataQualityScore, { good: 90, warning: 75 })}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{metrics.dataQualityScore.toFixed(1)}%</span>
                  <Badge variant={getStatusColor(metrics.dataQualityScore, { good: 90, warning: 75 })}>
                    {metrics.dataQualityScore >= 90 ? 'Høy' : metrics.dataQualityScore >= 75 ? 'Middels' : 'Lav'}
                  </Badge>
                </div>
                <Progress 
                  value={metrics.dataQualityScore} 
                  className="h-2"
                />
              </div>
            </div>

            {/* Total Discrepancy */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total avvik</span>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-mono">
                  {Math.abs(metrics.totalDiscrepancyAmount).toLocaleString('nb-NO', { 
                    style: 'currency', 
                    currency: 'NOK',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </div>
                <Badge variant={Math.abs(metrics.totalDiscrepancyAmount) <= 1000 ? 'default' : 'destructive'}>
                  {Math.abs(metrics.totalDiscrepancyAmount) <= 1000 ? 'Akseptabelt' : 'Høyt'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Anbefalinger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <Alert key={index}>
                  <Info className="h-4 w-4" />
                  <AlertDescription>{recommendation}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {matchRate >= 90 && metrics.accountCoverage >= 95 ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              )}
              <div>
                <p className="font-medium">
                  {matchRate >= 90 && metrics.accountCoverage >= 95 
                    ? 'Avstemmingen er av høy kvalitet' 
                    : 'Avstemmingen kan forbedres'
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {metrics.perfectMatches} av {metrics.totalItems} poster er perfekte treff
                </p>
              </div>
            </div>
            <Badge 
              variant={matchRate >= 90 && metrics.accountCoverage >= 95 ? 'default' : 'secondary'}
              className="text-xs"
            >
              {matchRate >= 90 && metrics.accountCoverage >= 95 ? 'Godkjent' : 'Trenger arbeid'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};