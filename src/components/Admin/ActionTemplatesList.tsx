import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Edit, Trash2, Search, Plus, ChevronDown } from 'lucide-react';
import { useAuditActionTemplates, useDeleteAuditActionTemplate } from '@/hooks/audit-actions/useActionTemplateCRUD';
import { useSubjectAreas } from '@/hooks/knowledge/useSubjectAreas';
import EditActionTemplateDialog from '@/components/AuditActions/EditActionTemplateDialog';
import CreateActionTemplateDialog from '@/components/AuditActions/CreateActionTemplateDialog';
import { toast } from '@/hooks/use-toast';
import { getPhaseLabel, getAllPhases } from '@/constants/auditPhases';
import type { AuditSubjectArea } from '@/types/audit-actions';
import type { AuditPhase } from '@/types/revio';

const ActionTemplatesList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectArea, setSelectedSubjectArea] = useState<AuditSubjectArea | 'all'>('all');

  const { data: templates, isLoading } = useAuditActionTemplates();
  const { data: subjectAreas } = useSubjectAreas();
  const deleteTemplate = useDeleteAuditActionTemplate();

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!confirm(`Er du sikker på at du vil slette "${templateName}"?`)) {
      return;
    }

    try {
      await deleteTemplate.mutateAsync(templateId);
      toast({
        title: "Mal slettet",
        description: "Revisjonshandlingsmalen er slettet.",
      });
    } catch (error) {
      toast({
        title: "Feil ved sletting",
        description: "Kunne ikke slette malen. Prøv igjen.",
        variant: "destructive"
      });
    }
  };

  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubjectArea = selectedSubjectArea === 'all' || template.subject_area === selectedSubjectArea;
    
    return matchesSearch && matchesSubjectArea;
  });

  // Group templates by phase
  const templatesByPhase = getAllPhases().reduce((acc, phase) => {
    acc[phase] = filteredTemplates?.filter(template => 
      template.applicable_phases?.includes(phase)
    ) || [];
    return acc;
  }, {} as Record<AuditPhase, typeof filteredTemplates>);

  if (isLoading) {
    return <div>Laster maler...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revisjonshandlingsmaler</CardTitle>
            <CardDescription>
              Administrer og rediger eksisterende handlingsmaler organisert etter fase
            </CardDescription>
          </div>
          <CreateActionTemplateDialog
            trigger={
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ny Handlingsmal
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Søk i maler..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={selectedSubjectArea} onValueChange={(value) => setSelectedSubjectArea(value as AuditSubjectArea | 'all')}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Alle fagområder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle fagområder</SelectItem>
              {subjectAreas?.map((area) => (
                <SelectItem key={area.id} value={area.name as AuditSubjectArea}>
                  {area.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Templates by Phase */}
        <div className="space-y-3">
          {filteredTemplates && filteredTemplates.length > 0 ? (
            getAllPhases().map((phase) => {
              const phaseTemplates = templatesByPhase[phase];
              if (phaseTemplates.length === 0) return null;

              return (
                <Collapsible key={phase} defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2">
                      <ChevronDown className="w-4 h-4" />
                      <h3 className="font-semibold">{getPhaseLabel(phase)}</h3>
                      <Badge variant="secondary">{phaseTemplates.length}</Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {phaseTemplates.map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors ml-4">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{template.name}</h4>
                          {template.description && (
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <EditActionTemplateDialog 
                            template={template}
                            trigger={
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(template.id, template.name)}
                            disabled={deleteTemplate.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedSubjectArea !== 'all'
                ? 'Ingen maler funnet med valgte filtre'
                : 'Ingen maler funnet. Opprett din første mal!'
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionTemplatesList;
