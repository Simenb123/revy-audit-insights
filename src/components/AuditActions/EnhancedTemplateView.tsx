import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, FileText, Brain, Clock } from 'lucide-react';
import { EnhancedAuditActionTemplate } from '@/types/enhanced-audit-actions';
import { getRiskBadgeVariant, getRiskLabel, getComplexityBadgeVariant, getComplexityLabel } from './core/badgeUtils';
import { getPhaseLabel } from '@/constants/auditPhases';
import ActionISAStandards from './ActionISAStandards';
import ActionDocumentRequirements from './ActionDocumentRequirements';
import ActionAIAssistant from './ActionAIAssistant';
import WorkingPaperTemplateManager from './WorkingPaperTemplateManager';
import WorkingPaperGenerator from './WorkingPaperGenerator';
import { logger } from '@/utils/logger';

interface EnhancedTemplateViewProps {
  template: EnhancedAuditActionTemplate;
  onCopyToClient?: (templateId: string) => void;
  onEditTemplate?: (template: EnhancedAuditActionTemplate) => void;
}

const EnhancedTemplateView = ({ 
  template, 
  onCopyToClient, 
  onEditTemplate 
}: EnhancedTemplateViewProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedWorkingPaperTemplate, setSelectedWorkingPaperTemplate] = useState(null);
  const [showWorkingPaperGenerator, setShowWorkingPaperGenerator] = useState(false);

  const handleGenerateWorkingPaper = (workingPaperTemplate: any) => {
    setSelectedWorkingPaperTemplate(workingPaperTemplate);
    setShowWorkingPaperGenerator(true);
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
              {template.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {template.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline">
                  {template.subject_area}
                </Badge>
                <Badge variant="outline">
                  {template.action_type}
                </Badge>
                <Badge variant={getRiskBadgeVariant(template.risk_level)}>
                  {getRiskLabel(template.risk_level)}
                </Badge>
                {template.estimated_hours && (
                  <Badge variant="outline" className="gap-1">
                    <Clock size={12} />
                    {template.estimated_hours}t
                  </Badge>
                )}
                {template.ai_metadata && (
                  <Badge variant={getComplexityBadgeVariant(template.ai_metadata.estimated_complexity || 3)} className="gap-1">
                    <Brain size={12} />
                    {getComplexityLabel(template.ai_metadata.estimated_complexity || 3)}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 text-xs text-muted-foreground">
                {template.isa_mappings && template.isa_mappings.length > 0 && (
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} />
                    {template.isa_mappings.length} ISA
                  </span>
                )}
                {template.document_mappings && template.document_mappings.length > 0 && (
                  <span className="flex items-center gap-1">
                    <FileText size={12} />
                    {template.document_mappings.length} dok
                  </span>
                )}
                {template.ai_metadata && (
                  <span className="flex items-center gap-1">
                    <Brain size={12} />
                    AI-assistert
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 ml-4">
              {onEditTemplate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditTemplate(template)}
                >
                  Rediger
                </Button>
              )}
              {onCopyToClient && (
                <Button
                  size="sm"
                  onClick={() => onCopyToClient(template.id)}
                >
                  Bruk i revisjon
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Oversikt</TabsTrigger>
              <TabsTrigger value="standards">ISA</TabsTrigger>
              <TabsTrigger value="documents">Dokumenter</TabsTrigger>
              <TabsTrigger value="working-papers">Arbeidspapirer</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              {template.objective && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Formål</h4>
                  <p className="text-sm text-muted-foreground">{template.objective}</p>
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-sm mb-2">Prosedyrer</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {template.procedures}
                </p>
              </div>
              
              {template.documentation_requirements && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Dokumentasjonskrav</h4>
                  <p className="text-sm text-muted-foreground">
                    {template.documentation_requirements}
                  </p>
                </div>
              )}
              
              <div className="flex flex-wrap gap-1">
                {template.applicable_phases.map(phase => (
                  <Badge key={phase} variant="secondary" className="text-xs">
                    {getPhaseLabel(phase)}
                  </Badge>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="standards">
              <ActionISAStandards 
                actionTemplateId={template.id}
                mappings={template.isa_mappings || []}
              />
            </TabsContent>
            
            <TabsContent value="documents">
              <ActionDocumentRequirements 
                actionTemplateId={template.id}
                mappings={template.document_mappings || []}
              />
            </TabsContent>
            
            <TabsContent value="working-papers">
              <WorkingPaperTemplateManager
                selectedSubjectArea={template.subject_area}
                actionType={template.action_type}
                onTemplateSelect={handleGenerateWorkingPaper}
              />
            </TabsContent>
            
            <TabsContent value="ai">
              <ActionAIAssistant 
                actionTemplateId={template.id}
                metadata={template.ai_metadata}
                actionTemplate={template}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedWorkingPaperTemplate && (
        <WorkingPaperGenerator
          template={selectedWorkingPaperTemplate}
          actionTemplate={template}
          open={showWorkingPaperGenerator}
          onOpenChange={setShowWorkingPaperGenerator}
          onSave={(workingPaper) => {
            logger.log('Saving working paper:', workingPaper);
            setShowWorkingPaperGenerator(false);
          }}
        />
      )}
    </>
  );
};

export default EnhancedTemplateView;
