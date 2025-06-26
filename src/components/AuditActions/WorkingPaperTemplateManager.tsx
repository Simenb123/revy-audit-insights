
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Plus, Wand2, Copy, Edit } from 'lucide-react';
import { useWorkingPaperTemplates, useCreateWorkingPaperTemplate } from '@/hooks/useEnhancedAuditActions';
import { WorkingPaperTemplate } from '@/types/enhanced-audit-actions';
import { useSubjectAreas } from '@/hooks/knowledge/useSubjectAreas';

interface WorkingPaperTemplateManagerProps {
  selectedSubjectArea?: string;
  actionType?: string;
  onTemplateSelect?: (template: WorkingPaperTemplate) => void;
}

const WorkingPaperTemplateManager = ({ 
  selectedSubjectArea, 
  actionType, 
  onTemplateSelect 
}: WorkingPaperTemplateManagerProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    subject_area: selectedSubjectArea || '',
    action_type: actionType || '',
    template_structure: {}
  });

  const { data: templates = [], isLoading } = useWorkingPaperTemplates(selectedSubjectArea, actionType);
  const { data: subjectAreas } = useSubjectAreas();
  const createTemplateMutation = useCreateWorkingPaperTemplate();

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject_area || !newTemplate.action_type) return;

    try {
      await createTemplateMutation.mutateAsync({
        ...newTemplate,
        is_system_template: false,
        template_structure: getDefaultTemplateStructure(newTemplate.action_type)
      });
      
      setIsCreateDialogOpen(false);
      setNewTemplate({
        name: '',
        description: '',
        subject_area: selectedSubjectArea || '',
        action_type: actionType || '',
        template_structure: {}
      });
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const getDefaultTemplateStructure = (actionType: string) => {
    const baseStructure = {
      sections: [
        {
          id: 'objective',
          title: 'Formål og målsetting',
          type: 'text',
          required: true,
          placeholder: 'Beskriv formålet med denne revisjonshandlingen...'
        },
        {
          id: 'scope',
          title: 'Omfang og avgrensning', 
          type: 'text',
          required: true,
          placeholder: 'Definer omfanget av arbeidet...'
        },
        {
          id: 'procedures',
          title: 'Utførte prosedyrer',
          type: 'checklist',
          required: true,
          items: [] as string[]
        },
        {
          id: 'findings',
          title: 'Funn og observasjoner',
          type: 'table',
          required: true,
          columns: ['Beskrivelse', 'Risiko', 'Anbefaling', 'Status']
        },
        {
          id: 'conclusion',
          title: 'Konklusjon',
          type: 'text',
          required: true,
          placeholder: 'Konklusjon basert på utført arbeid...'
        }
      ]
    };

    // Customize based on action type
    switch (actionType) {
      case 'bank_confirmation':
        baseStructure.sections[2].items = [
          'Sendt bekreftelse til alle banker',
          'Mottatt svar fra banker',
          'Avstemt saldo mot regnskap',
          'Kontrollert vilkår og betingelser'
        ];
        break;
      case 'inventory_count':
        baseStructure.sections[2].items = [
          'Observert fysisk lagertelling',
          'Kontrollert telleinstrukser',
          'Testet cut-off prosedyrer',
          'Avstemt telling mot regnskap'
        ];
        break;
      case 'payroll_testing':
        baseStructure.sections[2].items = [
          'Kontrollert lønnsberegninger',
          'Testet fraværsregistrering',
          'Verifisert skattetrekk',
          'Avstemt mot lønnssystem'
        ];
        break;
      default:
        baseStructure.sections[2].items = [
          'Gjennomført planlagte prosedyrer',
          'Kontrollert dokumentasjon',
          'Testet kontroller',
          'Vurdert funn og konklusjoner'
        ];
    }

    return baseStructure;
  };

  const getActionTypeLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      'bank_confirmation': 'Bankbekreftelse',
      'inventory_count': 'Varelagertelling',
      'payroll_testing': 'Lønnskontroll',
      'revenue_testing': 'Inntektstesting',
      'expense_testing': 'Kostnadstesting',
      'analytical_review': 'Analytisk gjennomgang'
    };
    return labels[actionType] || actionType;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          Laster arbeidspapir-maler...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Arbeidspapir-maler</h3>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ny mal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Opprett ny arbeidspapir-mal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Navn</label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Navn på arbeidspapir-mal"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Beskrivelse</label>
                <Textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Beskriv når denne malen skal brukes"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Fagområde</label>
                  <Select 
                    value={newTemplate.subject_area} 
                    onValueChange={(value) => setNewTemplate({ ...newTemplate, subject_area: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg fagområde" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectAreas?.map((area) => (
                        <SelectItem key={area.id} value={area.name}>
                          {area.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Handlingstype</label>
                  <Select 
                    value={newTemplate.action_type} 
                    onValueChange={(value) => setNewTemplate({ ...newTemplate, action_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg handlingstype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_confirmation">Bankbekreftelse</SelectItem>
                      <SelectItem value="inventory_count">Varelagertelling</SelectItem>
                      <SelectItem value="payroll_testing">Lønnskontroll</SelectItem>
                      <SelectItem value="revenue_testing">Inntektstesting</SelectItem>
                      <SelectItem value="expense_testing">Kostnadstesting</SelectItem>
                      <SelectItem value="analytical_review">Analytisk gjennomgang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button 
                  onClick={handleCreateTemplate}
                  disabled={!newTemplate.name || !newTemplate.subject_area || !newTemplate.action_type}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Opprett mal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="mb-4">Ingen arbeidspapir-maler funnet for dette området.</p>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Opprett første mal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant="outline">{getActionTypeLabel(template.action_type)}</Badge>
                  {template.is_system_template && (
                    <Badge variant="secondary">System</Badge>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {template.template_structure && (template.template_structure as any).sections ? 
                    `${(template.template_structure as any).sections.length} seksjoner` : 
                    'Ingen struktur definert'
                  }
                </div>
                
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={() => onTemplateSelect?.(template)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Bruk mal
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkingPaperTemplateManager;
