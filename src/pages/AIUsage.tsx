
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  MessageSquare,
  Zap,
  Target,
  Award
} from 'lucide-react';
import AIUsageDashboard from '@/components/AI/AIUsageDashboard';
import { useAIUsage } from '@/hooks/useAIUsage';

const AIUsage = () => {
  const { personalStats, loading } = useAIUsage('week');

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getEfficiencyScore = () => {
    if (!personalStats) return 0;
    const avgCostPerRequest = personalStats.summary.totalCost / personalStats.summary.totalRequests;
    const avgResponseTime = personalStats.summary.avgResponseTime;
    
    // Simple efficiency calculation (lower cost + faster response = higher score)
    const costScore = Math.max(0, 100 - (avgCostPerRequest * 10000));
    const speedScore = Math.max(0, 100 - (avgResponseTime / 50));
    
    return Math.round((costScore + speedScore) / 2);
  };

  const getUsageInsights = () => {
    if (!personalStats) return [];
    
    const insights = [];
    
    if (personalStats.summary.totalRequests > 50) {
      insights.push({
        type: 'warning',
        title: 'Høy bruk',
        description: 'Du bruker AI-assistenten mye. Vurder å optimalisere arbeidsflyt.'
      });
    }
    
    if (personalStats.summary.avgResponseTime > 3000) {
      insights.push({
        type: 'info',
        title: 'Treg respons',
        description: 'Responstiden er høy. Prøv kortere spørsmål for raskere svar.'
      });
    }
    
    if (personalStats.summary.totalCost < 0.10) {
      insights.push({
        type: 'success',
        title: 'Kostnadseffektiv',
        description: 'Du bruker AI-assistenten på en kostnadseffektiv måte!'
      });
    }
    
    return insights;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">AI-bruksstatistikk</h1>
          <p className="text-muted-foreground">Oversikt over din bruk av Revy AI-assistenten</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Revy AI v2.0
        </Badge>
      </div>

      {/* Enhanced overview cards */}
      {personalStats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Effektivitetsscore</p>
                  <p className="text-2xl font-bold">{getEfficiencyScore()}%</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Modell brukt mest</p>
                  <p className="text-lg font-semibold">
                    {Object.entries(personalStats.summary.modelUsage || {})
                      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gjennomsnittskostnad</p>
                  <p className="text-lg font-semibold">
                    ${(personalStats.summary.totalCost / personalStats.summary.totalRequests).toFixed(4)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mest brukt kontekst</p>
                  <p className="text-lg font-semibold">
                    {Object.entries(personalStats.summary.contextUsage || {})
                      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage insights */}
      {personalStats && getUsageInsights().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Bruksinnsikter og tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {getUsageInsights().map((insight, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    insight.type === 'success' ? 'border-green-500 bg-green-50' :
                    insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}
                >
                  <h4 className="font-medium">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main dashboard */}
      <AIUsageDashboard />
    </div>
  );
};

export default AIUsage;
