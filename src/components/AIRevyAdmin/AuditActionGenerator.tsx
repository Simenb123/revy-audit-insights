import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, Plus, Loader2, Save } from 'lucide-react';
import { useCreateAuditActionTemplate } from '@/hooks/audit-actions/useActionTemplateCRUD';
import { toast } from '@/hooks/use-toast';
import { generateEnhancedAIResponseWithVariant } from '@/services/revy/enhancedAiInteractionService';
import { useSubjectAreas } from '@/hooks/knowledge/useSubjectAreas';
import { useAuditActionTemplatesBySubjectArea } from '@/hooks/knowledge/useAuditActionTemplates';
import { useAuth } from '@/components/Auth/AuthProvider';
import { ACTION_TYPE_LABELS, ActionType, AuditSubjectArea } from '@/types/audit-actions';

interface FormData {
  name: string;
  description: string;
  objective: string;
  procedures: string;
  documentation_requirements: string;
  estimated_hours: number;
  risk_level: 'low' | 'medium' | 'high';
}

const AuditActionGenerator = () => {
  const { session } = useAuth();
  
  const [selectedSubjectArea, setSelectedSubjectArea] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<ActionType>('substantive');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const createTemplate = useCreateAuditActionTemplate();
  const { data: subjectAreas, isLoading: subjectAreasLoading } = useSubjectAreas();
  const { data: previewTemplates, isLoading: templatesLoading } = useAuditActionTemplatesBySubjectArea();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    objective: '',
    procedures: '',
    documentation_requirements: '',
    estimated_hours: 0,
    risk_level: 'medium'
  });

  const actionTypes: { value: ActionType; label: string }[] =
    Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => ({
      value: value as ActionType,
      label
    }));

  // Map subject area names to the correct enum values used in the database
  const getSubjectAreaEnumValue = (subjectAreaName: string): AuditSubjectArea => {
    const mapping: Record<string, AuditSubjectArea> = {
      'Inntekter/Salg': 'sales',
      'Lønn': 'payroll',
      'Andre driftskostnader': 'operating_expenses',
      'Varelager': 'inventory',
      'Finans': 'finance',
      'Banktransaksjoner': 'banking',
      'Investeringer/Anleggsmidler': 'fixed_assets',
      'Kundefordringer': 'receivables',
      'Leverandørgjeld': 'payables',
      'Egenkapital': 'equity',
      'Nærstående transaksjoner': 'other'
    };

    return mapping[subjectAreaName] || 'other';
  };

  const handleGenerateWithAI = async () => {
    if (!selectedSubjectArea) {
      toast({
        title: "Velg fagområde",
        description: "Du må velge et fagområde før du kan generere en handling med AI.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Lag et forslag til revisjonshandling for fagområdet "${selectedSubjectArea}" ` +
        `og handlingstypen "${selectedActionType}". ` +
        `Svar i JSON-format med feltene name, description, objective, procedures, ` +
        `documentation_requirements, estimated_hours og risk_level.`;

      const aiResponse = await generateEnhancedAIResponseWithVariant(
        prompt,
        'audit-actions',
        [], // history
        undefined, // clientData
        'employee', // userRole
        undefined, // sessionId
        undefined // selectedVariant
      );

      let parsed: any;
      try {
        parsed = JSON.parse(aiResponse);
      } catch (parseError) {
        logger.error('Failed to parse AI response:', parseError, aiResponse);
        throw new Error('Kunne ikke tolke AI-responsen');
      }

      const aiSuggestion: FormData = {
        name: parsed.name || '',
        description: parsed.description || '',
        objective: parsed.objective || '',
        procedures: parsed.procedures || '',
        documentation_requirements: parsed.documentation_requirements || '',
        estimated_hours: parsed.estimated_hours || 0,
        risk_level: (parsed.risk_level as 'low' | 'medium' | 'high') || 'medium'
      };

      setFormData(aiSuggestion);
      setShowCreateForm(true);

      toast({
        title: "AI-forslag generert",
        description: "Handlingen er generert med AI. Du kan nå redigere og lagre den.",
      });
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Kunne ikke generere handling med AI';
      toast({
        title: "Feil ved AI-generering",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateManual = () => {
    setFormData({
      name: '',
      description: '',
      objective: '',
      procedures: '',
      documentation_requirements: '',
      estimated_hours: 0,
      risk_level: 'medium'
    });
    setShowCreateForm(true);
  };

  const handleSave = async () => {
    if (!selectedSubjectArea) {
      toast({
        title: "Velg fagområde",
        description: "Du må velge et fagområde før du kan lagre handlingen.",
        variant: "destructive"
      });
      return;
    }

    if (!session?.user?.id) {
      toast({
        title: "Ikke autentisert",
        description: "Du må være logget inn for å lagre handlinger.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Convert the selected subject area to the correct enum value
      const enumSubjectArea = getSubjectAreaEnumValue(selectedSubjectArea);
      
      logger.log('Creating action with enum value:', {
        ...formData,
        subject_area: enumSubjectArea,
        action_type: selectedActionType,
        phase: 'execution',
        applicable_phases: ['execution'],
        created_by: session.user.id
      });

      await createTemplate.mutateAsync({
        name: formData.name,
        description: formData.description,
        subject_area: enumSubjectArea,
        action_type: selectedActionType,
        objective: formData.objective,
        procedures: formData.procedures,
        documentation_requirements: formData.documentation_requirements,
        estimated_hours: formData.estimated_hours,
        risk_level: formData.risk_level,
        applicable_phases: ['execution'],
        sort_order: 0,
        is_system_template: false,
        is_active: true,
        created_by: session.user.id
      });

      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        objective: '',
        procedures: '',
        documentation_requirements: '',
        estimated_hours: 0,
        risk_level: 'medium'
      });
    } catch (error) {
      logger.error('Error creating action:', error);
    }
  };

  if (subjectAreasLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Laster fagområder...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Opprett ny revisjonshandling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Navn</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Navn på handlingen"
              />
            </div>
            <div>
              <Label htmlFor="estimated_hours">Estimerte timer</Label>
              <Input
                id="estimated_hours"
                type="number"
                value={formData.estimated_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Kort beskrivelse av handlingen"
            />
          </div>

          <div>
            <Label htmlFor="objective">Formål</Label>
            <Textarea
              id="objective"
              value={formData.objective}
              onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
              placeholder="Hva er formålet med denne handlingen?"
            />
          </div>

          <div>
            <Label htmlFor="procedures">Prosedyrer</Label>
            <Textarea
              id="procedures"
              value={formData.procedures}
              onChange={(e) => setFormData(prev => ({ ...prev, procedures: e.target.value }))}
              placeholder="Detaljerte prosedyrer for gjennomføring"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="documentation">Dokumentasjonskrav</Label>
            <Textarea
              id="documentation"
              value={formData.documentation_requirements}
              onChange={(e) => setFormData(prev => ({ ...prev, documentation_requirements: e.target.value }))}
              placeholder="Hvilke dokumenter trengs?"
            />
          </div>

          <div>
            <Label>Risikonivå</Label>
            <Select 
              value={formData.risk_level} 
              onValueChange={(value: 'low' | 'medium' | 'high') => 
                setFormData(prev => ({ ...prev, risk_level: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Lav risiko</SelectItem>
                <SelectItem value="medium">Medium risiko</SelectItem>
                <SelectItem value="high">Høy risiko</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave}
              disabled={createTemplate.isPending || !formData.name || !formData.procedures}
            >
              {createTemplate.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Lagre handling
            </Button>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Avbryt
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Revisjonshandlinger Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Fagområde</Label>
              <Select value={selectedSubjectArea} onValueChange={setSelectedSubjectArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg fagområde" />
                </SelectTrigger>
                <SelectContent>
                  {subjectAreas?.map((area) => (
                    <SelectItem key={area.id} value={area.display_name}>
                      {area.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label>Handlingstype</Label>
              <Select
                value={selectedActionType}
                onValueChange={(v) => setSelectedActionType(v as ActionType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Søk handlinger</Label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Søk eksisterende handlinger..."
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              {selectedSubjectArea && selectedActionType && (
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {selectedSubjectArea}
                  </Badge>
                  <Badge variant="outline">
                    {actionTypes.find(t => t.value === selectedActionType)?.label}
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleGenerateWithAI} 
                disabled={isGenerating || !selectedSubjectArea}
                className="gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                AI Generator
              </Button>
              <Button onClick={handleCreateManual} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Ny Handling
              </Button>
            </div>
          </div>

          {/* Show existing templates for selected subject area */}
          {selectedSubjectArea && previewTemplates && previewTemplates.length > 0 && (
            <div className="mt-6 p-4 border rounded-lg">
              <h3 className="font-medium mb-2">
                Eksisterende handlinger - {selectedSubjectArea}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {previewTemplates.length} handlinger funnet
              </p>
              
              <div className="space-y-3">
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Laster handlinger...</span>
                  </div>
                ) : (
                  previewTemplates
                    .filter(template => {
                      const selectedArea = subjectAreas?.find(area => area.display_name === selectedSubjectArea);
                      return selectedArea && template.subject_areas?.id === selectedArea.id;
                    })
                    .map((template) => (
                      <div key={template.id} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <div className="flex gap-1">
                            {template.risk_level && (
                              <Badge 
                                variant={
                                  template.risk_level === 'high' ? 'destructive' : 
                                  template.risk_level === 'medium' ? 'default' : 'secondary'
                                } 
                                className="text-xs"
                              >
                                {template.risk_level === 'high' ? 'Høy' : 
                                 template.risk_level === 'medium' ? 'Medium' : 'Lav'}
                              </Badge>
                            )}
                            {template.is_system_template && (
                              <Badge variant="outline" className="text-xs">System</Badge>
                            )}
                          </div>
                        </div>
                        {template.description && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {template.description}
                          </p>
                        )}
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>Type: {actionTypes.find(t => t.value === template.action_type)?.label || template.action_type}</span>
                          {template.estimated_hours && (
                            <span>Estimert: {template.estimated_hours}t</span>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {selectedSubjectArea && (!previewTemplates || previewTemplates.filter(template => {
            const selectedArea = subjectAreas?.find(area => area.display_name === selectedSubjectArea);
            return selectedArea && template.subject_areas?.id === selectedArea.id;
          }).length === 0) && !templatesLoading && (
            <div className="mt-6 p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                Ingen eksisterende handlinger funnet for {selectedSubjectArea}.
                Bruk AI Generator eller opprett en ny handling manuelt.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditActionGenerator;
