import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Eye, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface Insight {
  category: string;
  observation: string;
  significance: 'high' | 'medium' | 'low';
}

interface AnalysisInsightsCardProps {
  insights: Insight[];
  onDrilldown: (type: 'account', identifier: string, title: string, description?: string) => void;
}

export const AnalysisInsightsCard: React.FC<AnalysisInsightsCardProps> = ({ 
  insights, 
  onDrilldown 
}) => {
  const getSeverityColor = (significance: string) => {
    switch (significance) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (significance: string) => {
    switch (significance) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <TrendingUp className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getSeverityLabel = (significance: string) => {
    const labels: Record<string, string> = {
      'high': 'Høy',
      'medium': 'Middels',
      'low': 'Lav'
    };
    return labels[significance] || significance;
  };

  const groupInsightsByCategory = () => {
    const grouped = insights.reduce((acc, insight) => {
      if (!acc[insight.category]) {
        acc[insight.category] = [];
      }
      acc[insight.category].push(insight);
      return acc;
    }, {} as Record<string, Insight[]>);
    return grouped;
  };

  const groupedInsights = groupInsightsByCategory();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <Target className="h-4 w-4" />
          AI-Innsikter ({insights.length})
        </h4>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">
            {insights.filter(i => i.significance === 'high').length} høy risiko
          </Badge>
          <Badge variant="outline" className="text-xs">
            {insights.filter(i => i.significance === 'medium').length} middels
          </Badge>
        </div>
      </div>

      {Object.entries(groupedInsights).map(([category, categoryInsights]) => (
        <Card key={category} className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{category}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{categoryInsights.length} innsikter</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDrilldown('account', category, `Kategori: ${category}`, `${categoryInsights.length} innsikter funnet`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryInsights.map((insight, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(insight.significance)}
                    <Badge variant={getSeverityColor(insight.significance) as any} className="text-xs">
                      {getSeverityLabel(insight.significance)}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {insight.observation}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {insights.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Ingen innsikter tilgjengelig ennå</p>
              <p className="text-xs">Kjør en AI-analyse for å få innsikter</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};