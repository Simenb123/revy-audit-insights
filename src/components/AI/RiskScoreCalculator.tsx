
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Client } from '@/types/revio';

interface RiskScoreCalculatorProps {
  client: Client;
}

interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

const RiskScoreCalculator = ({ client }: RiskScoreCalculatorProps) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  const calculateRiskScore = async () => {
    setIsCalculating(true);
    
    // Simuler AI-basert risikoberegning
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const factors: RiskFactor[] = [
      {
        name: 'Finansiell stabilitet',
        score: 75,
        weight: 0.3,
        trend: 'stable',
        description: 'Basert på likviditet og soliditet'
      },
      {
        name: 'Bransjerisiko',
        score: 60,
        weight: 0.2,
        trend: 'down',
        description: 'Markedsvolatilitet i bransjen'
      },
      {
        name: 'Regnskapshistorikk',
        score: 85,
        weight: 0.25,
        trend: 'up',
        description: 'Kvalitet på tidligere regnskapsdata'
      },
      {
        name: 'Ledelsesendringer',
        score: 90,
        weight: 0.15,
        trend: 'stable',
        description: 'Stabilitet i ledelsen'
      },
      {
        name: 'Compliance',
        score: 70,
        weight: 0.1,
        trend: 'up',
        description: 'Etterlevelse av regelverk'
      }
    ];

    const weighted = factors.reduce((acc, factor) => acc + (factor.score * factor.weight), 0);
    
    setRiskFactors(factors);
    setOverallScore(Math.round(weighted));
    setIsCalculating(false);
  };

  useEffect(() => {
    calculateRiskScore();
  }, [client.id]);

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'Lav', color: 'bg-green-500', variant: 'default' as const };
    if (score >= 60) return { level: 'Middels', color: 'bg-yellow-500', variant: 'secondary' as const };
    return { level: 'Høy', color: 'bg-red-500', variant: 'destructive' as const };
  };

  const riskLevel = getRiskLevel(overallScore);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            AI Risikoscore
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={calculateRiskScore}
            disabled={isCalculating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
            Oppdater
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isCalculating ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Beregner risikoscore...</p>
          </div>
        ) : (
          <>
            {/* Overall Score */}
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold">{overallScore}</div>
              <Badge variant={riskLevel.variant} className="text-sm">
                {riskLevel.level} risiko
              </Badge>
              <Progress value={overallScore} className="w-full" />
            </div>

            {/* Risk Factors */}
            <div className="space-y-3">
              <h4 className="font-medium">Risikofaktorer</h4>
              {riskFactors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{factor.name}</span>
                      {getTrendIcon(factor.trend)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{factor.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{factor.score}</div>
                    <div className="text-xs text-muted-foreground">Vekt: {Math.round(factor.weight * 100)}%</div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Recommendations */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">AI Anbefalinger</h4>
              <ul className="text-sm space-y-1">
                <li>• Fokuser på bransjerisiko-faktorer ved planlegging</li>
                <li>• Utvid testing av inntektsføring grunnet volatilitet</li>
                <li>• Gjennomgå interne kontroller mer detaljert</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskScoreCalculator;
