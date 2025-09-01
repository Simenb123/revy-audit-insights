import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, AlertTriangle, Target, CheckCircle } from 'lucide-react';
import { Transaction, SamplingParams } from '@/services/sampling/types';
import { getRiskBasedRecommendations, assessPopulationRisk } from '@/services/sampling/riskAssessment';
import { formatPercentage, formatNumber } from '@/services/sampling/utils';

interface SamplingRecommendationsProps {
  transactions: Transaction[];
  params: SamplingParams;
  onApplyRecommendation?: (recommendation: {
    riskWeighting: 'disabled' | 'moderat' | 'hoy';
    minPerStratum: number;
  }) => void;
}

const SamplingRecommendations: React.FC<SamplingRecommendationsProps> = ({
  transactions,
  params,
  onApplyRecommendation
}) => {
  // Always render component, but show placeholder if no data - prevents React error #310
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Risikoanalyse og anbefalinger
          </CardTitle>
          <CardDescription>
            Ingen transaksjoner å analysere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Velg populasjon for å få risikoanalyse</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const riskAssessment = assessPopulationRisk(transactions, params);
  const recommendations = getRiskBasedRecommendations(transactions, params);

  const getRiskWeightingColor = (weighting: string) => {
    switch (weighting) {
      case 'hoy': return 'destructive';
      case 'moderat': return 'secondary';
      default: return 'outline';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score > 0.7) return 'text-destructive';
    if (score > 0.4) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Risikoanalyse og anbefalinger
        </CardTitle>
        <CardDescription>
          Automatiske anbefalinger basert på populasjonens risikokarakteristika
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Assessment Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Gjennomsnittlig risiko</p>
            <p className={`text-2xl font-bold ${getRiskScoreColor(riskAssessment.averageRiskScore)}`}>
              {formatPercentage(riskAssessment.averageRiskScore * 100, 0)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Høyrisiko transaksjoner</p>
            <p className="text-2xl font-bold">
              {formatNumber(riskAssessment.highRiskTransactionCount)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Lav risiko</p>
            <p className="text-lg font-semibold text-muted-foreground">
              {formatNumber(riskAssessment.riskDistribution.low)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Høy risiko</p>
            <p className="text-lg font-semibold text-destructive">
              {formatNumber(riskAssessment.riskDistribution.high)}
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Anbefalinger
          </h4>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              Anbefalt risikovekting: 
              <Badge 
                variant={getRiskWeightingColor(recommendations.recommendedRiskWeighting)}
                className="ml-1"
              >
                {recommendations.recommendedRiskWeighting}
              </Badge>
            </Badge>
            
            <Badge variant="outline">
              Minimum per stratum: {recommendations.recommendedMinPerStratum}
            </Badge>
          </div>

          {onApplyRecommendation && (
            <div className="flex gap-2">
              <button
                onClick={() => onApplyRecommendation({
                  riskWeighting: recommendations.recommendedRiskWeighting,
                  minPerStratum: recommendations.recommendedMinPerStratum
                })}
                className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Bruk anbefalinger
              </button>
            </div>
          )}
        </div>

        {/* Warnings */}
        {recommendations.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              Advarsler
            </h4>
            {recommendations.warnings.map((warning, index) => (
              <Alert key={index} variant="default">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Quality Indicators */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Populasjonsstørrelse</span>
            <span className="font-medium">{formatNumber(transactions.length)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Høyrisiko andel</span>
            <span className="font-medium">
              {formatPercentage((riskAssessment.highRiskTransactionCount / transactions.length) * 100)}
            </span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 pt-2">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-sm text-muted-foreground">
            Risikoanalyse fullført - anbefalinger oppdatert
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(SamplingRecommendations);