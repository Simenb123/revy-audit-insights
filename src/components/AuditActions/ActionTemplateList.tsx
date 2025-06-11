
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AuditActionTemplate, 
  AuditSubjectArea, 
  ACTION_TYPE_LABELS 
} from '@/types/audit-actions';
import { Copy, Edit } from 'lucide-react';
import CreateActionTemplateDialog from './CreateActionTemplateDialog';

interface ActionTemplateListProps {
  templates: AuditActionTemplate[];
  selectedArea: AuditSubjectArea;
  onCopyToClient?: (templateIds: string[]) => void;
  onEditTemplate?: (template: AuditActionTemplate) => void;
}

const ActionTemplateList = ({ 
  templates, 
  selectedArea, 
  onCopyToClient, 
  onEditTemplate
}: ActionTemplateListProps) => {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  const filteredTemplates = templates.filter(t => t.subject_area === selectedArea);

  const handleTemplateSelect = (templateId: string, checked: boolean) => {
    if (checked) {
      setSelectedTemplates(prev => [...prev, templateId]);
    } else {
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
    }
  };

  const handleCopySelected = () => {
    if (selectedTemplates.length > 0 && onCopyToClient) {
      onCopyToClient(selectedTemplates);
      setSelectedTemplates([]);
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Handlingsmaler for {selectedArea}
        </h3>
        <div className="flex gap-2">
          {selectedTemplates.length > 0 && onCopyToClient && (
            <Button onClick={handleCopySelected} size="sm">
              <Copy className="w-4 h-4 mr-2" />
              Kopier valgte ({selectedTemplates.length})
            </Button>
          )}
          <CreateActionTemplateDialog selectedArea={selectedArea} />
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <p className="mb-4">Ingen handlingsmaler funnet for dette fagområdet.</p>
            <CreateActionTemplateDialog 
              selectedArea={selectedArea}
              trigger={
                <Button>
                  Opprett første handlingsmal
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {onCopyToClient && (
                      <Checkbox
                        checked={selectedTemplates.includes(template.id)}
                        onCheckedChange={(checked) => 
                          handleTemplateSelect(template.id, checked as boolean)
                        }
                        className="mt-1"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {template.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {ACTION_TYPE_LABELS[template.action_type]}
                    </Badge>
                    <Badge className={getRiskBadgeColor(template.risk_level)}>
                      {template.risk_level}
                    </Badge>
                    {template.is_system_template && (
                      <Badge variant="secondary">System</Badge>
                    )}
                    {onEditTemplate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditTemplate(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {template.objective && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Formål:</p>
                    <p className="text-sm text-gray-600">{template.objective}</p>
                  </div>
                )}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">Prosedyrer:</p>
                  <p className="text-sm text-gray-600">{template.procedures}</p>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>
                    Estimert tid: {template.estimated_hours || 'Ikke spesifisert'} timer
                  </span>
                  <span>
                    Faser: {template.applicable_phases.join(', ')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionTemplateList;
