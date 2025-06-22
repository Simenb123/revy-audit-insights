
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { ActionAIMetadata } from '@/types/enhanced-audit-actions';
import SpecializedAIAssistant from './SpecializedAIAssistant';
import { EnhancedAuditActionTemplate } from '@/types/enhanced-audit-actions';

interface ActionAIAssistantProps {
  actionTemplateId: string;
  metadata?: ActionAIMetadata;
  actionTemplate?: EnhancedAuditActionTemplate;
}

const ActionAIAssistant = ({ actionTemplateId, metadata, actionTemplate }: ActionAIAssistantProps) => {
  if (!actionTemplate) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Brain className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>AI-assistent ikke tilgjengelig for denne handlingen.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Metadata Overview */}
      {metadata && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI-analyse av handlingen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Common Issues */}
            {metadata.common_issues && metadata.common_issues.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  Vanlige utfordringer
                </h4>
                <div className="space-y-1">
                  {metadata.common_issues.map((issue: any, index: number) => (
                    <div key={index} className="text-sm p-2 bg-yellow-50 rounded border-l-2 border-yellow-200">
                      {typeof issue === 'string' ? issue : issue.description}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Typical Documents */}
            {metadata.typical_documents && metadata.typical_documents.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Typiske dokumenter
                </h4>
                <div className="flex flex-wrap gap-1">
                  {metadata.typical_documents.map((doc: any, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {typeof doc === 'string' ? doc : doc.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Indicators */}
            {metadata.risk_indicators && metadata.risk_indicators.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Risikoindikatorer
                </h4>
                <div className="space-y-1">
                  {metadata.risk_indicators.map((risk: any, index: number) => (
                    <div key={index} className="text-sm p-2 bg-red-50 rounded border-l-2 border-red-200">
                      {typeof risk === 'string' ? risk : risk.description}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quality Checkpoints */}
            {metadata.quality_checkpoints && metadata.quality_checkpoints.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Kvalitetskontrollpunkter
                </h4>
                <div className="space-y-1">
                  {metadata.quality_checkpoints.map((checkpoint: any, index: number) => (
                    <div key={index} className="text-sm p-2 bg-green-50 rounded border-l-2 border-green-200">
                      {typeof checkpoint === 'string' ? checkpoint : checkpoint.description}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Specialized AI Assistant */}
      <SpecializedAIAssistant actionTemplate={actionTemplate} />
    </div>
  );
};

export default ActionAIAssistant;
