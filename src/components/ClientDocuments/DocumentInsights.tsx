import { logger } from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Lightbulb, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { ClientDocument } from '@/hooks/useClientDocuments';
import { generateDocumentInsights, DocumentInsight } from '@/services/documentAIService';

interface DocumentInsightsProps {
  documents: ClientDocument[];
  clientId: string;
  context: string;
}

const DocumentInsights: React.FC<DocumentInsightsProps> = ({
  documents,
  clientId,
  context
}) => {
  const [insights, setInsights] = useState<DocumentInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInsights = () => {
      setIsLoading(true);
      try {
        const generatedInsights = generateDocumentInsights({
          documents,
          clientId,
          userContext: context
        });
        setInsights(generatedInsights);
      } catch (error) {
        logger.error('Failed to generate document insights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (documents.length > 0) {
      loadInsights();
    } else {
      setIsLoading(false);
    }
  }, [documents, clientId, context]);

  const getInsightIcon = (type: DocumentInsight['type']) => {
    switch (type) {
      case 'category_suggestion':
        return <Brain className="h-4 w-4 text-blue-600" />;
      case 'quality_check':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'missing_info':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'workflow_tip':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      default:
        return <Lightbulb className="h-4 w-4 text-gray-600" />;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge variant="default">Høy sikkerhet</Badge>;
    if (confidence >= 0.6) return <Badge variant="secondary">Medium sikkerhet</Badge>;
    return <Badge variant="outline">Lav sikkerhet</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 animate-pulse" />
            <span className="text-sm text-muted-foreground">AI-Revy analyserer dokumenter...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">Dokumentene ser bra ut! Ingen kritiske innsikter å rapportere.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4 text-purple-600" />
          AI-Revy Dokumentinnsikt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.slice(0, 3).map((insight, index) => (
          <div key={index} className="p-3 border rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getInsightIcon(insight.type)}
                <h4 className="text-sm font-medium">{insight.title}</h4>
              </div>
              {getConfidenceBadge(insight.confidence)}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
            {insight.actionable && insight.suggestedAction && (
              <Button variant="outline" size="sm" className="text-xs">
                {insight.suggestedAction}
              </Button>
            )}
          </div>
        ))}
        
        {insights.length > 3 && (
          <div className="text-center">
            <Button variant="ghost" size="sm" className="text-xs">
              Vis {insights.length - 3} flere innsikter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentInsights;
