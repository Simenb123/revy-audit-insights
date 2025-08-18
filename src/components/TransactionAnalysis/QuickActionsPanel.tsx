import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  RefreshCw, 
  Eye, 
  BarChart3, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Target,
  Search,
  Filter
} from 'lucide-react';

interface QuickActionsPanelProps {
  onExport: () => void;
  onRefresh: () => void;
  onDrilldown: (type: 'voucher' | 'account' | 'transaction', identifier: string, title: string) => void;
  insights: Array<{ category: string; significance: string }>;
  recommendations: Array<{ area: string; priority: string }>;
  riskFactors: Array<{ risk: string; likelihood: string; impact: string }>;
  anomalies: Array<{ description: string; severity: string; amount: number }>;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  onExport,
  onRefresh,
  onDrilldown,
  insights,
  recommendations,
  riskFactors,
  anomalies
}) => {
  const getTopItems = () => {
    // Get top insights by significance
    const topInsights = insights
      .filter(i => i.significance === 'high')
      .slice(0, 3);

    // Get top recommendations by priority
    const topRecommendations = recommendations
      .filter(r => r.priority === 'high')
      .slice(0, 3);

    // Get top risks by impact/likelihood
    const topRisks = riskFactors
      .filter(r => r.likelihood === 'high' || r.impact === 'high')
      .slice(0, 3);

    // Get largest anomalies
    const topAnomalies = anomalies
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 3);

    return {
      insights: topInsights,
      recommendations: topRecommendations,
      risks: topRisks,
      anomalies: topAnomalies
    };
  };

  const topItems = getTopItems();

  const quickActions = [
    {
      label: 'Eksporter rapport',
      description: 'Last ned Excel eller PDF rapport',
      icon: Download,
      action: onExport,
      variant: 'default' as const
    },
    {
      label: 'Oppfrisk analyse',
      description: 'Kjør ny AI-analyse',
      icon: RefreshCw,
      action: onRefresh,
      variant: 'outline' as const
    },
    {
      label: 'Filtrer transaksjoner',
      description: 'Avansert søk og filter',
      icon: Filter,
      action: () => onDrilldown('transaction', 'filter', 'Avansert filter'),
      variant: 'outline' as const
    }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Hurtighandlinger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant}
                className="w-full justify-start h-auto p-3"
                onClick={action.action}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Krever oppmerksomhet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topItems.risks.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Høy risiko
              </h5>
              <div className="space-y-2">
                {topItems.risks.map((risk, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start h-auto p-2 text-left"
                    onClick={() => onDrilldown('account', risk.risk, `Risiko: ${risk.risk}`)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm truncate">{risk.risk}</span>
                      <div className="flex gap-1">
                        <Badge variant="destructive" className="text-xs">
                          {risk.likelihood}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {risk.impact}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {topItems.anomalies.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-yellow-500" />
                Største avvik
              </h5>
              <div className="space-y-2">
                {topItems.anomalies.map((anomaly, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start h-auto p-2 text-left"
                    onClick={() => onDrilldown('transaction', `anomaly-${index}`, `Avvik: ${anomaly.description}`)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm truncate">{anomaly.description}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono">
                          {Math.abs(anomaly.amount).toLocaleString()}
                        </span>
                        <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'warning'} className="text-xs">
                          {anomaly.severity}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {topItems.recommendations.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Prioriterte anbefalinger
              </h5>
              <div className="space-y-2">
                {topItems.recommendations.map((rec, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start h-auto p-2 text-left"
                    onClick={() => onDrilldown('account', rec.area, `Anbefaling: ${rec.area}`)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm truncate">{rec.area}</span>
                      <Badge variant="outline" className="text-xs">
                        {rec.priority}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {topItems.risks.length === 0 && topItems.anomalies.length === 0 && topItems.recommendations.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Ingen kritiske elementer funnet</p>
              <p className="text-xs">Dette er bra! Dataene ser normale ut.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};