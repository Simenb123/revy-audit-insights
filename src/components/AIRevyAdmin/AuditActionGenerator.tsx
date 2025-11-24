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
import CreateActionTemplateForm from '@/components/AuditActions/CreateActionTemplateForm';
import type { CreateActionTemplateFormData } from '@/components/AuditActions/CreateActionTemplateForm/schema';
import { AuditPhase } from '@/types/revio';

interface AIGeneratedData {
  name: string;
  description: string;
  objective: string;
  procedures: string;
  documentation_requirements: string;
  estimated_hours: number;
  risk_level: 'low' | 'medium' | 'high';
  applicable_phases?: AuditPhase[];
}

const AuditActionGenerator = () => {
  const { session } = useAuth();
  
  const [selectedSubjectArea, setSelectedSubjectArea] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<ActionType>('substantive');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState<Partial<AIGeneratedData> | null>(null);
  
  const { data: subjectAreas, isLoading: subjectAreasLoading } = useSubjectAreas();
  const { data: previewTemplates, isLoading: templatesLoading } = useAuditActionTemplatesBySubjectArea();

  const actionTypes: { value: ActionType; label: string }[] =
    Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => ({
      value: value as ActionType,
      label
    }));

  // Get subject area ID from name for database storage
  const getSubjectAreaId = (subjectAreaName: string): string | undefined => {
    return subjectAreas?.find(area => area.display_name === subjectAreaName)?.id;
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
      const actionTypeLabel = actionTypes.find(t => t.value === selectedActionType)?.label || selectedActionType;
      
      // Enhanced prompt with detailed context and structure
      const prompt = `Du er en ekspert revisor som lager revisjonshandlinger i henhold til ISA-standarder.

Lag en detaljert revisjonshandling for:
- Fagområde: ${selectedSubjectArea}
- Handlingstype: ${actionTypeLabel}

Revisjonshandlingen skal:
1. Ha et konkret og beskrivende navn
2. Inkludere tydelig formål knyttet til revisjonsrisikoer
3. Inneholde spesifikke, steg-for-steg prosedyrer som kan følges
4. Definere nøyaktige dokumentasjonskrav
5. Estimere realistisk tidsbruk i timer
6. Vurdere risikonivå (low/medium/high)
7. Angi hvilke revisjonsfaser handlingen er relevant for

Tenk på:
- ISA 500 (Revisjonsbevis) - hvilke bevis trengs?
- ISA 315 (Risikovurdering) - hvilke risikoer adresseres?
- ISA 330 (Revisors reaksjoner på vurderte risikoer)

Svar BARE med et JSON-objekt i følgende format:
{
  "name": "Kort, beskrivende navn på revisjonshandlingen",
  "description": "1-2 setninger om hva handlingen omfatter",
  "objective": "Tydelig formål - hva skal verifiseres/testes/dokumenteres",
  "procedures": "Detaljerte steg-for-steg prosedyrer nummerert 1, 2, 3 osv. Vær spesifikk.",
  "documentation_requirements": "Nøyaktig hvilke dokumenter/bevis som skal innhentes og dokumenteres",
  "estimated_hours": <tall>,
  "risk_level": "low|medium|high",
  "applicable_phases": ["engagement", "planning", "risk_assessment", "execution", "completion", "reporting"]
}`;

      const aiResponse = await generateEnhancedAIResponseWithVariant(
        prompt,
        'audit-actions',
        [],
        undefined,
        'employee',
        undefined,
        undefined
      );

      let parsed: any;
      try {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = aiResponse.match(/```json?\s*([\s\S]*?)\s*```/) || 
                         aiResponse.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
        parsed = JSON.parse(jsonStr);
      } catch (parseError) {
        logger.error('Failed to parse AI response:', parseError, aiResponse);
        throw new Error('Kunne ikke tolke AI-responsen. Prøv igjen.');
      }

      // Validate required fields
      if (!parsed.name || !parsed.procedures) {
        throw new Error('AI-responsen mangler obligatoriske felt. Prøv igjen.');
      }

      const aiSuggestion: AIGeneratedData = {
        name: parsed.name,
        description: parsed.description || '',
        objective: parsed.objective || '',
        procedures: parsed.procedures,
        documentation_requirements: parsed.documentation_requirements || '',
        estimated_hours: Number(parsed.estimated_hours) || 2,
        risk_level: (['low', 'medium', 'high'].includes(parsed.risk_level) 
          ? parsed.risk_level 
          : 'medium') as 'low' | 'medium' | 'high',
        applicable_phases: Array.isArray(parsed.applicable_phases) && parsed.applicable_phases.length > 0
          ? parsed.applicable_phases.filter((p: string) => 
              ['overview', 'engagement', 'planning', 'risk_assessment', 'execution', 'completion', 'reporting'].includes(p)
            )
          : ['execution']
      };

      setAiGeneratedData(aiSuggestion);
      setShowCreateForm(true);

      toast({
        title: "AI-forslag generert",
        description: "Handlingen er generert med AI. Gjennomgå og tilpass før lagring.",
      });
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Kunne ikke generere handling med AI';
      logger.error('AI generation error:', error);
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
    setAiGeneratedData(null);
    setShowCreateForm(true);
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
    const subjectAreaId = selectedSubjectArea ? getSubjectAreaId(selectedSubjectArea) : undefined;
    
    const initialData: Partial<CreateActionTemplateFormData> = aiGeneratedData 
      ? {
          name: aiGeneratedData.name || '',
          description: aiGeneratedData.description || '',
          subject_area: subjectAreaId || '',
          action_type: selectedActionType,
          objective: aiGeneratedData.objective || '',
          procedures: aiGeneratedData.procedures || '',
          documentation_requirements: aiGeneratedData.documentation_requirements || '',
          estimated_hours: aiGeneratedData.estimated_hours || 0,
          risk_level: aiGeneratedData.risk_level || 'medium',
          applicable_phases: aiGeneratedData.applicable_phases || ['execution'],
          sort_order: 0
        }
      : {
          subject_area: subjectAreaId || '',
          action_type: selectedActionType,
          risk_level: 'medium',
          applicable_phases: ['execution'],
          sort_order: 0
        };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Opprett ny revisjonshandling
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aiGeneratedData && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI-generert forslag
              </h3>
              <p className="text-sm text-muted-foreground">
                Gjennomgå og tilpass handlingen før du lagrer. Du kan endre alle felt.
              </p>
            </div>
          )}
          <CreateActionTemplateForm
            selectedArea={subjectAreaId}
            onSuccess={() => {
              setShowCreateForm(false);
              setAiGeneratedData(null);
              toast({
                title: "Handling opprettet",
                description: "Den nye revisjonshandlingen er nå tilgjengelig i biblioteket.",
              });
            }}
            onCancel={() => {
              setShowCreateForm(false);
              setAiGeneratedData(null);
            }}
            initialData={initialData}
          />
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
