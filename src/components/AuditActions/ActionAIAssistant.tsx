
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, MessageSquare, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { ActionAIMetadata } from '@/types/enhanced-audit-actions';

interface ActionAIAssistantProps {
  actionTemplateId: string;
  metadata?: ActionAIMetadata | null;
  editable?: boolean;
}

const ActionAIAssistant = ({ actionTemplateId, metadata, editable = false }: ActionAIAssistantProps) => {
  const getComplexityColor = (complexity: number) => {
    if (complexity <= 2) return 'secondary';
    if (complexity <= 3) return 'default';
    return 'destructive';
  };

  const getComplexityLabel = (complexity: number) => {
    switch (complexity) {
      case 1: return 'Meget enkel';
      case 2: return 'Enkel';
      case 3: return 'Moderat';
      case 4: return 'Kompleks';
      case 5: return 'Meget kompleks';
      default: return 'Ukjent';
    }
  };

  if (!metadata) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Brain className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="mb-4">Ingen AI-assistent konfigurert for denne handlingen.</p>
            {editable && (
              <Button variant="outline">
                <Settings size={16} className="mr-2" />
                Konfigurer AI-assistent
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">AI-assistent konfigurering</h3>
        {editable && (
          <Button size="sm" variant="outline">
            <Settings size={16} className="mr-1" />
            Rediger
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain size={16} />
              AI-assistent aktivert
            </CardTitle>
            <Badge variant={getComplexityColor(metadata.estimated_complexity)}>
              {getComplexityLabel(metadata.estimated_complexity)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {metadata.specialized_prompt && (
            <div>
              <h4 className="text-sm font-medium mb-2">Spesialisert prompt</h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                {metadata.specialized_prompt}
              </p>
            </div>
          )}

          {metadata.common_issues && metadata.common_issues.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <AlertTriangle size={14} />
                Vanlige problemer
              </h4>
              <div className="space-y-2">
                {metadata.common_issues.map((issue: any, index: number) => (
                  <div key={index} className="text-sm text-muted-foreground bg-orange-50 p-2 rounded border-l-4 border-orange-200">
                    {typeof issue === 'string' ? issue : issue.description || 'Ikke beskrevet'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {metadata.typical_documents && metadata.typical_documents.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Typiske dokumenter</h4>
              <div className="flex flex-wrap gap-1">
                {metadata.typical_documents.map((doc: any, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {typeof doc === 'string' ? doc : doc.name || 'Ukjent dokument'}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {metadata.risk_indicators && metadata.risk_indicators.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <AlertTriangle size={14} />
                Risikoindikatorer
              </h4>
              <div className="space-y-2">
                {metadata.risk_indicators.map((indicator: any, index: number) => (
                  <div key={index} className="text-sm text-muted-foreground bg-red-50 p-2 rounded border-l-4 border-red-200">
                    {typeof indicator === 'string' ? indicator : indicator.description || 'Ikke beskrevet'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {metadata.quality_checkpoints && metadata.quality_checkpoints.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <CheckCircle size={14} />
                Kvalitetskontrollpunkter
              </h4>
              <div className="space-y-2">
                {metadata.quality_checkpoints.map((checkpoint: any, index: number) => (
                  <div key={index} className="text-sm text-muted-foreground bg-green-50 p-2 rounded border-l-4 border-green-200">
                    {typeof checkpoint === 'string' ? checkpoint : checkpoint.description || 'Ikke beskrevet'}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button className="w-full" variant="outline">
              <MessageSquare size={16} className="mr-2" />
              Start AI-assistert revisjon
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActionAIAssistant;
