import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Shield, AlertTriangle, TrendingUp, ChevronDown, Target } from "lucide-react";
import { RiskScoringResults as RiskResults, TransactionRiskScore } from "@/services/riskScoringService";

interface RiskScoringResultsProps {
  results: RiskResults | null;
  isLoading?: boolean;
}

export const RiskScoringResults: React.FC<RiskScoringResultsProps> = ({ results, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risikoskåring</CardTitle>
          <CardDescription>Analyserer transaksjonsrisiko...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
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
            <Shield className="h-5 w-5" />
            Risikoskåring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Ingen risikoskåring tilgjengelig. Kjør analyse først.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
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

  const getRiskLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      'critical': 'Kritisk',
      'high': 'Høy',
      'medium': 'Middels',
      'low': 'Lav'
    };
    return labels[level] || level;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'timing':
        return '⏰';
      case 'amount':
        return '💰';
      case 'description':
        return '📝';
      case 'frequency':
        return '📊';
      case 'user':
        return '👤';
      default:
        return '⚠️';
    }
  };

  const totalHighRisk = results.riskDistribution.high + results.riskDistribution.critical;
  const riskPercentage = ((totalHighRisk / results.totalTransactions) * 100).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risikoskåring
        </CardTitle>
        <CardDescription>
          {totalHighRisk} høyrisiko transaksjoner av {results.totalTransactions.toLocaleString('no-NO')} ({riskPercentage}%)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risikofordeling */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Risikofordeling
          </h4>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-destructive">{results.riskDistribution.critical}</div>
              <div className="text-sm text-muted-foreground">Kritisk</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-destructive">{results.riskDistribution.high}</div>
              <div className="text-sm text-muted-foreground">Høy</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-warning">{results.riskDistribution.medium}</div>
              <div className="text-sm text-muted-foreground">Middels</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-muted-foreground">{results.riskDistribution.low}</div>
              <div className="text-sm text-muted-foreground">Lav</div>
            </div>
          </div>
        </div>

        {/* Topp risikofaktorer */}
        {results.topRiskFactors.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Hyppigste risikofaktorer
            </h4>
            <div className="space-y-2">
              {results.topRiskFactors.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getCategoryIcon(item.factor.category)}</span>
                    <div>
                      <div className="font-medium">{item.factor.description}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {item.factor.category} • Vekt: {item.factor.weight}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{item.frequency}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Høyrisiko transaksjoner */}
        {results.highRiskTransactions.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Høyrisiko transaksjoner ({results.highRiskTransactions.length})
            </h4>
            <div className="space-y-2">
              {results.highRiskTransactions.slice(0, 10).map((transaction, index) => (
                <Collapsible key={index}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between p-4 h-auto border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <Badge variant={getRiskLevelColor(transaction.riskLevel) as any}>
                          {getRiskLevelLabel(transaction.riskLevel)}
                        </Badge>
                        <div>
                          <div className="font-medium">
                            {transaction.amount.toLocaleString('no-NO')} kr • Konto {transaction.accountNumber}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.date} • Bilag: {transaction.voucherNumber}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Score: {transaction.totalScore}</Badge>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-2">
                    <div className="p-4 bg-muted/30 rounded-lg ml-8 space-y-3">
                      <div>
                        <div className="font-medium">Beskrivelse:</div>
                        <div className="text-sm text-muted-foreground">{transaction.description}</div>
                      </div>
                      
                      <div>
                        <div className="font-medium mb-2">Risikofaktorer ({transaction.triggeredFactors.length}):</div>
                        <div className="space-y-2">
                          {transaction.triggeredFactors.map((factor, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-background rounded border">
                              <div>
                                <div className="font-medium text-sm">{factor.factor.description}</div>
                                <div className="text-xs text-muted-foreground">{factor.details}</div>
                              </div>
                              <Badge variant="outline">+{factor.points}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
              
              {results.highRiskTransactions.length > 10 && (
                <div className="text-center p-3 text-muted-foreground">
                  ...og {results.highRiskTransactions.length - 10} flere høyrisiko transaksjoner
                </div>
              )}
            </div>
          </div>
        )}

        {results.highRiskTransactions.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ingen høyrisiko transaksjoner identifisert. Dette er positivt - transaksjonsmønstrene ser normale ut.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};