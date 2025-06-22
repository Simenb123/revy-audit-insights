
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, Plus, Loader2, Save } from 'lucide-react';
import { useCreateAuditActionTemplate } from '@/hooks/useAuditActions';
import { toast } from '@/hooks/use-toast';

const AuditActionGenerator = () => {
  const [selectedSubjectArea, setSelectedSubjectArea] = useState('sales');
  const [selectedActionType, setSelectedActionType] = useState('substantive');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const createTemplate = useCreateAuditActionTemplate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objective: '',
    procedures: '',
    documentation_requirements: '',
    estimated_hours: 0,
    risk_level: 'medium' as const
  });

  const subjectAreas = [
    { value: 'sales', label: 'Inntekter/Salg' },
    { value: 'payroll', label: 'Lønn' },
    { value: 'operating_expenses', label: 'Andre driftskostnader' },
    { value: 'inventory', label: 'Varelager' },
    { value: 'finance', label: 'Finans' },
    { value: 'banking', label: 'Banktransaksjoner' },
    { value: 'fixed_assets', label: 'Anleggsmidler' },
    { value: 'receivables', label: 'Kundefordringer' },
    { value: 'payables', label: 'Leverandørgjeld' },
    { value: 'equity', label: 'Egenkapital' },
    { value: 'other', label: 'Annet' }
  ];

  const actionTypes = [
    { value: 'substantive', label: 'Substansiell testing' },
    { value: 'analytical', label: 'Analytiske handlinger' },
    { value: 'control_testing', label: 'Kontroll testing' },
    { value: 'risk_assessment', label: 'Risikovurdering' },
    { value: 'documentation', label: 'Dokumentasjon' }
  ];

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    try {
      // Simuler AI-generering for nå
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiSuggestion = {
        name: `AI-generert handling for ${subjectAreas.find(s => s.value === selectedSubjectArea)?.label}`,
        description: 'AI-generert beskrivelse basert på best practices',
        objective: 'Sikre nøyaktighet og fullstendighet av...',
        procedures: '1. Gjennomgå dokumentasjon\n2. Utfør testing\n3. Dokumenter funn',
        documentation_requirements: 'Arbeidspapirer, testresultater, konklusjoner',
        estimated_hours: 4,
        risk_level: 'medium' as const
      };
      
      setFormData(aiSuggestion);
      setShowCreateForm(true);
      
      toast({
        title: "AI-forslag generert",
        description: "Handlingen er generert med AI. Du kan nå redigere og lagre den.",
      });
    } catch (error) {
      toast({
        title: "Feil ved AI-generering",
        description: "Kunne ikke generere handling med AI",
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
    try {
      console.log('Creating action:', {
        ...formData,
        subject_area: selectedSubjectArea,
        action_type: selectedActionType,
        phase: 'execution',
        applicable_phases: ['execution']
      });

      await createTemplate.mutateAsync({
        name: formData.name,
        description: formData.description,
        subject_area: selectedSubjectArea as any,
        action_type: selectedActionType as any,
        objective: formData.objective,
        procedures: formData.procedures,
        documentation_requirements: formData.documentation_requirements,
        estimated_hours: formData.estimated_hours,
        risk_level: formData.risk_level,
        applicable_phases: ['execution'],
        sort_order: 0,
        is_system_template: false,
        is_active: true
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
      console.error('Error creating action:', error);
    }
  };

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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subjectAreas.map((area) => (
                    <SelectItem key={area.value} value={area.value}>
                      {area.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label>Handlingstype</Label>
              <Select value={selectedActionType} onValueChange={setSelectedActionType}>
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
              placeholder="Søk handlinger..."
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              {selectedSubjectArea && selectedActionType && (
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {subjectAreas.find(s => s.value === selectedSubjectArea)?.label}
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
                disabled={isGenerating}
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

          {selectedSubjectArea === 'sales' && (
            <div className="mt-6 p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Gjennomføring - Inntekter/Salg</h3>
              <p className="text-sm text-muted-foreground mb-4">1 handlinger</p>
              
              <div className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Salgsinntekter - Utvalgstest</h4>
                  <div className="flex gap-1">
                    <Badge variant="destructive" className="text-xs">Høy</Badge>
                    <Badge variant="outline" className="text-xs">System</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Utfører utvalgstest av salgstransaksjoner for å sikre korrekt inntektsføring
                </p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>Type: substantive</span>
                  <span>Estimert: 4t</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditActionGenerator;
